'use client';

import {
  Badge,
  Button,
  NFTFlipCard,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@ui';
import { ExternalLink, FileText, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface NFTOwnershipProps {
  tokenId: string;
  contractAddress: string;
  blockchainTxHash: string;
  companyName: string;
  companyLogoUrl?: string;
}

/**
 * NFT Ownership Details Component
 *
 * Displays NFT metadata and blockchain verification information
 * with an interactive 3D flippable card
 */
export function NFTOwnership({
  tokenId,
  contractAddress,
  blockchainTxHash,
  companyName,
  companyLogoUrl,
}: NFTOwnershipProps) {
  const basescanUrl = `https://basescan.org/nft/${contractAddress}/${tokenId}`;
  const txUrl = `https://basescan.org/tx/${blockchainTxHash}`;

  /* ========================================
     GLASSMORPHISM DESIGN - Apple-inspired premium aesthetic
     ======================================== */

  // Front: Primary accent fading to light slate
  const frontGradient =
    'from-primary/9 via-primary/5 to-slate-50 dark:to-slate-950';

  // Back: Light slate with subtle primary accent
  const backGradient =
    'from-slate-50 via-slate-100 to-primary/10 dark:from-slate-950 dark:via-slate-900';

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Front face content - NFT artwork and basic info with glassmorphism
  const frontFace = (
    <div
      className={`w-full h-full bg-gradient-to-br ${frontGradient} backdrop-blur-xl shadow-2xl ring-1 ring-white/10 flex items-center justify-center p-6`}
    >
      <div className="text-center space-y-4">
        {/* NFT Artwork */}
        <Avatar className="h-10 w-10 mx-auto shadow-lg">
          <AvatarImage src={companyLogoUrl} alt={companyName} />
          <AvatarFallback className="font-bold bg-neutral-100/90">
            {companyName[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Company Name */}
        <div>
          <p className="font-semibold mb-2">{companyName}</p>
        </div>
      </div>
    </div>
  );

  // Back face content - Blockchain verification details with glassmorphism
  const backFace = (
    <div
      className={`w-full h-full bg-gradient-to-br ${backGradient} backdrop-blur-xl shadow-2xl ring-1 ring-white/10 p-6 flex flex-col`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 " />
          <h3 className="text-sm font-semibold">Blockchain Details</h3>
        </div>
        <Badge variant="outline" className="text-xs flex items-center gap-1.5">
          <img
            src="/base-chain-logo.png"
            alt="Base"
            className="h-3 w-3 rounded-full"
          />
          Base
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Transaction Hash */}
        <div className="bg-white/80 dark:bg-black/20 p-3 rounded-md backdrop-blur-sm">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              Transaction Hash
            </span>
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs font-mono">
                {formatAddress(blockchainTxHash)}
              </code>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(blockchainTxHash, 'Transaction hash');
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(txUrl, '_blank');
                  }}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="aspect-16/9 w-full">
      <NFTFlipCard
        front={frontFace}
        back={backFace}
        className="h-full"
        clickToFlip={true}
        hoverToFlip={true}
      />
    </div>
  );
}
