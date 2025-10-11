import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-verify';
import '@typechain/hardhat';
import 'hardhat-deploy';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });

const config: HardhatUserConfig = {
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
    deploy: './deploy',
  },

  networks: {
    hardhat: {
      chainId: 31337,
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk',
        count: 10,
      },
    },

    // Base Sepolia Testnet
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
      accounts: process.env.DEPLOYER_PRIVATE_KEY_TESTNET
        ? [process.env.DEPLOYER_PRIVATE_KEY_TESTNET]
        : [],
      chainId: 84532,
      verify: {
        etherscan: {
          apiUrl: 'https://api-sepolia.basescan.org',
          apiKey: process.env.BASESCAN_API_KEY || '',
        },
      },
    },

    // Base Mainnet
    base: {
      url: process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org',
      accounts: process.env.DEPLOYER_PRIVATE_KEY_MAINNET
        ? [process.env.DEPLOYER_PRIVATE_KEY_MAINNET]
        : [],
      chainId: 8453,
      verify: {
        etherscan: {
          apiUrl: 'https://api.basescan.org',
          apiKey: process.env.BASESCAN_API_KEY || '',
        },
      },
    },

    // Local development (optional)
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
    },
  },

  // Contract verification
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY || '',
      base: process.env.BASESCAN_API_KEY || '',
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
    alwaysGenerateOverloads: false,
    externalArtifacts: [],
    dontOverrideCompile: false,
  },

  // Named accounts for deployment
  namedAccounts: {
    deployer: {
      default: 0, // First account
      baseSepolia: 0,
      base: 0,
    },
    admin: {
      default: 1, // Second account for admin role
    },
  },

  // Gas reporting
  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    showTimeSpent: true,
  },

  // Mocha test configuration
  mocha: {
    timeout: 60000, // 60 seconds for integration tests
  },
};

export default config;
