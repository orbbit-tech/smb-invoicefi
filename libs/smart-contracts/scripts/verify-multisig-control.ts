import { ethers, network } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

/**
 * @title Verify Multi-Sig Control Script
 * @notice Verifies that the multi-sig wallet has all expected admin roles
 * @dev Usage: npx hardhat run scripts/verify-multisig-control.ts --network base
 */
async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  VERIFY MULTI-SIG CONTROL');
  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log('Network:', network.name);
  console.log('Chain ID:', network.config.chainId);
  console.log('');

  // Load deployment addresses
  const deploymentFile = path.join(__dirname, '..', `deployments-${network.config.chainId}.json`);

  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found: ${deploymentFile}`);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));

  if (!deployments.multisig) {
    console.log('⚠️  No multi-sig address found in deployment file.');
    console.log('This deployment does not use a multi-sig wallet.');
    return;
  }

  const multisigAddress = deployments.multisig;
  const [deployer] = await ethers.getSigners();

  console.log('Multi-sig address:', multisigAddress);
  console.log('Deployer address:', deployer.address);
  console.log('');

  // Load contracts
  const invoice = await ethers.getContractAt('Invoice', deployments.contracts.invoice);
  const pool = await ethers.getContractAt('InvoiceFundingPool', deployments.contracts.invoiceFundingPool);
  const whitelist = await ethers.getContractAt('Whitelist', deployments.contracts.whitelist);

  // Get role IDs
  const ADMIN_ROLE = await invoice.DEFAULT_ADMIN_ROLE();
  const PAUSER_ROLE = await invoice.PAUSER_ROLE();
  const MINTER_ROLE = await invoice.MINTER_ROLE();
  const UPDATER_ROLE = await invoice.UPDATER_ROLE();
  const OPERATOR_ROLE = await pool.OPERATOR_ROLE();
  const WHITELIST_MANAGER_ROLE = await whitelist.WHITELIST_MANAGER_ROLE();

  console.log('Checking roles...');
  console.log('');

  // Check Invoice roles
  console.log('📄 Invoice Contract:', deployments.contracts.invoice);
  console.log('─'.repeat(70));

  const invoiceAdminMultisig = await invoice.hasRole(ADMIN_ROLE, multisigAddress);
  const invoiceAdminDeployer = await invoice.hasRole(ADMIN_ROLE, deployer.address);
  const invoicePauserMultisig = await invoice.hasRole(PAUSER_ROLE, multisigAddress);
  const invoicePauserDeployer = await invoice.hasRole(PAUSER_ROLE, deployer.address);

  console.log(`  DEFAULT_ADMIN_ROLE:`);
  console.log(`    Multi-sig: ${invoiceAdminMultisig ? '✅ HAS ROLE' : '❌ NO ROLE'}`);
  console.log(`    Deployer:  ${invoiceAdminDeployer ? '✅ HAS ROLE' : '❌ NO ROLE'}`);
  console.log(`  PAUSER_ROLE:`);
  console.log(`    Multi-sig: ${invoicePauserMultisig ? '✅ HAS ROLE' : '❌ NO ROLE'}`);
  console.log(`    Deployer:  ${invoicePauserDeployer ? '✅ HAS ROLE' : '❌ NO ROLE'}`);
  console.log('');

  // Check InvoiceFundingPool roles
  console.log('💰 InvoiceFundingPool Contract:', deployments.contracts.invoiceFundingPool);
  console.log('─'.repeat(70));

  const poolAdminMultisig = await pool.hasRole(ADMIN_ROLE, multisigAddress);
  const poolAdminDeployer = await pool.hasRole(ADMIN_ROLE, deployer.address);
  const poolOperatorMultisig = await pool.hasRole(OPERATOR_ROLE, multisigAddress);
  const poolOperatorDeployer = await pool.hasRole(OPERATOR_ROLE, deployer.address);
  const poolPauserMultisig = await pool.hasRole(PAUSER_ROLE, multisigAddress);
  const poolPauserDeployer = await pool.hasRole(PAUSER_ROLE, deployer.address);

  console.log(`  DEFAULT_ADMIN_ROLE:`);
  console.log(`    Multi-sig: ${poolAdminMultisig ? '✅ HAS ROLE' : '❌ NO ROLE'}`);
  console.log(`    Deployer:  ${poolAdminDeployer ? '✅ HAS ROLE' : '❌ NO ROLE'}`);
  console.log(`  OPERATOR_ROLE:`);
  console.log(`    Multi-sig: ${poolOperatorMultisig ? '✅ HAS ROLE' : '❌ NO ROLE'}`);
  console.log(`    Deployer:  ${poolOperatorDeployer ? '✅ HAS ROLE' : '❌ NO ROLE'}`);
  console.log(`  PAUSER_ROLE:`);
  console.log(`    Multi-sig: ${poolPauserMultisig ? '✅ HAS ROLE' : '❌ NO ROLE'}`);
  console.log(`    Deployer:  ${poolPauserDeployer ? '✅ HAS ROLE' : '❌ NO ROLE'}`);
  console.log('');

  // Check Whitelist roles
  console.log('✅ Whitelist Contract:', deployments.contracts.whitelist);
  console.log('─'.repeat(70));

  const whitelistAdminMultisig = await whitelist.hasRole(ADMIN_ROLE, multisigAddress);
  const whitelistAdminDeployer = await whitelist.hasRole(ADMIN_ROLE, deployer.address);
  const whitelistManagerMultisig = await whitelist.hasRole(WHITELIST_MANAGER_ROLE, multisigAddress);
  const whitelistManagerDeployer = await whitelist.hasRole(WHITELIST_MANAGER_ROLE, deployer.address);

  console.log(`  DEFAULT_ADMIN_ROLE:`);
  console.log(`    Multi-sig: ${whitelistAdminMultisig ? '✅ HAS ROLE' : '❌ NO ROLE'}`);
  console.log(`    Deployer:  ${whitelistAdminDeployer ? '✅ HAS ROLE' : '❌ NO ROLE'}`);
  console.log(`  WHITELIST_MANAGER_ROLE:`);
  console.log(`    Multi-sig: ${whitelistManagerMultisig ? '✅ HAS ROLE' : '❌ NO ROLE'}`);
  console.log(`    Deployer:  ${whitelistManagerDeployer ? '✅ HAS ROLE' : '❌ NO ROLE'}`);
  console.log('');

  // Summary
  console.log('═══════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════');

  const allMultisigRolesPresent =
    invoiceAdminMultisig &&
    invoicePauserMultisig &&
    poolAdminMultisig &&
    poolOperatorMultisig &&
    poolPauserMultisig &&
    whitelistAdminMultisig &&
    whitelistManagerMultisig;

  const anyDeployerRolesPresent =
    invoiceAdminDeployer ||
    invoicePauserDeployer ||
    poolAdminDeployer ||
    poolOperatorDeployer ||
    poolPauserDeployer ||
    whitelistAdminDeployer ||
    whitelistManagerDeployer;

  if (allMultisigRolesPresent && !anyDeployerRolesPresent) {
    console.log('');
    console.log('✅ PERFECT: Multi-sig has full control');
    console.log('✅ Deployer has no admin roles');
    console.log('');
    console.log('Security Status: PRODUCTION READY');
  } else if (allMultisigRolesPresent && anyDeployerRolesPresent) {
    console.log('');
    console.log('✅ Multi-sig has all required roles');
    console.log('⚠️  Deployer still has some admin roles (backup)');
    console.log('');
    console.log('Security Status: ACCEPTABLE (deployer backup exists)');
    console.log('');
    console.log('Next step:');
    console.log('  Run: npx hardhat run scripts/revoke-deployer-roles.ts --network', network.name);
    console.log('  To fully transfer control to multi-sig');
  } else {
    console.log('');
    console.log('❌ ERROR: Multi-sig does not have all required roles!');
    console.log('');
    console.log('Security Status: NOT READY FOR PRODUCTION');
    console.log('');
    console.log('Next step:');
    console.log('  Run: npx hardhat run scripts/transfer-to-multisig.ts --network', network.name);
  }

  console.log('═══════════════════════════════════════════════');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
