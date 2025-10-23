'use client';

import { Card, Separator } from '../../';
import { InvoiceDetailData } from './types';

interface FinancialLineItem {
  label: string;
  value: string | number;
  emphasis?: boolean;
}

interface FinancialBreakdownProps {
  invoice: InvoiceDetailData;
  lineItems: FinancialLineItem[];
  title?: string;
}

/**
 * Financial Breakdown Component
 *
 * Displays detailed financial calculations and breakdown
 * Reusable across SMB and Investor applications
 */
export function FinancialBreakdown({
  invoice,
  lineItems,
  title = 'Financial Details',
}: FinancialBreakdownProps) {
  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <Separator />
      <div className="space-y-3">
        {lineItems.map((item, index) => {
          const isLastItem = index === lineItems.length - 1;
          const showSeparatorBefore =
            item.emphasis && index > 0 && !lineItems[index - 1].emphasis;
          const showSeparatorAfter = item.emphasis && !isLastItem;

          return (
            <div key={index}>
              {showSeparatorBefore && <Separator className="my-3" />}
              <div className="flex justify-between items-center">
                <span
                  className={
                    item.emphasis
                      ? 'text-sm font-semibold'
                      : 'text-sm text-muted-foreground'
                  }
                >
                  {item.label}
                </span>
                <span
                  className={
                    item.emphasis
                      ? 'text-base font-bold'
                      : 'text-sm font-semibold'
                  }
                >
                  {item.value}
                </span>
              </div>
              {showSeparatorAfter && <Separator className="my-3" />}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
