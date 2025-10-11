import Link from 'next/link';
import { Card, Button } from '@ui';
import { ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';

/**
 * Dashboard Home Page
 *
 * Clean Dashboard Design principles:
 * - Consistent 8px spacing system (16px gaps, 24px card padding, 32px sections)
 * - Clear typography hierarchy
 * - Professional visual presentation
 */
export default function DashboardHomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-3 leading-tight">
          Overview
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Earn predictable yield by funding SMB invoices with USDC
        </p>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 transition-all duration-200 hover:shadow-md">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Total Value Locked
          </div>
          <div className="text-2xl font-bold text-foreground leading-tight">
            $2.1M
          </div>
        </Card>
        <Card className="p-6 transition-all duration-200 hover:shadow-md">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Active Invoices
          </div>
          <div className="text-2xl font-bold text-foreground leading-tight">
            17
          </div>
        </Card>
        <Card className="p-6 transition-all duration-200 hover:shadow-md">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Average APY
          </div>
          <div className="text-2xl font-bold leading-tight">10.8%</div>
        </Card>
        <Card className="p-6 transition-all duration-200 hover:shadow-md">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Default Rate
          </div>
          <div className="text-2xl font-bold  leading-tight">0%</div>
        </Card>
      </div>
    </div>
  );
}
