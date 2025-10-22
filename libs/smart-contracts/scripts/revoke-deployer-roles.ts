import { network } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

/**
 * @title Revoke Deployer Roles Script
 * @notice Removes all admin roles from the deployer wallet
 * @dev Usage: npx hardhat run scripts/revoke-deployer-roles.ts --network base
 *
 * ⚠️  WARNING: This operation is IRREVERSIBLE!
 * ⚠️  Only run this after verifying multi-sig has all roles!
 * ⚠️  After this, only the multi-sig can perform admin actions!
 */
async function main() {
  // Connect to network (Hardhat v3 pattern)
  const { viem } = await network.connect();

  console.log('═══════════════════════════════════════════════');
  console.log('  🔴 REVOKE DEPLOYER ADMIN ROLES');
  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log('⚠️  ⚠️  ⚠️  DANGER ZONE ⚠️  ⚠️  ⚠️');
  console.log('');
  console.log('This script will PERMANENTLY remove all admin roles');
  console.log('from the deployer wallet.');
  console.log('');
  console.log('After this operation:');
  console.log('  • You will NOT be able to pause contracts');
  console.log('  • You will NOT be able to grant/revoke roles');
  console.log('  • You will NOT be able to change contract settings');
  console.log('  • ONLY the multi-sig can perform admin actions');
  console.log('');
  console.log('This operation is IRREVERSIBLE!');
  console.log('');
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
  const [deployer] = await viem.getWalletClients();

  if (!deployments.multisig) {
    throw new Error('No multi-sig address found in deployment file!');
  }

  const multisigAddress = deployments.multisig as `0x${string}`;

  console.log('Deployer address:', deployer.account.address);
  console.log('Multi-sig address:', multisigAddress);
  console.log('');

  // Load contracts
  const invoice = await viem.getContractAt('Invoice', deployments.contracts.invoice as `0x${string}`);
  const pool = await viem.getContractAt('InvoiceFundingPool', deployments.contracts.invoiceFundingPool as `0x${string}`);
  const whitelist = await viem.getContractAt('Whitelist', deployments.contracts.whitelist as `0x${string}`);

  // Get role IDs
  const ADMIN_ROLE = await invoice.read.DEFAULT_ADMIN_ROLE();
  const PAUSER_ROLE = await invoice.read.PAUSER_ROLE();
  const OPERATOR_ROLE = await pool.read.OPERATOR_ROLE();
  const WHITELIST_OPERATOR_ROLE = await whitelist.read.WHITELIST_OPERATOR_ROLE();

  // Verify multi-sig has all roles FIRST
  console.log('Step 1: Verifying multi-sig has all required roles...');
  console.log('');

  const invoiceAdminCheck = await invoice.read.hasRole([ADMIN_ROLE, multisigAddress]);
  const invoicePauserCheck = await invoice.read.hasRole([PAUSER_ROLE, multisigAddress]);
  const poolAdminCheck = await pool.read.hasRole([ADMIN_ROLE, multisigAddress]);
  const poolOperatorCheck = await pool.read.hasRole([OPERATOR_ROLE, multisigAddress]);
  const poolPauserCheck = await pool.read.hasRole([PAUSER_ROLE, multisigAddress]);
  const whitelistAdminCheck = await whitelist.read.hasRole([ADMIN_ROLE, multisigAddress]);
  const whitelistOperatorCheck = await whitelist.read.hasRole([WHITELIST_OPERATOR_ROLE, multisigAddress]);

  if (
    !invoiceAdminCheck ||
    !invoicePauserCheck ||
    !poolAdminCheck ||
    !poolOperatorCheck ||
    !poolPauserCheck ||
    !whitelistAdminCheck ||
    !whitelistOperatorCheck
  ) {
    console.log('❌ ERROR: Multi-sig does not have all required roles!');
    console.log('');
    console.log('Cannot proceed with revoke. Run transfer script first:');
    console.log('  npx hardhat run scripts/transfer-to-multisig.ts --network', networkName);
    throw new Error('Multi-sig verification failed!');
  }

  console.log('✅ Multi-sig has all required roles');
  console.log('');

  // Check if deployer has any roles
  const deployerHasInvoiceAdmin = await invoice.read.hasRole([ADMIN_ROLE, deployer.account.address]);
  const deployerHasInvoicePauser = await invoice.read.hasRole([PAUSER_ROLE, deployer.account.address]);
  const deployerHasPoolAdmin = await pool.read.hasRole([ADMIN_ROLE, deployer.account.address]);
  const deployerHasPoolOperator = await pool.read.hasRole([OPERATOR_ROLE, deployer.account.address]);
  const deployerHasPoolPauser = await pool.read.hasRole([PAUSER_ROLE, deployer.account.address]);
  const deployerHasWhitelistAdmin = await whitelist.read.hasRole([ADMIN_ROLE, deployer.account.address]);
  const deployerHasWhitelistOperator = await whitelist.read.hasRole([WHITELIST_OPERATOR_ROLE, deployer.account.address]);

  const deployerHasAnyRole =
    deployerHasInvoiceAdmin ||
    deployerHasInvoicePauser ||
    deployerHasPoolAdmin ||
    deployerHasPoolOperator ||
    deployerHasPoolPauser ||
    deployerHasWhitelistAdmin ||
    deployerHasWhitelistOperator;

  if (!deployerHasAnyRole) {
    console.log('ℹ️  Deployer already has no admin roles. Nothing to revoke.');
    return;
  }

  console.log('Step 2: Confirming revocation...');
  console.log('');
  console.log('Roles to be revoked from deployer:');
  if (deployerHasInvoiceAdmin) console.log('  • Invoice: DEFAULT_ADMIN_ROLE');
  if (deployerHasInvoicePauser) console.log('  • Invoice: PAUSER_ROLE');
  if (deployerHasPoolAdmin) console.log('  • InvoiceFundingPool: DEFAULT_ADMIN_ROLE');
  if (deployerHasPoolOperator) console.log('  • InvoiceFundingPool: OPERATOR_ROLE');
  if (deployerHasPoolPauser) console.log('  • InvoiceFundingPool: PAUSER_ROLE');
  if (deployerHasWhitelistAdmin) console.log('  • Whitelist: DEFAULT_ADMIN_ROLE');
  if (deployerHasWhitelistOperator) console.log('  • Whitelist: WHITELIST_OPERATOR_ROLE');
  console.log('');
  console.log('⚠️  THIS IS YOUR LAST CHANCE TO CANCEL!');
  console.log('');

  // Triple confirmation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const confirmation1 = await new Promise<string>((resolve) => {
    rl.question('Type "I UNDERSTAND" to continue: ', (answer) => {
      resolve(answer);
    });
  });

  if (confirmation1 !== 'I UNDERSTAND') {
    rl.close();
    console.log('\n❌ Revocation cancelled');
    return;
  }

  const confirmation2 = await new Promise<string>((resolve) => {
    rl.question('Type "REVOKE DEPLOYER" to confirm: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });

  if (confirmation2 !== 'REVOKE DEPLOYER') {
    console.log('\n❌ Revocation cancelled');
    return;
  }

  console.log('\n🔄 Revoking deployer roles...\n');

  // Revoke roles
  if (deployerHasInvoiceAdmin) {
    console.log('Revoking Invoice DEFAULT_ADMIN_ROLE...');
    await invoice.write.revokeRole([ADMIN_ROLE, deployer.account.address]);
    console.log('✅ Revoked');
  }

  if (deployerHasInvoicePauser) {
    console.log('Revoking Invoice PAUSER_ROLE...');
    await invoice.write.revokeRole([PAUSER_ROLE, deployer.account.address]);
    console.log('✅ Revoked');
  }

  if (deployerHasPoolAdmin) {
    console.log('Revoking InvoiceFundingPool DEFAULT_ADMIN_ROLE...');
    await pool.write.revokeRole([ADMIN_ROLE, deployer.account.address]);
    console.log('✅ Revoked');
  }

  if (deployerHasPoolOperator) {
    console.log('Revoking InvoiceFundingPool OPERATOR_ROLE...');
    await pool.write.revokeRole([OPERATOR_ROLE, deployer.account.address]);
    console.log('✅ Revoked');
  }

  if (deployerHasPoolPauser) {
    console.log('Revoking InvoiceFundingPool PAUSER_ROLE...');
    await pool.write.revokeRole([PAUSER_ROLE, deployer.account.address]);
    console.log('✅ Revoked');
  }

  if (deployerHasWhitelistAdmin) {
    console.log('Revoking Whitelist DEFAULT_ADMIN_ROLE...');
    await whitelist.write.revokeRole([ADMIN_ROLE, deployer.account.address]);
    console.log('✅ Revoked');
  }

  if (deployerHasWhitelistOperator) {
    console.log('Revoking Whitelist WHITELIST_OPERATOR_ROLE...');
    await whitelist.write.revokeRole([WHITELIST_OPERATOR_ROLE, deployer.account.address]);
    console.log('✅ Revoked');
  }

  console.log('');

  // Verify deployer has no roles
  const finalCheck1 = await invoice.read.hasRole([ADMIN_ROLE, deployer.account.address]);
  const finalCheck2 = await pool.read.hasRole([ADMIN_ROLE, deployer.account.address]);
  const finalCheck3 = await whitelist.read.hasRole([ADMIN_ROLE, deployer.account.address]);

  if (finalCheck1 || finalCheck2 || finalCheck3) {
    throw new Error('❌ Verification failed! Deployer still has admin roles.');
  }

  console.log('✅ Verification passed: Deployer has no admin roles');
  console.log('');

  console.log('═══════════════════════════════════════════════');
  console.log('  ✅ REVOCATION COMPLETE');
  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log('Deployer wallet no longer has admin access.');
  console.log('');
  console.log('All admin actions must now go through multi-sig:');
  console.log('  ', multisigAddress);
  console.log('');
  console.log('Multi-sig UI: https://app.safe.global');
  console.log('');
  console.log('Verify control: npx hardhat run scripts/verify-multisig-control.ts --network', networkName);
  console.log('═══════════════════════════════════════════════');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
