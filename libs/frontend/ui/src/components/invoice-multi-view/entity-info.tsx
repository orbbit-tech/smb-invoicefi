'use client';

import { Avatar, AvatarImage, AvatarFallback } from '../shadcn';
import { cn } from '../../lib/utils';

export interface EntityInfoProps {
  name: string;
  logoUrl?: string;
  secondaryInfo?: string;
  size?: 'sm' | 'md' | 'lg';
  avatarClassName?: string;
  className?: string;
}

/**
 * EntityInfo Component
 *
 * Displays entity information with a logo avatar, name, and optional secondary info
 * Used for consistent display of SMBs, Payers, and other entities across invoice views
 *
 * Layout: [LOGO] Name
 *                Secondary Info (top-down aligned)
 */
export function EntityInfo({
  name,
  logoUrl,
  secondaryInfo,
  size = 'md',
  avatarClassName,
  className,
}: EntityInfoProps) {
  // Size mappings
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
  };

  const secondarySizeClasses = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Avatar
        className={cn(
          sizeClasses[size],
          'bg-neutral-100/90 shadow-sm flex-shrink-0',
          avatarClassName
        )}
      >
        <AvatarImage src={logoUrl} alt={name} />
        <AvatarFallback className="bg-neutral-100/90 font-semibold">
          {name[0]?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className={cn('font-medium truncate', textSizeClasses[size])}>
          {name}
        </p>
        {secondaryInfo && (
          <p
            className={cn(
              'text-muted-foreground truncate',
              secondarySizeClasses[size]
            )}
          >
            {secondaryInfo}
          </p>
        )}
      </div>
    </div>
  );
}
