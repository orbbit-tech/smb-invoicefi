// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for testing on Base Sepolia testnet
 * @dev This contract should ONLY be deployed on testnets, never on mainnet
 *
 * For mainnet deployments, use the official Base USDC:
 * Base Mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 */
contract MockUSDC is ERC20 {
    /**
     * @notice Initializes the Mock USDC token with 6 decimals (same as real USDC)
     */
    constructor() ERC20("Mock USDC", "USDC") {}

    /**
     * @notice Returns 6 decimals to match real USDC
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @notice Mint tokens to any address (for testing purposes)
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint (in 6 decimal format)
     * @dev Anyone can call this function on testnet for easy testing
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
