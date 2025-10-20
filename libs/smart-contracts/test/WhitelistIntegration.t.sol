// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/Invoice.sol";
import "../contracts/InvoiceFundingPool.sol";
import "../contracts/Whitelist.sol";
import "./mocks/MockUSDC.sol";

/**
 * @title WhitelistIntegrationTest
 * @notice Integration tests for whitelist enforcement across all contracts
 */
contract WhitelistIntegrationTest is Test {
    Invoice public invoice;
    InvoiceFundingPool public pool;
    Whitelist public whitelist;
    MockUSDC public usdc;

    address public owner;
    address public whitelistedInvestor;
    address public nonWhitelistedInvestor;
    address public whitelistedSMB;
    address public nonWhitelistedSMB;
    address public whitelistedInvestor2;

    uint256 constant INVOICE_AMOUNT = 10_000 * 1e6; // 10,000 USDC
    uint256 constant DUE_DATE_OFFSET = 30 days;
    uint256 constant APY = 1200; // 12%
    uint256 constant GRACE_PERIOD = 30 days;

    function setUp() public {
        owner = address(this);
        whitelistedInvestor = makeAddr("whitelistedInvestor");
        nonWhitelistedInvestor = makeAddr("nonWhitelistedInvestor");
        whitelistedSMB = makeAddr("whitelistedSMB");
        nonWhitelistedSMB = makeAddr("nonWhitelistedSMB");
        whitelistedInvestor2 = makeAddr("whitelistedInvestor2");

        // Deploy contracts
        usdc = new MockUSDC();
        whitelist = new Whitelist();
        invoice = new Invoice(
            "Orbbit Invoice",
            "ORBINV",
            "https://api.orbbit.com/metadata/",
            ".json",
            address(whitelist)
        );
        pool = new InvoiceFundingPool(
            address(usdc),
            address(invoice),
            GRACE_PERIOD,
            address(whitelist)
        );

        // Grant roles
        invoice.grantRole(invoice.MINTER_ROLE(), address(pool));
        invoice.grantRole(invoice.UPDATER_ROLE(), address(pool));

        // Whitelist addresses
        whitelist.addToWhitelist(
            whitelistedInvestor,
            IWhitelist.Role.INVESTOR
        );
        whitelist.addToWhitelist(
            whitelistedInvestor2,
            IWhitelist.Role.INVESTOR
        );
        whitelist.addToWhitelist(whitelistedSMB, IWhitelist.Role.SMB);

        // Mint USDC to investors
        usdc.mint(whitelistedInvestor, INVOICE_AMOUNT * 10);
        usdc.mint(whitelistedInvestor2, INVOICE_AMOUNT * 10);
        usdc.mint(nonWhitelistedInvestor, INVOICE_AMOUNT * 10);
    }

    // ============ FUNDING TESTS - INVESTOR WHITELIST ============

    function test_FundInvoice_Success_WithWhitelistedInvestorAndSMB() public {
        uint256 dueDate = block.timestamp + DUE_DATE_OFFSET;

        vm.startPrank(whitelistedInvestor);

        // Approve USDC
        usdc.approve(address(pool), INVOICE_AMOUNT);

        // Fund invoice
        uint256 tokenId = pool.fundInvoice(
            INVOICE_AMOUNT,
            dueDate,
            APY,
            whitelistedSMB,
            "ipfs://metadata"
        );

        // Verify NFT minted to investor
        assertEq(invoice.ownerOf(tokenId), whitelistedInvestor);

        // Verify USDC transferred to SMB
        assertEq(usdc.balanceOf(whitelistedSMB), INVOICE_AMOUNT);

        // Verify invoice data
        IInvoice.Data memory invoiceData = invoice.getInvoice(tokenId);
        assertEq(invoiceData.amount, INVOICE_AMOUNT);
        assertEq(invoiceData.issuer, whitelistedSMB);
        assertEq(
            uint256(invoiceData.status),
            uint256(IInvoice.Status.FUNDED)
        );

        vm.stopPrank();
    }

    function test_FundInvoice_RevertIf_InvestorNotWhitelisted() public {
        uint256 dueDate = block.timestamp + DUE_DATE_OFFSET;

        vm.startPrank(nonWhitelistedInvestor);

        // Approve USDC
        usdc.approve(address(pool), INVOICE_AMOUNT);

        // Attempt to fund invoice - should revert
        vm.expectRevert(abi.encodeWithSelector(IInvoiceFundingPool.InvestorNotWhitelisted.selector, nonWhitelistedInvestor));
        pool.fundInvoice(
            INVOICE_AMOUNT,
            dueDate,
            APY,
            whitelistedSMB,
            "ipfs://metadata"
        );

        vm.stopPrank();
    }

    function test_FundInvoice_RevertIf_SMBNotWhitelisted() public {
        uint256 dueDate = block.timestamp + DUE_DATE_OFFSET;

        vm.startPrank(whitelistedInvestor);

        // Approve USDC
        usdc.approve(address(pool), INVOICE_AMOUNT);

        // Attempt to fund invoice with non-whitelisted SMB - should revert
        vm.expectRevert(abi.encodeWithSelector(IInvoiceFundingPool.IssuerNotWhitelisted.selector, nonWhitelistedSMB));
        pool.fundInvoice(
            INVOICE_AMOUNT,
            dueDate,
            APY,
            nonWhitelistedSMB,
            "ipfs://metadata"
        );

        vm.stopPrank();
    }

    function test_FundInvoice_RevertIf_BothNotWhitelisted() public {
        uint256 dueDate = block.timestamp + DUE_DATE_OFFSET;

        vm.startPrank(nonWhitelistedInvestor);

        // Approve USDC
        usdc.approve(address(pool), INVOICE_AMOUNT);

        // Attempt to fund invoice - should revert with investor check first
        vm.expectRevert(abi.encodeWithSelector(IInvoiceFundingPool.InvestorNotWhitelisted.selector, nonWhitelistedInvestor));
        pool.fundInvoice(
            INVOICE_AMOUNT,
            dueDate,
            APY,
            nonWhitelistedSMB,
            "ipfs://metadata"
        );

        vm.stopPrank();
    }

    // ============ TRANSFER TESTS - NFT WHITELIST ============

    function test_TransferNFT_Success_ToWhitelistedInvestor() public {
        // First fund an invoice
        uint256 dueDate = block.timestamp + DUE_DATE_OFFSET;

        vm.startPrank(whitelistedInvestor);
        usdc.approve(address(pool), INVOICE_AMOUNT);
        uint256 tokenId = pool.fundInvoice(
            INVOICE_AMOUNT,
            dueDate,
            APY,
            whitelistedSMB,
            "ipfs://metadata"
        );
        vm.stopPrank();

        // Now transfer to another whitelisted investor
        vm.startPrank(whitelistedInvestor);
        invoice.transferFrom(
            whitelistedInvestor,
            whitelistedInvestor2,
            tokenId
        );
        vm.stopPrank();

        // Verify transfer succeeded
        assertEq(invoice.ownerOf(tokenId), whitelistedInvestor2);
    }

    function test_TransferNFT_RevertIf_RecipientNotWhitelisted() public {
        // First fund an invoice
        uint256 dueDate = block.timestamp + DUE_DATE_OFFSET;

        vm.startPrank(whitelistedInvestor);
        usdc.approve(address(pool), INVOICE_AMOUNT);
        uint256 tokenId = pool.fundInvoice(
            INVOICE_AMOUNT,
            dueDate,
            APY,
            whitelistedSMB,
            "ipfs://metadata"
        );
        vm.stopPrank();

        // Attempt to transfer to non-whitelisted address - should revert
        vm.startPrank(whitelistedInvestor);
        vm.expectRevert(abi.encodeWithSelector(IInvoice.RecipientNotWhitelisted.selector, nonWhitelistedInvestor));
        invoice.transferFrom(
            whitelistedInvestor,
            nonWhitelistedInvestor,
            tokenId
        );
        vm.stopPrank();
    }

    function test_SafeTransferNFT_RevertIf_RecipientNotWhitelisted() public {
        // First fund an invoice
        uint256 dueDate = block.timestamp + DUE_DATE_OFFSET;

        vm.startPrank(whitelistedInvestor);
        usdc.approve(address(pool), INVOICE_AMOUNT);
        uint256 tokenId = pool.fundInvoice(
            INVOICE_AMOUNT,
            dueDate,
            APY,
            whitelistedSMB,
            "ipfs://metadata"
        );
        vm.stopPrank();

        // Attempt safeTransfer to non-whitelisted address - should revert
        vm.startPrank(whitelistedInvestor);
        vm.expectRevert(abi.encodeWithSelector(IInvoice.RecipientNotWhitelisted.selector, nonWhitelistedInvestor));
        invoice.safeTransferFrom(
            whitelistedInvestor,
            nonWhitelistedInvestor,
            tokenId
        );
        vm.stopPrank();
    }

    // ============ WHITELIST REMOVAL TESTS ============

    function test_WhitelistRemoval_PreventsNewFunding() public {
        uint256 dueDate = block.timestamp + DUE_DATE_OFFSET;

        vm.startPrank(whitelistedInvestor);
        usdc.approve(address(pool), INVOICE_AMOUNT);

        // First funding should succeed
        pool.fundInvoice(
            INVOICE_AMOUNT,
            dueDate,
            APY,
            whitelistedSMB,
            "ipfs://metadata"
        );
        vm.stopPrank();

        // Remove investor from whitelist
        whitelist.removeFromWhitelist(whitelistedInvestor);

        // Second funding should fail
        vm.startPrank(whitelistedInvestor);
        usdc.approve(address(pool), INVOICE_AMOUNT);
        vm.expectRevert(abi.encodeWithSelector(IInvoiceFundingPool.InvestorNotWhitelisted.selector, whitelistedInvestor));
        pool.fundInvoice(
            INVOICE_AMOUNT,
            dueDate,
            APY,
            whitelistedSMB,
            "ipfs://metadata"
        );
        vm.stopPrank();
    }

    function test_WhitelistRemoval_PreventsTransferAsRecipient() public {
        // First fund an invoice
        uint256 dueDate = block.timestamp + DUE_DATE_OFFSET;

        vm.startPrank(whitelistedInvestor);
        usdc.approve(address(pool), INVOICE_AMOUNT);
        uint256 tokenId = pool.fundInvoice(
            INVOICE_AMOUNT,
            dueDate,
            APY,
            whitelistedSMB,
            "ipfs://metadata"
        );
        vm.stopPrank();

        // Remove investor2 from whitelist
        whitelist.removeFromWhitelist(whitelistedInvestor2);

        // Attempt transfer to removed investor - should fail
        vm.startPrank(whitelistedInvestor);
        vm.expectRevert(abi.encodeWithSelector(IInvoice.RecipientNotWhitelisted.selector, whitelistedInvestor2));
        invoice.transferFrom(
            whitelistedInvestor,
            whitelistedInvestor2,
            tokenId
        );
        vm.stopPrank();
    }

    function test_WhitelistRemoval_DoesNotAffectExistingOwnership() public {
        // First fund an invoice
        uint256 dueDate = block.timestamp + DUE_DATE_OFFSET;

        vm.startPrank(whitelistedInvestor);
        usdc.approve(address(pool), INVOICE_AMOUNT);
        uint256 tokenId = pool.fundInvoice(
            INVOICE_AMOUNT,
            dueDate,
            APY,
            whitelistedSMB,
            "ipfs://metadata"
        );
        vm.stopPrank();

        // Verify ownership
        assertEq(invoice.ownerOf(tokenId), whitelistedInvestor);

        // Remove investor from whitelist
        whitelist.removeFromWhitelist(whitelistedInvestor);

        // Ownership should still be intact
        assertEq(invoice.ownerOf(tokenId), whitelistedInvestor);

        // But they cannot transfer it out (sender can still send, but recipient must be whitelisted)
        vm.startPrank(whitelistedInvestor);
        invoice.transferFrom(
            whitelistedInvestor,
            whitelistedInvestor2,
            tokenId
        );
        vm.stopPrank();

        // Transfer to whitelisted address succeeds
        assertEq(invoice.ownerOf(tokenId), whitelistedInvestor2);
    }

    // ============ ROLE UPDATE TESTS ============

    function test_RoleUpdate_InvestorToSMB() public {
        uint256 dueDate = block.timestamp + DUE_DATE_OFFSET;

        // Can fund as investor
        vm.startPrank(whitelistedInvestor);
        usdc.approve(address(pool), INVOICE_AMOUNT);
        pool.fundInvoice(
            INVOICE_AMOUNT,
            dueDate,
            APY,
            whitelistedSMB,
            "ipfs://metadata"
        );
        vm.stopPrank();

        // Update role to SMB
        whitelist.addToWhitelist(whitelistedInvestor, IWhitelist.Role.SMB);

        // Can no longer fund as investor
        vm.startPrank(whitelistedInvestor);
        usdc.approve(address(pool), INVOICE_AMOUNT);
        vm.expectRevert(abi.encodeWithSelector(IInvoiceFundingPool.InvestorNotWhitelisted.selector, whitelistedInvestor));
        pool.fundInvoice(
            INVOICE_AMOUNT,
            dueDate,
            APY,
            whitelistedSMB,
            "ipfs://metadata"
        );
        vm.stopPrank();

        // But can now receive funds as SMB
        vm.startPrank(whitelistedInvestor2);
        usdc.approve(address(pool), INVOICE_AMOUNT);
        pool.fundInvoice(
            INVOICE_AMOUNT,
            dueDate,
            APY,
            whitelistedInvestor, // Now SMB
            "ipfs://metadata"
        );
        vm.stopPrank();
    }

    // ============ MULTIPLE INVOICE TESTS ============

    function test_MultipleInvoices_WithDifferentWhitelistedParticipants()
        public
    {
        uint256 dueDate = block.timestamp + DUE_DATE_OFFSET;

        // First invoice: whitelistedInvestor -> whitelistedSMB
        vm.startPrank(whitelistedInvestor);
        usdc.approve(address(pool), INVOICE_AMOUNT);
        uint256 tokenId1 = pool.fundInvoice(
            INVOICE_AMOUNT,
            dueDate,
            APY,
            whitelistedSMB,
            "ipfs://metadata1"
        );
        vm.stopPrank();

        // Second invoice: whitelistedInvestor2 -> whitelistedSMB
        vm.startPrank(whitelistedInvestor2);
        usdc.approve(address(pool), INVOICE_AMOUNT);
        uint256 tokenId2 = pool.fundInvoice(
            INVOICE_AMOUNT,
            dueDate,
            APY,
            whitelistedSMB,
            "ipfs://metadata2"
        );
        vm.stopPrank();

        // Verify both succeeded
        assertEq(invoice.ownerOf(tokenId1), whitelistedInvestor);
        assertEq(invoice.ownerOf(tokenId2), whitelistedInvestor2);
        assertEq(usdc.balanceOf(whitelistedSMB), INVOICE_AMOUNT * 2);
    }
}
