'use client';

/**
 * ============================================================================
 * PROVIDER HIERARCHY - Web3 Providers Disabled
 * ============================================================================
 *
 * Wallet features are disabled for the HQ app.
 * This component exists for consistency with the app structure
 * but simply renders children without Web3 providers.
 *
 * ============================================================================
 */

export function Web3Providers({ children }: { children: React.ReactNode }) {
  // Wallet features disabled for HQ app
  return <>{children}</>;
}
