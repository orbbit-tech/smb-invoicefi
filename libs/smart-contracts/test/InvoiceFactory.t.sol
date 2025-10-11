// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/InvoiceFactory.sol";
import "../contracts/InvoiceNFT.sol";
import "../contracts/FundingPool.sol";
import "../contracts/mocks/MockUSDC.sol";

/**
 * @title InvoiceFactoryTest
 * @notice Foundry unit tests for InvoiceFactory contract
 */
contract InvoiceFactoryTest is Test {
    InvoiceFactory public factory;
    InvoiceNFT public invoiceNFT;
    FundingPool public fundingPool;
    MockUSDC public usdc;

    address public admin = address(1);
    address public user = address(2);

    // Sample invoice data
    uint256 constant INVOICE_AMOUNT = 10000 * 10**6; // 10,000 USDC
    uint256 constant DUE_DATE = 1735689600; // Jan 1, 2025
    uint8 constant RISK_SCORE = 25;
    string constant PAYER = "Acme Corp";
    string constant INVOICE_NUMBER = "INV-001";
    string constant TOKEN_URI = "ipfs://QmTest123";

    event InvoiceCreated(
        uint256 indexed tokenId,
        uint256 amount,
        uint256 dueDate,
        string payer
    );

    function setUp() public {
        vm.startPrank(admin);

        // Deploy contracts
        usdc = new MockUSDC();
        invoiceNFT = new InvoiceNFT();
        fundingPool = new FundingPool(address(usdc), address(invoiceNFT));
        factory = new InvoiceFactory(address(invoiceNFT), address(fundingPool));

        // Grant roles
        invoiceNFT.grantRole(invoiceNFT.MINTER_ROLE(), address(factory));
        invoiceNFT.grantRole(invoiceNFT.UPDATER_ROLE(), address(factory));
        invoiceNFT.grantRole(invoiceNFT.UPDATER_ROLE(), address(fundingPool));

        vm.stopPrank();
    }

    // ============ Constructor Tests ============

    function testConstructorSuccess() public {
        assertEq(address(factory.invoiceNFT()), address(invoiceNFT), "InvoiceNFT address should match");
        assertEq(address(factory.fundingPool()), address(fundingPool), "FundingPool address should match");
        assertTrue(factory.hasRole(factory.ADMIN_ROLE(), admin), "Deployer should have ADMIN_ROLE");
        assertTrue(factory.hasRole(factory.DEFAULT_ADMIN_ROLE(), admin), "Deployer should have DEFAULT_ADMIN_ROLE");
    }

    function testRevertConstructorInvalidInvoiceNFT() public {
        vm.prank(admin);
        vm.expectRevert("Invalid InvoiceNFT address");
        new InvoiceFactory(address(0), address(fundingPool));
    }

    function testRevertConstructorInvalidFundingPool() public {
        vm.prank(admin);
        vm.expectRevert("Invalid FundingPool address");
        new InvoiceFactory(address(invoiceNFT), address(0));
    }

    // ============ Create Invoice Tests ============

    function testCreateInvoiceSuccess() public {
        vm.prank(admin);

        vm.expectEmit(true, false, false, true);
        emit InvoiceCreated(1, INVOICE_AMOUNT, DUE_DATE, PAYER);

        uint256 tokenId = factory.createInvoice(
            INVOICE_AMOUNT,
            DUE_DATE,
            RISK_SCORE,
            PAYER,
            INVOICE_NUMBER,
            TOKEN_URI
        );

        assertEq(tokenId, 1, "First token should be ID 1");

        // Check NFT was minted to factory
        assertEq(invoiceNFT.ownerOf(tokenId), address(factory), "Factory should own the NFT");

        // Check invoice data
        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(invoice.amount, INVOICE_AMOUNT, "Amount should match");
        assertEq(invoice.dueDate, DUE_DATE, "Due date should match");
        assertEq(invoice.riskScore, RISK_SCORE, "Risk score should match");
        assertEq(invoice.payer, PAYER, "Payer should match");
        assertEq(invoice.invoiceNumber, INVOICE_NUMBER, "Invoice number should match");

        // Check status is automatically set to Listed
        assertEq(uint8(invoice.status), uint8(InvoiceNFT.Status.Listed), "Status should be Listed");
    }

    function testCreateInvoiceAutoListed() public {
        vm.prank(admin);
        uint256 tokenId = factory.createInvoice(
            INVOICE_AMOUNT,
            DUE_DATE,
            RISK_SCORE,
            PAYER,
            INVOICE_NUMBER,
            TOKEN_URI
        );

        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(uint8(invoice.status), uint8(InvoiceNFT.Status.Listed), "Should be automatically listed");
    }

    function testCreateMultipleInvoices() public {
        vm.startPrank(admin);

        uint256 token1 = factory.createInvoice(INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, "INV-001", TOKEN_URI);
        uint256 token2 = factory.createInvoice(INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, "INV-002", TOKEN_URI);
        uint256 token3 = factory.createInvoice(INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, "INV-003", TOKEN_URI);

        vm.stopPrank();

        assertEq(token1, 1, "First token ID");
        assertEq(token2, 2, "Second token ID");
        assertEq(token3, 3, "Third token ID");
        assertEq(invoiceNFT.totalSupply(), 3, "Total supply should be 3");

        // All should be listed
        assertEq(uint8(invoiceNFT.getInvoice(token1).status), uint8(InvoiceNFT.Status.Listed), "Token1 listed");
        assertEq(uint8(invoiceNFT.getInvoice(token2).status), uint8(InvoiceNFT.Status.Listed), "Token2 listed");
        assertEq(uint8(invoiceNFT.getInvoice(token3).status), uint8(InvoiceNFT.Status.Listed), "Token3 listed");
    }

    function testCreateInvoiceWithDifferentData() public {
        vm.startPrank(admin);

        // High risk invoice
        uint256 highRiskToken = factory.createInvoice(
            50000 * 10**6, // 50,000 USDC
            DUE_DATE,
            85, // High risk
            "Risky Startup Inc",
            "INV-HIGH-001",
            "ipfs://QmHighRisk"
        );

        // Low risk invoice
        uint256 lowRiskToken = factory.createInvoice(
            5000 * 10**6, // 5,000 USDC
            DUE_DATE,
            5, // Low risk
            "Fortune 500 Corp",
            "INV-LOW-001",
            "ipfs://QmLowRisk"
        );

        vm.stopPrank();

        // Verify high risk invoice
        InvoiceNFT.InvoiceData memory highRiskInvoice = invoiceNFT.getInvoice(highRiskToken);
        assertEq(highRiskInvoice.amount, 50000 * 10**6, "High risk amount");
        assertEq(highRiskInvoice.riskScore, 85, "High risk score");
        assertEq(highRiskInvoice.payer, "Risky Startup Inc", "High risk payer");

        // Verify low risk invoice
        InvoiceNFT.InvoiceData memory lowRiskInvoice = invoiceNFT.getInvoice(lowRiskToken);
        assertEq(lowRiskInvoice.amount, 5000 * 10**6, "Low risk amount");
        assertEq(lowRiskInvoice.riskScore, 5, "Low risk score");
        assertEq(lowRiskInvoice.payer, "Fortune 500 Corp", "Low risk payer");
    }

    function testRevertCreateInvoiceWithoutAdminRole() public {
        vm.prank(user);
        vm.expectRevert();
        factory.createInvoice(
            INVOICE_AMOUNT,
            DUE_DATE,
            RISK_SCORE,
            PAYER,
            INVOICE_NUMBER,
            TOKEN_URI
        );
    }

    function testRevertCreateInvoiceZeroAmount() public {
        vm.prank(admin);
        vm.expectRevert("Amount must be greater than 0");
        factory.createInvoice(0, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);
    }

    function testRevertCreateInvoicePastDueDate() public {
        vm.prank(admin);
        vm.expectRevert("Due date must be in the future");
        factory.createInvoice(INVOICE_AMOUNT, block.timestamp - 1, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);
    }

    function testRevertCreateInvoiceInvalidRiskScore() public {
        vm.prank(admin);
        vm.expectRevert("Risk score must be 0-100");
        factory.createInvoice(INVOICE_AMOUNT, DUE_DATE, 101, PAYER, INVOICE_NUMBER, TOKEN_URI);
    }

    function testRevertCreateInvoiceEmptyPayer() public {
        vm.prank(admin);
        vm.expectRevert("Payer cannot be empty");
        factory.createInvoice(INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, "", INVOICE_NUMBER, TOKEN_URI);
    }

    // ============ Access Control Tests ============

    function testGrantAdminRole() public {
        address newAdmin = address(3);

        vm.prank(admin);
        factory.grantRole(factory.ADMIN_ROLE(), newAdmin);

        assertTrue(factory.hasRole(factory.ADMIN_ROLE(), newAdmin), "Should have ADMIN_ROLE");

        // New admin should be able to create invoices
        vm.prank(newAdmin);
        uint256 tokenId = factory.createInvoice(
            INVOICE_AMOUNT,
            DUE_DATE,
            RISK_SCORE,
            PAYER,
            INVOICE_NUMBER,
            TOKEN_URI
        );

        assertEq(tokenId, 1, "New admin should be able to create invoice");
    }

    function testRevokeAdminRole() public {
        vm.prank(admin);
        factory.revokeRole(factory.ADMIN_ROLE(), admin);

        assertFalse(factory.hasRole(factory.ADMIN_ROLE(), admin), "Should not have ADMIN_ROLE");

        // Should not be able to create invoices anymore
        vm.prank(admin);
        vm.expectRevert();
        factory.createInvoice(
            INVOICE_AMOUNT,
            DUE_DATE,
            RISK_SCORE,
            PAYER,
            INVOICE_NUMBER,
            TOKEN_URI
        );
    }

    function testDefaultAdminRole() public {
        // Admin should have DEFAULT_ADMIN_ROLE to manage other roles
        assertTrue(factory.hasRole(factory.DEFAULT_ADMIN_ROLE(), admin), "Should have DEFAULT_ADMIN_ROLE");

        address newAdmin = address(3);

        vm.prank(admin);
        factory.grantRole(factory.ADMIN_ROLE(), newAdmin);

        assertTrue(factory.hasRole(factory.ADMIN_ROLE(), newAdmin), "Should grant role");
    }

    function testRevertGrantRoleWithoutDefaultAdmin() public {
        address newAdmin = address(3);

        vm.prank(user);
        vm.expectRevert();
        factory.grantRole(factory.ADMIN_ROLE(), newAdmin);
    }

    // ============ Integration Tests ============

    function testCreateInvoiceAndFund() public {
        // Create invoice via factory
        vm.prank(admin);
        uint256 tokenId = factory.createInvoice(
            INVOICE_AMOUNT,
            DUE_DATE,
            RISK_SCORE,
            PAYER,
            INVOICE_NUMBER,
            TOKEN_URI
        );

        // Invoice should be immediately available for funding
        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(uint8(invoice.status), uint8(InvoiceNFT.Status.Listed), "Should be listed");

        // Fund the invoice
        address investor = address(4);
        usdc.mint(investor, INVOICE_AMOUNT);

        vm.startPrank(investor);
        usdc.approve(address(fundingPool), INVOICE_AMOUNT);
        fundingPool.depositUSDC(tokenId, INVOICE_AMOUNT);
        vm.stopPrank();

        // Check funding succeeded
        (, uint256 totalFunded,,) = fundingPool.getFundingInfo(tokenId);
        assertEq(totalFunded, INVOICE_AMOUNT, "Should be fully funded");

        // Status should be updated to FullyFunded
        invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(uint8(invoice.status), uint8(InvoiceNFT.Status.FullyFunded), "Should be fully funded");
    }

    function testCreateMultipleInvoicesAndFundSelectively() public {
        vm.startPrank(admin);
        uint256 token1 = factory.createInvoice(INVOICE_AMOUNT, DUE_DATE, 20, "Company A", "INV-A", TOKEN_URI);
        uint256 token2 = factory.createInvoice(INVOICE_AMOUNT, DUE_DATE, 50, "Company B", "INV-B", TOKEN_URI);
        uint256 token3 = factory.createInvoice(INVOICE_AMOUNT, DUE_DATE, 80, "Company C", "INV-C", TOKEN_URI);
        vm.stopPrank();

        // Fund only token1 and token3
        address investor = address(4);
        usdc.mint(investor, INVOICE_AMOUNT * 2);

        vm.startPrank(investor);
        usdc.approve(address(fundingPool), INVOICE_AMOUNT * 2);
        fundingPool.depositUSDC(token1, INVOICE_AMOUNT);
        fundingPool.depositUSDC(token3, INVOICE_AMOUNT);
        vm.stopPrank();

        // Check statuses
        assertEq(uint8(invoiceNFT.getInvoice(token1).status), uint8(InvoiceNFT.Status.FullyFunded), "Token1 funded");
        assertEq(uint8(invoiceNFT.getInvoice(token2).status), uint8(InvoiceNFT.Status.Listed), "Token2 still listed");
        assertEq(uint8(invoiceNFT.getInvoice(token3).status), uint8(InvoiceNFT.Status.FullyFunded), "Token3 funded");
    }

    // ============ Edge Cases ============

    function testCreateInvoiceMinimumAmount() public {
        vm.prank(admin);
        uint256 tokenId = factory.createInvoice(1, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);

        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(invoice.amount, 1, "Should accept minimum amount");
    }

    function testCreateInvoiceZeroRiskScore() public {
        vm.prank(admin);
        uint256 tokenId = factory.createInvoice(INVOICE_AMOUNT, DUE_DATE, 0, PAYER, INVOICE_NUMBER, TOKEN_URI);

        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(invoice.riskScore, 0, "Should accept zero risk score");
    }

    function testCreateInvoiceMaxRiskScore() public {
        vm.prank(admin);
        uint256 tokenId = factory.createInvoice(INVOICE_AMOUNT, DUE_DATE, 100, PAYER, INVOICE_NUMBER, TOKEN_URI);

        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(invoice.riskScore, 100, "Should accept max risk score");
    }

    function testCreateInvoiceWithFutureDueDate() public {
        uint256 farFutureDueDate = block.timestamp + 365 days;

        vm.prank(admin);
        uint256 tokenId = factory.createInvoice(
            INVOICE_AMOUNT,
            farFutureDueDate,
            RISK_SCORE,
            PAYER,
            INVOICE_NUMBER,
            TOKEN_URI
        );

        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(invoice.dueDate, farFutureDueDate, "Should accept far future due date");
    }

    function testCreateInvoiceLongStrings() public {
        string memory longPayer = "Very Long Company Name With Many Words To Test String Handling In Smart Contracts";
        string memory longInvoiceNumber = "INV-2025-Q1-DEPARTMENT-SUBDIVISION-PROJECT-000001-FINAL-REVISED";
        string memory longURI = "ipfs://QmVeryLongHashString1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

        vm.prank(admin);
        uint256 tokenId = factory.createInvoice(
            INVOICE_AMOUNT,
            DUE_DATE,
            RISK_SCORE,
            longPayer,
            longInvoiceNumber,
            longURI
        );

        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(invoice.payer, longPayer, "Should handle long payer name");
        assertEq(invoice.invoiceNumber, longInvoiceNumber, "Should handle long invoice number");
        assertEq(invoiceNFT.tokenURI(tokenId), longURI, "Should handle long URI");
    }

    // ============ Role Constant Tests ============

    function testAdminRoleConstant() public {
        bytes32 expectedRole = keccak256("ADMIN_ROLE");
        assertEq(factory.ADMIN_ROLE(), expectedRole, "ADMIN_ROLE should be correct hash");
    }

    function testHasExpectedRoles() public {
        // Check factory has expected roles on contracts
        assertTrue(
            invoiceNFT.hasRole(invoiceNFT.MINTER_ROLE(), address(factory)),
            "Factory should have MINTER_ROLE on InvoiceNFT"
        );
        assertTrue(
            invoiceNFT.hasRole(invoiceNFT.UPDATER_ROLE(), address(factory)),
            "Factory should have UPDATER_ROLE on InvoiceNFT"
        );
    }
}
