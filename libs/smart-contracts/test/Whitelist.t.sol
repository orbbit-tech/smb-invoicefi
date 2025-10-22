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
    address public operator;
    address public investor1;
    address public investor2;
    address public smb1;
    address public smb2;
    address public unauthorized;

    event AddressWhitelisted(
        address indexed account,
        IWhitelist.Role role,
        address indexed operator
    );
    event AddressRemoved(address indexed account, address indexed operator);
    event BatchWhitelistCompleted(uint256 count, address indexed operator);
    event BatchSizeUpdated(uint256 oldSize, uint256 newSize, address indexed operator);

    function setUp() public {
        owner = address(this);
        operator = makeAddr("operator");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");
        smb1 = makeAddr("smb1");
        smb2 = makeAddr("smb2");
        unauthorized = makeAddr("unauthorized");

        whitelist = new Whitelist(50); // Default batch size

        // Grant WHITELIST_OPERATOR_ROLE to operator
        whitelist.grantRole(
            whitelist.WHITELIST_OPERATOR_ROLE(),
            operator
        );
    }

    // ============ CONSTRUCTOR TESTS ============

    function test_Constructor_GrantsRolesToDeployer() public view {
        assertTrue(whitelist.hasRole(whitelist.DEFAULT_ADMIN_ROLE(), owner));
        assertTrue(
            whitelist.hasRole(whitelist.WHITELIST_OPERATOR_ROLE(), owner)
        );
    }

    // ============ ADD TO WHITELIST TESTS ============

    function test_AddToWhitelist_AsOperator_Investor() public {
        vm.startPrank(operator);

        vm.expectEmit(true, true, false, true);
        emit AddressWhitelisted(investor1, IWhitelist.Role.INVESTOR, operator);

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

    function test_AddToWhitelist_AsOperator_SMB() public {
        vm.startPrank(operator);

        vm.expectEmit(true, true, false, true);
        emit AddressWhitelisted(smb1, IWhitelist.Role.SMB, operator);

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
        vm.startPrank(operator);

        vm.expectRevert(abi.encodeWithSelector(IWhitelist.InvalidAddress.selector, address(0)));
        whitelist.addToWhitelist(address(0), IWhitelist.Role.INVESTOR);

        vm.stopPrank();
    }

    function test_AddToWhitelist_RevertIf_RoleNone() public {
        vm.startPrank(operator);

        vm.expectRevert(abi.encodeWithSelector(IWhitelist.InvalidRole.selector, IWhitelist.Role.NONE));
        whitelist.addToWhitelist(investor1, IWhitelist.Role.NONE);

        vm.stopPrank();
    }

    function test_AddToWhitelist_CanUpdateExistingRole() public {
        vm.startPrank(operator);

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

    function test_BatchAddToWhitelist_Success() public {
        vm.startPrank(operator);

        IWhitelist.WhitelistEntry[] memory entries = new IWhitelist.WhitelistEntry[](3);
        entries[0] = IWhitelist.WhitelistEntry({
            account: investor1,
            role: IWhitelist.Role.INVESTOR
        });
        entries[1] = IWhitelist.WhitelistEntry({
            account: investor2,
            role: IWhitelist.Role.INVESTOR
        });
        entries[2] = IWhitelist.WhitelistEntry({
            account: smb1,
            role: IWhitelist.Role.SMB
        });

        vm.expectEmit(false, true, false, true);
        emit BatchWhitelistCompleted(3, operator);

        whitelist.batchAddToWhitelist(entries);

        assertTrue(
            whitelist.isWhitelisted(investor1, IWhitelist.Role.INVESTOR)
        );
        assertTrue(
            whitelist.isWhitelisted(investor2, IWhitelist.Role.INVESTOR)
        );
        assertTrue(whitelist.isWhitelisted(smb1, IWhitelist.Role.SMB));

        vm.stopPrank();
    }

    function test_BatchAddToWhitelist_RevertIf_EmptyArray() public {
        vm.startPrank(operator);

        IWhitelist.WhitelistEntry[] memory entries = new IWhitelist.WhitelistEntry[](0);

        vm.expectRevert(abi.encodeWithSelector(IWhitelist.EmptyArray.selector));
        whitelist.batchAddToWhitelist(entries);

        vm.stopPrank();
    }

    function test_BatchAddToWhitelist_RevertIf_InvalidAddressInBatch() public {
        vm.startPrank(operator);

        IWhitelist.WhitelistEntry[] memory entries = new IWhitelist.WhitelistEntry[](2);
        entries[0] = IWhitelist.WhitelistEntry({
            account: investor1,
            role: IWhitelist.Role.INVESTOR
        });
        entries[1] = IWhitelist.WhitelistEntry({
            account: address(0), // Invalid
            role: IWhitelist.Role.INVESTOR
        });

        vm.expectRevert(abi.encodeWithSelector(IWhitelist.InvalidAddress.selector, address(0)));
        whitelist.batchAddToWhitelist(entries);

        vm.stopPrank();
    }

    function test_BatchAddToWhitelist_RevertIf_InvalidRoleInBatch() public {
        vm.startPrank(operator);

        IWhitelist.WhitelistEntry[] memory entries = new IWhitelist.WhitelistEntry[](2);
        entries[0] = IWhitelist.WhitelistEntry({
            account: investor1,
            role: IWhitelist.Role.INVESTOR
        });
        entries[1] = IWhitelist.WhitelistEntry({
            account: investor2,
            role: IWhitelist.Role.NONE // Invalid
        });

        vm.expectRevert(abi.encodeWithSelector(IWhitelist.InvalidRole.selector, IWhitelist.Role.NONE));
        whitelist.batchAddToWhitelist(entries);

        vm.stopPrank();
    }

    function test_BatchAddToWhitelist_RevertIf_Unauthorized() public {
        vm.startPrank(unauthorized);

        IWhitelist.WhitelistEntry[] memory entries = new IWhitelist.WhitelistEntry[](1);
        entries[0] = IWhitelist.WhitelistEntry({
            account: investor1,
            role: IWhitelist.Role.INVESTOR
        });

        vm.expectRevert();
        whitelist.batchAddToWhitelist(entries);

        vm.stopPrank();
    }

    function test_BatchAddToWhitelist_RevertIf_ExceedsBatchSize() public {
        vm.startPrank(operator);

        // Create array larger than MAX_BATCH_SIZE (50)
        IWhitelist.WhitelistEntry[] memory entries = new IWhitelist.WhitelistEntry[](51);
        for (uint256 i = 0; i < 51; i++) {
            entries[i] = IWhitelist.WhitelistEntry({
                account: address(uint160(i + 1)),
                role: IWhitelist.Role.INVESTOR
            });
        }

        vm.expectRevert(abi.encodeWithSelector(IWhitelist.BatchSizeExceeded.selector, 51, 50));
        whitelist.batchAddToWhitelist(entries);

        vm.stopPrank();
    }

    // ============ REMOVE FROM WHITELIST TESTS ============

    function test_RemoveFromWhitelist_Success() public {
        vm.startPrank(operator);

        // First add
        whitelist.addToWhitelist(investor1, IWhitelist.Role.INVESTOR);
        assertTrue(
            whitelist.isWhitelisted(investor1, IWhitelist.Role.INVESTOR)
        );

        // Then remove
        vm.expectEmit(true, true, false, true);
        emit AddressRemoved(investor1, operator);

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
        vm.startPrank(operator);

        vm.expectRevert(abi.encodeWithSelector(IWhitelist.InvalidAddress.selector, address(0)));
        whitelist.removeFromWhitelist(address(0));

        vm.stopPrank();
    }

    function test_RemoveFromWhitelist_RevertIf_AddressNotWhitelisted() public {
        vm.startPrank(operator);

        vm.expectRevert(abi.encodeWithSelector(IWhitelist.AddressNotWhitelisted.selector, investor1));
        whitelist.removeFromWhitelist(investor1);

        vm.stopPrank();
    }

    function test_RemoveFromWhitelist_RevertIf_Unauthorized() public {
        vm.startPrank(operator);
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
        vm.startPrank(operator);
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
        vm.startPrank(operator);
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

    function test_OnlyWhitelistOperator_CanAddToWhitelist() public {
        vm.startPrank(owner);
        whitelist.addToWhitelist(investor1, IWhitelist.Role.INVESTOR);
        vm.stopPrank();

        vm.startPrank(operator);
        whitelist.addToWhitelist(investor2, IWhitelist.Role.INVESTOR);
        vm.stopPrank();

        assertTrue(
            whitelist.isWhitelisted(investor1, IWhitelist.Role.INVESTOR)
        );
        assertTrue(
            whitelist.isWhitelisted(investor2, IWhitelist.Role.INVESTOR)
        );
    }

    function test_RoleManagement_CanGrantAndRevokeWhitelistOperatorRole()
        public
    {
        address newOperator = makeAddr("newOperator");

        // Grant role
        whitelist.grantRole(whitelist.WHITELIST_OPERATOR_ROLE(), newOperator);
        assertTrue(
            whitelist.hasRole(whitelist.WHITELIST_OPERATOR_ROLE(), newOperator)
        );

        // New operator can now add to whitelist
        vm.startPrank(newOperator);
        whitelist.addToWhitelist(investor1, IWhitelist.Role.INVESTOR);
        vm.stopPrank();

        assertTrue(
            whitelist.isWhitelisted(investor1, IWhitelist.Role.INVESTOR)
        );

        // Revoke role
        whitelist.revokeRole(whitelist.WHITELIST_OPERATOR_ROLE(), newOperator);
        assertFalse(
            whitelist.hasRole(whitelist.WHITELIST_OPERATOR_ROLE(), newOperator)
        );

        // Former operator can no longer add to whitelist
        vm.startPrank(newOperator);
        vm.expectRevert();
        whitelist.addToWhitelist(investor2, IWhitelist.Role.INVESTOR);
        vm.stopPrank();
    }

    // ============ SET BATCH SIZE TESTS ============

    function test_SetBatchSize_AsAdmin_Success() public {
        uint256 oldSize = whitelist.MAX_BATCH_SIZE();
        uint256 newSize = 100;

        vm.expectEmit(true, true, true, true);
        emit BatchSizeUpdated(oldSize, newSize, owner);

        whitelist.setBatchSize(newSize);

        assertEq(whitelist.MAX_BATCH_SIZE(), newSize);
    }

    function test_SetBatchSize_RevertIf_NotAdmin() public {
        vm.startPrank(operator);

        vm.expectRevert();
        whitelist.setBatchSize(100);

        vm.stopPrank();
    }

    function test_SetBatchSize_RevertIf_ZeroSize() public {
        vm.expectRevert(abi.encodeWithSelector(IWhitelist.InvalidBatchSize.selector, 0));
        whitelist.setBatchSize(0);
    }

    function test_Constructor_RevertIf_ZeroBatchSize() public {
        vm.expectRevert(abi.encodeWithSelector(IWhitelist.InvalidBatchSize.selector, 0));
        new Whitelist(0);
    }

    function test_Constructor_SetsBatchSizeCorrectly() public view {
        assertEq(whitelist.MAX_BATCH_SIZE(), 50);
    }
}
