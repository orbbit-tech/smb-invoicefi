'use client';

import { useState } from 'react';
import { Button } from '../shadcn';
import { Copy, Check } from 'lucide-react';

interface CopyableTextProps {
  text: string;
  truncateLength?: number;
  className?: string;
}

export function CopyableText({
  text,
  truncateLength = 8,
  className,
}: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click when copying
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Show start and end with ellipsis in the middle
  // Format: "ABCD...6789" (4 chars from start, 4 from end)
  const displayText =
    text.length > 12
      ? `${text.substring(0, 4)}...${text.substring(text.length - 4)}`
      : text;

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <span className="font-mono text-xs">{displayText}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        className="h-6 w-6 shrink-0"
        title={copied ? 'Copied!' : 'Copy to clipboard'}
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
        )}
      </Button>
    </div>
  );
}
