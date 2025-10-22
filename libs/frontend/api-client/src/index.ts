/**
 * Orbbit API Client
 *
 * TypeScript-fetch client for the Orbbit Backend API
 * Auto-generated from OpenAPI/Swagger specification
 *
 * Usage:
 *
 * ```typescript
 * import { Configuration, SMBInvoicesApi } from '@api-client';
 *
 * const config = new Configuration({
 *   basePath: 'http://localhost:9000',
 *   headers: {
 *     'Authorization': 'Bearer YOUR_TOKEN',
 *   },
 * });
 *
 * const invoicesApi = new SMBInvoicesApi(config);
 * const invoices = await invoicesApi.list({ organizationId: '123' });
 * ```
 */

export * from './generated';
