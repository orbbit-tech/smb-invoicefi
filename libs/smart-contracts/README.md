# Orbbit Smart Contracts

Smart contracts for the Orbbit invoice financing protocol, built for Base (Ethereum L2).

## Overview

Orbbit enables SMBs to tokenize their invoices as NFTs and receive immediate funding from investors. The protocol automates the entire lifecycle from invoice creation to yield distribution.

### Core Contracts

- **InvoiceNFT** - ERC-721 contract for tokenized invoices with lifecycle status tracking
- **FundingPool** - Manages USDC deposits, investor tracking, and automated yield distribution
- **InvoiceFactory** - Simplified invoice creation and listing
- **MockUSDC** - Test USDC token for testnet development

### Architecture

```
┌─────────────────┐
│ InvoiceFactory  │ ─────┐
└─────────────────┘      │
                         │ Mints & Lists
                         ↓
                  ┌──────────────┐
                  │  InvoiceNFT  │
                  └──────────────┘
                         ↑
                         │ Updates Status
                         │
                  ┌──────────────┐      ┌────────┐
                  │ FundingPool  │ ←──→ │  USDC  │
                  └──────────────┘      └────────┘
                         ↑
                         │
                   [Investors Fund]
```

## Technology Stack

This project uses a **dual-framework approach**:

- **Foundry** - Fast Solidity testing and development
- **Hardhat** - Deployment, TypeScript integration, and TypeChain generation

### Why Both?

- Foundry: Fast unit tests (~10x faster), gas optimization, fuzz testing
- Hardhat: TypeScript deployment scripts, TypeChain types for frontend, better debugging

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

### Environment Variables

Create a `.env` file in the monorepo root:

```bash
# Private key for deployment (DO NOT COMMIT)
PRIVATE_KEY=your_private_key_here

# RPC URLs
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_MAINNET_RPC=https://mainnet.base.org

# Optional: for contract verification
BASESCAN_API_KEY=your_basescan_api_key
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
import { InvoiceNFT, FundingPool } from '@libs/contracts/types';
import { ethers } from 'ethers';

// Connect to contract
const invoiceNFT = new ethers.Contract(
  contractAddress,
  InvoiceNFT__factory.abi,
  signer
) as InvoiceNFT;

// Call contract methods with full TypeScript support
const invoice = await invoiceNFT.getInvoice(tokenId);
console.log(invoice.amount); // TypeScript knows the structure!
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
forge test --match-contract InvoiceNFTTest
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

**Using Hardhat:**
```bash
nx run smart-contracts:deploy:sepolia
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

**Using Hardhat:**
```bash
nx run smart-contracts:deploy:mainnet
```

**Using Foundry:**
```bash
forge script script/Deploy.s.sol \
  --rpc-url $BASE_MAINNET_RPC \
  --broadcast \
  --verify
```

### Deployment Process

The deployment script will:

1. Deploy MockUSDC (testnet only) or use Base USDC (mainnet)
2. Deploy InvoiceNFT
3. Deploy FundingPool
4. Deploy InvoiceFactory
5. Configure all roles and permissions
6. Output deployment addresses

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
    "usdc": "0x...",
    "invoiceNFT": "0x...",
    "fundingPool": "0x...",
    "factory": "0x..."
  }
}
```

## Contract Verification

Contracts are automatically verified during deployment if `BASESCAN_API_KEY` is set.

**Manual verification:**

```bash
npx hardhat verify --network base <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

Example:
```bash
npx hardhat verify --network base 0x123... "0xUSDC" "0xInvoiceNFT"
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

### Create New Invoice (Admin Only)

```typescript
const tx = await factory.createInvoice(
  ethers.parseUnits("10000", 6), // 10,000 USDC
  Math.floor(Date.now() / 1000) + 86400 * 30, // Due in 30 days
  25, // Risk score
  "Acme Corporation",
  "INV-2025-001",
  "ipfs://QmMetadata..."
);

const receipt = await tx.wait();
// Invoice is automatically listed on marketplace
```

### Fund Invoice (Investor)

```typescript
// 1. Approve USDC
await usdc.approve(fundingPoolAddress, amount);

// 2. Deposit USDC
await fundingPool.depositUSDC(tokenId, amount);

// Contract automatically updates status when fully funded
```

### Trigger Repayment (Admin Only)

```typescript
// Calculate repayment amount (principal + yield)
const repaymentAmount = principalAmount * 1.1; // 10% yield

// Approve USDC
await usdc.approve(fundingPoolAddress, repaymentAmount);

// Trigger repayment - automatically distributes to all investors
await fundingPool.triggerRepayment(tokenId, repaymentAmount);

// Yield is automatically distributed proportionally!
```

## Security

### Access Control

The contracts use OpenZeppelin's `AccessControl` for role-based permissions:

- **DEFAULT_ADMIN_ROLE** - Can manage all roles (deployer)
- **MINTER_ROLE** - Can mint invoice NFTs (InvoiceFactory)
- **UPDATER_ROLE** - Can update invoice status (InvoiceFactory, FundingPool)
- **ADMIN_ROLE** - Can create invoices and trigger repayments (Orbbit admins)

### Safety Features

- ReentrancyGuard on all fund transfers
- Pausable functionality for emergency stops
- SafeERC20 for secure token transfers
- Validated status transitions
- Overflow protection (Solidity 0.8.20)

## Project Structure

```
libs/smart-contracts/
├── contracts/
│   ├── InvoiceNFT.sol          # ERC-721 invoice tokens
│   ├── FundingPool.sol         # USDC deposits & yield distribution
│   ├── InvoiceFactory.sol      # Simplified invoice creation
│   └── mocks/
│       └── MockUSDC.sol        # Test USDC token
├── test/
│   ├── InvoiceNFT.t.sol        # Foundry unit tests
│   ├── FundingPool.t.sol
│   └── InvoiceFactory.t.sol
├── test-integration/
│   └── invoice-lifecycle.test.ts   # Hardhat integration tests
├── script/
│   └── Deploy.s.sol            # Foundry deployment script
├── deploy/
│   └── 001_deploy_contracts.ts    # Hardhat deployment script
├── foundry.toml                # Foundry configuration
├── hardhat.config.ts           # Hardhat configuration
└── project.json                # Nx configuration
```

## Troubleshooting

### "Exceeds target amount" error

Ensure deposit doesn't exceed the invoice amount. Check remaining funding needed:

```typescript
const info = await fundingPool.getFundingInfo(tokenId);
const remaining = info.targetAmount - info.totalFunded;
```

### "Invoice not available for funding" error

Check invoice status. Only `Listed` or `PartiallyFunded` invoices can receive deposits:

```typescript
const invoice = await invoiceNFT.getInvoice(tokenId);
console.log("Status:", invoice.status); // Should be 1 or 2
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
