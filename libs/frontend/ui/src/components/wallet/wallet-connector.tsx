'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '../shadcn';
import { Wallet } from 'lucide-react';
import { WalletModal } from './wallet-modal';
import { useWalletModal } from './use-wallet-modal';

/**
 * WalletConnector - Custom wallet connection button with modal
 *
 * Shows "Setup Wallet" when disconnected → Opens custom modal
 * Shows wallet address when connected (Base network only)
 * Shows "Wrong network" button if user is on unsupported chain
 * Uses RainbowKit's ConnectButton.Custom for wallet state management
 */
export function WalletConnector() {
  const { isOpen, openModal, closeModal } = useWalletModal();

  return (
    <>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          authenticationStatus,
          mounted,
        }) => {
          // Note: If your app doesn't use authentication, you
          // can remove all 'authenticationStatus' checks
          const ready = mounted && authenticationStatus !== 'loading';
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus || authenticationStatus === 'authenticated');

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <Button onClick={openModal} variant="outline">
                      <Wallet className="h-4 w-4" />
                      Setup Wallet
                    </Button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <Button
                      onClick={openChainModal}
                      variant="destructive"
                      className="h-9 px-3"
                    >
                      <span className="text-sm font-medium">Wrong network</span>
                    </Button>
                  );
                }

                // Connected to correct network - show account only
                return (
                  <Button
                    onClick={openAccountModal}
                    variant="outline"
                    className="flex items-center gap-2 h-9 px-3 border-border/40 hover:bg-accent hover:border-border transition-colors"
                  >
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {account.displayName}
                    </span>
                  </Button>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>

      {/* Custom Wallet Modal */}
      <WalletModal isOpen={isOpen} onClose={closeModal} />
    </>
  );
}
