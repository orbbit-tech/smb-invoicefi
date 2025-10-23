'use client';

import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@ui';
import { Wallet } from 'lucide-react';

interface WalletGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * WalletGuard Component
 *
 * Requires user to have a connected wallet to view protected content.
 * Shows a connection prompt if wallet is not connected.
 */
export function WalletGuard({ children, redirectTo }: WalletGuardProps) {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (redirectTo && !isConnected) {
      router.push(redirectTo);
    }
  }, [isConnected, redirectTo, router]);

  if (!isConnected || !address) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-12 max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Wallet className="h-12 w-12 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Connect Your Wallet
            </h2>
            <p className="text-muted-foreground">
              Please connect your wallet to access the Orbbit Invest platform and start funding invoices.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                // The wallet connection button is in the navbar
                // This will prompt users to look there
              }}
            >
              Connect Wallet
            </Button>
            <p className="text-xs text-muted-foreground">
              Use the "Connect Wallet" button in the top navigation bar
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
