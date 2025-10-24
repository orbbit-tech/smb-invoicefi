# Smart Contract ABIs

This directory contains Application Binary Interfaces (ABIs) for the smart contracts deployed on Base network.

## Files

### InvoiceNFT.abi.json
ABI for the Invoice NFT smart contract. Contains event definitions for:
- `InvoiceMinted` - When a new invoice NFT is created
- `InvoiceFunded` - When an investor funds an invoice
- `RepaymentDeposited` - When repayment funds are deposited
- `InvoiceSettled` - When funds are distributed to investor
- `InvoiceDefaulted` - When an invoice defaults
- `Transfer` - ERC721 standard transfer event

## Usage

These ABIs are used by:
1. **CDP Webhook Service** - To register webhook subscriptions for specific events
2. **Event Listener Service** - To parse event data from blockchain
3. **Contract Service** - To interact with smart contracts

## Updating ABIs

After deploying new contract versions:

1. Export the ABI from your Hardhat/Foundry compilation output
2. Update the corresponding JSON file in this directory
3. Update event signatures in `cdp-webhook.service.ts` if event structures changed
4. Restart the backend service to register updated webhooks

## Contract Addresses

Contract addresses are configured via environment variables in `.env`:

```
INVOICE_CONTRACT_ADDRESS=0x...
FUNDING_POOL_CONTRACT_ADDRESS=0x...
```

See `.env.example` for all required configuration.
