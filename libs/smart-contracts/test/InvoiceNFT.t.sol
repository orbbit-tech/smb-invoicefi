// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/InvoiceNFT.sol";

/**
 * @title InvoiceNFTTest
 * @notice Foundry unit tests for InvoiceNFT contract
 */
contract InvoiceNFTTest is Test {
    InvoiceNFT public invoiceNFT;

    address public admin = address(1);
    address public minter = address(2);
    address public updater = address(3);
    address public user = address(4);

    // Sample invoice data
    uint256 constant INVOICE_AMOUNT = 10000 * 10**6; // 10,000 USDC
    uint256 constant DUE_DATE = 1735689600; // Jan 1, 2025
    uint8 constant RISK_SCORE = 25;
    string constant PAYER = "Acme Corp";
    string constant INVOICE_NUMBER = "INV-001";
    string constant TOKEN_URI = "ipfs://QmTest123";

    event InvoiceMinted(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 amount,
        uint256 dueDate,
        string payer
    );

    event InvoiceStatusUpdated(
        uint256 indexed tokenId,
        InvoiceNFT.Status previousStatus,
        InvoiceNFT.Status newStatus
    );

    function setUp() public {
        vm.prank(admin);
        invoiceNFT = new InvoiceNFT();

        // Grant roles
        vm.startPrank(admin);
        invoiceNFT.grantRole(invoiceNFT.MINTER_ROLE(), minter);
        invoiceNFT.grantRole(invoiceNFT.UPDATER_ROLE(), updater);
        vm.stopPrank();
    }

    // ============ Minting Tests ============

    function testMintInvoiceSuccess() public {
        vm.prank(minter);

        vm.expectEmit(true, true, false, true);
        emit InvoiceMinted(1, minter, INVOICE_AMOUNT, DUE_DATE, PAYER);

        uint256 tokenId = invoiceNFT.mint(
            minter,
            INVOICE_AMOUNT,
            DUE_DATE,
            RISK_SCORE,
            PAYER,
            INVOICE_NUMBER,
            TOKEN_URI
        );

        assertEq(tokenId, 1, "First token should be ID 1");
        assertEq(invoiceNFT.ownerOf(tokenId), minter, "Minter should own token");
        assertEq(invoiceNFT.tokenURI(tokenId), TOKEN_URI, "Token URI should match");
        assertEq(invoiceNFT.totalSupply(), 1, "Total supply should be 1");
    }

    function testMintInvoiceData() public {
        vm.prank(minter);
        uint256 tokenId = invoiceNFT.mint(
            minter,
            INVOICE_AMOUNT,
            DUE_DATE,
            RISK_SCORE,
            PAYER,
            INVOICE_NUMBER,
            TOKEN_URI
        );

        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);

        assertEq(invoice.amount, INVOICE_AMOUNT, "Amount should match");
        assertEq(invoice.dueDate, DUE_DATE, "Due date should match");
        assertEq(invoice.riskScore, RISK_SCORE, "Risk score should match");
        assertEq(uint8(invoice.status), uint8(InvoiceNFT.Status.Created), "Status should be Created");
        assertEq(invoice.payer, PAYER, "Payer should match");
        assertEq(invoice.invoiceNumber, INVOICE_NUMBER, "Invoice number should match");
        assertTrue(invoice.createdAt > 0, "Created timestamp should be set");
    }

    function testMintMultipleInvoices() public {
        vm.startPrank(minter);

        uint256 token1 = invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, "INV-001", TOKEN_URI);
        uint256 token2 = invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, "INV-002", TOKEN_URI);
        uint256 token3 = invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, "INV-003", TOKEN_URI);

        vm.stopPrank();

        assertEq(token1, 1, "First token ID");
        assertEq(token2, 2, "Second token ID");
        assertEq(token3, 3, "Third token ID");
        assertEq(invoiceNFT.totalSupply(), 3, "Total supply should be 3");
    }

    function testRevertMintWithoutMinterRole() public {
        vm.prank(user);
        vm.expectRevert();
        invoiceNFT.mint(user, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);
    }

    function testRevertMintZeroAmount() public {
        vm.prank(minter);
        vm.expectRevert("Amount must be greater than 0");
        invoiceNFT.mint(minter, 0, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);
    }

    function testRevertMintPastDueDate() public {
        vm.prank(minter);
        vm.expectRevert("Due date must be in the future");
        invoiceNFT.mint(minter, INVOICE_AMOUNT, block.timestamp - 1, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);
    }

    function testRevertMintInvalidRiskScore() public {
        vm.prank(minter);
        vm.expectRevert("Risk score must be 0-100");
        invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, 101, PAYER, INVOICE_NUMBER, TOKEN_URI);
    }

    function testRevertMintEmptyPayer() public {
        vm.prank(minter);
        vm.expectRevert("Payer cannot be empty");
        invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, "", INVOICE_NUMBER, TOKEN_URI);
    }

    // ============ Status Update Tests ============

    function testUpdateStatusCreatedToListed() public {
        vm.prank(minter);
        uint256 tokenId = invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);

        vm.prank(updater);
        vm.expectEmit(true, false, false, true);
        emit InvoiceStatusUpdated(tokenId, InvoiceNFT.Status.Created, InvoiceNFT.Status.Listed);

        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Listed);

        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(uint8(invoice.status), uint8(InvoiceNFT.Status.Listed), "Status should be Listed");
    }

    function testUpdateStatusListedToPartiallyFunded() public {
        vm.prank(minter);
        uint256 tokenId = invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);

        vm.startPrank(updater);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Listed);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.PartiallyFunded);
        vm.stopPrank();

        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(uint8(invoice.status), uint8(InvoiceNFT.Status.PartiallyFunded), "Status should be PartiallyFunded");
    }

    function testUpdateStatusCompleteLifecycle() public {
        vm.prank(minter);
        uint256 tokenId = invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);

        vm.startPrank(updater);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Listed);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.PartiallyFunded);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.FullyFunded);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Disbursed);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.PendingRepayment);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Repaid);
        vm.stopPrank();

        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(uint8(invoice.status), uint8(InvoiceNFT.Status.Repaid), "Status should be Repaid");
    }

    function testRevertUpdateStatusWithoutUpdaterRole() public {
        vm.prank(minter);
        uint256 tokenId = invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);

        vm.prank(user);
        vm.expectRevert();
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Listed);
    }

    function testRevertUpdateStatusNonexistentToken() public {
        vm.prank(updater);
        vm.expectRevert("Token does not exist");
        invoiceNFT.updateStatus(999, InvoiceNFT.Status.Listed);
    }

    function testRevertUpdateStatusSameStatus() public {
        vm.prank(minter);
        uint256 tokenId = invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);

        vm.prank(updater);
        vm.expectRevert("Status unchanged");
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Created);
    }

    function testRevertInvalidStatusTransitionCreatedToFunded() public {
        vm.prank(minter);
        uint256 tokenId = invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);

        vm.prank(updater);
        vm.expectRevert("Can only transition to Listed");
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.FullyFunded);
    }

    function testRevertInvalidStatusTransitionListedToDisbursed() public {
        vm.prank(minter);
        uint256 tokenId = invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);

        vm.startPrank(updater);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Listed);

        vm.expectRevert("Can only transition to PartiallyFunded or FullyFunded");
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Disbursed);
        vm.stopPrank();
    }

    function testRevertInvalidStatusTransitionPartiallyFundedToListed() public {
        vm.prank(minter);
        uint256 tokenId = invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);

        vm.startPrank(updater);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Listed);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.PartiallyFunded);

        vm.expectRevert("Can only transition to FullyFunded");
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Listed);
        vm.stopPrank();
    }

    // ============ Access Control Tests ============

    function testGrantMinterRole() public {
        address newMinter = address(5);

        vm.prank(admin);
        invoiceNFT.grantRole(invoiceNFT.MINTER_ROLE(), newMinter);

        assertTrue(invoiceNFT.hasRole(invoiceNFT.MINTER_ROLE(), newMinter), "Should have minter role");

        vm.prank(newMinter);
        uint256 tokenId = invoiceNFT.mint(newMinter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);
        assertEq(tokenId, 1, "New minter should be able to mint");
    }

    function testRevokeMinterRole() public {
        vm.prank(admin);
        invoiceNFT.revokeRole(invoiceNFT.MINTER_ROLE(), minter);

        assertFalse(invoiceNFT.hasRole(invoiceNFT.MINTER_ROLE(), minter), "Should not have minter role");

        vm.prank(minter);
        vm.expectRevert();
        invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);
    }

    // ============ View Function Tests ============

    function testGetInvoice() public {
        vm.prank(minter);
        uint256 tokenId = invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);

        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);

        assertTrue(invoice.amount > 0, "Invoice should exist");
        assertEq(invoice.amount, INVOICE_AMOUNT, "Amount should match");
    }

    function testRevertGetInvoiceNonexistent() public {
        vm.expectRevert("Token does not exist");
        invoiceNFT.getInvoice(999);
    }

    function testTotalSupply() public {
        assertEq(invoiceNFT.totalSupply(), 0, "Initial supply should be 0");

        vm.startPrank(minter);
        invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, "INV-001", TOKEN_URI);
        assertEq(invoiceNFT.totalSupply(), 1, "Supply should be 1");

        invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, "INV-002", TOKEN_URI);
        assertEq(invoiceNFT.totalSupply(), 2, "Supply should be 2");
        vm.stopPrank();
    }

    // ============ ERC-721 Compatibility Tests ============

    function testTransferInvoiceNFT() public {
        vm.prank(minter);
        uint256 tokenId = invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);

        vm.prank(minter);
        invoiceNFT.transferFrom(minter, user, tokenId);

        assertEq(invoiceNFT.ownerOf(tokenId), user, "User should own token after transfer");
    }

    function testSupportsInterface() public {
        // ERC-721
        assertTrue(invoiceNFT.supportsInterface(0x80ac58cd), "Should support ERC-721");
        // ERC-721 Metadata
        assertTrue(invoiceNFT.supportsInterface(0x5b5e139f), "Should support ERC-721 Metadata");
        // AccessControl
        assertTrue(invoiceNFT.supportsInterface(0x7965db0b), "Should support AccessControl");
    }

    // ============ Edge Cases ============

    function testMintWithMinimumAmount() public {
        vm.prank(minter);
        uint256 tokenId = invoiceNFT.mint(minter, 1, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);

        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(invoice.amount, 1, "Should accept minimum amount");
    }

    function testMintWithMaxRiskScore() public {
        vm.prank(minter);
        uint256 tokenId = invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, 100, PAYER, INVOICE_NUMBER, TOKEN_URI);

        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(invoice.riskScore, 100, "Should accept max risk score");
    }

    function testMintWithZeroRiskScore() public {
        vm.prank(minter);
        uint256 tokenId = invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, 0, PAYER, INVOICE_NUMBER, TOKEN_URI);

        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(invoice.riskScore, 0, "Should accept zero risk score");
    }

    function testStatusTransitionToOverdue() public {
        vm.prank(minter);
        uint256 tokenId = invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);

        vm.startPrank(updater);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Listed);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.FullyFunded);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Disbursed);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.PendingRepayment);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Overdue);
        vm.stopPrank();

        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(uint8(invoice.status), uint8(InvoiceNFT.Status.Overdue), "Should transition to Overdue");
    }

    function testStatusTransitionOverdueToDefaulted() public {
        vm.prank(minter);
        uint256 tokenId = invoiceNFT.mint(minter, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);

        vm.startPrank(updater);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Listed);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.FullyFunded);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Disbursed);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.PendingRepayment);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Overdue);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Defaulted);
        vm.stopPrank();

        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(uint8(invoice.status), uint8(InvoiceNFT.Status.Defaulted), "Should transition to Defaulted");
    }
}
