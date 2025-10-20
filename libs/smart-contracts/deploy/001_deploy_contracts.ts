import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import fs from 'fs';
import path from 'path';
import deploymentConfig, { getChainConfig } from '../config/deployment.config';

/**
 * @title Hardhat Deployment Script
 * @notice Deploys Orbbit smart contracts using Hardhat
 * @dev Usage:
 *      Base Sepolia: npx hardhat deploy --network base-sepolia
 *      Base Mainnet: npx hardhat deploy --network base
 * @dev Configuration can be customized via environment variables (see .env.example)
 *
 * @dev Deployment Strategy:
 *      Testnet (Base Sepolia): Deployer retains admin control for fast iteration
 *      Mainnet (Base): Automatically transfers admin control to multi-sig wallet
 */
const deployContracts: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deployments, getNamedAccounts, ethers, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log('==============================================');
  console.log('Deploying Orbbit Smart Contracts');
  console.log('==============================================');
  console.log('Deployer:', deployer);
  console.log('Network:', network.name);
  console.log('Chain ID:', network.config.chainId);
  console.log('');

  // Get chain configuration
  const chainConfig = getChainConfig(network.config.chainId || 0);
  if (!chainConfig) {
    throw new Error(`Unsupported chain ID: ${network.config.chainId}`);
  }

  // ============================================
  // VALIDATE MULTI-SIG REQUIREMENT (Mainnet)
  // ============================================

  if (chainConfig.requiresMultisig) {
    console.log('🔒 MAINNET DEPLOYMENT - Multi-sig required');
    console.log('');

    if (!chainConfig.multisigAddress) {
      throw new Error(
        '❌ MAINNET ERROR: MULTISIG_ADDRESS environment variable is required for mainnet deployment!\n' +
        '   Create a Safe multi-sig at https://safe.global first.\n' +
        '   Then set: export MULTISIG_ADDRESS=0xYourSafeAddress'
      );
    }

    // Verify multi-sig address is a contract
    const multisigCode = await ethers.provider.getCode(chainConfig.multisigAddress);
    if (multisigCode === '0x' || multisigCode === '0x0') {
      throw new Error(
        `❌ MAINNET ERROR: Multi-sig address ${chainConfig.multisigAddress} has no code!\n` +
        '   This address is not a Safe contract. Please verify the address.'
      );
    }

    // Verify multi-sig is not the same as deployer
    if (chainConfig.multisigAddress.toLowerCase() === deployer.toLowerCase()) {
      throw new Error(
        '❌ MAINNET ERROR: Multi-sig address cannot be the same as deployer address!\n' +
        '   Create a Safe multi-sig with multiple signers.'
      );
    }

    console.log('✅ Multi-sig validation passed');
    console.log('   Multi-sig address:', chainConfig.multisigAddress);
    console.log('');
  } else {
    console.log('🧪 TESTNET DEPLOYMENT - Personal wallet (fast iteration)');
    console.log('');
  }

  // ============================================
  // 1. DEPLOY OR GET PAYMENT TOKEN (USDC)
  // ============================================

  let paymentTokenAddress: string;

  if (chainConfig.paymentToken) {
    console.log(`Using ${chainConfig.name} USDC (Circle official):`, chainConfig.paymentToken);
    if (!chainConfig.isMainnet) {
      console.log('Get test USDC from Circle faucet: https://faucet.circle.com (10 USDC per hour per address)');
    }
    paymentTokenAddress = chainConfig.paymentToken;
  } else {
    console.log('Deploying Mock USDC for local/unsupported testnet...');
    const mockUSDC = await deploy('MockUSDC', {
      from: deployer,
      args: [],
      log: true,
      waitConfirmations: 1,
    });
    paymentTokenAddress = mockUSDC.address;
    console.log('Mock USDC deployed at:', paymentTokenAddress);
  }

  console.log('');

  // ============================================
  // 2. GET DEPLOYMENT CONFIGURATION
  // ============================================

  const { token, contract } = deploymentConfig;

  console.log('Configuration:');
  console.log('- Token Name:', token.name);
  console.log('- Token Symbol:', token.symbol);
  console.log('- Metadata Base URI:', token.metadataBaseUri);
  console.log('- Metadata Extension:', token.metadataExtension);
  console.log('- Grace Period Days:', contract.gracePeriodDays);
  console.log('');

  // ============================================
  // 3. DEPLOY WHITELIST
  // ============================================

  console.log('Deploying Whitelist contract...');
  const whitelist = await deploy('Whitelist', {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });
  console.log('Whitelist deployed at:', whitelist.address);
  console.log('');

  // ============================================
  // 4. DEPLOY INVOICE
  // ============================================

  console.log('Deploying Invoice contract...');
  const invoice = await deploy('Invoice', {
    from: deployer,
    args: [
      token.name,
      token.symbol,
      token.metadataBaseUri,
      token.metadataExtension,
      whitelist.address, // Whitelist address
    ],
    log: true,
    waitConfirmations: 1,
  });
  console.log('Invoice deployed at:', invoice.address);
  console.log('');

  // ============================================
  // 5. DEPLOY INVOICE FUNDING POOL
  // ============================================

  console.log('Deploying InvoiceFundingPool contract...');
  const pool = await deploy('InvoiceFundingPool', {
    from: deployer,
    args: [
      paymentTokenAddress,
      invoice.address,
      contract.gracePeriodDays,
      whitelist.address, // Whitelist address
    ],
    log: true,
    waitConfirmations: 1,
  });
  console.log('InvoiceFundingPool deployed at:', pool.address);
  console.log('');

  // ============================================
  // 6. CONFIGURE INTER-CONTRACT ROLES
  // ============================================

  console.log('Configuring inter-contract roles...');

  const invoiceContract = await ethers.getContractAt('Invoice', invoice.address);
  const poolContract = await ethers.getContractAt('InvoiceFundingPool', pool.address);

  // Grant MINTER_ROLE to InvoiceFundingPool (lazy minting - NFT minted when funded)
  const minterRole = await invoiceContract.MINTER_ROLE();
  const poolHasMinterRole = await invoiceContract.hasRole(minterRole, pool.address);

  if (!poolHasMinterRole) {
    const tx1 = await invoiceContract.grantRole(minterRole, pool.address);
    await tx1.wait();
    console.log('✓ Granted MINTER_ROLE to InvoiceFundingPool (for lazy minting)');
  } else {
    console.log('✓ InvoiceFundingPool already has MINTER_ROLE');
  }

  // Grant UPDATER_ROLE to InvoiceFundingPool
  const updaterRole = await invoiceContract.UPDATER_ROLE();
  const hasUpdaterRole = await invoiceContract.hasRole(updaterRole, pool.address);

  if (!hasUpdaterRole) {
    const tx2 = await invoiceContract.grantRole(updaterRole, pool.address);
    await tx2.wait();
    console.log('✓ Granted UPDATER_ROLE to InvoiceFundingPool');
  } else {
    console.log('✓ InvoiceFundingPool already has UPDATER_ROLE');
  }

  console.log('');

  // ============================================
  // 7. TRANSFER TO MULTI-SIG (Mainnet Only)
  // ============================================

  if (chainConfig.requiresMultisig && chainConfig.multisigAddress) {
    console.log('🏛️  MAINNET: Transferring admin control to multi-sig...');
    console.log('');

    const multisigAddress = chainConfig.multisigAddress;
    const whitelistContract = await ethers.getContractAt('Whitelist', whitelist.address);

    // Get all roles
    const ADMIN_ROLE = await invoiceContract.DEFAULT_ADMIN_ROLE();
    const PAUSER_ROLE = await invoiceContract.PAUSER_ROLE();
    const OPERATOR_ROLE = await poolContract.OPERATOR_ROLE();
    const WHITELIST_MANAGER_ROLE = await whitelistContract.WHITELIST_MANAGER_ROLE();

    // Grant all admin roles to multi-sig
    console.log('Granting admin roles to multi-sig:', multisigAddress);

    // Invoice Contract
    await (await invoiceContract.grantRole(ADMIN_ROLE, multisigAddress)).wait();
    await (await invoiceContract.grantRole(PAUSER_ROLE, multisigAddress)).wait();
    console.log('✓ Invoice: Admin roles granted');

    // InvoiceFundingPool Contract
    await (await poolContract.grantRole(ADMIN_ROLE, multisigAddress)).wait();
    await (await poolContract.grantRole(OPERATOR_ROLE, multisigAddress)).wait();
    await (await poolContract.grantRole(PAUSER_ROLE, multisigAddress)).wait();
    console.log('✓ InvoiceFundingPool: Admin roles granted');

    // Whitelist Contract
    await (await whitelistContract.grantRole(ADMIN_ROLE, multisigAddress)).wait();
    await (await whitelistContract.grantRole(WHITELIST_MANAGER_ROLE, multisigAddress)).wait();
    console.log('✓ Whitelist: Admin roles granted');

    console.log('');

    // Verify multi-sig has all roles
    console.log('Verifying multi-sig has all roles...');

    const invoiceHasAdmin = await invoiceContract.hasRole(ADMIN_ROLE, multisigAddress);
    const poolHasAdmin = await poolContract.hasRole(ADMIN_ROLE, multisigAddress);
    const whitelistHasAdmin = await whitelistContract.hasRole(ADMIN_ROLE, multisigAddress);

    if (!invoiceHasAdmin || !poolHasAdmin || !whitelistHasAdmin) {
      throw new Error('❌ Multi-sig verification failed! Multi-sig does not have all admin roles.');
    }

    console.log('✅ Multi-sig verified - has all admin roles');
    console.log('');

    // Revoke deployer roles (OPTIONAL - keeping for now for easier management)
    console.log('Note: Deployer retains admin roles for easier post-deployment setup.');
    console.log('      Run scripts/revoke-deployer-roles.ts when ready to fully transfer control.');
    console.log('');

  } else {
    console.log('🧪 TESTNET: Deployer retains admin control');
    console.log('');
    console.log('Admin roles:');
    console.log('- Deployer has DEFAULT_ADMIN_ROLE on all contracts');
    console.log('- Deployer has OPERATOR_ROLE on InvoiceFundingPool');
    console.log('- Deployer has PAUSER_ROLE on Invoice and InvoiceFundingPool');
    console.log('- Deployer has WHITELIST_MANAGER_ROLE on Whitelist');
    console.log('');
  }

  // ============================================
  // 8. SAVE DEPLOYMENT ADDRESSES
  // ============================================

  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer,
    multisig: chainConfig.multisigAddress || null,
    timestamp: new Date().toISOString(),
    contracts: {
      paymentToken: paymentTokenAddress,
      whitelist: whitelist.address,
      invoice: invoice.address,
      invoiceFundingPool: pool.address,
    },
  };

  const deploymentsDir = path.join(__dirname, '..');
  const filename = `deployments-${network.config.chainId}.json`;
  const filepath = path.join(deploymentsDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));
  console.log('Deployment data saved to:', filename);
  console.log('');

  // ============================================
  // 9. PRINT DEPLOYMENT SUMMARY
  // ============================================

  console.log('==============================================');
  console.log('Deployment Summary');
  console.log('==============================================');
  console.log('Network:', network.name);
  console.log('Chain ID:', network.config.chainId);
  console.log('Deployer:', deployer);

  if (chainConfig.multisigAddress) {
    console.log('Multi-sig:', chainConfig.multisigAddress);
  }

  console.log('');
  console.log('Contract Addresses:');
  console.log('-------------------');
  console.log('Payment Token (USDC):', paymentTokenAddress);
  console.log('Whitelist:', whitelist.address);
  console.log('Invoice:', invoice.address);
  console.log('InvoiceFundingPool:', pool.address);
  console.log('');

  if (chainConfig.requiresMultisig) {
    console.log('Admin Control: Multi-sig (with deployer backup)');
  } else {
    console.log('Admin Control: Deployer (personal wallet)');
  }

  console.log('');
  console.log('==============================================');
  console.log('Next Steps:');
  console.log('==============================================');
  console.log('1. Deployment addresses saved to', filename);
  console.log('2. Update frontend configuration with contract addresses');
  console.log('3. Generate TypeChain types: nx run smart-contracts:typechain');
  console.log('4. Verify contracts on Basescan (if not auto-verified)');

  if (chainConfig.requiresMultisig) {
    console.log('5. Verify multi-sig control: npx hardhat run scripts/verify-multisig-control.ts --network base');
    console.log('6. (Optional) Revoke deployer roles: npx hardhat run scripts/revoke-deployer-roles.ts --network base');
  } else {
    if (network.config.chainId === 84532) {
      // Base Sepolia
      console.log('5. Get test USDC from Circle faucet: https://faucet.circle.com');
      console.log('   (10 USDC per hour per address)');
    } else if (!chainConfig.paymentToken) {
      // Local/other testnet with MockUSDC
      console.log('5. Mint test payment tokens (MockUSDC) to your test accounts');
    }
  }

  console.log('==============================================');

  return true;
};

deployContracts.tags = ['all', 'orbbit'];
deployContracts.dependencies = [];

export default deployContracts;
