/**
 * API Client Configuration
 *
 * Configures the generated API client with base URL and authentication
 */

import {
  Configuration,
  SMBDashboardApi,
  SMBInvoicesApi,
} from '@api-client';

// Get API base URL from environment variable
// Note: Do not include /v1 suffix - it's already in the generated API paths
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9000';

/**
 * Get auth token from session cookie
 * For auth endpoints, we don't need this as cookies are sent automatically
 */
function getAuthToken(): string | undefined {
  // Cookies are automatically sent with credentials: 'include'
  // No need to manually extract token
  return undefined;
}

/**
 * Create API configuration with cookie support
 * Uses credentials: 'include' to automatically send HTTP-only cookies
 */
export function createApiConfig(): Configuration {
  return new Configuration({
    basePath: API_BASE_URL,
    credentials: 'include', // Enable cookie-based authentication
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// Create API instances
const apiConfig = createApiConfig();

export const dashboardApi = new SMBDashboardApi(apiConfig);
export const invoicesApi = new SMBInvoicesApi(apiConfig);
// Note: Auth endpoints use direct fetch() calls in use-auth-manager hook
// because they're not yet in the OpenAPI spec

/**
 * Organized API client for easy access
 */
export const orbbitClient = {
  dashboard: dashboardApi,
  invoices: invoicesApi,
};
