import {
  Controller,
  Post,
  Body,
  HttpCode,
  Headers,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiHeader } from '@nestjs/swagger';
import { Response } from 'express';
import { SMBAuthService } from './smb-auth.service';
import {
  SendEmailOtpDto,
  AuthenticateEmailOtpDto,
  CompleteSignupDto,
  ExchangeIntermediateSessionDto,
} from '../../shared/auth/auth.dto';
import { Public } from '../../shared/auth/public.decorator';

@ApiTags('SMB Authentication')
@Controller('smb/auth')
@Public() // All auth endpoints are public (except logout which overrides this)
export class SMBAuthController {
  constructor(private readonly authService: SMBAuthService) {}

  @Post('email/otp/send')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Send OTP to email',
    description: 'Sends a one-time password to the specified email address',
  })
  @ApiResponse({ status: 204, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid email or failed to send' })
  async sendEmailOtp(@Body() dto: SendEmailOtpDto): Promise<void> {
    await this.authService.sendEmailOtp(dto);
  }

  @Post('email/otp/authenticate')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Authenticate OTP code',
    description: 'Verifies the OTP code and returns intermediate session token',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP authenticated successfully',
    schema: {
      properties: {
        intermediateSessionToken: { type: 'string' },
        discoveredOrganizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              organizationId: { type: 'string', nullable: true },
              stytchOrganizationId: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid code or email' })
  async authenticateEmailOtp(@Body() dto: AuthenticateEmailOtpDto) {
    return await this.authService.authenticateEmailOtp(dto);
  }

  @Post('complete-signup')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Complete signup by creating new organization',
    description:
      'Creates a new organization and returns session JWT in HTTP-only cookie',
  })
  @ApiResponse({
    status: 200,
    description: 'Signup completed successfully',
    schema: {
      properties: {
        organizationId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Failed to create organization' })
  async completeSignup(
    @Body() dto: CompleteSignupDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.completeSignup(dto);

    // Set HTTP-only cookie with session JWT
    response.cookie('session_jwt', result.sessionJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return {
      organizationId: result.organizationId,
    };
  }

  @Post('intermediate-sessions/exchange')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Exchange intermediate session for full session',
    description:
      'Joins an existing organization and returns session JWT in HTTP-only cookie',
  })
  @ApiResponse({
    status: 200,
    description: 'Session exchanged successfully',
    schema: {
      properties: {
        organizationId: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to join organization',
  })
  async exchangeIntermediateSession(
    @Body() dto: ExchangeIntermediateSessionDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.exchangeIntermediateSession(dto);

    // Set HTTP-only cookie with session JWT
    response.cookie('session_jwt', result.sessionJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return {
      organizationId: result.organizationId,
    };
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Logout user',
    description: 'Revokes the session and clears cookies',
  })
  @ApiHeader({
    name: 'authorization',
    description: 'Bearer token with session JWT',
    required: true,
  })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or missing session JWT' })
  async logout(
    @Headers('authorization') authHeader: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    // Extract JWT from Bearer header
    const sessionJwt = authHeader?.substring(7);

    if (!sessionJwt) {
      throw new BadRequestException('Authorization header is required');
    }

    await this.authService.logout(sessionJwt);

    // Clear cookie
    response.clearCookie('session_jwt');
  }
}
