# Orbbit Smart Contracts

Smart contracts for the Orbbit invoice financing protocol, built for Base (Ethereum L2).

## Overview

Orbbit enables SMBs to tokenize their invoices as NFTs and receive immediate funding from investors. The protocol automates the entire lifecycle from invoice creation to yield distribution.

**V1**: Currently uses USDC exclusively as the payment token on Base.

### Core Contracts

- **Invoice** - ERC-721 contract for tokenized invoices with lifecycle status tracking
- **InvoiceFundingPool** - Manages payment token deposits (USDC), investor tracking, and automated yield distribution
- **MockUSDC** - Test USDC token for testnet development

### Architecture

```
                  ┌──────────────┐
                  │   Invoice    │     ERC-721 NFTs
                  └──────────────┘
                         ↑
                         │ Mints & Updates
                         │
                  ┌───────────────────────┐      ┌───────────────┐
                  │ InvoiceFundingPool  │ ←──→ │ Payment Token │
                  └───────────────────────┘      └───────────────┘
                         ↑                          (USDC on Base)
                         │
                   [Investors Fund]
                   (Lazy Minting)
```

## Technology Stack

This project uses a **dual-framework approach**:

- **Foundry** - Fast Solidity testing and development
- **Hardhat v3** - Deployment with Ignition, TypeScript integration, and TypeChain generation

### Why Both?

- Foundry: Fast unit tests (~10x faster), gas optimization, fuzz testing
- Hardhat v3: Declarative deployments with Ignition, TypeChain types for frontend, encrypted keystore for secrets

## Prerequisites

### Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Verify installation:
```bash
forge --version
```

### Install Node Dependencies

From the monorepo root:
```bash
pnpm install
```

## Setup

### Hardhat v3 Keystore Setup (Encrypted Secrets)

Hardhat v3 uses an encrypted keystore for secure storage of private keys and API keys.

**Set up your private keys:**

```bash
# For Base Sepolia testnet (encrypted, password-protected)
npx hardhat keystore set TESTNET_DEPLOYER_PRIVATE_KEY

# For Base Mainnet (encrypted, password-protected)
npx hardhat keystore set MAINNET_DEPLOYER_PRIVATE_KEY

# For contract verification
npx hardhat keystore set ETHERSCAN_API_KEY

# For development (no password prompt)
npx hardhat keystore set TESTNET_DEPLOYER_PRIVATE_KEY --dev
```

**Manage keystore:**
```bash
npx hardhat keystore list              # List all keys
npx hardhat keystore get <KEY>         # Get a key value
npx hardhat keystore delete <KEY>      # Delete a key
npx hardhat keystore change-password   # Change password
```

> 📚 **New to Hardhat v3?** See [HARDHAT_V3_MIGRATION.md](./HARDHAT_V3_MIGRATION.md) for full migration guide.

### Environment Variables (Optional)

For non-sensitive values like RPC URLs, create a `.env` file:

```bash
# RPC URLs (optional - defaults are provided)
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_MAINNET_RPC=https://mainnet.base.org
```

### Install Foundry Dependencies

Foundry dependencies are managed via git submodules:

```bash
cd libs/smart-contracts
forge install
```

## Development

### Compile Contracts

**Using Foundry:**
```bash
nx run smart-contracts:build:foundry
```

**Using Hardhat:**
```bash
nx run smart-contracts:build:hardhat
```

### Run Tests

**Foundry Unit Tests (Fast):**
```bash
nx run smart-contracts:test
```

With gas reporting:
```bash
nx run smart-contracts:test:gas
```

With coverage:
```bash
nx run smart-contracts:test:coverage
```

**Hardhat Integration Tests:**
```bash
nx run smart-contracts:test:integration
```

### Generate TypeChain Types

Generate TypeScript types for frontend integration:

```bash
nx run smart-contracts:typechain
```

Types will be generated to: `libs/frontend/ui/generated/contracts/`

### Use in Frontend

Import generated types in your frontend code:

```typescript
import { Invoice, InvoiceFundingPool } from '@libs/contracts/types';
import { ethers } from 'ethers';

// Connect to contract
const invoice = new ethers.Contract(
  contractAddress,
  Invoice__factory.abi,
  signer
) as Invoice;

// Call contract methods with full TypeScript support
const invoiceData = await invoice.getInvoice(tokenId);
console.log(invoiceData.amount); // TypeScript knows the structure!
```

## Testing

### Test Structure

Following the testing pyramid (as per our docs):

```
Unit Tests (50%)           → Foundry  → test/*.t.sol
Integration Tests (30%)    → Hardhat  → test-integration/*.test.ts
E2E Tests (20%)           → Hardhat  → Frontend integration
```

### Running Specific Tests

**Run specific Foundry test:**
```bash
forge test --match-test testMintInvoiceSuccess
```

**Run specific contract tests:**
```bash
forge test --match-contract InvoiceTest
```

**Run with verbosity:**
```bash
forge test -vvvv
```

**Run specific Hardhat test:**
```bash
npx hardhat test test-integration/invoice-lifecycle.test.ts
```

## Deployment

### Deploy to Base Sepolia (Testnet)

**Using Hardhat Ignition (Recommended):**
```bash
npx hardhat ignition deploy ignition/modules/OrbbitProtocol.ts \
  --network baseSepolia \
  --parameters ignition/parameters/base-sepolia.json
```

**Using Foundry:**
```bash
forge script script/Deploy.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC \
  --broadcast \
  --verify
```

### Deploy to Base Mainnet

⚠️ **IMPORTANT**: Triple-check all configurations before mainnet deployment!

**Using Hardhat Ignition (Recommended):**
```bash
npx hardhat ignition deploy ignition/modules/OrbbitProtocol.ts \
  --network base \
  --parameters ignition/parameters/base-mainnet.json
```

**Using Foundry:**
```bash
forge script script/Deploy.s.sol \
  --rpc-url $BASE_MAINNET_RPC \
  --broadcast \
  --verify
```

### Deployment Process

The Hardhat Ignition deployment will:

1. Use Circle's official USDC on Base (testnet/mainnet)
2. Deploy Whitelist contract
3. Deploy Invoice NFT contract
4. Deploy InvoiceFundingPool contract
5. Configure all inter-contract roles and permissions
6. Save deployment artifacts to `ignition/deployments/`

Ignition provides:
- ✅ Declarative deployment modules
- ✅ Automatic retry and failure recovery
- ✅ Built-in deployment verification
- ✅ Reproducible deployments across networks

### Contract Addresses

After deployment, addresses will be saved to:
- `deployments-84532.json` (Base Sepolia)
- `deployments-8453.json` (Base Mainnet)

Example output:
```json
{
  "network": "84532",
  "deployer": "0x...",
  "contracts": {
    "paymentToken": "0x...",
    "invoice": "0x...",
    "invoiceFundingPool": "0x..."
  }
}
```

## Contract Verification

Contracts are automatically verified during deployment if `ETHERSCAN_API_KEY` is set.

**Manual verification:**

```bash
npx hardhat verify --network base <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

Example:
```bash
npx hardhat verify --network base 0x123... "0xUSDC" "0xInvoice"
```

## Gas Optimization

### View Gas Report

```bash
nx run smart-contracts:test:gas
```

### Create Gas Snapshot

```bash
nx run smart-contracts:snapshot
```

This creates `.gas-snapshot` file for tracking gas changes over time.

## Common Tasks

### Fund Invoice (Investor)

```typescript
// Load invoice details from database
const invoice = await fetch(`/api/invoices/${invoiceId}`).then(r => r.json());

// 1. Approve payment token (USDC)
await paymentToken.approve(invoiceFundingPoolAddress, invoice.amount);

// 2. Fund invoice (lazy minting - NFT created here!)
const tx = await invoiceFundingPool.fundInvoice(
  invoice.amount,
  invoice.payer,
  invoice.dueDate,
  invoice.apy,
  invoice.smbWallet,
  invoice.metadataURI
);

const receipt = await tx.wait();
// NFT minted directly to investor with FUNDED status
```

### Deposit Repayment (SMB/Admin)

```typescript
// Step 1: Deposit repayment to contract
// Calculate repayment amount (principal + yield)
const invoiceData = await invoice.getInvoice(tokenId);
const yield = await invoiceFundingPool.calculateYield(
  invoiceData.amount,
  invoiceData.apy,
  invoiceData.dueDate
);
const totalRepayment = invoiceData.amount + yield;

// Approve payment token (USDC)
await paymentToken.approve(invoiceFundingPoolAddress, totalRepayment);

// Deposit repayment
await invoiceFundingPool.depositRepayment(tokenId);
```

### Settle Repayment (Admin Only)

```typescript
// Step 2: Admin settles repayment to investor
await invoiceFundingPool.settleRepayment(tokenId);

// Yield is automatically distributed to investor!
```

## Security

### Access Control

The contracts use OpenZeppelin's `AccessControl` for role-based permissions:

- **DEFAULT_ADMIN_ROLE** - Can manage all roles (deployer)
- **MINTER_ROLE** - Can mint invoice NFTs (InvoiceFundingPool)
- **UPDATER_ROLE** - Can update invoice status (InvoiceFundingPool)
- **OPERATOR_ROLE** - Can trigger repayments and manage pool operations (Orbbit operations team)

### Safety Features

- ReentrancyGuard on all fund transfers
- Pausable functionality for emergency stops
- SafeERC20 for secure token transfers
- Validated status transitions
- Overflow protection (Solidity 0.8.20)

## Project Structure

```
libs/smart-contracts/
├── contracts/                      # Production contracts only
│   ├── Invoice.sol                 # ERC-721 invoice tokens
│   ├── InvoiceFundingPool.sol      # Payment token deposits & yield (USDC on Base)
│   └── IInvoice.sol                # Invoice interface
├── test/
│   ├── mocks/                      # Test utilities
│   │   └── MockUSDC.sol            # Test USDC token
│   ├── Invoice.t.sol               # Foundry unit tests
│   └── InvoiceFundingPool.t.sol
├── test-integration/
│   └── invoice-lifecycle.test.ts   # Hardhat integration tests
├── script/
│   └── Deploy.s.sol                # Foundry deployment script
├── deploy/
│   └── 001_deploy_contracts.ts    # Hardhat deployment script
├── foundry.toml                    # Foundry configuration
├── hardhat.config.ts               # Hardhat configuration
└── project.json                    # Nx configuration
```

## Troubleshooting

### "Invoice already funded" error

Each invoice can only be funded once (single-investor model). Check funding status:

```typescript
const info = await invoiceFundingPool.getFundingInfo(tokenId);
console.log("Investor:", info.investor); // address(0) if not funded
```

### "Invoice not available for funding" error

Check invoice status. Only `LISTED` invoices can be funded:

```typescript
const invoiceData = await invoice.getInvoice(tokenId);
console.log("Status:", invoiceData.status); // Should be 1 (LISTED)
```

### Foundry not found

Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Gas estimation failed

Ensure you have enough ETH for gas on Base:
```bash
# Check balance
cast balance $YOUR_ADDRESS --rpc-url $BASE_SEPOLIA_RPC
```

## Resources

- [Foundry Documentation](https://book.getfoundry.sh/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Base Documentation](https://docs.base.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [TypeChain Documentation](https://github.com/dethcrypto/TypeChain)

## License

MIT

## Contributing

For internal Orbbit team use. See main monorepo README for contribution guidelines.

## Support

For questions or issues, contact the Orbbit engineering team or create an issue in the monorepo.
