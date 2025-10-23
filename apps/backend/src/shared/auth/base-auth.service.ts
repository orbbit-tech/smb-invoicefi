import {
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as stytch from 'stytch';
import {
  SendEmailOtpDto,
  AuthenticateEmailOtpDto,
  CompleteSignupDto,
  ExchangeIntermediateSessionDto,
} from './auth.dto';
import { callStytchApi } from '../../stytch/stytch.util';
import { Kysely } from 'kysely';
import type Database from '../../../../../src/types/db/Database';

interface AuthResult {
  sessionJwt: string;
  organizationId: string;
  memberId?: string;
}

interface AuthenticateResult {
  intermediateSessionToken: string;
  discoveredOrganizations: Array<{
    organizationId: string | null;
    stytchOrganizationId: string;
  }>;
}

/**
 * Base authentication service that can be used by both SMB and Investor auth modules
 */
export class BaseAuthService {
  constructor(
    protected readonly stytchClient: stytch.B2BClient,
    protected readonly configService: ConfigService,
    protected readonly db: Kysely<Database>,
  ) {}

  /**
   * Send OTP to user's email for authentication
   */
  async sendEmailOtp(dto: SendEmailOtpDto): Promise<void> {
    try {
      await callStytchApi(
        this.stytchClient.otps.email.discovery.send({
          email_address: dto.email,
        }),
      );
    } catch (error) {
      console.error('Failed to send email OTP:', error);
      throw new BadRequestException('Failed to send verification email');
    }
  }

  /**
   * Authenticate user with OTP code
   */
  async authenticateEmailOtp(
    dto: AuthenticateEmailOtpDto,
  ): Promise<AuthenticateResult> {
    try {
      const result = await callStytchApi(
        this.stytchClient.otps.email.discovery.authenticate({
          email_address: dto.email,
          code: dto.code,
        }),
      );

      // Process discovered organizations
      const discoveredOrganizations = [];
      for (const stytchOrg of result.discovered_organizations || []) {
        const stytchOrgId = stytchOrg.organization?.organization_id;
        if (!stytchOrgId) continue;

        // Look up our internal organization by Stytch ID
        const organization = await this.db
          .selectFrom('identity.organization')
          .select(['id', 'stytchOrganizationId'])
          .where('stytchOrganizationId', '=', stytchOrgId)
          .where('deletedAt', 'is', null)
          .executeTakeFirst();

        discoveredOrganizations.push({
          organizationId: organization?.id || null,
          stytchOrganizationId: stytchOrgId,
        });
      }

      return {
        intermediateSessionToken: result.intermediate_session_token,
        discoveredOrganizations,
      };
    } catch (error) {
      console.error('Failed to authenticate email OTP:', error);
      throw new UnauthorizedException('Invalid verification code or email');
    }
  }

  /**
   * Complete signup by creating new organization
   */
  async completeSignup(dto: CompleteSignupDto): Promise<AuthResult> {
    const sessionDurationMinutes =
      parseInt(
        this.configService.get<string>('SESSION_DURATION_MINUTES') || '1440',
      ) || 1440; // Default 24 hours

    try {
      // Generate organization slug from name
      const organizationSlug = dto.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // First, create the organization in our database
      const organization = await this.db
        .insertInto('identity.organization')
        .values({
          name: dto.organizationName,
          stytchOrganizationId: null, // Will be updated after Stytch creation
        })
        .returning(['id', 'name'])
        .executeTakeFirstOrThrow();

      // Create Stytch organization with our org ID as custom claim
      const stytchResult = await callStytchApi(
        this.stytchClient.discovery.organizations.create({
          intermediate_session_token: dto.intermediateSessionToken,
          organization_name: dto.organizationName,
          organization_slug: organizationSlug,
          session_duration_minutes: sessionDurationMinutes,
          session_custom_claims: {
            org_id: organization.id,
            given_name: dto.givenName,
            family_name: dto.familyName,
          },
        }),
      );

      if (!stytchResult.session_jwt || !stytchResult.organization) {
        throw new BadRequestException('Failed to create organization');
      }

      // Update our organization with Stytch ID
      await this.db
        .updateTable('identity.organization')
        .set({
          stytchOrganizationId: stytchResult.organization.organization_id,
        })
        .where('id', '=', organization.id)
        .execute();

      return {
        sessionJwt: stytchResult.session_jwt,
        organizationId: organization.id,
      };
    } catch (error) {
      console.error('Failed to complete signup:', error);
      throw new BadRequestException('Failed to create organization');
    }
  }

  /**
   * Exchange intermediate session for full session by joining existing organization
   */
  async exchangeIntermediateSession(
    dto: ExchangeIntermediateSessionDto,
  ): Promise<AuthResult> {
    const sessionDurationMinutes =
      parseInt(
        this.configService.get<string>('SESSION_DURATION_MINUTES') || '1440',
      ) || 1440;

    try {
      // Get organization and its Stytch ID
      const organization = await this.db
        .selectFrom('identity.organization')
        .select(['id', 'stytchOrganizationId', 'name'])
        .where('id', '=', dto.organizationId)
        .where('deletedAt', 'is', null)
        .executeTakeFirstOrThrow();

      if (!organization.stytchOrganizationId) {
        throw new BadRequestException('Organization not properly configured');
      }

      const exchangeResult = await callStytchApi(
        this.stytchClient.discovery.intermediateSessions.exchange({
          intermediate_session_token: dto.intermediateSessionToken,
          organization_id: organization.stytchOrganizationId,
          session_duration_minutes: sessionDurationMinutes,
          session_custom_claims: {
            org_id: organization.id,
          },
        }),
      );

      return {
        sessionJwt: exchangeResult.session_jwt,
        organizationId: organization.id,
      };
    } catch (error) {
      console.error('Failed to exchange intermediate session:', error);
      throw new InternalServerErrorException('Failed to join organization');
    }
  }

  /**
   * Logout by revoking session
   */
  async logout(sessionJwt: string): Promise<void> {
    if (!sessionJwt) {
      throw new BadRequestException('Session JWT is required for logout');
    }

    try {
      await this.stytchClient.sessions.revoke({
        session_jwt: sessionJwt,
      });
    } catch (error) {
      console.error('Failed to revoke session:', error);
      throw new InternalServerErrorException('Failed to revoke session');
    }
  }

  /**
   * Authenticate session JWT and return decoded claims
   */
  async authenticateSession(sessionJwt: string): Promise<any> {
    try {
      const result = await this.stytchClient.sessions.authenticate({
        session_jwt: sessionJwt,
      });

      return {
        memberId: result.member_session.member_id,
        organizationId: result.member_session.custom_claims?.org_id,
      };
    } catch (error) {
      console.error('Failed to authenticate session:', error);
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
}
