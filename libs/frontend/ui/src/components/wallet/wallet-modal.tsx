'use client';

import { useState } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useConnect } from 'wagmi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  RadioGroup,
  RadioGroupItem,
} from '../shadcn';
import { cn } from '../../lib/utils';
import { BadgePlus, Wallet } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WalletOption = 'create' | 'connect';

/**
 * WalletModal - Custom wallet connection modal with two distinct flows
 *
 * Flow 1: Create Smart Wallet (for non-crypto users)
 *   - Uses Base Account connector for simple passkey-based onboarding
 * Flow 2: Connect Existing Wallet (for crypto-savvy users)
 *   - Opens RainbowKit modal with MetaMask, WalletConnect, etc.
 *
 * Simple modal with RadioGroup - no form components needed
 */
export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const [selectedOption, setSelectedOption] = useState<WalletOption>('create');
  const { openConnectModal } = useConnectModal();
  const { connect, connectors } = useConnect();

  const handleCreateWallet = () => {
    // Find the Base Account connector for new wallet creation
    const baseAccountConnector = connectors.find(
      (c) => c.id === 'baseAccount'
    );

    if (baseAccountConnector) {
      connect({ connector: baseAccountConnector });
      onClose();
    } else {
      console.error('Base Account connector not found');
      console.log(
        'Available connectors:',
        connectors.map((c) => ({ id: c.id, name: c.name }))
      );
      // Fallback: open RainbowKit modal
      onClose();
      openConnectModal?.();
    }
  };

  const handleConnectExisting = () => {
    onClose(); // Close our modal first
    openConnectModal?.(); // Then open RainbowKit modal
  };

  const handleContinue = () => {
    if (selectedOption === 'create') {
      handleCreateWallet();
    } else {
      handleConnectExisting();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Select how you would like to set up your wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup
            value={selectedOption}
            onValueChange={(value) => setSelectedOption(value as WalletOption)}
            className="space-y-3"
          >
            {/* Option 1: Create Smart Wallet */}
            <label htmlFor="create-wallet" className="block cursor-pointer">
              <div
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-4 transition-all',
                  selectedOption === 'create'
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    selectedOption === 'create' ? 'bg-primary/10' : 'bg-muted'
                  )}
                >
                  <BadgePlus
                    className={cn(
                      'h-5 w-5',
                      selectedOption === 'create'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="font-medium">Create a new wallet</div>
                  <p className="text-sm text-muted-foreground">
                    Get set up in seconds and have full control over funds.
                  </p>
                </div>
                <RadioGroupItem value="create" id="create-wallet" />
              </div>
            </label>

            {/* Option 2: Connect Existing Wallet */}
            <label htmlFor="connect-wallet" className="block cursor-pointer">
              <div
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-4 transition-all',
                  selectedOption === 'connect'
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    selectedOption === 'connect' ? 'bg-primary/10' : 'bg-muted'
                  )}
                >
                  <Wallet
                    className={cn(
                      'h-5 w-5',
                      selectedOption === 'connect'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="font-medium">I have an existing wallet</div>
                  <p className="text-sm text-muted-foreground">
                    Connect your MetaMask, Coinbase Wallet, or any WalletConnect
                    wallet.
                  </p>
                </div>
                <RadioGroupItem value="connect" id="connect-wallet" />
              </div>
            </label>
          </RadioGroup>

          {/* Continue Button */}
          <Button onClick={handleContinue} size="lg" className="w-full">
            {selectedOption === 'create' ? (
              <>Create new wallet</>
            ) : (
              <>Connect wallet</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
