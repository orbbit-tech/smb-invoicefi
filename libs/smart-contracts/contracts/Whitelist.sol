// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/access/AccessControl.sol';
import './interfaces/IWhitelist.sol';

/**
 * @title Whitelist
 * @notice Manages KYC/KYB compliant address whitelist for the protocol
 * @dev Implements role-based whitelist with INVESTOR and SMB roles
 */
contract Whitelist is IWhitelist, AccessControl {
    // ============ ROLES ============

    bytes32 public constant WHITELIST_OPERATOR_ROLE =
        keccak256('WHITELIST_OPERATOR_ROLE');

    // ============ STATE VARIABLES ============

    /// @notice Mapping from address to whitelist role
    mapping(address => Role) private _whitelist;

    /// @notice Maximum number of addresses that can be whitelisted in a single batch
    uint256 public MAX_BATCH_SIZE;

    // ============ CONSTRUCTOR ============

    /**
     * @notice Initializes the Whitelist contract
     * @param maxBatchSize Initial maximum batch size for whitelist operations
     * @dev Grants DEFAULT_ADMIN_ROLE and WHITELIST_OPERATOR_ROLE to deployer
     */
    constructor(uint256 maxBatchSize) {
        if (maxBatchSize == 0) revert IWhitelist.InvalidBatchSize(0);
        MAX_BATCH_SIZE = maxBatchSize;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(WHITELIST_OPERATOR_ROLE, msg.sender);
    }

    // ============ EXTERNAL FUNCTIONS ============

    /**
     * @notice Adds a single address to the whitelist with a specific role
     * @dev Implements {IWhitelist-addToWhitelist}
     * @param account The address to whitelist
     * @param role The role to assign (INVESTOR or SMB)
     * @dev Only callable by addresses with WHITELIST_OPERATOR_ROLE
     */
    function addToWhitelist(
        address account,
        Role role
    ) external onlyRole(WHITELIST_OPERATOR_ROLE) {
        if (account == address(0)) revert IWhitelist.InvalidAddress(account);
        if (role == Role.NONE) revert IWhitelist.InvalidRole(role);

        _whitelist[account] = role;

        emit AddressWhitelisted(account, role, msg.sender);
    }

    /**
     * @notice Batch adds multiple addresses to whitelist
     * @dev Implements {IWhitelist-batchAddToWhitelist}
     * @param entries Array of WhitelistEntry structs containing address-role pairs
     * @dev Gas-efficient for onboarding multiple users at once
     * @dev Each address-role pair is validated individually
     * @dev Reverts entire transaction if any validation fails
     * @dev Maximum batch size enforced to prevent gas issues
     * @dev Type-safe approach prevents array length mismatches
     * @dev Only callable by addresses with WHITELIST_OPERATOR_ROLE
     */
    function batchAddToWhitelist(
        IWhitelist.WhitelistEntry[] calldata entries
    ) external onlyRole(WHITELIST_OPERATOR_ROLE) {
        // Validate array not empty
        if (entries.length == 0) {
            revert IWhitelist.EmptyArray();
        }

        // Validate batch size limit
        if (entries.length > MAX_BATCH_SIZE) {
            revert IWhitelist.BatchSizeExceeded(
                entries.length,
                MAX_BATCH_SIZE
            );
        }

        // Process each entry
        for (uint256 i = 0; i < entries.length; i++) {
            // Validate address
            if (entries[i].account == address(0)) {
                revert IWhitelist.InvalidAddress(entries[i].account);
            }

            // Validate role
            if (entries[i].role == Role.NONE) {
                revert IWhitelist.InvalidRole(entries[i].role);
            }

            // Update whitelist
            _whitelist[entries[i].account] = entries[i].role;

            // Emit individual event for each address
            emit AddressWhitelisted(entries[i].account, entries[i].role, msg.sender);
        }

        // Emit batch completion event
        emit IWhitelist.BatchWhitelistCompleted(entries.length, msg.sender);
    }

    /**
     * @notice Removes an address from the whitelist
     * @dev Implements {IWhitelist-removeFromWhitelist}
     * @param account The address to remove
     * @dev Only callable by addresses with WHITELIST_OPERATOR_ROLE
     * @dev Sets the role to NONE, effectively removing the address
     */
    function removeFromWhitelist(
        address account
    ) external onlyRole(WHITELIST_OPERATOR_ROLE) {
        if (account == address(0)) revert IWhitelist.InvalidAddress(account);
        if (_whitelist[account] == Role.NONE)
            revert IWhitelist.AddressNotWhitelisted(account);

        _whitelist[account] = Role.NONE;

        emit AddressRemoved(account, msg.sender);
    }

    /**
     * @notice Updates the maximum batch size for whitelist operations
     * @param newBatchSize The new maximum batch size
     * @dev Only callable by addresses with DEFAULT_ADMIN_ROLE
     * @dev Must be greater than 0 to prevent operational issues
     */
    function setBatchSize(
        uint256 newBatchSize
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newBatchSize == 0) revert IWhitelist.InvalidBatchSize(newBatchSize);

        uint256 oldSize = MAX_BATCH_SIZE;
        MAX_BATCH_SIZE = newBatchSize;

        emit IWhitelist.BatchSizeUpdated(oldSize, newBatchSize, msg.sender);
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
