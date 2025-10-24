# CDP Webhooks Setup Guide

Complete guide for setting up Coinbase Developer Platform (CDP) webhooks for real-time blockchain event listening on Base.

## Overview

This implementation uses CDP webhooks to automatically sync smart contract events from Base blockchain to your PostgreSQL database. When an investor funds an invoice, repays it, or any other blockchain event occurs, CDP sends a webhook notification to your backend, which processes it and updates your database.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Smart Contract Event Emitted on Base                         │
│    (InvoiceFunded, InvoiceMinted, InvoiceRepaid, etc.)         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. CDP Detects Event (sub-second latency)                       │
│    - Monitors your contract addresses                           │
│    - Filters by event signatures                                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. CDP Sends HTTPS POST to Your Webhook Endpoint                │
│    POST https://your-backend.com/webhooks/blockchain            │
│    - Includes event data, transaction hash, block info          │
│    - Signed with CDP signature for verification                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. WebhookReceiverController Processes Request                  │
│    - Verifies signature                                         │
│    - Routes to appropriate event handler                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. EventListenerService Syncs to Database                       │
│    - Creates/updates invoice records                            │
│    - Creates investor positions                                 │
│    - Stores transaction hashes                                  │
│    - Updates on-chain status                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

### 1. CDP Account Setup

1. Go to https://portal.cdp.coinbase.com/
2. Create an account or sign in
3. Create a new project
4. Navigate to **API Keys** section
5. Click **Create API Key**
6. Download the JSON file (e.g., `cdp_api_key.json`)
7. Store it securely - you'll need it for configuration

### 2. Smart Contract Deployment

Before setting up webhooks, you need:
- ✅ Smart contracts deployed to Base Sepolia (testnet) or Base Mainnet
- ✅ Contract addresses noted
- ✅ Contract ABIs exported

**Contracts needed:**
- Invoice NFT contract (minting, funding, settlement)
- Funding Pool contract (optional, if separate from NFT contract)

### 3. Public Webhook Endpoint

Your backend must be accessible via HTTPS:

**For Development:**
```bash
# Install ngrok: https://ngrok.com/download
# Start your backend
pnpm nx serve backend

# In another terminal, expose it
ngrok http 9000

# Note the HTTPS URL (e.g., https://abc123.ngrok.io)
```

**For Production:**
- Deploy backend to Railway, Render, Vercel, or similar
- Ensure HTTPS is enabled (usually automatic)
- Note your backend URL (e.g., https://api.orbbit.finance)

## Configuration

### Step 1: Update Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
# apps/backend/.env.local

# Network configuration
BLOCKCHAIN_NETWORK=base-sepolia  # or "base-mainnet" for production

# Smart contract addresses (update after deployment)
INVOICE_CONTRACT_ADDRESS=0xYourInvoiceContractAddress
FUNDING_POOL_CONTRACT_ADDRESS=0xYourFundingPoolAddress
WHITELIST_CONTRACT_ADDRESS=0xYourWhitelistAddress

# CDP configuration
CDP_API_KEY_PATH=./cdp_api_key.json
CDP_WEBHOOKS_ENABLED=true
WEBHOOK_NOTIFICATION_URI=https://abc123.ngrok.io/webhooks/blockchain

# RPC URLs (optional, defaults provided)
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### Step 2: Place CDP API Key

Copy your downloaded `cdp_api_key.json` to the backend directory:

```bash
cp ~/Downloads/cdp_api_key.json apps/backend/cdp_api_key.json

# Add to .gitignore if not already there
echo "cdp_api_key.json" >> apps/backend/.gitignore
```

### Step 3: Update Smart Contract ABIs

After deploying contracts, update the ABI file with actual event definitions:

```bash
# Copy ABI from your contract compilation output
# If using Hardhat:
cp libs/smart-contracts/artifacts/contracts/InvoiceNFT.sol/InvoiceNFT.json \
   apps/backend/src/blockchain/abis/InvoiceNFT.abi.json

# Extract just the ABI array (not the full Hardhat artifact)
```

The ABI must include these events:
- `InvoiceMinted(uint256 tokenId, address issuer, uint256 amount, uint256 dueAt, uint256 apr)`
- `InvoiceFunded(uint256 tokenId, address investor, uint256 amount, uint256 fundedAt)`
- `RepaymentDeposited(uint256 tokenId, uint256 amount, address depositedBy, uint256 depositedAt)`
- `InvoiceSettled(uint256 tokenId, address investor, uint256 principal, uint256 yield, uint256 totalAmount, uint256 settledAt)`
- `InvoiceDefaulted(uint256 tokenId, address investor, uint256 principal, uint256 defaultedAt)`

## Starting the Service

### Development

```bash
# Terminal 1: Start backend
cd apps/backend
pnpm nx serve backend

# Terminal 2: Start ngrok
ngrok http 9000

# Terminal 3: Test webhook endpoint
curl https://abc123.ngrok.io/webhooks/blockchain/health
# Should return: {"status":"healthy","timestamp":"...","service":"blockchain-webhook-receiver"}
```

### Production

```bash
# Deploy backend with environment variables set
# Webhooks will automatically register on startup if CDP_WEBHOOKS_ENABLED=true
```

## Webhook Registration

Webhooks are automatically registered when the backend starts (if `CDP_WEBHOOKS_ENABLED=true`).

You can verify registration by checking logs:

```
[CdpWebhookService] CDP SDK initialized successfully
[CdpWebhookService] Registering CDP webhooks...
[CdpWebhookService] Registered ERC721 transfer webhook: wh_abc123...
[CdpWebhookService] Registered contract events webhook: wh_def456...
[CdpWebhookService] All webhooks registered successfully
```

### Manual Webhook Management

If you need to manually manage webhooks:

```typescript
// In NestJS controller or service
import { CdpWebhookService } from './blockchain/cdp-webhook.service';

// List all webhooks
const webhooks = await cdpWebhookService.listWebhooks();

// Delete a webhook
await cdpWebhookService.deleteWebhook('wh_abc123...');

// Update webhook URI
await cdpWebhookService.updateWebhookUri('wh_abc123...', 'https://new-url.com/webhooks');
```

## Testing

### 1. Test Webhook Endpoint

```bash
# Health check
curl -X POST https://your-backend.com/webhooks/blockchain/health

# Expected: {"status":"healthy","timestamp":"..."}
```

### 2. Deploy Test Contract & Emit Events

```bash
cd libs/smart-contracts

# Deploy to Base Sepolia
pnpm hardhat deploy --network base-sepolia

# Mint a test invoice
pnpm hardhat run scripts/mint-test-invoice.ts --network base-sepolia
```

### 3. Monitor Webhook Delivery

**In CDP Dashboard:**
1. Go to https://portal.cdp.coinbase.com/
2. Navigate to **Webhooks** section
3. Click on your webhook
4. View **Event History** to see:
   - Delivery attempts
   - Success/failure status
   - Response codes
   - Retry attempts

**In Your Backend Logs:**
```
[WebhookReceiverController] Received webhook: wh_evt_abc123, type: InvoiceFunded, tx: 0x...
[EventListenerService] Processing InvoiceFunded event: 0x...
[EventListenerService] Successfully processed InvoiceFunded event for token 1
```

## Event Handlers

Each event type is handled by a specific method in `EventListenerService`:

| Event | Handler | Database Operations |
|-------|---------|---------------------|
| `InvoiceMinted` | `handleInvoiceMinted()` | Creates NFT record, updates invoice status to LISTED |
| `InvoiceFunded` | `handleInvoiceFunded()` | Creates funding detail, investor position, updates status to FUNDED |
| `RepaymentDeposited` | `handleRepaymentDeposited()` | Updates invoice to FULLY_PAID, records transaction |
| `InvoiceSettled` | `handleInvoiceRepaid()` | Creates repayment record, distribution record, closes position |
| `InvoiceDefaulted` | `handleInvoiceDefaulted()` | Creates default record, updates position to DEFAULTED |

## Troubleshooting

### Webhooks Not Firing

**Check:**
1. ✅ `CDP_WEBHOOKS_ENABLED=true` in `.env`
2. ✅ Backend is running and accessible via HTTPS
3. ✅ Contract address is correct in `.env`
4. ✅ Events are actually being emitted on blockchain (check Basescan)
5. ✅ CDP dashboard shows webhook as "Active"

**Debug:**
```bash
# Check backend logs
tail -f apps/backend/logs/app.log

# Test webhook endpoint
curl -X POST https://your-backend.com/webhooks/blockchain/health
```

### Invalid Signature Errors

This means CDP sent a webhook but signature verification failed.

**Possible causes:**
1. Wrong API key configured
2. Webhook payload was modified in transit (MITM attack)
3. Request body was read before verification

**Fix:**
- Ensure `CDP_API_KEY_PATH` points to correct file
- Never modify request body before signature verification

### Events Processed Multiple Times

The service includes idempotency checks to prevent duplicate processing.

If you see duplicates:
1. Check `blockchain.transaction` table for duplicate `txHash`
2. Review logs for `already processed, skipping` messages
3. Verify transaction hash uniqueness in your database

### Missing Events

CDP guarantees delivery but may retry failed webhooks.

**If events are missing:**
1. Check CDP dashboard → Webhook → Event History for failed deliveries
2. Review your backend logs for errors during event processing
3. Use manual sync function if needed:

```typescript
// Sync specific invoice
await eventListenerService.syncInvoiceById('inv_123');

// Sync block range
await eventListenerService.syncFromBlock(BigInt(12345000), BigInt(12345100));
```

## Security Considerations

### 1. Signature Verification

**ALWAYS** verify webhook signatures:
```typescript
const isValid = cdpWebhookService.verifyWebhookSignature(payload, signature);
if (!isValid) throw new UnauthorizedException();
```

This prevents:
- Malicious actors sending fake events
- Replay attacks
- Data tampering

### 2. Idempotency

The service checks for duplicate transactions:
```typescript
if (await this.isTransactionProcessed(txHash)) {
  return; // Skip processing
}
```

This prevents:
- Double-spending scenarios
- Duplicate investor positions
- Incorrect accounting

### 3. Database Transactions

All multi-step operations use database transactions:
```typescript
await this.db.transaction().execute(async (trx) => {
  // All operations succeed or all fail
});
```

This ensures:
- Data consistency
- Atomicity (all-or-nothing)
- Rollback on errors

## Production Checklist

Before going live:

- [ ] Smart contracts deployed to Base Mainnet
- [ ] Contract addresses updated in production `.env`
- [ ] CDP API key for production environment created
- [ ] Webhook URL points to production backend (HTTPS)
- [ ] `CDP_WEBHOOKS_ENABLED=true` in production
- [ ] Database migrations run on production DB
- [ ] Backend deployed and running
- [ ] Test invoice funded and webhook received successfully
- [ ] Monitoring setup for webhook failures
- [ ] Alerts configured for critical errors

## Monitoring & Observability

### Key Metrics to Track

1. **Webhook Delivery Success Rate**
   - Monitor in CDP Dashboard
   - Should be >99%

2. **Event Processing Time**
   - Log duration of each event handler
   - Alert if >1 second

3. **Database Transaction Failures**
   - Count failed transactions
   - Alert on any failures

4. **Idempotency Check Hits**
   - Track how often duplicates are detected
   - High rate may indicate CDP retry issues

### Recommended Tools

- **Logging**: Winston, Pino
- **Monitoring**: Sentry, DataDog
- **Alerting**: PagerDuty, Slack webhooks
- **CDP Dashboard**: Built-in webhook monitoring

## FAQ

**Q: Do I need to pay for CDP webhooks?**
A: CDP provides free, rate-limited RPC and webhook access for Base. Check CDP pricing page for current limits.

**Q: What if my backend is down when an event occurs?**
A: CDP retries webhooks multiple times with exponential backoff. You won't lose events.

**Q: Can I use this with other chains besides Base?**
A: CDP currently supports Base Mainnet and Base Sepolia. For other chains, you'd need a different event listener (Alchemy, Infura webhooks, or polling).

**Q: How do I update event handlers after contract changes?**
A: 1) Update ABI file, 2) Update DTOs if event structure changed, 3) Update event handler logic, 4) Deploy backend, 5) CDP will automatically pick up new events.

**Q: Can I test webhooks without deploying contracts?**
A: Yes! Use CDP's test event feature in the dashboard to send mock webhooks to your endpoint.

## Support

- **CDP Documentation**: https://docs.cdp.coinbase.com/
- **CDP Discord**: https://discord.gg/cdp
- **Base Documentation**: https://docs.base.org/
- **Internal Issues**: File in GitHub repo

## Next Steps

1. ✅ Complete this setup
2. 🚀 Deploy contracts to Base Sepolia
3. 🧪 Test with real blockchain transactions
4. 📊 Monitor webhook delivery and processing
5. 🎯 Deploy to production (Base Mainnet)
