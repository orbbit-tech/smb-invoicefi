/**
 * API Client Configuration
 *
 * Configures the generated API client with base URL and authentication
 */

import {
  Configuration,
  InvestorMarketplaceApi,
  InvestorPortfolioApi,
  InvestorProfileApi,
} from '@api-client';

// Get API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9000';

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

export const marketplaceApi = new InvestorMarketplaceApi(apiConfig);
export const portfolioApi = new InvestorPortfolioApi(apiConfig);
export const profileApi = new InvestorProfileApi(apiConfig);

/**
 * Organized API client for easy access
 */
export const orbbitClient = {
  marketplace: marketplaceApi,
  portfolio: portfolioApi,
  profile: profileApi,
};
