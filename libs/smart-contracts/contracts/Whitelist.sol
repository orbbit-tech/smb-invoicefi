// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/access/AccessControl.sol';
import './interfaces/IWhitelist.sol';

/**
 * @title Whitelist
 * @notice Manages KYC/KYB compliant address whitelist for the Orbbit protocol
 * @dev Implements role-based whitelist with INVESTOR and SMB roles
 */
contract Whitelist is IWhitelist, AccessControl {
    // ============ ROLES ============

    bytes32 public constant WHITELIST_MANAGER_ROLE =
        keccak256('WHITELIST_MANAGER_ROLE');

    // ============ STATE VARIABLES ============

    /// @notice Mapping from address to whitelist role
    mapping(address => Role) private _whitelist;

    // ============ CONSTRUCTOR ============

    /**
     * @notice Initializes the Whitelist contract
     * @dev Grants DEFAULT_ADMIN_ROLE and WHITELIST_MANAGER_ROLE to deployer
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(WHITELIST_MANAGER_ROLE, msg.sender);
    }

    // ============ EXTERNAL FUNCTIONS ============

    /**
     * @notice Adds a single address to the whitelist with a specific role
     * @dev Implements {IWhitelist-addToWhitelist}
     * @param account The address to whitelist
     * @param role The role to assign (INVESTOR or SMB)
     * @dev Only callable by addresses with WHITELIST_MANAGER_ROLE
     */
    function addToWhitelist(
        address account,
        Role role
    ) external onlyRole(WHITELIST_MANAGER_ROLE) {
        if (account == address(0)) revert IWhitelist.InvalidAddress(account);
        if (role == Role.NONE) revert IWhitelist.InvalidRole(role);

        _whitelist[account] = role;

        emit AddressWhitelisted(account, role, msg.sender);
    }

    /**
     * @notice Removes an address from the whitelist
     * @dev Implements {IWhitelist-removeFromWhitelist}
     * @param account The address to remove
     * @dev Only callable by addresses with WHITELIST_MANAGER_ROLE
     * @dev Sets the role to NONE, effectively removing the address
     */
    function removeFromWhitelist(
        address account
    ) external onlyRole(WHITELIST_MANAGER_ROLE) {
        if (account == address(0)) revert IWhitelist.InvalidAddress(account);
        if (_whitelist[account] == Role.NONE) revert IWhitelist.AddressNotWhitelisted(account);

        _whitelist[account] = Role.NONE;

        emit AddressRemoved(account, msg.sender);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Checks if an address is whitelisted with a specific role
     * @dev Implements {IWhitelist-isWhitelisted}
     * @param account The address to check
     * @param role The required role
     * @return True if the address has the specified role
     */
    function isWhitelisted(
        address account,
        Role role
    ) external view returns (bool) {
        return _whitelist[account] == role;
    }

    /**
     * @notice Gets the whitelist role for an address
     * @dev Implements {IWhitelist-getRole}
     * @param account The address to check
     * @return The role assigned to the address (NONE if not whitelisted)
     */
    function getRole(address account) external view returns (Role) {
        return _whitelist[account];
    }
}
