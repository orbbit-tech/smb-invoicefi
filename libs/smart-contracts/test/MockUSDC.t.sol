// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "./mocks/MockUSDC.sol";

contract MockUSDCTest is Test {
    MockUSDC public usdc;
    address public user1 = address(0x1);
    address public user2 = address(0x2);

    function setUp() public {
        usdc = new MockUSDC();
    }

    function testDecimals() public view {
        assertEq(usdc.decimals(), 6, "Should have 6 decimals");
    }

    function testMint() public {
        uint256 amount = 1000 * 10**6; // 1000 USDC
        usdc.mint(user1, amount);

        assertEq(usdc.balanceOf(user1), amount, "User1 should have minted amount");
    }

    function testMintMultiple() public {
        uint256 amount1 = 1000 * 10**6;
        uint256 amount2 = 500 * 10**6;

        usdc.mint(user1, amount1);
        usdc.mint(user1, amount2);

        assertEq(
            usdc.balanceOf(user1),
            amount1 + amount2,
            "User1 should have total of both mints"
        );
    }

    function testTransfer() public {
        uint256 amount = 1000 * 10**6;
        usdc.mint(user1, amount);

        vm.prank(user1);
        usdc.transfer(user2, 500 * 10**6);

        assertEq(usdc.balanceOf(user1), 500 * 10**6, "User1 should have 500 USDC");
        assertEq(usdc.balanceOf(user2), 500 * 10**6, "User2 should have 500 USDC");
    }

    function testApproveAndTransferFrom() public {
        uint256 amount = 1000 * 10**6;
        usdc.mint(user1, amount);

        // Approve user2 to spend user1's tokens
        vm.prank(user1);
        usdc.approve(user2, 500 * 10**6);

        // User2 transfers from user1
        vm.prank(user2);
        usdc.transferFrom(user1, user2, 500 * 10**6);

        assertEq(usdc.balanceOf(user1), 500 * 10**6, "User1 should have 500 USDC");
        assertEq(usdc.balanceOf(user2), 500 * 10**6, "User2 should have 500 USDC");
    }

    function testFuzzMint(address to, uint256 amount) public {
        vm.assume(to != address(0));
        vm.assume(amount < type(uint256).max);

        usdc.mint(to, amount);
        assertEq(usdc.balanceOf(to), amount, "Address should have minted amount");
    }
}
