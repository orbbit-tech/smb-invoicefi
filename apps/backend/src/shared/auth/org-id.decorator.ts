import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract organization ID from JWT custom claims
 * Falls back to query parameter in development mode for testing
 * Usage: @OrgId() organizationId: string
 *
 * Priority order:
 * 1. JWT token custom claims (production - when @Public() is removed)
 * 2. Query parameter (development/testing - when routes are @Public())
 * 3. Throw error if neither is present
 */
export const OrgId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Primary: Get from JWT token (production)
    if (user && user.organizationId) {
      return user.organizationId;
    }

    // Fallback: Get from query parameter (development/testing only)
    // This allows frontend to pass organizationId explicitly during development
    const queryOrgId = request.query?.organizationId;
    if (queryOrgId) {
      console.warn(
        `[DEV] Using organizationId from query parameter: ${queryOrgId}. This should only be used in development!`,
      );
      return queryOrgId as string;
    }

    // Additional fallback: Check body for organizationId (for POST/PATCH requests)
    const bodyOrgId = request.body?.organizationId;
    if (bodyOrgId) {
      console.warn(
        `[DEV] Using organizationId from request body: ${bodyOrgId}. This should only be used in development!`,
      );
      return bodyOrgId as string;
    }

    throw new Error('Organization ID not found in request context');
  },
);
