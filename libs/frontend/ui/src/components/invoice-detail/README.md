# Invoice Detail Components

Shared UI components for displaying invoice details across SMB and Investor applications.

## Overview

This directory contains reusable React components that provide consistent invoice detail displays throughout the application. These components are designed to work with different invoice data structures while maintaining a unified visual language.

## Components

### `InvoiceDetailHeader`

Displays company information with avatar, name, and optional subtitle/status badge.

**Props:**
- `invoice: InvoiceDetailData` - Invoice data object
- `statusBadge?: React.ReactNode` - Optional status badge component
- `subtitle?: string` - Optional subtitle text (defaults to invoice ID and category)

**Usage:**
```tsx
<InvoiceDetailHeader
  invoice={invoice}
  subtitle={`Invoice NFT #${invoice.tokenId}`}
  statusBadge={<Badge>Active</Badge>}
/>
```

---

### `InvoiceMetrics`

Grid display of key invoice metrics with customizable layout.

**Props:**
- `invoice: InvoiceDetailData` - Invoice data object
- `metrics: MetricItem[]` - Array of metrics to display
- `title?: string` - Section title (default: "Investment Overview")
- `icon?: React.ReactNode` - Optional icon component

**Usage:**
```tsx
<InvoiceMetrics
  invoice={invoice}
  metrics={[
    { label: 'Invoice Amount', value: '$10,000' },
    { label: 'APR', value: '12%' },
    { label: 'Term', value: '30d' },
  ]}
/>
```

---

### `PayerInformation`

Displays payer details including avatar, name, and payment history.

**Props:**
- `invoice: InvoiceDetailData` - Invoice data object
- `payerHistory?: PayerHistoryData` - Optional payer history data

**Usage:**
```tsx
<PayerInformation
  invoice={invoice}
  payerHistory={{
    paymentHistory: '100% On-Time',
    totalInvoicesPaid: 127,
    averagePaymentTime: 28,
  }}
/>
```

---

### `RiskAssessment`

Shows risk level, industry classification, and key risk factors.

**Props:**
- `invoice: InvoiceDetailData` - Invoice data object
- `riskFactors?: RiskFactors` - Optional risk factors

**Usage:**
```tsx
<RiskAssessment
  invoice={invoice}
  riskFactors={{
    factors: [
      'Strong payer credit history',
      'Established business relationship',
    ],
  }}
/>
```

---

### `FinancialBreakdown`

Detailed financial calculations with flexible line items.

**Props:**
- `invoice: InvoiceDetailData` - Invoice data object
- `lineItems: FinancialLineItem[]` - Array of financial line items
- `title?: string` - Section title (default: "Financial Details")

**Usage:**
```tsx
<FinancialBreakdown
  invoice={invoice}
  lineItems={[
    { label: 'Invoice Amount', value: '$10,000' },
    { label: 'Discount Rate', value: '5%' },
    { label: 'Total', value: '$9,500', emphasis: true },
  ]}
/>
```

---

### `DocumentsSection`

Displays document attachments with download/view functionality.

**Props:**
- `documents?: Document[]` - Array of document objects
- `disabledMessage?: string` - Message shown when documents are disabled

**Usage:**
```tsx
<DocumentsSection
  documents={[
    { name: 'Invoice.pdf', url: '/path/to/file.pdf' },
    { name: 'PO.pdf', disabled: true },
  ]}
/>
```

---

## Types

All shared TypeScript types are defined in `types.ts`:

- `InvoiceDetailData` - Main invoice data structure
- `PayerHistoryData` - Payer payment history
- `RiskFactors` - Risk assessment factors
- `MetricItem` - Individual metric display
- `FinancialLineItem` - Financial breakdown line item
- `Document` - Document attachment

## Architecture

### Composition Pattern

Each application composes its detail pages from:

1. **Shared Core Components** (from `@ui`)
   - Common UI patterns used across all apps
   - Consistent styling and behavior

2. **App-Specific Components**
   - Role-specific functionality
   - Custom business logic

3. **Page-Level Composition**
   - Combines shared and custom components
   - Handles data fetching and state management

### Example: Investor Marketplace Page

```tsx
import {
  InvoiceDetailHeader,
  InvoiceMetrics,
  PayerInformation,
  RiskAssessment,
  FinancialBreakdown,
  DocumentsSection,
} from '@ui';

export default function MarketplaceDetailPage() {
  return (
    <div>
      <InvoiceDetailHeader invoice={invoice} />
      <InvoiceMetrics invoice={invoice} metrics={[...]} />
      <FinancialBreakdown invoice={invoice} lineItems={[...]} />
      <PayerInformation invoice={invoice} />
      <RiskAssessment invoice={invoice} />
      <DocumentsSection />

      {/* Investor-specific: Funding Modal */}
      <FundingModal invoice={invoice} />
    </div>
  );
}
```

### Example: Investor Portfolio Page

```tsx
import {
  InvoiceDetailHeader,
  InvoiceMetrics,
  PayerInformation,
  RiskAssessment,
} from '@ui';
import {
  NFTOwnership,
  PerformanceMetrics,
  InvestmentTimeline,
} from '@/components/portfolio';

export default function PortfolioDetailPage() {
  return (
    <div>
      <InvoiceDetailHeader invoice={investment} statusBadge={<Badge />} />
      <InvoiceMetrics invoice={investment} metrics={[...]} />

      {/* Investor-specific: Performance Tracking */}
      <PerformanceMetrics {...investmentData} />
      <InvestmentTimeline {...timelineData} />
      <NFTOwnership {...nftData} />

      <PayerInformation invoice={investment} />
      <RiskAssessment invoice={investment} />
    </div>
  );
}
```

### Example: SMB Invoice Page

The SMB invoice detail page has a different focus (invoice intrinsics rather than investment metrics), so it maintains its own custom structure while potentially importing shared components for specific sections where appropriate.

## Benefits

✅ **DRY Principle** - Single source of truth for common UI patterns
✅ **Consistency** - Same look and feel across invoice views
✅ **Maintainability** - Fix bugs once, apply everywhere
✅ **Type Safety** - Shared TypeScript interfaces
✅ **Flexibility** - Each app can add role-specific sections
✅ **Testability** - Components can be tested in isolation

## Import Path

All components are exported from the main UI library:

```tsx
import {
  InvoiceDetailHeader,
  InvoiceMetrics,
  PayerInformation,
  RiskAssessment,
  FinancialBreakdown,
  DocumentsSection,
  type InvoiceDetailData,
  type PayerHistoryData,
  type RiskFactors,
} from '@ui';
```

## Future Enhancements

- [ ] Add loading states for async data
- [ ] Implement skeleton loaders
- [ ] Add animation/transitions
- [ ] Create Storybook stories for each component
- [ ] Add unit tests
- [ ] Support multiple currencies
- [ ] Add internationalization (i18n)
