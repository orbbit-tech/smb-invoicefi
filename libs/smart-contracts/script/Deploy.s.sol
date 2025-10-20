// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/Invoice.sol";
import "../contracts/InvoiceFundingPool.sol";
import "../contracts/Whitelist.sol";
import "../test/mocks/MockUSDC.sol";

/**
 * @title Deploy
 * @notice Foundry deployment script for Orbbit smart contracts
 * @dev Usage:
 *      Base Sepolia (testnet): forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC --broadcast --verify
 *      Base Mainnet: forge script script/Deploy.s.sol --rpc-url $BASE_MAINNET_RPC --broadcast --verify
 * @dev Configuration can be customized via environment variables (see .env.example)
 *
 * @dev Deployment Strategy:
 *      Testnet (Base Sepolia): Deployer retains admin control for fast iteration
 *      Mainnet (Base): Transfers admin control to multi-sig wallet (set MULTISIG_ADDRESS)
 */
contract Deploy is Script {
    // Base Mainnet USDC address (Circle's official USDC)
    address constant BASE_MAINNET_USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    // Base Sepolia USDC address (Circle's official testnet USDC)
    address constant BASE_SEPOLIA_USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    // Chain IDs
    uint256 constant BASE_MAINNET_CHAIN_ID = 8453;
    uint256 constant BASE_SEPOLIA_CHAIN_ID = 84532;

    // Default configuration values (can be overridden via environment variables)
    string constant DEFAULT_TOKEN_NAME = "Orbbit Invoice";
    string constant DEFAULT_TOKEN_SYMBOL = "ORBINV";
    string constant DEFAULT_METADATA_BASE_URI = "https://api.orbbit.com/metadata/";
    string constant DEFAULT_METADATA_EXTENSION = ".json";
    uint256 constant DEFAULT_GRACE_PERIOD_DAYS = 30;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("==============================================");
        console.log("Deploying Orbbit Smart Contracts");
        console.log("==============================================");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("");

        // Check if mainnet and require multi-sig
        bool isMainnet = block.chainid == BASE_MAINNET_CHAIN_ID;
        address multisigAddress = address(0);

        if (isMainnet) {
            console.log(unicode"🔒 MAINNET DEPLOYMENT - Multi-sig required");
            console.log("");

            // Get multi-sig address from env
            try vm.envAddress("MULTISIG_ADDRESS") returns (address _multisig) {
                multisigAddress = _multisig;
            } catch {
                revert("MAINNET ERROR: MULTISIG_ADDRESS environment variable required!");
            }

            // Verify multi-sig address has code
            require(multisigAddress.code.length > 0, "MAINNET ERROR: Multi-sig address has no code!");
            require(multisigAddress != deployer, "MAINNET ERROR: Multi-sig cannot be same as deployer!");

            console.log("Multi-sig address:", multisigAddress);
            console.log("");
        } else {
            console.log(unicode"🧪 TESTNET DEPLOYMENT - Personal wallet (fast iteration)");
            console.log("");
        }

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy or get payment token (USDC)
        address paymentTokenAddress;
        if (block.chainid == BASE_MAINNET_CHAIN_ID) {
            console.log("Using Base Mainnet USDC (Circle official):", BASE_MAINNET_USDC);
            paymentTokenAddress = BASE_MAINNET_USDC;
        } else if (block.chainid == BASE_SEPOLIA_CHAIN_ID) {
            console.log("Using Base Sepolia USDC (Circle official):", BASE_SEPOLIA_USDC);
            console.log("Get test USDC from Circle faucet: https://faucet.circle.com");
            paymentTokenAddress = BASE_SEPOLIA_USDC;
        } else {
            console.log("Deploying Mock USDC for local/unsupported testnet...");
            MockUSDC usdc = new MockUSDC();
            paymentTokenAddress = address(usdc);
            console.log("Mock USDC deployed at:", paymentTokenAddress);
        }

        console.log("");

        // 2. Get configuration from environment or use defaults
        string memory tokenName = vm.envOr("INVOICE_TOKEN_NAME", DEFAULT_TOKEN_NAME);
        string memory tokenSymbol = vm.envOr("INVOICE_TOKEN_SYMBOL", DEFAULT_TOKEN_SYMBOL);
        string memory metadataBaseUri = vm.envOr("INVOICE_METADATA_BASE_URI", DEFAULT_METADATA_BASE_URI);
        string memory metadataExtension = vm.envOr("INVOICE_METADATA_EXTENSION", DEFAULT_METADATA_EXTENSION);
        uint256 gracePeriodDays = vm.envOr("GRACE_PERIOD_DAYS", DEFAULT_GRACE_PERIOD_DAYS);

        console.log("Configuration:");
        console.log("- Token Name:", tokenName);
        console.log("- Token Symbol:", tokenSymbol);
        console.log("- Metadata Base URI:", metadataBaseUri);
        console.log("- Metadata Extension:", metadataExtension);
        console.log("- Grace Period Days:", gracePeriodDays);
        console.log("");

        // 3. Deploy Whitelist (KYC/KYB compliance)
        console.log("Deploying Whitelist contract...");
        Whitelist whitelist = new Whitelist();
        console.log("Whitelist deployed at:", address(whitelist));
        console.log("");

        // 4. Deploy Invoice
        console.log("Deploying Invoice contract...");
        Invoice invoice = new Invoice(
            tokenName,
            tokenSymbol,
            metadataBaseUri,
            metadataExtension,
            address(whitelist)
        );
        console.log("Invoice deployed at:", address(invoice));
        console.log("");

        // 5. Deploy InvoiceFundingPool
        console.log("Deploying InvoiceFundingPool contract...");
        InvoiceFundingPool pool = new InvoiceFundingPool(
            paymentTokenAddress,
            address(invoice),
            gracePeriodDays,
            address(whitelist)
        );
        console.log("InvoiceFundingPool deployed at:", address(pool));
        console.log("");

        // 6. Configure inter-contract roles
        console.log("Configuring inter-contract roles...");

        // Grant MINTER_ROLE to InvoiceFundingPool (for lazy minting)
        bytes32 minterRole = invoice.MINTER_ROLE();
        invoice.grantRole(minterRole, address(pool));
        console.log("- Granted MINTER_ROLE to InvoiceFundingPool");

        // Grant UPDATER_ROLE to InvoiceFundingPool
        bytes32 updaterRole = invoice.UPDATER_ROLE();
        invoice.grantRole(updaterRole, address(pool));
        console.log("- Granted UPDATER_ROLE to InvoiceFundingPool");

        console.log("");

        // 7. Transfer to multi-sig (mainnet only)
        if (isMainnet && multisigAddress != address(0)) {
            console.log(unicode"🏛️  MAINNET: Transferring admin control to multi-sig...");
            console.log("");

            bytes32 adminRole = invoice.DEFAULT_ADMIN_ROLE();
            bytes32 pauserRole = invoice.PAUSER_ROLE();
            bytes32 operatorRole = pool.OPERATOR_ROLE();
            bytes32 whitelistManagerRole = whitelist.WHITELIST_MANAGER_ROLE();

            console.log("Granting admin roles to multi-sig:", multisigAddress);

            // Invoice Contract
            invoice.grantRole(adminRole, multisigAddress);
            invoice.grantRole(pauserRole, multisigAddress);
            console.log("- Invoice: Admin roles granted");

            // InvoiceFundingPool Contract
            pool.grantRole(adminRole, multisigAddress);
            pool.grantRole(operatorRole, multisigAddress);
            pool.grantRole(pauserRole, multisigAddress);
            console.log("- InvoiceFundingPool: Admin roles granted");

            // Whitelist Contract
            whitelist.grantRole(adminRole, multisigAddress);
            whitelist.grantRole(whitelistManagerRole, multisigAddress);
            console.log("- Whitelist: Admin roles granted");

            console.log("");

            // Verify multi-sig has roles
            require(invoice.hasRole(adminRole, multisigAddress), "Multi-sig verification failed: Invoice");
            require(pool.hasRole(adminRole, multisigAddress), "Multi-sig verification failed: Pool");
            require(whitelist.hasRole(adminRole, multisigAddress), "Multi-sig verification failed: Whitelist");

            console.log(unicode"✅ Multi-sig verified - has all admin roles");
            console.log("");

            console.log("Note: Deployer retains admin roles for easier post-deployment setup.");
            console.log("      Run revoke script when ready to fully transfer control.");
            console.log("");
        } else {
            console.log(unicode"🧪 TESTNET: Deployer retains admin control");
            console.log("");
            console.log("Admin roles:");
            console.log("- Deployer has DEFAULT_ADMIN_ROLE on all contracts");
            console.log("- Deployer has OPERATOR_ROLE on InvoiceFundingPool");
            console.log("- Deployer has PAUSER_ROLE on Invoice and InvoiceFundingPool");
            console.log("- Deployer has WHITELIST_MANAGER_ROLE on Whitelist");
            console.log("");
        }

        vm.stopBroadcast();

        // Print deployment summary
        console.log("==============================================");
        console.log("Deployment Summary");
        console.log("==============================================");
        console.log("Network:", block.chainid == BASE_MAINNET_CHAIN_ID ? "Base Mainnet" : "Base Sepolia");
        console.log("Deployer:", deployer);
        if (multisigAddress != address(0)) {
            console.log("Multi-sig:", multisigAddress);
        }
        console.log("");
        console.log("Contract Addresses:");
        console.log("-------------------");
        console.log("Payment Token (USDC):", paymentTokenAddress);
        console.log("Whitelist:", address(whitelist));
        console.log("Invoice:", address(invoice));
        console.log("InvoiceFundingPool:", address(pool));
        console.log("");

        if (isMainnet) {
            console.log("Admin Control: Multi-sig (with deployer backup)");
        } else {
            console.log("Admin Control: Deployer (personal wallet)");
        }

        console.log("");
        console.log("==============================================");
        console.log("Next Steps:");
        console.log("==============================================");
        console.log("1. Save these addresses to your environment variables");
        console.log("2. Update frontend configuration with contract addresses");
        console.log("3. Verify contracts on Basescan (if not auto-verified)");
        console.log("4. Add initial addresses to whitelist:");
        console.log("   - Investors: cast send", address(whitelist), "\"addToWhitelist(address,uint8)\" <INVESTOR_ADDRESS> 1");
        console.log("   - SMBs: cast send", address(whitelist), "\"addToWhitelist(address,uint8)\" <SMB_ADDRESS> 2");
        if (block.chainid == BASE_SEPOLIA_CHAIN_ID) {
            console.log("5. Get test USDC from Circle faucet:");
            console.log("   https://faucet.circle.com");
            console.log("   (10 USDC per hour per address)");
        } else if (block.chainid != BASE_MAINNET_CHAIN_ID) {
            console.log("5. Mint test payment tokens (MockUSDC):");
            console.log("   cast send", paymentTokenAddress, "\"mint(address,uint256)\" <ADDRESS> <AMOUNT>");
        }
        console.log("==============================================");
    }
}
