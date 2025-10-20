import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import deploymentConfig from '../../config/deployment.config';

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
 *      Base Sepolia: npx hardhat ignition deploy ignition/modules/OrbbitProtocol.ts --network baseSepolia
 *      Base Mainnet: npx hardhat ignition deploy ignition/modules/OrbbitProtocol.ts --network base
 *
 * @dev Parameters can be overridden using ignition parameters:
 *      npx hardhat ignition deploy ... --parameters ignition/parameters/base-sepolia.json
 */
const OrbbitProtocolModule = buildModule('OrbbitProtocol', (m) => {
  // ============================================
  // CONFIGURATION
  // ============================================

  const { token, contract } = deploymentConfig;

  // Parameters with defaults from deployment config
  const tokenName = m.getParameter('tokenName', token.name);
  const tokenSymbol = m.getParameter('tokenSymbol', token.symbol);
  const metadataBaseUri = m.getParameter('metadataBaseUri', token.metadataBaseUri);
  const metadataExtension = m.getParameter('metadataExtension', token.metadataExtension);
  const gracePeriodDays = m.getParameter('gracePeriodDays', contract.gracePeriodDays);

  // Payment token (USDC) - can be overridden per network
  // For Base Sepolia: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
  // For Base Mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  const paymentToken = m.getParameter(
    'paymentToken',
    '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // Default to Base Sepolia USDC
  );

  // ============================================
  // 1. DEPLOY WHITELIST
  // ============================================

  const whitelist = m.contract('Whitelist');

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
