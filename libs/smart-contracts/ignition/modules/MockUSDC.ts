import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

/**
 * @title MockUSDC Deployment Module
 * @notice Deploys MockUSDC for local testing
 * @dev This should ONLY be used on local hardhat network
 *      For Base Sepolia, use Circle's testnet USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
 *      For Base Mainnet, use official USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 */
const MockUSDCModule = buildModule('MockUSDC', (m) => {
  const mockUSDC = m.contract('MockUSDC', []);

  return { mockUSDC };
});

export default MockUSDCModule;
