import Link from 'next/link';
import { Card, Button } from '@ui';
import { ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';

export default function DashboardHomePage() {
  return (
    <>
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Orbbit Invest
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Earn predictable yield by funding SMB invoices with USDC on Base
        </p>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">
            Total Value Locked
          </div>
          <div className="text-3xl font-bold text-foreground">$2.1M</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">
            Active Invoices
          </div>
          <div className="text-3xl font-bold text-foreground">17</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">Average APY</div>
          <div className="text-3xl font-bold text-success">10.8%</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">Default Rate</div>
          <div className="text-3xl font-bold text-success">0%</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Card className="p-8 hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-semibold mb-3">Browse Marketplace</h3>
          <p className="text-muted-foreground mb-6">
            Explore available invoices and start earning yield on your USDC
          </p>
          <Link href="/marketplace">
            <Button className="group">
              View Invoices
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </Card>

        <Card className="p-8 hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-semibold mb-3">Track Portfolio</h3>
          <p className="text-muted-foreground mb-6">
            Monitor your active investments and realized returns
          </p>
          <Link href="/portfolio">
            <Button variant="outline" className="group">
              View Portfolio
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </Card>
      </div>

      {/* Value Propositions */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Why Invest in Invoices?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Predictable Returns</h3>
            </div>
            <p className="text-muted-foreground">
              Earn 8-12% APY with clear repayment timelines and known yield
              calculations
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-success/10 rounded-lg">
                <Shield className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-semibold text-lg">Real-World Backed</h3>
            </div>
            <p className="text-muted-foreground">
              Every invoice is backed by established enterprise payers like
              Microsoft and Oracle
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Zap className="h-6 w-6 text-warning" />
              </div>
              <h3 className="font-semibold text-lg">Instant Settlement</h3>
            </div>
            <p className="text-muted-foreground">
              Automatic yield distribution on-chain when invoices are repaid -
              no manual claims
            </p>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <Card className="p-8 bg-primary/5">
        <h2 className="text-2xl font-bold mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold mb-2">Connect & Browse</h4>
              <p className="text-sm text-muted-foreground">
                Connect your wallet and browse verified invoices from SMBs with
                enterprise customers
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold mb-2">Fund with USDC</h4>
              <p className="text-sm text-muted-foreground">
                Approve USDC spending and deposit funds to your chosen invoices
                directly on Base
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold mb-2">Earn Yield</h4>
              <p className="text-sm text-muted-foreground">
                Receive principal + yield automatically when the invoice is
                repaid at maturity
              </p>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
