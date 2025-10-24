'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Alert,
  AlertDescription,
} from '@ui';
import {
  Wallet,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Invoice } from '@ui';
import { useRepayInvoice } from '@/hooks/blockchain/use-repay-invoice';
import { useAccount } from 'wagmi';

interface RepaymentModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onRepaymentSuccess?: () => void;
}

export function RepaymentModal({
  invoice,
  isOpen,
  onClose,
  onRepaymentSuccess,
}: RepaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'crypto' | 'bank' | null>(
    null
  );
  const [success, setSuccess] = useState(false);
  const { isConnected } = useAccount();
  const {
    repayInvoice,
    isProcessing,
    isApproving,
    isRepaying,
    error: blockchainError,
  } = useRepayInvoice();
  const [error, setError] = useState<string | null>(null);

  if (!invoice) return null;

  // Calculate repayment amounts
  const principal = invoice.amount;
  const interestAmount = (principal * invoice.apr) / 100;
  const totalRepayment = principal + interestAmount;

  // Calculate urgency based on status and days
  const daysUntilDue = invoice.daysUntilDue;
  const isOverdue = invoice.status === ('OVERDUE' as any);
  const isDueSoon =
    invoice.status === 'FULLY_FUNDED' && daysUntilDue >= 0 && daysUntilDue <= 7;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const handleCryptoPayment = async () => {
    setError(null);

    try {
      // Check if wallet is connected
      if (!isConnected) {
        setError('Please connect your wallet first');
        return;
      }

      // Check if invoice has tokenId
      if (!invoice.tokenId) {
        setError(
          'This invoice has not been tokenized yet. Cannot process blockchain repayment.'
        );
        return;
      }

      // Call the blockchain repayment function
      const result = await repayInvoice({
        tokenId: Number(invoice.tokenId),
        amount: totalRepayment,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onRepaymentSuccess?.();
          handleClose();
        }, 2000);
      }
    } catch (err) {
      // Error is already handled by the hook and set in blockchainError
      console.error('Repayment failed:', err);
    }
  };

  const handleBankTransfer = async () => {
    setError(null);
    // TODO: Implement bank transfer flow
    setError(
      'Bank transfer is not yet implemented. Please use crypto wallet payment.'
    );
  };

  const handleClose = () => {
    setPaymentMethod(null);
    setError(null);
    setSuccess(false);
    onClose();
  };

  // Combine errors
  const displayError = error || blockchainError;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Repay Invoice</span>
            {isOverdue && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                <AlertCircle className="h-3 w-3" />
                Overdue
              </span>
            )}
            {isDueSoon && !isOverdue && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Clock className="h-3 w-3" />
                Due Soon
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Invoice #{invoice.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 py-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3 mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Payment Initiated</h3>
              <p className="text-sm text-muted-foreground">
                Your repayment is being processed. You'll receive a confirmation
                shortly.
              </p>
            </div>
          </div>
        ) : (
          <>
            {isDueSoon && !isOverdue && (
              <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  Payment due in {daysUntilDue} day
                  {daysUntilDue !== 1 ? 's' : ''} ({formatDate(invoice.dueDate)}
                  ). Make your payment on time to maintain your good payment
                  history.
                </AlertDescription>
              </Alert>
            )}

            {/* Payment Summary */}
            <div className="space-y-2 py-4 bg-muted rounded-md p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Principal Amount
                </span>
                <span>{formatCurrency(principal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Interest ({invoice.apr}% APR)
                </span>
                <span>{formatCurrency(interestAmount)}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="text-sm  text-muted-foreground">
                  Total Amount Due
                </span>
                <span className="font-bold">
                  {formatCurrency(totalRepayment)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Due Date</span>
                <span className={isOverdue ? 'font-medium' : ''}>
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
            </div>

            {/* Payment Method Selection */}
            {!paymentMethod && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Select Payment Method</p>

                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex items-start gap-3 hover:border-primary"
                  onClick={() => setPaymentMethod('crypto')}
                  disabled={isProcessing}
                >
                  <div className="rounded-full bg-primary/10 p-2">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Pay with Crypto Wallet</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Connect your wallet and pay directly with USDC
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex items-start gap-3 hover:border-primary"
                  onClick={() => setPaymentMethod('bank')}
                  disabled={isProcessing}
                >
                  <div className="rounded-full bg-primary/10 p-2">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Pay with Bank Transfer</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      We'll convert your transfer to USDC on-chain
                    </div>
                  </div>
                </Button>
              </div>
            )}

            {/* Payment Confirmation */}
            {paymentMethod === 'crypto' && (
              <div className="space-y-4">
                <Alert>
                  <Wallet className="h-4 w-4" />
                  <AlertDescription>
                    You'll be prompted to approve USDC spending and confirm the
                    transaction in your wallet.
                  </AlertDescription>
                </Alert>

                {displayError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{displayError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setPaymentMethod(null)}
                    disabled={isProcessing}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCryptoPayment}
                    disabled={isProcessing}
                  >
                    {isApproving && 'Approving USDC...'}
                    {isRepaying && 'Processing Repayment...'}
                    {!isProcessing && 'Confirm Payment'}
                  </Button>
                </div>
              </div>
            )}

            {paymentMethod === 'bank' && (
              <div className="space-y-4">
                <Alert>
                  <Building2 className="h-4 w-4" />
                  <AlertDescription>
                    You'll receive bank transfer instructions. Once received,
                    we'll convert to USDC and complete your repayment.
                  </AlertDescription>
                </Alert>

                {displayError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{displayError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setPaymentMethod(null)}
                  >
                    Back
                  </Button>
                  <Button className="flex-1" onClick={handleBankTransfer}>
                    Get Instructions
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
