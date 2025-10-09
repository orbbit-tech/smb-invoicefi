# Orbbit Onchain Invoice Financing Protocol

Orbbit creates a marketplace connecting investors seeking stable yields with SMBs needing fast working capital. Built on Base with Next.js, TailwindCSS, and Web3 integration.

## Architecture

This is an Nx monorepo containing two Next.js applications:

- **SMB App** (`apps/frontend/smb`) - Invoice submission portal for small and medium-sized businesses
- **Investor App** (`apps/frontend/investor`) - Marketplace dashboard for investors to browse and fund invoices

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: TailwindCSS
- **Web3** (Investor App):
  - Wagmi v2
  - Viem
  - RainbowKit
  - Base/Base Sepolia support
- **Monorepo**: Nx
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+ (recommended) - `npm install -g pnpm`
- Git

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd smb-invoicefi

# Install dependencies with pnpm
pnpm install
```

### Why pnpm?

This project uses **pnpm** instead of npm for:
- ⚡ **3x faster** installations
- 💾 **Saves disk space** with content-addressable storage
- 🔒 **Stricter dependency management** (prevents phantom dependencies)
- 🎯 **Better monorepo support** with workspace protocol

### Running the Apps

#### SMB App (Port 3000)

```bash
# Development mode
pnpm dev:smb

# Build
pnpm build:smb
```

Visit: http://localhost:3000

#### Investor App (Port 3001)

```bash
# Development mode
pnpm dev:investor

# Build
pnpm build:investor
```

Visit: http://localhost:3001

#### Run Both Apps Simultaneously

```bash
# Terminal 1
pnpm dev:smb

# Terminal 2
pnpm dev:investor
```

## Project Structure

```
smb-invoicefi/
├── apps/
│   ├── frontend/
│   │   ├── smb/                # SMB portal app
│   │   │   ├── src/
│   │   │   │   └── app/
│   │   │   │       ├── layout.tsx
│   │   │   │       ├── page.tsx
│   │   │   │       └── global.css
│   │   │   ├── tailwind.config.js
│   │   │   ├── postcss.config.js
│   │   │   └── project.json
│   │   ├── investor/           # Investor marketplace app
│   │   │   ├── src/
│   │   │   │   └── app/
│   │   │   │       ├── layout.tsx
│   │   │   │       ├── page.tsx
│   │   │   │       ├── providers.tsx  # Web3 providers
│   │   │   │       └── global.css
│   │   │   ├── tailwind.config.js
│   │   │   ├── postcss.config.js
│   │   │   └── project.json
│   │   └── [e2e test apps]
│   └── backend/                # Backend services
├── nx.json
├── package.json
└── tsconfig.base.json
```

## Features

### SMB App Features

- Invoice submission interface
- Fast capital access information
- Benefits showcase
- How it works section
- No blockchain knowledge required

### Investor App Features

- **Web3 Integration**: Connect wallet via RainbowKit (supports Base & Base Sepolia)
- **Invoice Marketplace**: Browse available invoices with detailed metrics
- **Real-time Stats**: TVL, active invoices, average APY, default rate
- **Invoice Cards**: Display amount, payer, APY, risk score, funding progress
- **Responsive Design**: Mobile-friendly interface

## Web3 Configuration

The investor app comes pre-configured with:

- Base Sepolia (testnet)
- Base (mainnet)
- RainbowKit wallet connection
- Wagmi v2 hooks

To use with your project:

1. Get a WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Update `apps/frontend/investor/src/app/providers.tsx`:

```typescript
const config = getDefaultConfig({
  appName: 'Orbbit Invoice Financing',
  projectId: 'YOUR_PROJECT_ID', // Replace with your project ID
  chains: [baseSepolia, base],
  // ...
});
```

## Development Commands

```bash
# View project graph
pnpm nx graph

# Run specific app
pnpm nx dev <app-name>

# Build specific app
pnpm nx build <app-name>

# Build all apps
pnpm build:all

# Clean all build artifacts and dependencies
pnpm clean

# Lint all apps
pnpm nx affected:lint

# Test all apps
pnpm nx affected:test
```

## Deployment

### Vercel (Recommended)

Both apps can be deployed to Vercel:

```bash
# SMB App
cd apps/frontend/smb
vercel

# Investor App
cd apps/frontend/investor
vercel
```

### Build for Production

```bash
# Build SMB app
pnpm build:smb

# Build Investor app
pnpm build:investor

# Build both apps
pnpm build:all
```

## Environment Variables

### Investor App

Create `.env.local` in `apps/frontend/investor/`:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [ ] Smart contract integration
- [ ] IPFS invoice storage
- [ ] Real-time risk scoring API
- [ ] SMB self-service onboarding
- [ ] Portfolio tracking dashboard
- [ ] Secondary market trading
- [ ] Basename integration

## License

MIT

## Contact

Orbbit Team - [Website](https://orbbit.com)

Built with ❤️ on Base
