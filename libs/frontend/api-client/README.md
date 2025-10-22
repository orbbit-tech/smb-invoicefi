# Orbbit API Client

TypeScript-fetch API client for the Orbbit Web3 Invoice Financing Platform backend.

Auto-generated from OpenAPI/Swagger specification.

## Generation

To regenerate the API client after backend changes:

1. Start the backend server:
   ```bash
   nx serve backend
   ```

2. Generate the client:
   ```bash
   nx run api-client:generate-api
   ```

The generated client will be in `src/generated/`.

## Usage

### Basic Setup

```typescript
import { Configuration, SMBInvoicesApi } from '@api-client';

const config = new Configuration({
  basePath: 'http://localhost:9000',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
  },
});

const invoicesApi = new SMBInvoicesApi(config);
```

### SMB Endpoints

```typescript
// List invoices
const invoices = await invoicesApi.list({
  organizationId: '123',
  status: 'LISTED',
  page: 1,
  limit: 20,
});

// Get invoice detail
const invoice = await invoicesApi.getById({
  id: 'invoice-id',
  organizationId: '123',
});

// Create invoice
const newInvoice = await invoicesApi.create({
  organizationId: '123',
  createInvoiceDto: {
    payerCompanyId: 'payer-id',
    amount: 1000000, // $10,000 in cents
    invoiceNumber: 'INV-001',
    invoiceDate: Math.floor(Date.now() / 1000),
    dueAt: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
  },
});
```

### Investor Endpoints

```typescript
import { InvestorMarketplaceApi, InvestorPortfolioApi } from '@api-client';

// Marketplace
const marketplaceApi = new InvestorMarketplaceApi(config);
const availableInvoices = await marketplaceApi.list({
  riskScore: 'LOW',
  page: 1,
  limit: 20,
});

// Portfolio
const portfolioApi = new InvestorPortfolioApi(config);
const summary = await portfolioApi.getSummary({
  investorAddress: '0x123...',
});

const positions = await portfolioApi.getPositions({
  investorAddress: '0x123...',
  status: 'ACTIVE',
});
```

### Shared Endpoints

```typescript
import { SharedPayersApi, SharedBlockchainApi } from '@api-client';

// Payer details
const payersApi = new SharedPayersApi(config);
const payer = await payersApi.getById({ id: 'payer-id' });

// NFT data
const blockchainApi = new SharedBlockchainApi(config);
const nftData = await blockchainApi.getNftData({ tokenId: '123' });
```

## API Documentation

Full API documentation is available at:
- **Swagger UI**: http://localhost:9000/api/docs
- **OpenAPI JSON**: http://localhost:9000/api/docs/swagger.json

## Type Safety

All API responses are fully typed with TypeScript interfaces:

```typescript
import type {
  InvoiceDto,
  InvoiceDetailDto,
  DashboardMetricsDto,
  MarketplaceInvoiceDto,
  PortfolioSummaryDto,
} from '@api-client';
```

## Error Handling

```typescript
try {
  const invoice = await invoicesApi.getById({
    id: 'invalid-id',
    organizationId: '123',
  });
} catch (error) {
  if (error.status === 404) {
    console.error('Invoice not found');
  } else if (error.status === 403) {
    console.error('Unauthorized');
  } else {
    console.error('API error:', error);
  }
}
```
