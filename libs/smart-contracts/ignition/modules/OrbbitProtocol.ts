import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

/**
 * @title Orbbit Protocol Ignition Module
 * @notice Deploys the complete Orbbit Invoice Financing Protocol
 * @dev This module deploys:
 *      1. Whitelist contract
 *      2. Invoice NFT contract
 *      3. InvoiceFundingPool contract
 *      4. Configures inter-contract roles
 *
 * @dev Usage:
 *      Base Sepolia (testnet):
 *        npx hardhat ignition deploy ignition/modules/OrbbitProtocol.ts \
 *          --network baseSepolia \
 *          --parameters ignition/parameters/base-sepolia.json
 *
 *      Base Mainnet (production):
 *        npx hardhat ignition deploy ignition/modules/OrbbitProtocol.ts \
 *          --network base \
 *          --parameters ignition/parameters/base-mainnet.json
 *
 * @dev Parameters (defined in parameter JSON files):
 *      - paymentToken: USDC contract address (network-specific)
 *      - tokenName: Invoice NFT name (default: "Orbbit Invoice")
 *      - tokenSymbol: Invoice NFT symbol (default: "ORBINV")
 *      - metadataBaseUri: Base URI for NFT metadata
 *      - metadataExtension: File extension for metadata (default: ".json")
 *      - gracePeriodDays: Grace period for defaults (default: 30)
 *      - platformTreasury: Platform treasury address (default: deployer)
 *      - platformFeeRate: Platform fee rate in basis points (default: 3000 = 30%)
 *      - maxBatchSize: Maximum batch size for whitelist operations (default: 50)
 *
 * @dev IMPORTANT: Always use parameter files to ensure correct network configuration
 */
const OrbbitProtocolModule = buildModule('OrbbitProtocol', (m) => {
  // ============================================
  // PARAMETERS
  // ============================================

  // All parameters are provided via parameter JSON files
  // Defaults are safe testnet values as fallback
  const paymentToken = m.getParameter(
    'paymentToken',
    '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // Base Sepolia USDC
  );
  const tokenName = m.getParameter('tokenName', 'Orbbit Invoice');
  const tokenSymbol = m.getParameter('tokenSymbol', 'ORBINV');
  const metadataBaseUri = m.getParameter(
    'metadataBaseUri',
    'https://api.orbbit.com/metadata/'
  );
  const metadataExtension = m.getParameter('metadataExtension', '.json');
  const gracePeriodDays = m.getParameter('gracePeriodDays', 30);
  // Platform fee parameters (30% = 3000 basis points)
  const platformTreasury = m.getParameter('platformTreasury', m.getAccount(0)); // Default to deployer
  const platformFeeRate = m.getParameter('platformFeeRate', 3000); // 30%
  const maxBatchSize = m.getParameter('maxBatchSize', 50); // Default: 50

  // ============================================
  // 1. DEPLOY WHITELIST
  // ============================================

  const whitelist = m.contract('Whitelist', [maxBatchSize]);

  // ============================================
  // 2. DEPLOY INVOICE NFT
  // ============================================

  const invoice = m.contract('Invoice', [
    tokenName,
    tokenSymbol,
    metadataBaseUri,
    metadataExtension,
    whitelist,
  ]);

  // ============================================
  // 3. DEPLOY INVOICE FUNDING POOL
  // ============================================

  const pool = m.contract('InvoiceFundingPool', [
    paymentToken,
    invoice,
    gracePeriodDays,
    whitelist,
    platformTreasury,
    platformFeeRate,
  ]);

  // ============================================
  // 4. CONFIGURE INTER-CONTRACT ROLES
  // ============================================

  // Grant MINTER_ROLE to InvoiceFundingPool (lazy minting - NFT minted when funded)
  m.call(invoice, 'grantRole', [
    m.staticCall(invoice, 'MINTER_ROLE'),
    pool,
  ], { id: 'Invoice_GrantMinterRole' });

  // Grant UPDATER_ROLE to InvoiceFundingPool
  m.call(invoice, 'grantRole', [
    m.staticCall(invoice, 'UPDATER_ROLE'),
    pool,
  ], { id: 'Invoice_GrantUpdaterRole' });

  // ============================================
  // RETURN DEPLOYED CONTRACTS
  // ============================================

  return {
    whitelist,
    invoice,
    pool,
  };
});

export default OrbbitProtocolModule;
