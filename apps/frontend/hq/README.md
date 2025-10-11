# Orbbit HQ Dashboard

HQ dashboard for Orbbit platform management and operations.

## Features

- 🔐 **Email/OTP Authentication** - Secure Web2 login with Stytch
- 💰 **Wallet Integration** - Connect wallet via RainbowKit for Web3 transactions
- 📊 **Platform Management** - Monitor and manage platform operations
- 📈 **Analytics Dashboard** - Track platform metrics and performance
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
pnpm dev:hq

# Or using nx directly
nx dev hq
```

Visit [http://localhost:3002](http://localhost:3002)

## Architecture

### Authentication Flow
1. User visits app → redirected to `/auth`
2. Email/OTP login via Stytch
3. Session stored in JWT cookie
4. Access granted to dashboard

### Wallet Integration Flow
1. User clicks "Connect Wallet" in header
2. RainbowKit modal opens with wallet options
3. Wallet connected via WalletConnect/Coinbase Wallet
4. USDC balance displayed
5. Can now execute transactions

### Pages

- **`/`** - Dashboard home with platform overview
- **`/users`** - User management (coming soon)
- **`/settings`** - Platform settings (coming soon)

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Web3**: RainbowKit, wagmi, viem
- **Blockchain**: Base (Sepolia testnet)
- **Auth**: Stytch (Email/OTP)
- **Styling**: Tailwind CSS v4 + Orbbit theme
- **UI Components**: shadcn/ui + custom components

## Development

### Project Structure

```
apps/hq/
├── src/
│   ├── app/
│   │   ├── (dashboard)/      # Authenticated dashboard routes
│   │   ├── layout.tsx         # Root layout with providers
│   │   └── providers.tsx      # Web3 providers
│   ├── components/
│   │   ├── (dashboard)/       # Dashboard UI components
│   │   └── navigation/        # Sidebar & navigation
│   ├── utils/
│   │   ├── atoms/             # Jotai state atoms
│   │   ├── hooks/             # Custom React hooks
│   │   └── middlewares/       # Auth & API middleware
│   └── config/                # App configuration
└── public/                    # Static assets
```

### Key Files

- `src/app/providers.tsx` - RainbowKit + Wagmi configuration
- `src/middleware.ts` - Auth protection
- `src/components/(dashboard)/dashboard-header.tsx` - Header with wallet

## Deployment

### Environment Variables

Ensure these are set in production:

- `NEXT_PUBLIC_CDP_API_KEY` - Coinbase Developer Platform
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect Cloud

### Build

```bash
nx build hq
```

## Contributing

See main monorepo README for contribution guidelines.
