// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/InvoiceNFT.sol";
import "../contracts/FundingPool.sol";
import "../contracts/InvoiceFactory.sol";
import "../contracts/mocks/MockUSDC.sol";

/**
 * @title Deploy
 * @notice Foundry deployment script for Orbbit invoice financing contracts
 * @dev Run with: forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --verify
 *
 * For testnet deployment (with MockUSDC):
 *   forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC --broadcast --verify
 *
 * For mainnet deployment (using real USDC):
 *   forge script script/Deploy.s.sol --rpc-url $BASE_MAINNET_RPC --broadcast --verify
 */
contract Deploy is Script {
    // Base Mainnet USDC address
    address constant BASE_USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    // Base Sepolia chain ID
    uint256 constant BASE_SEPOLIA_CHAIN_ID = 84532;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // Determine USDC address based on network
        address usdcAddress;
        bool isTestnet = block.chainid == BASE_SEPOLIA_CHAIN_ID;

        if (isTestnet) {
            console.log("\n=== Deploying MockUSDC for testnet ===");
            MockUSDC usdc = new MockUSDC();
            usdcAddress = address(usdc);
            console.log("MockUSDC deployed to:", usdcAddress);
        } else {
            usdcAddress = BASE_USDC;
            console.log("\n=== Using mainnet USDC at:", usdcAddress, "===");
        }

        // Deploy InvoiceNFT
        console.log("\n=== Deploying InvoiceNFT ===");
        InvoiceNFT invoiceNFT = new InvoiceNFT();
        console.log("InvoiceNFT deployed to:", address(invoiceNFT));

        // Deploy FundingPool
        console.log("\n=== Deploying FundingPool ===");
        FundingPool fundingPool = new FundingPool(usdcAddress, address(invoiceNFT));
        console.log("FundingPool deployed to:", address(fundingPool));

        // Deploy InvoiceFactory
        console.log("\n=== Deploying InvoiceFactory ===");
        InvoiceFactory factory = new InvoiceFactory(address(invoiceNFT), address(fundingPool));
        console.log("InvoiceFactory deployed to:", address(factory));

        // Configure roles
        console.log("\n=== Configuring Roles ===");

        bytes32 MINTER_ROLE = invoiceNFT.MINTER_ROLE();
        bytes32 UPDATER_ROLE = invoiceNFT.UPDATER_ROLE();

        console.log("Granting MINTER_ROLE to factory...");
        invoiceNFT.grantRole(MINTER_ROLE, address(factory));

        console.log("Granting UPDATER_ROLE to factory...");
        invoiceNFT.grantRole(UPDATER_ROLE, address(factory));

        console.log("Granting UPDATER_ROLE to funding pool...");
        invoiceNFT.grantRole(UPDATER_ROLE, address(fundingPool));

        vm.stopBroadcast();

        // Print deployment summary
        console.log("\n==================================================");
        console.log("           DEPLOYMENT SUMMARY");
        console.log("==================================================");
        console.log("Network Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("");
        console.log("Contract Addresses:");
        console.log("--------------------------------------------------");
        console.log("USDC:           ", usdcAddress);
        console.log("InvoiceNFT:     ", address(invoiceNFT));
        console.log("FundingPool:    ", address(fundingPool));
        console.log("InvoiceFactory: ", address(factory));
        console.log("");
        console.log("Roles Configured:");
        console.log("--------------------------------------------------");
        console.log("Factory has MINTER_ROLE on InvoiceNFT");
        console.log("Factory has UPDATER_ROLE on InvoiceNFT");
        console.log("FundingPool has UPDATER_ROLE on InvoiceNFT");
        console.log("==================================================");
        console.log("");

        // Write deployment addresses to file for frontend consumption
        string memory json = string.concat(
            '{\n',
            '  "network": "', vm.toString(block.chainid), '",\n',
            '  "deployer": "', vm.toString(deployer), '",\n',
            '  "contracts": {\n',
            '    "usdc": "', vm.toString(usdcAddress), '",\n',
            '    "invoiceNFT": "', vm.toString(address(invoiceNFT)), '",\n',
            '    "fundingPool": "', vm.toString(address(fundingPool)), '",\n',
            '    "factory": "', vm.toString(address(factory)), '"\n',
            '  }\n',
            '}'
        );

        string memory filename = string.concat("deployments-", vm.toString(block.chainid), ".json");
        vm.writeFile(filename, json);
        console.log("Deployment info written to:", filename);
    }
}
