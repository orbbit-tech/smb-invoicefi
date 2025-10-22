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
