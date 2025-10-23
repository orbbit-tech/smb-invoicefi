import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as stytch from 'stytch';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Factory function to create an auth guard for a specific Stytch client
 */
export function createAuthGuard(stytchClientToken: string) {
  @Injectable()
  class BaseAuthGuard implements CanActivate {
    constructor(
      private reflector: Reflector,
      private readonly stytchClient: stytch.B2BClient,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      // Check if route is marked as public
      const isPublic = this.reflector.getAllAndOverride<boolean>(
        IS_PUBLIC_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (isPublic) {
        return true;
      }

      const request = context.switchToHttp().getRequest<Request>();

      // Allow unauthenticated access to Swagger docs and health endpoints
      const path = (request.path || request.url) as string;
      if (path && (path.startsWith('/api/docs') || path.includes('/health'))) {
        return true;
      }

      // Extract token from Authorization header
      const token = this.extractTokenFromRequest(request);

      if (!token) {
        throw new UnauthorizedException('Authentication token not found');
      }

      try {
        const result = await this.stytchClient.sessions.authenticateJwt({
          session_jwt: token,
        });

        // Attach user info to request for use in controllers
        (request as any).user = {
          memberId: result.member_session.member_id,
          organizationId: result.member_session.custom_claims?.org_id,
        };

        return true;
      } catch (error) {
        console.error('Authentication failed:', error);
        throw new UnauthorizedException(
          'Invalid or expired authentication token',
        );
      }
    }

    private extractTokenFromRequest(request: Request): string | undefined {
      // Extract token from Authorization header (Bearer token)
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }

      return undefined;
    }
  }

  return BaseAuthGuard;
}
