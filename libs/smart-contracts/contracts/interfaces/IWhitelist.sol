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
        NONE,       // 0 - Not whitelisted
        INVESTOR,   // 1 - Can fund invoices and hold invoice NFTs
        SMB         // 2 - Can receive funding as invoice issuer/SMB
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

    // ============ EVENTS ============

    /**
     * @notice Emitted when an address is added to the whitelist
     * @param account The address that was whitelisted
     * @param role The role assigned to the address
     * @param manager The admin who performed the action
     */
    event AddressWhitelisted(
        address indexed account,
        Role role,
        address indexed manager
    );

    /**
     * @notice Emitted when an address is removed from the whitelist
     * @param account The address that was removed
     * @param manager The admin who performed the action
     */
    event AddressRemoved(address indexed account, address indexed manager);

    // ============ FUNCTIONS ============

    /**
     * @notice Adds a single address to the whitelist with a specific role
     * @param account The address to whitelist
     * @param role The role to assign (INVESTOR or SMB)
     * @dev Only callable by addresses with WHITELIST_MANAGER_ROLE
     */
    function addToWhitelist(address account, Role role) external;

    /**
     * @notice Removes an address from the whitelist
     * @param account The address to remove
     * @dev Only callable by addresses with WHITELIST_MANAGER_ROLE
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
