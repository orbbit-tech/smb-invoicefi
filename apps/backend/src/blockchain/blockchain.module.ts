import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { viemClientProvider } from './blockchain.provider';
import { ContractService } from './contract.service';
import { EventListenerService } from './event-listener.service';
import { CdpWebhookService } from './cdp-webhook.service';
import { AlchemyWebhookService } from './alchemy-webhook.service';
import { WebhookReceiverController } from './webhook-receiver.controller';

/**
 * Global blockchain module providing Viem client, contract services,
 * webhook integration (Alchemy + CDP), and event listening with polling backup
 * Automatically starts webhook subscriptions and polling on module initialization
 */
@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [
    WebhookReceiverController,
  ],
  providers: [
    viemClientProvider,
    ContractService,
    EventListenerService,
    AlchemyWebhookService,
    CdpWebhookService,
  ],
  exports: [
    viemClientProvider,
    ContractService,
    EventListenerService,
    AlchemyWebhookService,
    CdpWebhookService,
  ],
})
export class BlockchainModule {}
