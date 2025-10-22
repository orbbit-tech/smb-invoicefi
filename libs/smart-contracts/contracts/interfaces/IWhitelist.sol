// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IWhitelist
 * @notice Interface for the Whitelist contract enforcing KYC/KYB compliance
 * @dev Defines the public API, shared types, and events for address whitelisting
 */
interface IWhitelist {
    // ============ ENUMS ============

    /**
     * @notice Whitelist roles for different participant types
     * @dev Each address can have one role at a time
     */
    enum Role {
        NONE, // 0 - Not whitelisted
        INVESTOR, // 1 - Can fund invoices and hold invoice NFTs
        SMB // 2 - Can receive funding as SMB
    }

    // ============ STRUCTS ============

    /**
     * @notice Whitelist entry pairing an address with its assigned role
     * @dev Used in batch operations to ensure type safety and prevent array length mismatches
     */
    struct WhitelistEntry {
        address account;
        Role role;
    }

    // ============ ERRORS ============

    /**
     * @notice Thrown when an invalid address is provided
     * @param account The invalid address provided
     */
    error InvalidAddress(address account);

    /**
     * @notice Thrown when an invalid role is provided
     * @param role The invalid role provided
     */
    error InvalidRole(Role role);

    /**
     * @notice Thrown when trying to remove an address that is not whitelisted
     * @param account The address that is not whitelisted
     */
    error AddressNotWhitelisted(address account);

    /**
     * @notice Thrown when array lengths mismatch in batch operations
     * @param accountsLength Length of accounts array
     * @param rolesLength Length of roles array
     */
    error ArrayLengthMismatch(uint256 accountsLength, uint256 rolesLength);

    /**
     * @notice Thrown when an empty array is provided to batch operations
     */
    error EmptyArray();

    /**
     * @notice Thrown when batch size exceeds maximum limit
     * @param providedSize Provided batch size
     * @param maxSize Maximum allowed batch size
     */
    error BatchSizeExceeded(uint256 providedSize, uint256 maxSize);

    /**
     * @notice Thrown when an invalid batch size is provided
     * @param providedSize The invalid batch size provided (must be greater than 0)
     */
    error InvalidBatchSize(uint256 providedSize);

    // ============ EVENTS ============

    /**
     * @notice Emitted when an address is added to the whitelist
     * @param account The address that was whitelisted
     * @param role The role assigned to the address
     * @param operator The address with WHITELIST_OPERATOR_ROLE who performed the action
     */
    event AddressWhitelisted(
        address indexed account,
        Role role,
        address indexed operator
    );

    /**
     * @notice Emitted when an address is removed from the whitelist
     * @param account The address that was removed
     * @param operator The address with WHITELIST_OPERATOR_ROLE who performed the action
     */
    event AddressRemoved(address indexed account, address indexed operator);

    /**
     * @notice Emitted when batch whitelist operation completes
     * @param count Number of addresses processed
     * @param operator The address with WHITELIST_OPERATOR_ROLE who performed the action
     */
    event BatchWhitelistCompleted(uint256 count, address indexed operator);

    /**
     * @notice Emitted when the maximum batch size is updated
     * @param oldSize Previous maximum batch size
     * @param newSize New maximum batch size
     * @param operator The address with DEFAULT_ADMIN_ROLE who performed the action
     */
    event BatchSizeUpdated(
        uint256 oldSize,
        uint256 newSize,
        address indexed operator
    );

    // ============ FUNCTIONS ============

    /**
     * @notice Adds a single address to the whitelist with a specific role
     * @param account The address to whitelist
     * @param role The role to assign (INVESTOR or SMB)
     * @dev Only callable by addresses with WHITELIST_OPERATOR_ROLE
     */
    function addToWhitelist(address account, Role role) external;

    /**
     * @notice Batch adds multiple addresses to whitelist
     * @param entries Array of WhitelistEntry structs containing address-role pairs
     * @dev Gas-efficient for onboarding multiple users at once
     * @dev Each address-role pair is validated individually
     * @dev Reverts entire transaction if any validation fails
     * @dev Maximum batch size enforced to prevent gas issues
     * @dev Type-safe approach prevents array length mismatches
     * @dev Only callable by addresses with WHITELIST_OPERATOR_ROLE
     */
    function batchAddToWhitelist(WhitelistEntry[] calldata entries) external;

    /**
     * @notice Removes an address from the whitelist
     * @param account The address to remove
     * @dev Only callable by addresses with WHITELIST_OPERATOR_ROLE
     */
    function removeFromWhitelist(address account) external;

    /**
     * @notice Checks if an address is whitelisted with a specific role
     * @param account The address to check
     * @param role The required role
     * @return True if the address has the specified role
     */
    function isWhitelisted(
        address account,
        Role role
    ) external view returns (bool);

    /**
     * @notice Gets the whitelist role for an address
     * @param account The address to check
     * @return The role assigned to the address (NONE if not whitelisted)
     */
    function getRole(address account) external view returns (Role);
}
