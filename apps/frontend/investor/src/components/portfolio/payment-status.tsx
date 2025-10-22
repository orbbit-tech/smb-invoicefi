'use client';

import { Card, Separator, Badge, Progress } from '@ui';
import { DollarSign, CheckCircle2, Clock } from 'lucide-react';

interface Payment {
  date: string;
  amount: number;
}

interface PaymentStatusProps {
  totalAmount: number;
  paymentsMade: Payment[];
  status: 'active' | 'funded' | 'repaid';
  dueDate: string;
}

/**
 * Payment Status Tracking Component
 *
 * Displays payment progress and history
 */
export function PaymentStatus({
  totalAmount,
  paymentsMade,
  status,
  dueDate,
}: PaymentStatusProps) {
  const totalReceived = paymentsMade.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const outstandingAmount = totalAmount - totalReceived;
  const paymentProgress = (totalReceived / totalAmount) * 100;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = () => {
    if (status === 'repaid') {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </Badge>
      );
    }
    if (paymentsMade.length > 0 && paymentsMade.length < totalAmount) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Partial Payment
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 " />
          <h2 className="text-lg font-semibold">Payment Status</h2>
        </div>
        {getStatusBadge()}
      </div>
      <Separator />

      {/* Payment Progress */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Payment Progress</span>
          <span className="font-semibold">{paymentProgress.toFixed(0)}%</span>
        </div>
        <Progress value={paymentProgress} className="h-2" />
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-neutral-100/80 p-4 rounded-md">
          <p className="text-xs text-muted-foreground mb-1">Total Expected</p>
          <p className="text-lg font-bold">${totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-neutral-100/80 p-4 rounded-md">
          <p className="text-xs text-muted-foreground mb-1">Received</p>
          <p className="text-lg font-bold ">
            ${totalReceived.toLocaleString()}
          </p>
        </div>
      </div>

      {outstandingAmount > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Outstanding Amount
              </p>
              <p className="text-xs text-amber-700">
                Due: {formatDate(dueDate)}
              </p>
            </div>
            <p className="text-lg font-bold text-amber-900">
              ${outstandingAmount.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Payment History */}
      {paymentsMade.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Payment History</h3>
            <div className="space-y-2">
              {paymentsMade.map((payment, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-neutral-100/80 rounded-md"
                >
                  <div>
                    <p className="text-sm font-semibold">Payment {index + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(payment.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold">
                      ${payment.amount.toLocaleString()}
                    </p>
                    <CheckCircle2 className="h-4 w-4 " />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {paymentsMade.length === 0 && (
        <div className="text-center py-4">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No payments received yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Payment due: {formatDate(dueDate)}
          </p>
        </div>
      )}
    </Card>
  );
}
