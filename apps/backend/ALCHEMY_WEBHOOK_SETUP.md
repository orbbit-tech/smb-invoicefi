# Alchemy Setup Guide - RPC + Webhooks

This guide walks you through setting up Alchemy for both RPC and webhooks using a **single API key** for your entire stack.

## Why Alchemy for Everything?

- ✅ **Single API key** - Use same key for RPC + webhooks across backend & frontend
- ✅ **Production-ready** (99.9% webhook delivery rate)
- ✅ **Proven at scale** (used by OpenSea, Uniswap, Aave)
- ✅ **Better monitoring** (all metrics in one dashboard)
- ✅ **Generous free tier** (100M CUs/month covers RPC + webhooks)

---

## Prerequisites

1. Alchemy account ([Sign up here](https://dashboard.alchemy.com/signup))
2. Base network selected in your Alchemy app
3. Deployed smart contracts on Base (addresses needed)
4. Public HTTPS endpoint for webhook delivery

---

## Step 1: Get Alchemy API Key (Use for Everything)

1. Go to [Alchemy Dashboard](https://dashboard.alchemy.com/)
2. Create a new app (or select existing):
   - **Network**: Base Mainnet or Base Sepolia
   - **Name**: Orbbit Invoice Platform
3. Copy the **API Key** from the dashboard home
4. **This ONE key is used for:**
   - Backend RPC calls
   - Frontend RPC calls (Investor & SMB apps)
   - Webhook authentication

5. Add to all `.env` files:

   **Backend** (`apps/backend/.env`):
   ```bash
   ALCHEMY_API_KEY=your_api_key_here
   BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/your_api_key_here
   BASE_MAINNET_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_api_key_here
   ```

   **Frontend Investor** (`apps/frontend/investor/.env.local`):
   ```bash
   NEXT_PUBLIC_ALCHEMY_API_KEY=your_api_key_here
   NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/your_api_key_here
   NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_api_key_here
   ```

   **Frontend SMB** (`apps/frontend/smb/.env.local`):
   ```bash
   # Same as Investor
   NEXT_PUBLIC_ALCHEMY_API_KEY=your_api_key_here
   NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/your_api_key_here
   NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_api_key_here
   ```

---

## Step 2: Setup Public Webhook Endpoint

### Option A: Production (Recommended)

Use your production backend URL:
```bash
ALCHEMY_WEBHOOK_URL=https://api.yourapp.com/webhooks/blockchain/alchemy
```

### Option B: Local Development with Ngrok

1. Install ngrok: `npm install -g ngrok`
2. Start your backend: `npm run dev` (port 9000)
3. In a new terminal, run:
   ```bash
   ngrok http 9000
   ```
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Add to `.env`:
   ```bash
   ALCHEMY_WEBHOOK_URL=https://abc123.ngrok.io/webhooks/blockchain/alchemy
   ```

---

## Step 3: Create Custom Webhook

### Via Alchemy Dashboard (Recommended)

1. Go to [Webhooks Dashboard](https://dashboard.alchemy.com/webhooks)
2. Click **"Create Webhook"**
3. Select **"Custom Webhook"** (for smart contract events)
4. Configure:

   **Basic Settings:**
   - **Network**: Base Mainnet or Base Sepolia (match your deployment)
   - **Webhook URL**: Your endpoint from Step 2
   - **Webhook Type**: GraphQL

   **GraphQL Query:**
   ```graphql
   {
     block {
       logs(filter: {
         addresses: [
           "YOUR_INVOICE_CONTRACT_ADDRESS",
           "YOUR_FUNDING_POOL_CONTRACT_ADDRESS"
         ]
       }) {
         address
         topics
         data
         transaction {
           hash
           index
         }
         block {
           hash
           number
           timestamp
         }
         logIndex
       }
     }
   }
   ```

5. Click **"Create Webhook"**
6. Copy the **Signing Key** (starts with `whsec_`)
7. Add to `.env`:
   ```bash
   ALCHEMY_WEBHOOK_SIGNING_KEY=whsec_your_signing_key_here
   ```

### Via API (Alternative)

```bash
curl -X POST https://dashboard.alchemy.com/api/create-webhook \
  -H "X-Alchemy-Token: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "network": "BASE_SEPOLIA",
    "webhook_type": "GRAPHQL",
    "webhook_url": "https://your-backend.com/webhooks/blockchain/alchemy",
    "graphql_query": {
      "skip_empty_messages": true,
      "block": {
        "logs": {
          "address": [
            "0xYourInvoiceContract",
            "0xYourFundingPoolContract"
          ],
          "topics": []
        }
      }
    }
  }'
```

---

## Step 4: Configure Environment Variables

Update your `.env` file with all required values:

```bash
# ============================================================================
# Blockchain Webhooks Configuration
# ============================================================================

# Use Alchemy as primary webhook provider
WEBHOOK_PROVIDER=alchemy

# Alchemy Configuration
ALCHEMY_API_KEY=your_api_key_here
ALCHEMY_WEBHOOK_SIGNING_KEY=whsec_your_signing_key_here
ALCHEMY_WEBHOOK_URL=https://your-backend.com/webhooks/blockchain/alchemy

# Enable polling backup (catches missed events)
POLLING_ENABLED=true
POLLING_INTERVAL_MS=300000  # 5 minutes

# Optional: CDP as fallback (not recommended for production)
CDP_WEBHOOKS_ENABLED=false
```

---

## Step 5: Deploy Contract Addresses

After deploying your smart contracts, update the contract addresses in `.env`:

```bash
# Base Sepolia (Testnet)
INVOICE_CONTRACT_ADDRESS_BASE_SEPOLIA=0xYourInvoiceContractAddress
INVOICE_FUNDING_POOL_CONTRACT_ADDRESS_BASE_SEPOLIA=0xYourFundingPoolAddress

# Base Mainnet (Production)
INVOICE_CONTRACT_ADDRESS_BASE_MAINNET=0xYourInvoiceContractAddress
INVOICE_FUNDING_POOL_CONTRACT_ADDRESS_BASE_MAINNET=0xYourFundingPoolAddress
```

**Important:** After updating addresses, recreate your Alchemy webhook with the new addresses in the GraphQL query (Step 3).

---

## Step 6: Test Webhook

### Test via Alchemy Dashboard

1. Go to your webhook in the [Webhooks Dashboard](https://dashboard.alchemy.com/webhooks)
2. Click **"Test Webhook"**
3. Alchemy will send a test payload to your endpoint
4. Check your backend logs:
   ```bash
   npm run dev
   # Look for: "Received Alchemy webhook: ..."
   ```

### Test with Real Transaction

1. Perform a blockchain transaction (e.g., mint an invoice)
2. Watch your backend logs:
   ```bash
   # Should see:
   # Received Alchemy webhook: {...}
   # Processing Alchemy event: InvoiceMinted, tx: 0x...
   # Successfully processed InvoiceMinted event for token 42
   ```
3. Verify database was updated:
   ```sql
   SELECT * FROM blockchain.contract_event
   WHERE event_name = 'InvoiceMinted'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

### Health Check Endpoint

Test that your webhook receiver is healthy:

```bash
curl -X POST http://localhost:9000/webhooks/blockchain/health
# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-01-23T10:30:00.000Z",
#   "service": "blockchain-webhook-receiver",
#   "providers": {
#     "alchemy": true,
#     "cdp": false
#   }
# }
```

---

## Step 7: Monitor Webhooks

### Alchemy Dashboard

1. Go to [Webhooks Dashboard](https://dashboard.alchemy.com/webhooks)
2. Select your webhook
3. View metrics:
   - **Delivery rate**: Should be >99%
   - **Latency**: Average response time
   - **Recent deliveries**: Last 100 webhook calls
   - **Errors**: Failed deliveries

### Backend Logs

Monitor your application logs for webhook processing:

```bash
# Success logs
[EventListenerService] Processing Alchemy event: InvoiceFunded, tx: 0xabc...
[EventListenerService] Successfully processed InvoiceFunded event for token 42

# Error logs (investigate these)
[WebhookReceiverController] Invalid Alchemy webhook signature
[EventListenerService] Error processing InvoiceFunded event: ...
```

### Database Verification

Check that events are being recorded:

```sql
-- Recent contract events
SELECT
  event_name,
  tx_hash,
  block_number,
  processed,
  created_at
FROM blockchain.contract_event
ORDER BY created_at DESC
LIMIT 10;

-- Event processing stats
SELECT
  event_name,
  COUNT(*) as count,
  MAX(created_at) as last_processed
FROM blockchain.contract_event
GROUP BY event_name;
```

---

## Troubleshooting

### Webhook Not Receiving Events

**Check 1: Verify webhook is active**
```bash
curl -H "X-Alchemy-Token: YOUR_API_KEY" \
  https://dashboard.alchemy.com/api/team-webhooks
```

**Check 2: Test endpoint manually**
```bash
curl -X POST https://your-backend.com/webhooks/blockchain/alchemy \
  -H "Content-Type: application/json" \
  -H "x-alchemy-signature: test" \
  -d '{"webhookId":"test","id":"test","createdAt":"2025-01-01","type":"GRAPHQL","event":{"network":"BASE_SEPOLIA","data":{"block":{"logs":[]}}}}'
```

**Check 3: Verify contract addresses**
- Ensure addresses in GraphQL query match deployed contracts
- Addresses must be lowercase
- Addresses must be checksummed (0x prefix)

**Check 4: Network mismatch**
- Webhook network (BASE_MAINNET/BASE_SEPOLIA) must match your deployment
- RPC URL must match the same network

### Signature Verification Failing

**Check 1: Signing key is correct**
```bash
# Should start with whsec_
echo $ALCHEMY_WEBHOOK_SIGNING_KEY
```

**Check 2: Raw body is preserved**
- Ensure your server passes raw body to signature verification
- NestJS requires `rawBody` middleware for this

**Check 3: Test signature generation**
```typescript
import * as crypto from 'crypto';

const body = '{"webhookId":"test",...}'; // Exact payload
const signingKey = 'whsec_...';
const hmac = crypto.createHmac('sha256', signingKey);
hmac.update(body, 'utf8');
const signature = hmac.digest('hex');
console.log('Expected signature:', signature);
```

### Events Not Processing

**Check 1: Event signatures**
- Update `EVENT_SIGNATURES` in `alchemy-webhook.dto.ts` after contract deployment
- Get event signatures from your contract ABI

**Check 2: Database connection**
```bash
# Check if database is accessible
npm run db:test-connection
```

**Check 3: Review logs**
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev
```

### Polling Backup Not Running

**Check 1: Polling is enabled**
```bash
POLLING_ENABLED=true
```

**Check 2: Cron is initialized**
```typescript
// Check logs for:
// [EventListenerService] Polling backup enabled (every 5 minutes)
```

**Check 3: Manual trigger**
```typescript
// In your backend, manually trigger:
await eventListenerService.pollBlockchainEvents();
```

---

## Best Practices

### 1. Use Polling Backup

Always enable polling as a safety net:
```bash
POLLING_ENABLED=true
POLLING_INTERVAL_MS=300000  # 5 minutes
```

### 2. Monitor Webhook Health

Set up alerts for:
- Webhook delivery rate < 95%
- Average latency > 5 seconds
- Signature verification failures

### 3. Handle Idempotency

Webhooks may deliver duplicate events:
- ✅ Our implementation checks `processedTxHashes` Set
- ✅ Database checks for existing transactions
- ✅ Polling also respects idempotency

### 4. Respond Quickly

Alchemy expects response within 5 seconds:
- ✅ Return 200 OK immediately
- ✅ Process events asynchronously
- ✅ Don't wait for database commits in response

### 5. Secure Your Endpoint

- ✅ Always verify webhook signatures
- ✅ Use HTTPS in production
- ✅ Rate limit the webhook endpoint
- ✅ Don't expose in public docs

---

## Production Checklist

Before going live:

- [ ] Alchemy webhook created with production contract addresses
- [ ] Signing key configured in environment
- [ ] Webhook URL is HTTPS (not HTTP)
- [ ] Polling backup enabled
- [ ] Database indexes on `tx_hash` for fast lookups
- [ ] Monitoring/alerts configured
- [ ] Load tested webhook endpoint (can handle burst traffic)
- [ ] Error handling tested (database down, network timeout, etc.)
- [ ] Webhook delivery logs reviewed (>99% success rate)
- [ ] Backup plan documented (manual sync procedure)

---

## Support

- **Alchemy Docs**: https://docs.alchemy.com/reference/notify-api-quickstart
- **Alchemy Discord**: https://discord.gg/alchemy
- **Our Docs**: See `IMPLEMENTATION_SUMMARY.md` for architecture overview

---

## Migration from CDP Webhooks

If you're currently using CDP webhooks:

1. ✅ Keep CDP webhooks running during migration
2. ✅ Set `WEBHOOK_PROVIDER=alchemy` to switch primary
3. ✅ Monitor both webhook endpoints for 24-48 hours
4. ✅ Compare event delivery rates (Alchemy should be higher)
5. ✅ Once confident, disable CDP: `CDP_WEBHOOKS_ENABLED=false`
6. ✅ Keep polling enabled as backup forever

**Rollback**: Simply change `WEBHOOK_PROVIDER=cdp` to switch back.

---

**You're all set!** 🎉

Your backend is now configured to receive production-ready webhook notifications from Alchemy with polling backup for 100% reliability.
