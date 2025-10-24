import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

/**
 * @title Local Development Deployment Module
 * @notice Deploys complete Orbbit protocol with MockUSDC for local testing
 * @dev This module:
 *      1. Deploys MockUSDC
 *      2. Deploys Whitelist
 *      3. Deploys Invoice NFT
 *      4. Deploys InvoiceFundingPool (using MockUSDC)
 *      5. Configures all roles
 *
 * @dev Usage:
 *      Start Hardhat node:
 *        npx hardhat node
 *
 *      Deploy (in a new terminal):
 *        npx hardhat ignition deploy ignition/modules/LocalDevelopment.ts \
 *          --network localhost \
 *          --parameters ignition/parameters/localhost.json
 *
 * @dev After deployment:
 *      - Mint test USDC to your test addresses
 *      - Whitelist test addresses (SMB and INVESTOR roles)
 *      - List test invoices
 */
const LocalDevelopmentModule = buildModule('LocalDevelopment', (m) => {
  // ============================================
  // PARAMETERS
  // ============================================

  const tokenName = m.getParameter('tokenName', 'Orbbit Invoice (Local)');
  const tokenSymbol = m.getParameter('tokenSymbol', 'ORBINV');
  const metadataBaseUri = m.getParameter(
    'metadataBaseUri',
    'https://api.orbbit.com/metadata/'
  );
  const metadataExtension = m.getParameter('metadataExtension', '.json');
  const gracePeriodDays = m.getParameter('gracePeriodDays', 30);
  const platformTreasury = m.getParameter('platformTreasury', m.getAccount(0)); // Default to deployer
  const platformFeeRate = m.getParameter('platformFeeRate', 3000); // 30%
  const maxBatchSize = m.getParameter('maxBatchSize', 50);
  const maxInvoiceAmount = m.getParameter(
    'maxInvoiceAmount',
    10_000_000_000_000n
  ); // 10M USDC (with 6 decimals)

  // ============================================
  // 1. DEPLOY MOCK USDC (Local Testing Only)
  // ============================================

  const mockUSDC = m.contract('MockUSDC', []);

  // ============================================
  // 2. DEPLOY WHITELIST
  // ============================================

  const whitelist = m.contract('Whitelist', [maxBatchSize]);

  // ============================================
  // 3. DEPLOY INVOICE NFT
  // ============================================

  const invoice = m.contract('Invoice', [
    tokenName,
    tokenSymbol,
    metadataBaseUri,
    metadataExtension,
    whitelist,
  ]);

  // ============================================
  // 4. DEPLOY INVOICE FUNDING POOL
  // ============================================

  const pool = m.contract('InvoiceFundingPool', [
    mockUSDC, // Use MockUSDC for local testing
    invoice,
    gracePeriodDays,
    whitelist,
    platformTreasury,
    platformFeeRate,
    maxInvoiceAmount,
  ]);

  // ============================================
  // 5. CONFIGURE INTER-CONTRACT ROLES
  // ============================================

  // Grant MINTER_ROLE to InvoiceFundingPool
  m.call(
    invoice,
    'grantRole',
    [m.staticCall(invoice, 'MINTER_ROLE'), pool],
    { id: 'Invoice_GrantMinterRole' }
  );

  // Grant UPDATER_ROLE to InvoiceFundingPool
  m.call(
    invoice,
    'grantRole',
    [m.staticCall(invoice, 'UPDATER_ROLE'), pool],
    { id: 'Invoice_GrantUpdaterRole' }
  );

  // ============================================
  // RETURN DEPLOYED CONTRACTS
  // ============================================

  return {
    mockUSDC,
    whitelist,
    invoice,
    pool,
  };
});

export default LocalDevelopmentModule;
