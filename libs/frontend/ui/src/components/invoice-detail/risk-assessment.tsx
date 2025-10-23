'use client';

import { Card, Separator, Badge } from '../../';
import { ShieldCheck } from 'lucide-react';
import { InvoiceDetailData, RiskFactors } from './types';

interface RiskAssessmentProps {
  invoice: InvoiceDetailData;
  riskFactors?: RiskFactors;
}

/**
 * Risk Assessment Component
 *
 * Displays risk level, industry, and key risk factors
 * Reusable across SMB and Investor applications
 */
export function RiskAssessment({
  invoice,
  riskFactors = {
    factors: [
      'Strong payer credit history',
      'Established business relationship',
      'Short payment term (30 days)',
    ],
  },
}: RiskAssessmentProps) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold">Risk Assessment</h2>
      </div>
      <Separator />
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Risk Level</span>
          <Badge variant="secondary">{invoice.riskScore || 'Medium'}</Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Industry</span>
          <Badge variant="secondary">
            {invoice.category || invoice.industry || 'N/A'}
          </Badge>
        </div>
      </div>
      {riskFactors.factors && riskFactors.factors.length > 0 && (
        <div className="bg-neutral-100/80 p-4 rounded-md space-y-2">
          <p className="text-sm font-semibold">Key Factors:</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            {riskFactors.factors.map((factor, index) => (
              <li key={index}>{factor}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
