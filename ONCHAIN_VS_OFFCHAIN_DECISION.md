# On-Chain vs Off-Chain Decision Matrix

## Decision Framework

Store a state **ON-CHAIN** only if it meets **ALL** of these criteria:

1. ✅ **Financial Settlement**: Does it trigger money movement (USDC transfers)?
2. ✅ **Ownership Change**: Does it affect NFT ownership or transferability?
3. ✅ **Immutability Required**: Must this be permanent and tamper-proof?
4. ✅ **Public Transparency**: Do investors/market need real-time visibility?
5. ✅ **DeFi Composability**: Will other protocols need to read this status?

## Invoice Lifecycle Analysis

| State | Financial Settlement | Ownership Change | Immutable Required | Public Transparency | DeFi Composability | **Decision** |
|-------|---------------------|------------------|-------------------|--------------------|--------------------|--------------|
| **Draft** | ❌ No | ❌ No | ❌ No (editable) | ❌ No (internal) | ❌ No | **OFF-CHAIN** |
| **Submitted** | ❌ No | ❌ No | ❌ No (can reject) | ❌ No (internal) | ❌ No | **OFF-CHAIN** |
| **Underwriting** | ❌ No | ❌ No | ❌ No (can revise) | ❌ No (private data) | ❌ No | **OFF-CHAIN** |
| **Approved** | ❌ No | ❌ No | ❌ No (can expire) | ❌ No (pre-funding) | ❌ No | **OFF-CHAIN** |
| **Declined** | ❌ No | ❌ No | ❌ No (can appeal) | ❌ No (internal) | ❌ No | **OFF-CHAIN** |
| **Listed** | ❌ No | ❌ No | ❌ No (can delist) | ⚠️ Maybe | ❌ No | **OFF-CHAIN** |
| **Funded** | ✅ USDC transfer | ✅ NFT minted | ✅ Yes | ✅ Yes | ✅ Yes | **ON-CHAIN** ✅ |
| **Awaiting_Payment** | ❌ No | ❌ No | ❌ No (time-based) | ❌ No (calculated) | ❌ No | **OFF-CHAIN** |
| **Due_Date** | ❌ No | ❌ No | ❌ No (time-based) | ❌ No (calculated) | ❌ No | **OFF-CHAIN** |
| **Grace_Period** | ❌ No | ❌ No | ❌ No (can extend) | ⚠️ Maybe | ❌ No | **OFF-CHAIN** |
| **Fully_Paid** | ✅ USDC return | ⚠️ Lifecycle end | ✅ Yes | ✅ Yes | ✅ Yes | **ON-CHAIN** ✅ |
| **Defaulted** | ⚠️ Value = $0 | ⚠️ Trading impact | ✅ Yes | ✅ Yes (risk) | ✅ Yes (liquidation) | **ON-CHAIN** ✅ |
| **Collection** | ❌ No (ongoing) | ❌ No | ❌ No (in progress) | ❌ No (internal ops) | ❌ No | **OFF-CHAIN** |
| **Partial_Paid** | ⚠️ Partial only | ❌ No | ❌ No (can complete) | ❌ No (temporary) | ❌ No | **OFF-CHAIN** |
| **Unpaid** | ❌ No | ❌ No | ❌ No (can recover) | ❌ No (internal) | ❌ No | **OFF-CHAIN** |
| **Charge_Off** | ❌ No (accounting) | ❌ No | ❌ No (tax event) | ❌ No (internal) | ❌ No | **OFF-CHAIN** |
| **Settled** | ❌ No | ❌ No | ❌ No (final cleanup) | ❌ No (internal) | ❌ No | **OFF-CHAIN** |

## Cost Analysis

### Scenario: 1,000 Invoices/Month

#### Option A: All States On-Chain (17 states)
```
Average state transitions per invoice: 8-12
Gas cost per transition: $0.30
Monthly cost: 1,000 × 10 × $0.30 = $3,000/month
Annual cost: $36,000/year
```

#### Option B: Critical States Only (3 on-chain states)
```
Average on-chain transitions per invoice: 2
Gas cost per transition: $0.30
Monthly cost: 1,000 × 2 × $0.30 = $600/month
Annual cost: $7,200/year

Savings: $28,800/year
```

## Architecture Recommendation

### Smart Contract (On-Chain)
```solidity
enum Status {
    DRAFT,      // Legacy, unused (for interface compatibility)
    LISTED,     // Legacy, unused (for interface compatibility)
    FUNDED,     // ✅ Active: NFT minted, investor funded
    REPAID,     // ✅ Active: Full repayment completed
    DEFAULTED   // ✅ Active: Grace period expired, no payment
}
```

### PostgreSQL Database (Off-Chain)
```sql
CREATE TYPE invoice_lifecycle_status AS ENUM (
    -- Pre-funding workflow
    'DRAFT',
    'SUBMITTED',
    'UNDERWRITING',
    'APPROVED',
    'DECLINED',
    'LISTED',

    -- On-chain states (synced from blockchain)
    'FUNDED',
    'FULLY_PAID',    -- Maps to REPAID
    'DEFAULTED',

    -- Post-funding workflow
    'AWAITING_PAYMENT',
    'DUE_DATE',
    'GRACE_PERIOD',
    'COLLECTION',
    'PARTIAL_PAID',
    'UNPAID',
    'CHARGE_OFF',
    'SETTLED'
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    status invoice_lifecycle_status NOT NULL,

    -- Blockchain sync fields
    blockchain_token_id INTEGER,
    blockchain_status VARCHAR(20), -- 'FUNDED', 'REPAID', 'DEFAULTED'
    blockchain_synced_at TIMESTAMP,

    -- Off-chain business data
    underwriting_score NUMERIC,
    collection_notes TEXT,
    partial_payments JSONB,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Event Synchronization Service
```typescript
// Backend service syncs blockchain → database
invoiceFundingPool.on('InvoiceFunded', async (tokenId, investor, amount) => {
    await db.invoice.update({
        where: { id: invoiceId },
        data: {
            status: 'FUNDED',
            blockchain_token_id: tokenId,
            blockchain_status: 'FUNDED',
            blockchain_synced_at: new Date()
        }
    });
});

invoiceFundingPool.on('InvoiceRepaid', async (tokenId, investor, amount) => {
    await db.invoice.update({
        where: { blockchain_token_id: tokenId },
        data: {
            status: 'FULLY_PAID',
            blockchain_status: 'REPAID',
            blockchain_synced_at: new Date()
        }
    });
});

invoiceFundingPool.on('InvoiceDefaulted', async (tokenId, investor, principal) => {
    await db.invoice.update({
        where: { blockchain_token_id: tokenId },
        data: {
            status: 'DEFAULTED',
            blockchain_status: 'DEFAULTED',
            blockchain_synced_at: new Date()
        }
    });
});
```

## Benefits of Hybrid Approach

### Cost Efficiency
- 80% reduction in gas costs
- Scalable to millions of invoices without blockchain congestion

### Flexibility
- Change business logic without smart contract upgrades
- Fix mistakes easily in off-chain states
- Add new statuses (e.g., 'DISPUTED', 'RESTRUCTURED') without migration

### Performance
- Fast dashboard queries (50ms vs 50 seconds)
- Real-time status updates without waiting for blockchain confirmation
- Better UX for SMBs and investors

### Privacy
- Sensitive underwriting data stays private
- GDPR compliance possible (can delete off-chain data)
- Competitive advantage protected

### Security
- Critical financial states immutable on blockchain
- Investor protection through transparent on-chain defaults
- NFT marketplace shows accurate risk status

## References

- **MakerDAO**: https://docs.makerdao.com/smart-contract-modules/core-module
- **Centrifuge**: https://docs.centrifuge.io/getting-started/
- **Goldfinch**: https://docs.goldfinch.finance/goldfinch/protocol-mechanics
- **Ethereum Gas Tracker**: https://basescan.org/gastracker
