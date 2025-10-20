import { ethers, network } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

/**
 * @title Transfer to Multi-Sig Script
 * @notice Manually transfers all admin roles to the multi-sig wallet
 * @dev Usage: npx hardhat run scripts/transfer-to-multisig.ts --network base
 * @dev Use this if automatic transfer during deployment was skipped or failed
 */
async function main() {
  const MULTISIG_ADDRESS = process.env.MULTISIG_ADDRESS;

  if (!MULTISIG_ADDRESS) {
    throw new Error('MULTISIG_ADDRESS environment variable not set!');
  }

  console.log('═══════════════════════════════════════════════');
  console.log('  TRANSFER CONTROL TO MULTI-SIG');
  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log('Network:', network.name);
  console.log('Chain ID:', network.config.chainId);
  console.log('Multi-sig address:', MULTISIG_ADDRESS);
  console.log('');

  // Load deployment addresses
  const deploymentFile = path.join(__dirname, '..', `deployments-${network.config.chainId}.json`);

  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found: ${deploymentFile}`);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  const [deployer] = await ethers.getSigners();

  console.log('Deployer address:', deployer.address);
  console.log('');
  console.log('This will grant ALL admin roles to the multi-sig wallet.');
  console.log('');
  console.log('⚠️  WARNING:');
  console.log('  - Multi-sig will have full control over all contracts');
  console.log('  - Deployer will retain roles (use revoke script to remove)');
  console.log('  - This operation requires gas fees');
  console.log('');

  // Confirmation prompt
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const confirmed = await new Promise<boolean>((resolve) => {
    rl.question('Type "TRANSFER" to confirm: ', (answer) => {
      rl.close();
      resolve(answer === 'TRANSFER');
    });
  });

  if (!confirmed) {
    console.log('\n❌ Transfer cancelled');
    return;
  }

  console.log('\n🔄 Starting transfer...\n');

  // Load contracts
  const invoice = await ethers.getContractAt('Invoice', deployments.contracts.invoice);
  const pool = await ethers.getContractAt('InvoiceFundingPool', deployments.contracts.invoiceFundingPool);
  const whitelist = await ethers.getContractAt('Whitelist', deployments.contracts.whitelist);

  // Get role IDs
  const ADMIN_ROLE = await invoice.DEFAULT_ADMIN_ROLE();
  const PAUSER_ROLE = await invoice.PAUSER_ROLE();
  const OPERATOR_ROLE = await pool.OPERATOR_ROLE();
  const WHITELIST_MANAGER_ROLE = await whitelist.WHITELIST_MANAGER_ROLE();

  // Invoice Contract
  console.log('📄 Invoice Contract');
  console.log('─'.repeat(50));

  const invoiceHasAdmin = await invoice.hasRole(ADMIN_ROLE, MULTISIG_ADDRESS);
  if (!invoiceHasAdmin) {
    console.log('  Granting DEFAULT_ADMIN_ROLE...');
    await (await invoice.grantRole(ADMIN_ROLE, MULTISIG_ADDRESS)).wait();
    console.log('  ✅ Granted');
  } else {
    console.log('  ✓ Already has DEFAULT_ADMIN_ROLE');
  }

  const invoiceHasPauser = await invoice.hasRole(PAUSER_ROLE, MULTISIG_ADDRESS);
  if (!invoiceHasPauser) {
    console.log('  Granting PAUSER_ROLE...');
    await (await invoice.grantRole(PAUSER_ROLE, MULTISIG_ADDRESS)).wait();
    console.log('  ✅ Granted');
  } else {
    console.log('  ✓ Already has PAUSER_ROLE');
  }

  console.log('');

  // InvoiceFundingPool Contract
  console.log('💰 InvoiceFundingPool Contract');
  console.log('─'.repeat(50));

  const poolHasAdmin = await pool.hasRole(ADMIN_ROLE, MULTISIG_ADDRESS);
  if (!poolHasAdmin) {
    console.log('  Granting DEFAULT_ADMIN_ROLE...');
    await (await pool.grantRole(ADMIN_ROLE, MULTISIG_ADDRESS)).wait();
    console.log('  ✅ Granted');
  } else {
    console.log('  ✓ Already has DEFAULT_ADMIN_ROLE');
  }

  const poolHasOperator = await pool.hasRole(OPERATOR_ROLE, MULTISIG_ADDRESS);
  if (!poolHasOperator) {
    console.log('  Granting OPERATOR_ROLE...');
    await (await pool.grantRole(OPERATOR_ROLE, MULTISIG_ADDRESS)).wait();
    console.log('  ✅ Granted');
  } else {
    console.log('  ✓ Already has OPERATOR_ROLE');
  }

  const poolHasPauser = await pool.hasRole(PAUSER_ROLE, MULTISIG_ADDRESS);
  if (!poolHasPauser) {
    console.log('  Granting PAUSER_ROLE...');
    await (await pool.grantRole(PAUSER_ROLE, MULTISIG_ADDRESS)).wait();
    console.log('  ✅ Granted');
  } else {
    console.log('  ✓ Already has PAUSER_ROLE');
  }

  console.log('');

  // Whitelist Contract
  console.log('✅ Whitelist Contract');
  console.log('─'.repeat(50));

  const whitelistHasAdmin = await whitelist.hasRole(ADMIN_ROLE, MULTISIG_ADDRESS);
  if (!whitelistHasAdmin) {
    console.log('  Granting DEFAULT_ADMIN_ROLE...');
    await (await whitelist.grantRole(ADMIN_ROLE, MULTISIG_ADDRESS)).wait();
    console.log('  ✅ Granted');
  } else {
    console.log('  ✓ Already has DEFAULT_ADMIN_ROLE');
  }

  const whitelistHasManager = await whitelist.hasRole(WHITELIST_MANAGER_ROLE, MULTISIG_ADDRESS);
  if (!whitelistHasManager) {
    console.log('  Granting WHITELIST_MANAGER_ROLE...');
    await (await whitelist.grantRole(WHITELIST_MANAGER_ROLE, MULTISIG_ADDRESS)).wait();
    console.log('  ✅ Granted');
  } else {
    console.log('  ✓ Already has WHITELIST_MANAGER_ROLE');
  }

  console.log('');

  // Verify all roles
  console.log('🔍 Verifying multi-sig has all roles...');

  const invoiceAdminCheck = await invoice.hasRole(ADMIN_ROLE, MULTISIG_ADDRESS);
  const invoicePauserCheck = await invoice.hasRole(PAUSER_ROLE, MULTISIG_ADDRESS);
  const poolAdminCheck = await pool.hasRole(ADMIN_ROLE, MULTISIG_ADDRESS);
  const poolOperatorCheck = await pool.hasRole(OPERATOR_ROLE, MULTISIG_ADDRESS);
  const poolPauserCheck = await pool.hasRole(PAUSER_ROLE, MULTISIG_ADDRESS);
  const whitelistAdminCheck = await whitelist.hasRole(ADMIN_ROLE, MULTISIG_ADDRESS);
  const whitelistManagerCheck = await whitelist.hasRole(WHITELIST_MANAGER_ROLE, MULTISIG_ADDRESS);

  if (
    !invoiceAdminCheck ||
    !invoicePauserCheck ||
    !poolAdminCheck ||
    !poolOperatorCheck ||
    !poolPauserCheck ||
    !whitelistAdminCheck ||
    !whitelistManagerCheck
  ) {
    throw new Error('❌ Verification failed! Multi-sig does not have all required roles.');
  }

  console.log('✅ Multi-sig verified - has all admin roles\n');

  // Update deployment file
  deployments.multisig = MULTISIG_ADDRESS;
  fs.writeFileSync(deploymentFile, JSON.stringify(deployments, null, 2));

  console.log('═══════════════════════════════════════════════');
  console.log('  ✅ TRANSFER COMPLETE');
  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log('Multi-sig now has full control of:');
  console.log('  • Invoice:', deployments.contracts.invoice);
  console.log('  • InvoiceFundingPool:', deployments.contracts.invoiceFundingPool);
  console.log('  • Whitelist:', deployments.contracts.whitelist);
  console.log('');
  console.log('⚠️  Deployer still has admin roles (backup).');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Verify: npx hardhat run scripts/verify-multisig-control.ts --network', network.name);
  console.log('  2. (Optional) Revoke deployer: npx hardhat run scripts/revoke-deployer-roles.ts --network', network.name);
  console.log('');
  console.log('All future admin actions must go through the multi-sig at:');
  console.log('  https://app.safe.global');
  console.log('═══════════════════════════════════════════════');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
