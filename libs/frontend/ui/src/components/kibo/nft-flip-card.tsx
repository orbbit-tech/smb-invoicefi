'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface NFTFlipCardProps {
  /** Front face content */
  front: React.ReactNode;
  /** Back face content */
  back: React.ReactNode;
  /** Additional className for the container */
  className?: string;
  /** Whether the card should be flippable on click (default: true) */
  clickToFlip?: boolean;
  /** Whether the card should flip on hover (desktop only, default: true) */
  hoverToFlip?: boolean;
  /** Initial flip state */
  initiallyFlipped?: boolean;
  /** Callback when flip state changes */
  onFlipChange?: (isFlipped: boolean) => void;
}

/**
 * NFTFlipCard - A 3D flippable card component with hover and click interactions
 *
 * Features:
 * - 3D CSS transforms for smooth flip animation
 * - Hover to flip on desktop
 * - Click/tap to flip on all devices
 * - Accessible keyboard navigation
 * - Customizable front and back content
 *
 * Based on the pattern from Kibo UI's credit card component
 */
export const NFTFlipCard = React.forwardRef<HTMLDivElement, NFTFlipCardProps>(
  (
    {
      front,
      back,
      className,
      clickToFlip = true,
      hoverToFlip = true,
      initiallyFlipped = false,
      onFlipChange,
      ...props
    },
    ref
  ) => {
    const [isFlipped, setIsFlipped] = React.useState(initiallyFlipped);
    const [isTouchDevice, setIsTouchDevice] = React.useState(false);

    // Detect touch device
    React.useEffect(() => {
      setIsTouchDevice(
        'ontouchstart' in window || navigator.maxTouchPoints > 0
      );
    }, []);

    const handleClick = () => {
      if (clickToFlip) {
        const newFlipState = !isFlipped;
        setIsFlipped(newFlipState);
        onFlipChange?.(newFlipState);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (clickToFlip && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handleClick();
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'group relative w-full h-full [perspective:1000px]',
          className
        )}
        {...props}
      >
        {/* Flippable card inner container */}
        <div
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={clickToFlip ? 0 : undefined}
          role={clickToFlip ? 'button' : undefined}
          aria-label="Flip card"
          className={cn(
            'relative shadow-md w-full h-full transition-transform duration-600 [transform-style:preserve-3d]',
            // Hover flip (disabled on touch devices to avoid conflicts)
            hoverToFlip &&
              !isTouchDevice &&
              'group-hover:[transform:rotateY(-180deg)]',
            // Click/tap flip
            isFlipped && '[transform:rotateY(-180deg)]',
            // Interactive cursor
            clickToFlip && 'cursor-pointer',
            // Focus styles
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg'
          )}
        >
          {/* Front face */}
          <div
            className={cn(
              'absolute inset-0 w-full h-full [backface-visibility:hidden]',
              'rounded-lg overflow-hidden'
            )}
          >
            {front}
          </div>

          {/* Back face */}
          <div
            className={cn(
              'absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(-180deg)]',
              'rounded-lg overflow-hidden'
            )}
          >
            {back}
          </div>
        </div>
      </div>
    );
  }
);

NFTFlipCard.displayName = 'NFTFlipCard';
