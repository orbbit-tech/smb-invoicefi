# Orbbit Investor Dashboard

Invoice financing marketplace where investors fund SMB invoices with USDC and earn yield on Base.

## Features

- 🔐 **Email/OTP Authentication** - Secure Web2 login with Stytch
- 💰 **Wallet Integration** - Connect wallet via OnchainKit for Web3 transactions
- 📊 **Invoice Marketplace** - Browse, filter, and fund SMB invoices
- 📈 **Portfolio Tracking** - Monitor investments and returns
- 🎨 **Themed UI** - OnchainKit components styled to match Orbbit brand

## Getting Started

### Prerequisites

1. **Environment Variables** - Copy `.env.example` to `.env.local` and configure:
   ```bash
   # Coinbase Developer Platform API Key
   # Get from: https://portal.cdp.coinbase.com/
   NEXT_PUBLIC_CDP_API_KEY=your_cdp_api_key_here

   # WalletConnect Project ID
   # Get from: https://cloud.walletconnect.com/
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
   ```

2. **Backend API** - Ensure the Orbbit backend is running for authentication

### Run Development Server

```bash
# From monorepo root
pnpm dev:investor

# Or using nx directly
nx dev investor
```

Visit [http://localhost:3001](http://localhost:3001)

## Architecture

### Authentication Flow
1. User visits app → redirected to `/auth`
2. Email/OTP login via Stytch
3. Session stored in JWT cookie
4. Access granted to dashboard

### Wallet Integration Flow
1. User clicks "Connect Wallet" in header
2. OnchainKit modal opens with wallet options
3. Wallet connected via WalletConnect/Coinbase Wallet
4. USDC balance displayed
5. Can now fund invoices and execute transactions

### Pages

- **`/`** - Dashboard home with platform overview
- **`/marketplace`** - Browse and filter invoices
- **`/portfolio`** - Track investments and returns
- **`/auth`** - Email/OTP authentication

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Web3**: OnchainKit, wagmi, viem
- **Blockchain**: Base (Sepolia testnet)
- **Auth**: Stytch (Email/OTP)
- **Styling**: Tailwind CSS v4 + Orbbit theme
- **UI Components**: shadcn/ui + custom OnchainKit components

## OnchainKit Components

Custom themed components in `@libs/frontend/ui`:

- `ConnectButton` - Wallet connection
- `WalletAccountDropdown` - Account menu
- `BalanceDisplay` - Token balance
- `AddressDisplay` - Formatted address
- `TransactionButtonWrapper` - Transaction execution

## Smart Contracts (Coming Soon)

When contracts are deployed to Base Sepolia:

1. Add ABIs to `src/contracts/abis/`
2. Update contract addresses in `src/contracts/addresses.ts`
3. Create wagmi hooks for contract interactions
4. Replace mock data with blockchain queries

## Development

### Project Structure

```
apps/investor/
├── src/
│   ├── app/
│   │   ├── (dashboard)/      # Authenticated dashboard routes
│   │   ├── auth/              # Email/OTP login
│   │   ├── layout.tsx         # Root layout with providers
│   │   └── providers.tsx      # Web3 providers
│   ├── components/
│   │   ├── invoices/          # Invoice UI components
│   │   ├── navigation/        # Sidebar
│   │   └── auth/              # Auth forms
│   ├── utils/
│   │   ├── middlewares/       # Auth & API middleware
│   │   └── hooks/             # Custom React hooks
│   └── config/                # App configuration
└── public/                    # Static assets
```

### Key Files

- `src/app/providers.tsx` - OnchainKit + Wagmi configuration
- `src/middleware.ts` - Auth protection
- `src/components/(dashboard)/dashboard-content.tsx` - Header with wallet

## Deployment

### Environment Variables

Ensure these are set in production:

- `NEXT_PUBLIC_CDP_API_KEY` - Coinbase Developer Platform
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect Cloud

### Build

```bash
nx build investor
```

## Contributing

See main monorepo README for contribution guidelines.
