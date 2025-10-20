// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/Whitelist.sol";

/**
 * @title WhitelistTest
 * @notice Unit tests for Whitelist contract
 */
contract WhitelistTest is Test {
    Whitelist public whitelist;

    address public owner;
    address public manager;
    address public investor1;
    address public investor2;
    address public smb1;
    address public smb2;
    address public unauthorized;

    event AddressWhitelisted(
        address indexed account,
        IWhitelist.Role role,
        address indexed manager
    );
    event AddressRemoved(address indexed account, address indexed manager);
    event BatchWhitelisted(uint256 count, address indexed manager);

    function setUp() public {
        owner = address(this);
        manager = makeAddr("manager");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");
        smb1 = makeAddr("smb1");
        smb2 = makeAddr("smb2");
        unauthorized = makeAddr("unauthorized");

        whitelist = new Whitelist();

        // Grant WHITELIST_MANAGER_ROLE to manager
        whitelist.grantRole(
            whitelist.WHITELIST_MANAGER_ROLE(),
            manager
        );
    }

    // ============ CONSTRUCTOR TESTS ============

    function test_Constructor_GrantsRolesToDeployer() public view {
        assertTrue(whitelist.hasRole(whitelist.DEFAULT_ADMIN_ROLE(), owner));
        assertTrue(
            whitelist.hasRole(whitelist.WHITELIST_MANAGER_ROLE(), owner)
        );
    }

    // ============ ADD TO WHITELIST TESTS ============

    function test_AddToWhitelist_AsManager_Investor() public {
        vm.startPrank(manager);

        vm.expectEmit(true, true, false, true);
        emit AddressWhitelisted(investor1, IWhitelist.Role.INVESTOR, manager);

        whitelist.addToWhitelist(investor1, IWhitelist.Role.INVESTOR);

        assertTrue(
            whitelist.isWhitelisted(investor1, IWhitelist.Role.INVESTOR)
        );
        assertEq(
            uint256(whitelist.getRole(investor1)),
            uint256(IWhitelist.Role.INVESTOR)
        );

        vm.stopPrank();
    }

    function test_AddToWhitelist_AsManager_SMB() public {
        vm.startPrank(manager);

        vm.expectEmit(true, true, false, true);
        emit AddressWhitelisted(smb1, IWhitelist.Role.SMB, manager);

        whitelist.addToWhitelist(smb1, IWhitelist.Role.SMB);

        assertTrue(whitelist.isWhitelisted(smb1, IWhitelist.Role.SMB));
        assertEq(
            uint256(whitelist.getRole(smb1)),
            uint256(IWhitelist.Role.SMB)
        );

        vm.stopPrank();
    }

    function test_AddToWhitelist_RevertIf_UnauthorizedCaller() public {
        vm.startPrank(unauthorized);

        vm.expectRevert();
        whitelist.addToWhitelist(investor1, IWhitelist.Role.INVESTOR);

        vm.stopPrank();
    }

    function test_AddToWhitelist_RevertIf_ZeroAddress() public {
        vm.startPrank(manager);

        vm.expectRevert(abi.encodeWithSelector(IWhitelist.InvalidAddress.selector, address(0)));
        whitelist.addToWhitelist(address(0), IWhitelist.Role.INVESTOR);

        vm.stopPrank();
    }

    function test_AddToWhitelist_RevertIf_RoleNone() public {
        vm.startPrank(manager);

        vm.expectRevert(abi.encodeWithSelector(IWhitelist.InvalidRole.selector, IWhitelist.Role.NONE));
        whitelist.addToWhitelist(investor1, IWhitelist.Role.NONE);

        vm.stopPrank();
    }

    function test_AddToWhitelist_CanUpdateExistingRole() public {
        vm.startPrank(manager);

        // First add as INVESTOR
        whitelist.addToWhitelist(investor1, IWhitelist.Role.INVESTOR);
        assertTrue(
            whitelist.isWhitelisted(investor1, IWhitelist.Role.INVESTOR)
        );

        // Then update to SMB
        whitelist.addToWhitelist(investor1, IWhitelist.Role.SMB);
        assertTrue(whitelist.isWhitelisted(investor1, IWhitelist.Role.SMB));
        assertFalse(
            whitelist.isWhitelisted(investor1, IWhitelist.Role.INVESTOR)
        );

        vm.stopPrank();
    }

    // ============ BATCH ADD TO WHITELIST TESTS ============
    // TODO: Implement addBatchToWhitelist in Whitelist contract first

    /* function test_AddBatchToWhitelist_Success() public {
        vm.startPrank(manager);

        address[] memory accounts = new address[](3);
        accounts[0] = investor1;
        accounts[1] = investor2;
        accounts[2] = smb1;

        IWhitelist.Role[] memory roles = new IWhitelist.Role[](3);
        roles[0] = IWhitelist.Role.INVESTOR;
        roles[1] = IWhitelist.Role.INVESTOR;
        roles[2] = IWhitelist.Role.SMB;

        vm.expectEmit(false, true, false, true);
        emit BatchWhitelisted(3, manager);

        whitelist.addBatchToWhitelist(accounts, roles);

        assertTrue(
            whitelist.isWhitelisted(investor1, IWhitelist.Role.INVESTOR)
        );
        assertTrue(
            whitelist.isWhitelisted(investor2, IWhitelist.Role.INVESTOR)
        );
        assertTrue(whitelist.isWhitelisted(smb1, IWhitelist.Role.SMB));

        vm.stopPrank();
    }

    function test_AddBatchToWhitelist_RevertIf_ArrayLengthMismatch() public {
        vm.startPrank(manager);

        address[] memory accounts = new address[](2);
        accounts[0] = investor1;
        accounts[1] = investor2;

        IWhitelist.Role[] memory roles = new IWhitelist.Role[](3);
        roles[0] = IWhitelist.Role.INVESTOR;
        roles[1] = IWhitelist.Role.INVESTOR;
        roles[2] = IWhitelist.Role.SMB;

        vm.expectRevert("Array length mismatch");
        whitelist.addBatchToWhitelist(accounts, roles);

        vm.stopPrank();
    }

    function test_AddBatchToWhitelist_RevertIf_EmptyArrays() public {
        vm.startPrank(manager);

        address[] memory accounts = new address[](0);
        IWhitelist.Role[] memory roles = new IWhitelist.Role[](0);

        vm.expectRevert("Empty arrays");
        whitelist.addBatchToWhitelist(accounts, roles);

        vm.stopPrank();
    }

    function test_AddBatchToWhitelist_RevertIf_InvalidAddressInBatch() public {
        vm.startPrank(manager);

        address[] memory accounts = new address[](2);
        accounts[0] = investor1;
        accounts[1] = address(0); // Invalid

        IWhitelist.Role[] memory roles = new IWhitelist.Role[](2);
        roles[0] = IWhitelist.Role.INVESTOR;
        roles[1] = IWhitelist.Role.INVESTOR;

        vm.expectRevert("Invalid address in batch");
        whitelist.addBatchToWhitelist(accounts, roles);

        vm.stopPrank();
    }

    function test_AddBatchToWhitelist_RevertIf_InvalidRoleInBatch() public {
        vm.startPrank(manager);

        address[] memory accounts = new address[](2);
        accounts[0] = investor1;
        accounts[1] = investor2;

        IWhitelist.Role[] memory roles = new IWhitelist.Role[](2);
        roles[0] = IWhitelist.Role.INVESTOR;
        roles[1] = IWhitelist.Role.NONE; // Invalid

        vm.expectRevert("Invalid role in batch");
        whitelist.addBatchToWhitelist(accounts, roles);

        vm.stopPrank();
    }

    function test_AddBatchToWhitelist_RevertIf_Unauthorized() public {
        vm.startPrank(unauthorized);

        address[] memory accounts = new address[](1);
        accounts[0] = investor1;

        IWhitelist.Role[] memory roles = new IWhitelist.Role[](1);
        roles[0] = IWhitelist.Role.INVESTOR;

        vm.expectRevert();
        whitelist.addBatchToWhitelist(accounts, roles);

        vm.stopPrank();
    } */

    // ============ REMOVE FROM WHITELIST TESTS ============

    function test_RemoveFromWhitelist_Success() public {
        vm.startPrank(manager);

        // First add
        whitelist.addToWhitelist(investor1, IWhitelist.Role.INVESTOR);
        assertTrue(
            whitelist.isWhitelisted(investor1, IWhitelist.Role.INVESTOR)
        );

        // Then remove
        vm.expectEmit(true, true, false, true);
        emit AddressRemoved(investor1, manager);

        whitelist.removeFromWhitelist(investor1);

        assertFalse(
            whitelist.isWhitelisted(investor1, IWhitelist.Role.INVESTOR)
        );
        assertEq(
            uint256(whitelist.getRole(investor1)),
            uint256(IWhitelist.Role.NONE)
        );

        vm.stopPrank();
    }

    function test_RemoveFromWhitelist_RevertIf_ZeroAddress() public {
        vm.startPrank(manager);

        vm.expectRevert(abi.encodeWithSelector(IWhitelist.InvalidAddress.selector, address(0)));
        whitelist.removeFromWhitelist(address(0));

        vm.stopPrank();
    }

    function test_RemoveFromWhitelist_RevertIf_AddressNotWhitelisted() public {
        vm.startPrank(manager);

        vm.expectRevert(abi.encodeWithSelector(IWhitelist.AddressNotWhitelisted.selector, investor1));
        whitelist.removeFromWhitelist(investor1);

        vm.stopPrank();
    }

    function test_RemoveFromWhitelist_RevertIf_Unauthorized() public {
        vm.startPrank(manager);
        whitelist.addToWhitelist(investor1, IWhitelist.Role.INVESTOR);
        vm.stopPrank();

        vm.startPrank(unauthorized);

        vm.expectRevert();
        whitelist.removeFromWhitelist(investor1);

        vm.stopPrank();
    }

    // ============ VIEW FUNCTION TESTS ============

    function test_IsWhitelisted_ReturnsFalseForNonWhitelistedAddress()
        public
        view
    {
        assertFalse(
            whitelist.isWhitelisted(investor1, IWhitelist.Role.INVESTOR)
        );
        assertFalse(whitelist.isWhitelisted(investor1, IWhitelist.Role.SMB));
    }

    function test_IsWhitelisted_ReturnsTrueForCorrectRole() public {
        vm.startPrank(manager);
        whitelist.addToWhitelist(investor1, IWhitelist.Role.INVESTOR);
        vm.stopPrank();

        assertTrue(
            whitelist.isWhitelisted(investor1, IWhitelist.Role.INVESTOR)
        );
        assertFalse(whitelist.isWhitelisted(investor1, IWhitelist.Role.SMB));
    }

    function test_GetRole_ReturnsNoneForNonWhitelistedAddress() public view {
        assertEq(
            uint256(whitelist.getRole(investor1)),
            uint256(IWhitelist.Role.NONE)
        );
    }

    function test_GetRole_ReturnsCorrectRoleForWhitelistedAddress() public {
        vm.startPrank(manager);
        whitelist.addToWhitelist(investor1, IWhitelist.Role.INVESTOR);
        whitelist.addToWhitelist(smb1, IWhitelist.Role.SMB);
        vm.stopPrank();

        assertEq(
            uint256(whitelist.getRole(investor1)),
            uint256(IWhitelist.Role.INVESTOR)
        );
        assertEq(
            uint256(whitelist.getRole(smb1)),
            uint256(IWhitelist.Role.SMB)
        );
    }

    // ============ ACCESS CONTROL TESTS ============

    function test_OnlyWhitelistManager_CanAddToWhitelist() public {
        vm.startPrank(owner);
        whitelist.addToWhitelist(investor1, IWhitelist.Role.INVESTOR);
        vm.stopPrank();

        vm.startPrank(manager);
        whitelist.addToWhitelist(investor2, IWhitelist.Role.INVESTOR);
        vm.stopPrank();

        assertTrue(
            whitelist.isWhitelisted(investor1, IWhitelist.Role.INVESTOR)
        );
        assertTrue(
            whitelist.isWhitelisted(investor2, IWhitelist.Role.INVESTOR)
        );
    }

    function test_RoleManagement_CanGrantAndRevokeWhitelistManagerRole()
        public
    {
        address newManager = makeAddr("newManager");

        // Grant role
        whitelist.grantRole(whitelist.WHITELIST_MANAGER_ROLE(), newManager);
        assertTrue(
            whitelist.hasRole(whitelist.WHITELIST_MANAGER_ROLE(), newManager)
        );

        // New manager can now add to whitelist
        vm.startPrank(newManager);
        whitelist.addToWhitelist(investor1, IWhitelist.Role.INVESTOR);
        vm.stopPrank();

        assertTrue(
            whitelist.isWhitelisted(investor1, IWhitelist.Role.INVESTOR)
        );

        // Revoke role
        whitelist.revokeRole(whitelist.WHITELIST_MANAGER_ROLE(), newManager);
        assertFalse(
            whitelist.hasRole(whitelist.WHITELIST_MANAGER_ROLE(), newManager)
        );

        // Former manager can no longer add to whitelist
        vm.startPrank(newManager);
        vm.expectRevert();
        whitelist.addToWhitelist(investor2, IWhitelist.Role.INVESTOR);
        vm.stopPrank();
    }
}
