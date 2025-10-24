import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
  HttpCode,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { CdpWebhookService } from './cdp-webhook.service';
import { AlchemyWebhookService } from './alchemy-webhook.service';
import { EventListenerService } from './event-listener.service';
import {
  CdpWebhookPayload,
  isValidWebhookPayload,
  getEventType,
} from './dto/webhook-payload.dto';
import {
  AlchemyWebhookPayload,
  isValidAlchemyWebhookPayload,
  normalizeAlchemyPayload,
  parseEventDataByName,
} from './dto/alchemy-webhook.dto';

/**
 * Webhook Receiver Controller
 * Receives and processes webhook notifications from multiple providers:
 * - Alchemy (production-ready, recommended)
 * - Coinbase CDP (Alpha, backup)
 */
@ApiTags('Blockchain - Webhooks')
@Controller('webhooks/blockchain')
export class WebhookReceiverController {
  private readonly logger = new Logger(WebhookReceiverController.name);

  constructor(
    private readonly cdpWebhookService: CdpWebhookService,
    private readonly alchemyWebhookService: AlchemyWebhookService,
    private readonly eventListenerService: EventListenerService
  ) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Receive CDP webhook notifications',
    description:
      'Endpoint for Coinbase Developer Platform to send blockchain event notifications',
  })
  @ApiHeader({
    name: 'x-webhook-signature',
    description: 'CDP webhook signature for verification',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid webhook signature',
  })
  async handleWebhook(
    @Body() payload: CdpWebhookPayload,
    @Headers('x-webhook-signature') signature: string
  ) {
    try {
      // 1. Validate payload structure
      if (!isValidWebhookPayload(payload)) {
        this.logger.error('Invalid webhook payload structure');
        throw new UnauthorizedException('Invalid payload');
      }

      // 2. Verify webhook signature
      const isValid = this.cdpWebhookService.verifyWebhookSignature(
        JSON.stringify(payload),
        signature
      );

      if (!isValid) {
        this.logger.error('Invalid webhook signature');
        throw new UnauthorizedException('Invalid signature');
      }

      // 3. Log webhook receipt
      this.logger.log(
        `Received webhook: ${payload.id}, type: ${payload.type}, tx: ${payload.data.transaction_hash}`
      );

      // 4. Route to appropriate event handler based on event type
      const eventType = getEventType(payload);
      await this.routeEvent(eventType, payload);

      // 5. Return 200 OK quickly (CDP expects fast response)
      return {
        status: 'processed',
        webhookId: payload.id,
        transactionHash: payload.data.transaction_hash,
      };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);

      // Still return 200 to prevent CDP retry for permanently failing webhooks
      // Log the error for manual investigation
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Route webhook event to appropriate handler
   */
  private async routeEvent(eventType: string, payload: CdpWebhookPayload) {
    const { data } = payload;

    try {
      switch (eventType) {
        case 'InvoiceMinted':
        case 'erc721_transfer': // NFT minted (from 0x0 address)
          if (
            data.from_address === '0x0000000000000000000000000000000000000000'
          ) {
            await this.eventListenerService.handleInvoiceMinted(data);
          } else {
            // Secondary market transfer - handle NFT ownership change
            this.logger.log(
              `NFT transferred: ${data.token_id} from ${data.from_address} to ${data.to_address}`
            );
          }
          break;

        case 'InvoiceFunded':
          await this.eventListenerService.handleInvoiceFunded(data);
          break;

        case 'RepaymentDeposited':
          await this.eventListenerService.handleRepaymentDeposited(data);
          break;

        case 'InvoiceRepaid':
        case 'InvoiceSettled':
          await this.eventListenerService.handleInvoiceRepaid(data);
          break;

        case 'InvoiceDefaulted':
          await this.eventListenerService.handleInvoiceDefaulted(data);
          break;

        default:
          this.logger.warn(`Unhandled event type: ${eventType}`);
      }
    } catch (error) {
      this.logger.error(`Error handling ${eventType} event:`, error);
      throw error;
    }
  }

  /**
   * Alchemy webhook endpoint (production-ready)
   * Receives notifications from Alchemy Notify API
   */
  @Post('alchemy')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Receive Alchemy webhook notifications',
    description:
      'Endpoint for Alchemy Notify to send blockchain event notifications',
  })
  @ApiHeader({
    name: 'x-alchemy-signature',
    description: 'Alchemy webhook signature for verification',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid webhook signature',
  })
  async handleAlchemyWebhook(
    @Body() payload: AlchemyWebhookPayload,
    @Headers('x-alchemy-signature') signature: string,
    @Req() req: RawBodyRequest<Request>
  ) {
    try {
      // 1. Validate payload structure
      if (!isValidAlchemyWebhookPayload(payload)) {
        this.logger.error('Invalid Alchemy webhook payload structure');
        throw new UnauthorizedException('Invalid payload');
      }

      // 2. Verify webhook signature using raw body
      const rawBody = req.rawBody
        ? req.rawBody.toString('utf8')
        : JSON.stringify(payload);
      const isValid = this.alchemyWebhookService.verifyWebhookSignature(
        rawBody,
        signature
      );

      if (!isValid) {
        this.logger.error('Invalid Alchemy webhook signature');
        throw new UnauthorizedException('Invalid signature');
      }

      // 3. Log webhook receipt
      this.logger.log(
        `Received Alchemy webhook: ${payload.id}, type: ${payload.type}, webhookId: ${payload.webhookId}`
      );

      // 4. Normalize Alchemy payload to internal format
      const normalizedEvents = normalizeAlchemyPayload(payload);

      // 5. Process each event
      for (const event of normalizedEvents) {
        await this.routeAlchemyEvent(event);
      }

      // 6. Return 200 OK quickly (Alchemy expects fast response)
      return {
        status: 'processed',
        webhookId: payload.webhookId,
        eventId: payload.id,
        eventsProcessed: normalizedEvents.length,
      };
    } catch (error) {
      this.logger.error('Error processing Alchemy webhook:', error);

      // Still return 200 to prevent Alchemy retry for permanently failing webhooks
      // Log the error for manual investigation
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Route Alchemy event to appropriate handler
   */
  private async routeAlchemyEvent(event: any) {
    try {
      const { eventName, eventData, transactionHash } = event;

      this.logger.log(
        `Processing Alchemy event: ${eventName}, tx: ${transactionHash}`
      );

      // Convert normalized event to CDP format for compatibility with existing handlers
      const cdpFormatData: any = {
        network_id: event.network,
        block_height: event.blockNumber,
        block_hash: event.blockHash,
        block_timestamp: event.blockTimestamp,
        transaction_hash: transactionHash,
        transaction_index: event.transactionIndex,
        log_index: event.logIndex,
        contract_address: event.contractAddress,
        event_name: eventName,
        event_data: parseEventDataByName(
          eventName,
          eventData.rawData,
          eventData.topics
        ),
        from_address: event.from_address,
        to_address: event.to_address,
        token_id: event.token_id,
      };

      // Route based on event name
      switch (eventName) {
        case 'Transfer':
          // Check if it's a mint (from 0x0)
          if (
            cdpFormatData.from_address ===
            '0x0000000000000000000000000000000000000000'
          ) {
            await this.eventListenerService.handleInvoiceMinted(cdpFormatData);
          } else {
            // Secondary market transfer
            this.logger.log(
              `NFT transferred: ${cdpFormatData.token_id} from ${cdpFormatData.from_address} to ${cdpFormatData.to_address}`
            );
          }
          break;

        case 'InvoiceMinted':
          await this.eventListenerService.handleInvoiceMinted(cdpFormatData);
          break;

        case 'InvoiceFunded':
          await this.eventListenerService.handleInvoiceFunded(cdpFormatData);
          break;

        case 'RepaymentDeposited':
          await this.eventListenerService.handleRepaymentDeposited(
            cdpFormatData
          );
          break;

        case 'InvoiceRepaid':
        case 'InvoiceSettled':
          await this.eventListenerService.handleInvoiceRepaid(cdpFormatData);
          break;

        case 'InvoiceDefaulted':
          await this.eventListenerService.handleInvoiceDefaulted(cdpFormatData);
          break;

        default:
          this.logger.warn(`Unhandled Alchemy event type: ${eventName}`);
      }
    } catch (error) {
      this.logger.error(
        `Error handling Alchemy event ${event.eventName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * CDP webhook endpoint (legacy/backup)
   * Kept for backward compatibility and fallback
   */
  @Post('cdp')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Receive CDP webhook notifications (legacy)',
    description:
      'Endpoint for Coinbase Developer Platform to send blockchain event notifications',
  })
  @ApiHeader({
    name: 'x-webhook-signature',
    description: 'CDP webhook signature for verification',
    required: true,
  })
  async handleCdpWebhook(
    @Body() payload: CdpWebhookPayload,
    @Headers('x-webhook-signature') signature: string
  ) {
    // Reuse existing CDP webhook logic
    return this.handleWebhook(payload, signature);
  }

  /**
   * Health check endpoint for webhook service
   */
  @Post('health')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Webhook health check',
    description: 'Test endpoint to verify webhook receiver is working',
  })
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'blockchain-webhook-receiver',
      providers: {
        alchemy: !!process.env.ALCHEMY_API_KEY,
      },
    };
  }
}
