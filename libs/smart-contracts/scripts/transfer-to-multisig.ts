import { network } from 'hardhat';
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
  // Connect to network (Hardhat v3 pattern)
  const { viem } = await network.connect();

  const MULTISIG_ADDRESS = process.env.MULTISIG_ADDRESS;

  if (!MULTISIG_ADDRESS) {
    throw new Error('MULTISIG_ADDRESS environment variable not set!');
  }

  console.log('═══════════════════════════════════════════════');
  console.log('  TRANSFER CONTROL TO MULTI-SIG');
  console.log('═══════════════════════════════════════════════');
  console.log('');

  // Get network info from Viem PublicClient (official Hardhat + Viem pattern)
  const publicClient = await viem.getPublicClient();
  const chainId = await publicClient.getChainId();
  const networkName = publicClient.chain.name;

  console.log('Network:', networkName);
  console.log('Chain ID:', chainId);
  console.log('Multi-sig address:', MULTISIG_ADDRESS);
  console.log('');

  // Load deployment addresses
  const deploymentFile = path.join(__dirname, '..', `deployments-${chainId}.json`);

  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found: ${deploymentFile}`);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  const [deployer] = await viem.getWalletClients();

  console.log('Deployer address:', deployer.account.address);
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

  const multisigAddress = MULTISIG_ADDRESS as `0x${string}`;

  // Load contracts
  const invoice = await viem.getContractAt('Invoice', deployments.contracts.invoice as `0x${string}`);
  const pool = await viem.getContractAt('InvoiceFundingPool', deployments.contracts.invoiceFundingPool as `0x${string}`);
  const whitelist = await viem.getContractAt('Whitelist', deployments.contracts.whitelist as `0x${string}`);

  // Get role IDs
  const ADMIN_ROLE = await invoice.read.DEFAULT_ADMIN_ROLE();
  const PAUSER_ROLE = await invoice.read.PAUSER_ROLE();
  const OPERATOR_ROLE = await pool.read.OPERATOR_ROLE();
  const WHITELIST_OPERATOR_ROLE = await whitelist.read.WHITELIST_OPERATOR_ROLE();

  // Invoice Contract
  console.log('📄 Invoice Contract');
  console.log('─'.repeat(50));

  const invoiceHasAdmin = await invoice.read.hasRole([ADMIN_ROLE, multisigAddress]);
  if (!invoiceHasAdmin) {
    console.log('  Granting DEFAULT_ADMIN_ROLE...');
    await invoice.write.grantRole([ADMIN_ROLE, multisigAddress]);
    console.log('  ✅ Granted');
  } else {
    console.log('  ✓ Already has DEFAULT_ADMIN_ROLE');
  }

  const invoiceHasPauser = await invoice.read.hasRole([PAUSER_ROLE, multisigAddress]);
  if (!invoiceHasPauser) {
    console.log('  Granting PAUSER_ROLE...');
    await invoice.write.grantRole([PAUSER_ROLE, multisigAddress]);
    console.log('  ✅ Granted');
  } else {
    console.log('  ✓ Already has PAUSER_ROLE');
  }

  console.log('');

  // InvoiceFundingPool Contract
  console.log('💰 InvoiceFundingPool Contract');
  console.log('─'.repeat(50));

  const poolHasAdmin = await pool.read.hasRole([ADMIN_ROLE, multisigAddress]);
  if (!poolHasAdmin) {
    console.log('  Granting DEFAULT_ADMIN_ROLE...');
    await pool.write.grantRole([ADMIN_ROLE, multisigAddress]);
    console.log('  ✅ Granted');
  } else {
    console.log('  ✓ Already has DEFAULT_ADMIN_ROLE');
  }

  const poolHasOperator = await pool.read.hasRole([OPERATOR_ROLE, multisigAddress]);
  if (!poolHasOperator) {
    console.log('  Granting OPERATOR_ROLE...');
    await pool.write.grantRole([OPERATOR_ROLE, multisigAddress]);
    console.log('  ✅ Granted');
  } else {
    console.log('  ✓ Already has OPERATOR_ROLE');
  }

  const poolHasPauser = await pool.read.hasRole([PAUSER_ROLE, multisigAddress]);
  if (!poolHasPauser) {
    console.log('  Granting PAUSER_ROLE...');
    await pool.write.grantRole([PAUSER_ROLE, multisigAddress]);
    console.log('  ✅ Granted');
  } else {
    console.log('  ✓ Already has PAUSER_ROLE');
  }

  console.log('');

  // Whitelist Contract
  console.log('✅ Whitelist Contract');
  console.log('─'.repeat(50));

  const whitelistHasAdmin = await whitelist.read.hasRole([ADMIN_ROLE, multisigAddress]);
  if (!whitelistHasAdmin) {
    console.log('  Granting DEFAULT_ADMIN_ROLE...');
    await whitelist.write.grantRole([ADMIN_ROLE, multisigAddress]);
    console.log('  ✅ Granted');
  } else {
    console.log('  ✓ Already has DEFAULT_ADMIN_ROLE');
  }

  const whitelistHasOperator = await whitelist.read.hasRole([WHITELIST_OPERATOR_ROLE, multisigAddress]);
  if (!whitelistHasOperator) {
    console.log('  Granting WHITELIST_OPERATOR_ROLE...');
    await whitelist.write.grantRole([WHITELIST_OPERATOR_ROLE, multisigAddress]);
    console.log('  ✅ Granted');
  } else {
    console.log('  ✓ Already has WHITELIST_OPERATOR_ROLE');
  }

  console.log('');

  // Verify all roles
  console.log('🔍 Verifying multi-sig has all roles...');

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
  console.log('  1. Verify: npx hardhat run scripts/verify-multisig-control.ts --network', networkName);
  console.log('  2. (Optional) Revoke deployer: npx hardhat run scripts/revoke-deployer-roles.ts --network', networkName);
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
