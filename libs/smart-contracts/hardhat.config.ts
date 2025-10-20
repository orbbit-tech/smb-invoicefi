import type { HardhatUserConfig } from 'hardhat/config';
import hardhatKeystore from '@nomicfoundation/hardhat-keystore';
import hardhatIgnition from '@nomicfoundation/hardhat-ignition';
import { configVariable } from 'hardhat/config';
import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-ethers-chai-matchers';
import '@nomicfoundation/hardhat-ignition-ethers';
import '@nomicfoundation/hardhat-network-helpers';
import '@nomicfoundation/hardhat-typechain';
import '@nomicfoundation/hardhat-verify';
import * as dotenv from 'dotenv';

// Load environment variables from local .env file (for RPC URLs and API keys only)
dotenv.config();

const config: HardhatUserConfig = {
  // Register plugins
  plugins: [hardhatKeystore, hardhatIgnition],

  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  paths: {
    sources: './contracts',
    tests: './test-integration',
    cache: './cache_hardhat',
    artifacts: './artifacts',
  },

  networks: {
    hardhat: {
      type: 'edr-simulated',
      chainId: 31337,
      chainType: 'l1',
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk',
        count: 10,
      },
    },

    // Base Sepolia Testnet
    // Setup: npx hardhat keystore set TESTNET_DEPLOYER_PRIVATE_KEY
    // Or for dev: npx hardhat keystore set TESTNET_DEPLOYER_PRIVATE_KEY --dev
    baseSepolia: {
      type: 'http',
      url: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
      accounts: [configVariable('TESTNET_DEPLOYER_PRIVATE_KEY')],
      chainId: 84532,
    },

    // Base Mainnet
    // Setup: npx hardhat keystore set MAINNET_DEPLOYER_PRIVATE_KEY
    // IMPORTANT: For production, prefer hardware wallet over software keys
    base: {
      type: 'http',
      url: process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org',
      accounts: [configVariable('MAINNET_DEPLOYER_PRIVATE_KEY')],
      chainId: 8453,
    },

    // Local development (optional)
    localhost: {
      type: 'http',
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
    },
  },

  // Contract verification
  etherscan: {
    apiKey: {
      baseSepolia: configVariable('ETHERSCAN_API_KEY'),
      base: configVariable('ETHERSCAN_API_KEY'),
    },
    customChains: [
      {
        network: 'baseSepolia',
        chainId: 84532,
        urls: {
          apiURL: 'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia.basescan.org',
        },
      },
      {
        network: 'base',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://basescan.org',
        },
      },
    ],
  },

  // TypeChain configuration - output to shared location
  typechain: {
    outDir: '../../../libs/frontend/ui/generated/contracts',
    target: 'ethers-v6',
  },

  // Hardhat Ignition configuration
  ignition: {
    requiredConfirmations: 1,
  },
};

export default config;
