# Orbbit SMB Invoice Financing Dashboard

A modern, responsive dashboard for SMB (Small and Medium-sized Business) users to manage invoice financing on the Orbbit platform.

## Features

✅ **Dashboard Overview**
- Key metrics display (Total Invoices, Active Funding, Total Funded, Pending Repayments)
- Recent invoices table with status tracking
- Quick action cards

✅ **Invoice Management**
- View all invoices with filtering and sorting
- Search by invoice number or payer name
- Filter by status (Created, Listed, Funded, Repaid, etc.)
- Detailed invoice view with funding progress tracking

✅ **Submit Invoice**
- Multi-step form with validation
- Real-time calculation of expected funding (80% of invoice value)
- Progress indicator and review step

✅ **Responsive Design**
- Mobile-first approach
- Optimized for desktop, tablet, and mobile devices
- Collapsible sidebar navigation

✅ **Developer Features**
- Authentication bypass mode for development
- Mock data layer for testing
- Comprehensive Playwright E2E tests

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn UI (from `@libs/frontend/ui`)
- **State Management**: Jotai
- **Data Fetching**: React Query
- **Testing**: Playwright
- **Authentication**: Stytch (with bypass mode for development)

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- The project uses an Nx monorepo structure

### Installation

```bash
# From the monorepo root
pnpm install
```

### Development

#### Running with Authentication

```bash
# From the monorepo root
pnpm nx dev smb
```

Visit [http://localhost:3000](http://localhost:3000)

#### Running with Auth Bypass (Development Mode)

For faster development without authentication:

1. Copy `.env.local` and set the bypass flag:

```bash
# apps/smb/.env.local
NEXT_PUBLIC_BYPASS_AUTH=true
NEXT_PUBLIC_API_URL=http://localhost:3333
```

2. Start the dev server:

```bash
pnpm nx dev smb
```

When auth bypass is enabled, you'll see a warning banner at the top of the dashboard indicating "Development Mode".

### Building

```bash
# Production build
pnpm nx build smb

# Start production server
pnpm nx start smb
```

## Testing

### E2E Tests with Playwright

The project includes comprehensive E2E tests covering:
- Dashboard functionality
- Invoice list with filtering/sorting
- Multi-step invoice submission form
- Invoice detail pages
- Sidebar navigation
- Responsive design

#### Running Tests

```bash
# Run all E2E tests
pnpm nx e2e smb-e2e

# Run tests in UI mode (recommended for development)
pnpm nx e2e smb-e2e --ui

# Run specific test file
pnpm nx e2e smb-e2e --grep "dashboard"
```

#### Test Files

- `dashboard.spec.ts` - Dashboard page tests
- `invoices-list.spec.ts` - Invoice list and filtering tests
- `submit-invoice.spec.ts` - Invoice submission form tests
- `invoice-detail.spec.ts` - Invoice detail page tests
- `sidebar-navigation.spec.ts` - Navigation tests
- `responsive.spec.ts` - Mobile/tablet responsive tests

### Using Playwright MCP Server

The project is configured to work with Playwright MCP server for interactive testing during development:

```bash
# Start the MCP server (if available)
# Then use Claude Code's Playwright integration to test the UI interactively
```

## Project Structure

```
apps/smb/
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # Dashboard routes (layout + pages)
│   │   │   ├── layout.tsx        # Dashboard layout with sidebar
│   │   │   ├── (main)/page.tsx   # Main dashboard page
│   │   │   ├── invoices/         # Invoice pages
│   │   │   │   ├── page.tsx      # Invoice list
│   │   │   │   ├── submit/       # Submit invoice form
│   │   │   │   └── [id]/         # Invoice detail
│   │   ├── auth/                 # Authentication pages
│   │   └── layout.tsx            # Root layout
│   ├── components/
│   │   ├── dashboard/            # Dashboard-specific components
│   │   │   └── metric-card.tsx
│   │   ├── invoices/             # Invoice components
│   │   │   ├── invoice-card.tsx
│   │   │   ├── invoice-status-badge.tsx
│   │   │   ├── invoice-table.tsx
│   │   │   └── invoice-detail-client.tsx
│   │   ├── navigation/           # Navigation components
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── nav-org.tsx
│   │   │   └── nav-member.tsx
│   │   ├── loading/              # Loading states
│   │   ├── dev-mode-indicator.tsx
│   │   └── error-boundary.tsx
│   ├── data/
│   │   └── mock-invoices.ts      # Mock data for development
│   ├── types/
│   │   └── invoice.ts            # TypeScript types
│   ├── utils/
│   │   ├── api/                  # API clients
│   │   ├── atoms/                # Jotai state
│   │   ├── cookies/              # Session management
│   │   └── middlewares/          # Next.js middleware
│   └── config/
│       └── auth-config.ts        # Auth configuration
└── .env.local                    # Environment variables
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_BYPASS_AUTH` | Enable auth bypass for development | `false` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3333` |

**⚠️ Important**: Never set `NEXT_PUBLIC_BYPASS_AUTH=true` in production!

## Mock Data

The app includes mock invoice data for development and testing. You can find it in:

- `src/data/mock-invoices.ts` - 8 sample invoices with various statuses
- `src/types/invoice.ts` - TypeScript types and enums

Invoice statuses follow the PRD lifecycle:
- `CREATED` → `LISTED` → `PARTIALLY_FUNDED` → `FULLY_FUNDED` → `DISBURSED` → `PENDING_REPAYMENT` → `REPAID`

## Key Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with metrics and recent invoices |
| `/invoices` | Full invoice list with filters |
| `/invoices/submit` | Multi-step form to submit new invoice |
| `/invoices/[id]` | Detailed invoice view with timeline |
| `/auth` | Authentication page (bypassed in dev mode) |

## UI Components

All UI components are sourced from the shared library `@libs/frontend/ui` which includes:
- Shadcn UI components (Button, Card, Table, Form, etc.)
- Custom theme with Tailwind CSS
- Consistent design system across apps

## MVP Features (PRD Aligned)

Based on the Product Requirements Document (PRD):

✅ **For SMBs:**
- Fast capital access tracking (80% in <24 hours)
- Transparent pricing display
- Simple invoice submission
- Status tracking (Listed → Funded → Disbursed → Repaid)

✅ **Dashboard Metrics:**
- Total invoices submitted
- Active funding amount
- Total funded to date
- Pending repayments

✅ **Invoice Lifecycle:**
- Visual timeline showing invoice progress
- Funding progress bars
- Status badges with color coding
- Risk score display

## Contributing

When adding new features:

1. Use Shadcn UI components from `@libs/frontend/ui`
2. Follow the existing file structure
3. Add E2E tests for new pages/flows
4. Update mock data if needed
5. Ensure responsive design (test on mobile)

## License

Proprietary - Orbbit Inc.

## Support

For issues or questions, please contact the development team or file an issue in the repository.
