import { ethers } from "hardhat";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * Hardhat deployment script for Orbbit invoice financing contracts
 *
 * Deploys in order:
 * 1. MockUSDC (testnet only)
 * 2. InvoiceNFT
 * 3. FundingPool
 * 4. InvoiceFactory
 *
 * Then configures all roles and permissions
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  const network = await ethers.provider.getNetwork();
  const isTestnet = network.chainId === 84532n; // Base Sepolia

  let usdcAddress: string;

  // Step 1: Deploy or use existing USDC
  if (isTestnet) {
    console.log("\n📝 Deploying MockUSDC for testnet...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    usdcAddress = await usdc.getAddress();
    console.log("✅ MockUSDC deployed to:", usdcAddress);
  } else {
    // Base Mainnet USDC address
    usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    console.log("\n📝 Using mainnet USDC at:", usdcAddress);
  }

  // Step 2: Deploy InvoiceNFT
  console.log("\n📝 Deploying InvoiceNFT...");
  const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
  const invoiceNFT = await InvoiceNFT.deploy();
  await invoiceNFT.waitForDeployment();
  const invoiceNFTAddress = await invoiceNFT.getAddress();
  console.log("✅ InvoiceNFT deployed to:", invoiceNFTAddress);

  // Step 3: Deploy FundingPool
  console.log("\n📝 Deploying FundingPool...");
  const FundingPool = await ethers.getContractFactory("FundingPool");
  const fundingPool = await FundingPool.deploy(usdcAddress, invoiceNFTAddress);
  await fundingPool.waitForDeployment();
  const fundingPoolAddress = await fundingPool.getAddress();
  console.log("✅ FundingPool deployed to:", fundingPoolAddress);

  // Step 4: Deploy InvoiceFactory
  console.log("\n📝 Deploying InvoiceFactory...");
  const InvoiceFactory = await ethers.getContractFactory("InvoiceFactory");
  const factory = await InvoiceFactory.deploy(invoiceNFTAddress, fundingPoolAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ InvoiceFactory deployed to:", factoryAddress);

  // Step 5: Configure roles
  console.log("\n📝 Configuring roles...");

  const MINTER_ROLE = await invoiceNFT.MINTER_ROLE();
  const UPDATER_ROLE = await invoiceNFT.UPDATER_ROLE();

  // Grant MINTER_ROLE to factory
  console.log("Granting MINTER_ROLE to factory...");
  const tx1 = await invoiceNFT.grantRole(MINTER_ROLE, factoryAddress);
  await tx1.wait();
  console.log("✅ MINTER_ROLE granted to factory");

  // Grant UPDATER_ROLE to factory
  console.log("Granting UPDATER_ROLE to factory...");
  const tx2 = await invoiceNFT.grantRole(UPDATER_ROLE, factoryAddress);
  await tx2.wait();
  console.log("✅ UPDATER_ROLE granted to factory");

  // Grant UPDATER_ROLE to funding pool
  console.log("Granting UPDATER_ROLE to funding pool...");
  const tx3 = await invoiceNFT.grantRole(UPDATER_ROLE, fundingPoolAddress);
  await tx3.wait();
  console.log("✅ UPDATER_ROLE granted to funding pool");

  // Step 6: Verify deployment
  console.log("\n📋 Deployment Summary");
  console.log("=====================");
  console.log("Network:", network.name, `(chainId: ${network.chainId})`);
  console.log("Deployer:", deployer.address);
  console.log("");
  console.log("Contract Addresses:");
  console.log("-------------------");
  console.log("USDC:", usdcAddress);
  console.log("InvoiceNFT:", invoiceNFTAddress);
  console.log("FundingPool:", fundingPoolAddress);
  console.log("InvoiceFactory:", factoryAddress);
  console.log("");
  console.log("Roles Configured:");
  console.log("-----------------");
  console.log("✅ Factory has MINTER_ROLE on InvoiceNFT");
  console.log("✅ Factory has UPDATER_ROLE on InvoiceNFT");
  console.log("✅ FundingPool has UPDATER_ROLE on InvoiceNFT");
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: {
      name: network.name,
      chainId: Number(network.chainId),
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      usdc: usdcAddress,
      invoiceNFT: invoiceNFTAddress,
      fundingPool: fundingPoolAddress,
      factory: factoryAddress,
    },
  };

  console.log("\n💾 Deployment Info (JSON):");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Optional: Verify contracts on Basescan (if API key is set)
  if (process.env.BASESCAN_API_KEY && !isTestnet) {
    console.log("\n🔍 Verifying contracts on Basescan...");
    console.log("Run the following commands to verify:");
    console.log("");
    console.log(`npx hardhat verify --network base ${invoiceNFTAddress}`);
    console.log(`npx hardhat verify --network base ${fundingPoolAddress} ${usdcAddress} ${invoiceNFTAddress}`);
    console.log(`npx hardhat verify --network base ${factoryAddress} ${invoiceNFTAddress} ${fundingPoolAddress}`);
  }

  console.log("\n✨ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export default main;
