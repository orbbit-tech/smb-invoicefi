import { network } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

/**
 * @title Verify Multi-Sig Control Script
 * @notice Verifies that the multi-sig wallet has all expected admin roles
 * @dev Usage: npx hardhat run scripts/verify-multisig-control.ts --network base
 */
async function main() {
  // Connect to network (Hardhat v3 pattern)
  const { viem } = await network.connect();

  console.log('═══════════════════════════════════════════════');
  console.log('  VERIFY MULTI-SIG CONTROL');
  console.log('═══════════════════════════════════════════════');
  console.log('');

  // Get network info from Viem PublicClient (official Hardhat + Viem pattern)
  const publicClient = await viem.getPublicClient();
  const chainId = await publicClient.getChainId();
  const networkName = publicClient.chain.name;

  console.log('Network:', networkName);
  console.log('Chain ID:', chainId);
  console.log('');

  // Load deployment addresses
  const deploymentFile = path.join(__dirname, '..', `deployments-${chainId}.json`);

  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found: ${deploymentFile}`);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));

  if (!deployments.multisig) {
    console.log('⚠️  No multi-sig address found in deployment file.');
    console.log('This deployment does not use a multi-sig wallet.');
    return;
  }

  const multisigAddress = deployments.multisig as `0x${string}`;
  const [deployer] = await viem.getWalletClients();

  console.log('Multi-sig address:', multisigAddress);
  console.log('Deployer address:', deployer.account.address);
  console.log('');

  // Load contracts
  const invoice = await viem.getContractAt('Invoice', deployments.contracts.invoice as `0x${string}`);
  const pool = await viem.getContractAt('InvoiceFundingPool', deployments.contracts.invoiceFundingPool as `0x${string}`);
  const whitelist = await viem.getContractAt('Whitelist', deployments.contracts.whitelist as `0x${string}`);

  // Get role IDs
  const ADMIN_ROLE = await invoice.read.DEFAULT_ADMIN_ROLE();
  const PAUSER_ROLE = await invoice.read.PAUSER_ROLE();
  const MINTER_ROLE = await invoice.read.MINTER_ROLE();
  const UPDATER_ROLE = await invoice.read.UPDATER_ROLE();
  const OPERATOR_ROLE = await pool.read.OPERATOR_ROLE();
  const WHITELIST_OPERATOR_ROLE = await whitelist.read.WHITELIST_OPERATOR_ROLE();

  console.log('Checking roles...');
  console.log('');

  // Check Invoice roles
  console.log('📄 Invoice Contract:', deployments.contracts.invoice);
  console.log('─'.repeat(70));

  const invoiceAdminMultisig = await invoice.read.hasRole([ADMIN_ROLE, multisigAddress]);
  const invoiceAdminDeployer = await invoice.read.hasRole([ADMIN_ROLE, deployer.account.address]);
  const invoicePauserMultisig = await invoice.read.hasRole([PAUSER_ROLE, multisigAddress]);
  const invoicePauserDeployer = await invoice.read.hasRole([PAUSER_ROLE, deployer.account.address]);

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

  const poolAdminMultisig = await pool.read.hasRole([ADMIN_ROLE, multisigAddress]);
  const poolAdminDeployer = await pool.read.hasRole([ADMIN_ROLE, deployer.account.address]);
  const poolOperatorMultisig = await pool.read.hasRole([OPERATOR_ROLE, multisigAddress]);
  const poolOperatorDeployer = await pool.read.hasRole([OPERATOR_ROLE, deployer.account.address]);
  const poolPauserMultisig = await pool.read.hasRole([PAUSER_ROLE, multisigAddress]);
  const poolPauserDeployer = await pool.read.hasRole([PAUSER_ROLE, deployer.account.address]);

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

  const whitelistAdminMultisig = await whitelist.read.hasRole([ADMIN_ROLE, multisigAddress]);
  const whitelistAdminDeployer = await whitelist.read.hasRole([ADMIN_ROLE, deployer.account.address]);
  const whitelistOperatorMultisig = await whitelist.read.hasRole([WHITELIST_OPERATOR_ROLE, multisigAddress]);
  const whitelistOperatorDeployer = await whitelist.read.hasRole([WHITELIST_OPERATOR_ROLE, deployer.account.address]);

  console.log(`  DEFAULT_ADMIN_ROLE:`);
  console.log(`    Multi-sig: ${whitelistAdminMultisig ? '✅ HAS ROLE' : '❌ NO ROLE'}`);
  console.log(`    Deployer:  ${whitelistAdminDeployer ? '✅ HAS ROLE' : '❌ NO ROLE'}`);
  console.log(`  WHITELIST_OPERATOR_ROLE:`);
  console.log(`    Multi-sig: ${whitelistOperatorMultisig ? '✅ HAS ROLE' : '❌ NO ROLE'}`);
  console.log(`    Deployer:  ${whitelistOperatorDeployer ? '✅ HAS ROLE' : '❌ NO ROLE'}`);
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
    whitelistOperatorMultisig;

  const anyDeployerRolesPresent =
    invoiceAdminDeployer ||
    invoicePauserDeployer ||
    poolAdminDeployer ||
    poolOperatorDeployer ||
    poolPauserDeployer ||
    whitelistAdminDeployer ||
    whitelistOperatorDeployer;

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
    console.log('  Run: npx hardhat run scripts/revoke-deployer-roles.ts --network', networkName);
    console.log('  To fully transfer control to multi-sig');
  } else {
    console.log('');
    console.log('❌ ERROR: Multi-sig does not have all required roles!');
    console.log('');
    console.log('Security Status: NOT READY FOR PRODUCTION');
    console.log('');
    console.log('Next step:');
    console.log('  Run: npx hardhat run scripts/transfer-to-multisig.ts --network', networkName);
  }

  console.log('═══════════════════════════════════════════════');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
