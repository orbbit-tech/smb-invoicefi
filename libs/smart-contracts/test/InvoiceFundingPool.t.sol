// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import 'forge-std/Test.sol';
import '../contracts/Invoice.sol';
import '../contracts/InvoiceFundingPool.sol';
import '../contracts/Whitelist.sol';
import '../contracts/interfaces/IInvoice.sol';
import '../contracts/interfaces/IWhitelist.sol';
import './mocks/MockUSDC.sol';

/**
 * @title InvoiceFundingPoolTest
 * @notice Foundry unit tests for InvoiceFundingPool contract
 * @dev Tests funding, repayment, defaults, and yield calculations
 */
contract InvoiceFundingPoolTest is Test {
    Invoice public invoice;
    InvoiceFundingPool public pool;
    MockUSDC public paymentToken;
    Whitelist public whitelist;

    address public admin = address(1);
    address public minter = address(2);
    address public updater = address(3);
    address public pauser = address(4);
    address public investor = address(5);
    address public smb = address(6);
    address public platformTreasury = address(7);

    // Sample invoice data
    uint256 constant INVOICE_AMOUNT = 10000 * 10 ** 6; // 10,000 USDC
    uint256 dueAt; // Will be set in setUp
    uint256 constant APR = 1200; // 12% in basis points
    string constant METADATA_URI = 'ipfs://QmTest123';

    // Configuration constants (matching deployment defaults)
    string constant TOKEN_NAME = 'Orbbit Invoice';
    string constant TOKEN_SYMBOL = 'ORBINV';
    string constant METADATA_BASE_URI = 'https://api.orbbit.com/metadata/';
    string constant METADATA_EXTENSION = '.json';
    uint256 constant GRACE_PERIOD_DAYS = 30;
    uint256 constant PLATFORM_FEE_RATE = 3000; // 25%

    event InvoiceListed(
        uint256 indexed tokenId,
        address indexed issuer,
        uint256 amount,
        uint256 dueAt,
        uint256 apr
    );

    event InvoiceFunded(
        uint256 indexed tokenId,
        address indexed investor,
        uint256 amount
    );

    event RepaymentDeposited(
        uint256 indexed tokenId,
        address indexed depositor,
        uint256 amount
    );

    event InvoiceRepaid(
        uint256 indexed tokenId,
        address indexed investor,
        uint256 totalAmount
    );

    event InvoiceDefaulted(
        uint256 indexed tokenId,
        address indexed investor,
        uint256 principal
    );

    function setUp() public {
        // Set due date to 30 days from now
        dueAt = block.timestamp + 30 days;

        // Deploy contracts
        vm.startPrank(admin);

        paymentToken = new MockUSDC();
        whitelist = new Whitelist(50); // Default batch size
        invoice = new Invoice(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            METADATA_BASE_URI,
            METADATA_EXTENSION,
            address(whitelist)
        );
        pool = new InvoiceFundingPool(
            address(paymentToken),
            address(invoice),
            GRACE_PERIOD_DAYS,
            address(whitelist),
            platformTreasury,
            PLATFORM_FEE_RATE
        );

        // Grant roles to Invoice contract - MINTER_ROLE goes to pool for two-step custody
        invoice.grantRole(invoice.MINTER_ROLE(), address(pool));
        invoice.grantRole(invoice.UPDATER_ROLE(), address(pool));
        invoice.grantRole(invoice.PAUSER_ROLE(), pauser);

        // Grant roles to Pool contract
        pool.grantRole(pool.PAUSER_ROLE(), pauser);

        // Whitelist investor and SMB for testing
        whitelist.addToWhitelist(investor, IWhitelist.Role.INVESTOR);
        whitelist.addToWhitelist(smb, IWhitelist.Role.SMB);

        vm.stopPrank();

        // Mint payment tokens to test accounts
        paymentToken.mint(investor, 1000000 * 10 ** 6); // 1M USDC
        paymentToken.mint(smb, 1000000 * 10 ** 6); // 1M USDC for repayments
    }

    // ============ Helper Functions ============

    /// @notice Helper to list and fund an invoice in one go (two-step process)
    function _listAndFundInvoice() internal returns (uint256 tokenId) {
        // Step 1: Platform lists
        vm.prank(admin);
        tokenId = pool.listInvoice(
            INVOICE_AMOUNT,
            dueAt,
            APR,
            smb,
            METADATA_URI
        );

        // Step 2: Investor funds
        vm.prank(investor);
        paymentToken.approve(address(pool), INVOICE_AMOUNT);
        vm.prank(investor);
        pool.fundInvoice(tokenId);
    }

    // ============ Constructor Tests ============

    function testConstructorSetsPaymentToken() public view {
        assertEq(
            address(pool.paymentToken()),
            address(paymentToken),
            'Payment token address should be set'
        );
    }

    function testConstructorSetsInvoice() public view {
        assertEq(
            address(pool.invoice()),
            address(invoice),
            'Invoice address should be set'
        );
    }

    function testRevertConstructorZeroPaymentToken() public {
        vm.expectRevert();
        new InvoiceFundingPool(
            address(0),
            address(invoice),
            GRACE_PERIOD_DAYS,
            address(whitelist),
            platformTreasury,
            PLATFORM_FEE_RATE
        );
    }

    function testRevertConstructorZeroInvoice() public {
        vm.expectRevert();
        new InvoiceFundingPool(
            address(paymentToken),
            address(0),
            GRACE_PERIOD_DAYS,
            address(whitelist),
            platformTreasury,
            PLATFORM_FEE_RATE
        );
    }

    function testRevertConstructorZeroGracePeriod() public {
        vm.expectRevert();
        new InvoiceFundingPool(
            address(paymentToken),
            address(invoice),
            0,
            address(whitelist),
            platformTreasury,
            PLATFORM_FEE_RATE
        );
    }

    function testConstructorSetsGracePeriod() public view {
        assertEq(
            pool.GRACE_PERIOD_DAYS(),
            GRACE_PERIOD_DAYS,
            'Grace period should be set'
        );
    }

    // ============ Listing Tests (Step 1 of Two-Step Custody) ============

    function testListInvoiceSuccess() public {
        // Platform lists invoice
        vm.prank(admin);
        vm.expectEmit(true, true, false, true);
        emit InvoiceListed(1, smb, INVOICE_AMOUNT, dueAt, APR);

        uint256 tokenId = pool.listInvoice(
            INVOICE_AMOUNT,
            dueAt,
            APR,
            smb,
            METADATA_URI
        );

        // Check tokenId is 1 (first mint)
        assertEq(tokenId, 1, 'Token ID should be 1');

        // Check NFT is owned by contract
        assertEq(
            invoice.ownerOf(tokenId),
            address(pool),
            'Contract should own NFT'
        );

        // Check status is LISTED
        IInvoice.InvoiceData memory data = invoice.getInvoice(tokenId);
        assertEq(
            uint8(data.status),
            uint8(IInvoice.Status.LISTED),
            'Status should be LISTED'
        );

        // Check issuer is recorded
        assertEq(pool.invoiceIssuer(tokenId), smb, 'Issuer should be recorded');

        // Check invoice data stored correctly
        assertEq(data.amount, INVOICE_AMOUNT, 'Amount should match');
        assertEq(
            data.paymentToken,
            address(paymentToken),
            'Payment token should match'
        );
        assertEq(data.dueAt, dueAt, 'Due date should match');
        assertEq(data.apr, APR, 'APR should match');
        assertEq(data.issuer, smb, 'Issuer should match');
        assertEq(data.uri, METADATA_URI, 'Metadata URI should match');
    }

    function testRevertListInvoiceNotOperator() public {
        // Non-operator tries to list invoice
        vm.prank(investor);
        vm.expectRevert();
        pool.listInvoice(INVOICE_AMOUNT, dueAt, APR, smb, METADATA_URI);
    }

    function testRevertListInvoiceZeroAmount() public {
        vm.prank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IInvoiceFundingPool.InvalidAmount.selector,
                0
            )
        );
        pool.listInvoice(0, dueAt, APR, smb, METADATA_URI);
    }

    function testRevertListInvoiceInvalidIssuer() public {
        vm.prank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IInvoiceFundingPool.InvalidIssuer.selector,
                address(0)
            )
        );
        pool.listInvoice(INVOICE_AMOUNT, dueAt, APR, address(0), METADATA_URI);
    }

    function testRevertListInvoiceIssuerNotWhitelisted() public {
        address nonWhitelistedSMB = address(99);
        vm.prank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IInvoiceFundingPool.IssuerNotWhitelisted.selector,
                nonWhitelistedSMB
            )
        );
        pool.listInvoice(
            INVOICE_AMOUNT,
            dueAt,
            APR,
            nonWhitelistedSMB,
            METADATA_URI
        );
    }

    // ============ Funding Tests (Step 2 of Two-Step Custody) ============

    function testFundInvoiceSuccess() public {
        // Step 1: Platform lists invoice
        vm.prank(admin);
        uint256 tokenId = pool.listInvoice(
            INVOICE_AMOUNT,
            dueAt,
            APR,
            smb,
            METADATA_URI
        );

        // Step 2: Investor funds invoice
        vm.prank(investor);
        paymentToken.approve(address(pool), INVOICE_AMOUNT);

        vm.prank(investor);
        vm.expectEmit(true, true, false, true);
        emit InvoiceFunded(tokenId, investor, INVOICE_AMOUNT);

        uint256 returnedTokenId = pool.fundInvoice(tokenId);

        // Check returned tokenId matches
        assertEq(returnedTokenId, tokenId, 'Returned token ID should match');

        // Check investor is recorded
        assertEq(
            pool.invoiceInvestor(tokenId),
            investor,
            'Investor should be recorded'
        );
        assertEq(
            pool.fundedAmounts(tokenId),
            INVOICE_AMOUNT,
            'Funded amount should be recorded'
        );

        // Check NFT transferred to investor
        assertEq(invoice.ownerOf(tokenId), investor, 'Investor should own NFT');

        // Check status updated to FUNDED
        IInvoice.InvoiceData memory data = invoice.getInvoice(tokenId);
        assertEq(
            uint8(data.status),
            uint8(IInvoice.Status.FUNDED),
            'Status should be FUNDED'
        );
    }

    function testFundInvoiceTransfersUSDCToSMB() public {
        // Step 1: Platform lists invoice
        vm.prank(admin);
        uint256 tokenId = pool.listInvoice(
            INVOICE_AMOUNT,
            dueAt,
            APR,
            smb,
            METADATA_URI
        );

        // Step 2: Investor funds invoice
        uint256 smbBalanceBefore = paymentToken.balanceOf(smb);

        vm.prank(investor);
        paymentToken.approve(address(pool), INVOICE_AMOUNT);
        vm.prank(investor);
        pool.fundInvoice(tokenId);

        uint256 smbBalanceAfter = paymentToken.balanceOf(smb);

        assertEq(
            smbBalanceAfter - smbBalanceBefore,
            INVOICE_AMOUNT,
            'SMB should receive USDC'
        );
    }

    function testFundInvoiceTransfersNFTFromContractToInvestor() public {
        // Step 1: Platform lists invoice
        vm.prank(admin);
        uint256 tokenId = pool.listInvoice(
            INVOICE_AMOUNT,
            dueAt,
            APR,
            smb,
            METADATA_URI
        );

        // Check NFT owned by contract initially
        assertEq(
            invoice.ownerOf(tokenId),
            address(pool),
            'Contract should own NFT initially'
        );

        // Step 2: Investor funds invoice
        vm.prank(investor);
        paymentToken.approve(address(pool), INVOICE_AMOUNT);
        vm.prank(investor);
        pool.fundInvoice(tokenId);

        // Check NFT transferred to investor
        assertEq(
            invoice.ownerOf(tokenId),
            investor,
            'Investor should own NFT after funding'
        );

        // Check invoice data matches
        IInvoice.InvoiceData memory data = invoice.getInvoice(tokenId);
        assertEq(data.amount, INVOICE_AMOUNT, 'Amount should match');
        assertEq(
            data.paymentToken,
            address(paymentToken),
            'Payment token should match'
        );
        assertEq(data.dueAt, dueAt, 'Due date should match');
        assertEq(data.apr, APR, 'APR should match');
        assertEq(data.issuer, smb, 'Issuer should match');
        assertEq(data.uri, METADATA_URI, 'Metadata URI should match');
    }

    function testFundMultipleInvoicesIncrementingTokenIds() public {
        // List multiple invoices
        vm.startPrank(admin);
        uint256 token1 = pool.listInvoice(
            INVOICE_AMOUNT,
            dueAt,
            APR,
            smb,
            'ipfs://1'
        );
        uint256 token2 = pool.listInvoice(
            INVOICE_AMOUNT,
            dueAt,
            APR,
            smb,
            'ipfs://2'
        );
        uint256 token3 = pool.listInvoice(
            INVOICE_AMOUNT,
            dueAt,
            APR,
            smb,
            'ipfs://3'
        );
        vm.stopPrank();

        assertEq(token1, 1, 'First token should be ID 1');
        assertEq(token2, 2, 'Second token should be ID 2');
        assertEq(token3, 3, 'Third token should be ID 3');

        // Fund all three invoices
        vm.startPrank(investor);
        paymentToken.approve(address(pool), INVOICE_AMOUNT * 3);
        pool.fundInvoice(token1);
        pool.fundInvoice(token2);
        pool.fundInvoice(token3);
        vm.stopPrank();

        // All owned by investor
        assertEq(
            invoice.ownerOf(token1),
            investor,
            'Token 1 owned by investor'
        );
        assertEq(
            invoice.ownerOf(token2),
            investor,
            'Token 2 owned by investor'
        );
        assertEq(
            invoice.ownerOf(token3),
            investor,
            'Token 3 owned by investor'
        );
    }

    function testRevertFundInvoiceInsufficientAllowance() public {
        // List invoice
        vm.prank(admin);
        uint256 tokenId = pool.listInvoice(
            INVOICE_AMOUNT,
            dueAt,
            APR,
            smb,
            METADATA_URI
        );

        // Try to fund without USDC approval
        vm.prank(investor);
        vm.expectRevert();
        pool.fundInvoice(tokenId);
    }

    function testRevertFundInvoiceNotListed() public {
        // Try to fund non-existent invoice
        vm.prank(investor);
        paymentToken.approve(address(pool), INVOICE_AMOUNT);
        vm.prank(investor);
        vm.expectRevert();
        pool.fundInvoice(999);
    }

    function testRevertFundInvoiceInvestorNotWhitelisted() public {
        // List invoice
        vm.prank(admin);
        uint256 tokenId = pool.listInvoice(
            INVOICE_AMOUNT,
            dueAt,
            APR,
            smb,
            METADATA_URI
        );

        // Non-whitelisted investor tries to fund
        address nonWhitelistedInvestor = address(88);
        paymentToken.mint(nonWhitelistedInvestor, INVOICE_AMOUNT);

        vm.prank(nonWhitelistedInvestor);
        paymentToken.approve(address(pool), INVOICE_AMOUNT);
        vm.prank(nonWhitelistedInvestor);
        vm.expectRevert(
            abi.encodeWithSelector(
                IInvoiceFundingPool.InvestorNotWhitelisted.selector,
                nonWhitelistedInvestor
            )
        );
        pool.fundInvoice(tokenId);
    }

    // ============ Repayment Deposit Tests ============

    function testDepositRepaymentSuccess() public {
        // List and fund invoice (two-step)
        uint256 tokenId = _listAndFundInvoice();

        // Calculate expected repayment
        uint256 fundingTime = pool.fundingTimestamps(tokenId);
        (uint256 totalYield, , ) = pool.calculateYield(
            INVOICE_AMOUNT,
            APR,
            dueAt,
            fundingTime
        );
        uint256 totalRepayment = INVOICE_AMOUNT + totalYield;

        // SMB deposits repayment
        vm.prank(smb);
        paymentToken.approve(address(pool), totalRepayment);

        vm.prank(smb);
        vm.expectEmit(true, true, false, true);
        emit RepaymentDeposited(tokenId, smb, totalRepayment);

        pool.depositRepayment(tokenId);

        assertEq(
            pool.repaymentPool(tokenId),
            totalRepayment,
            'Repayment should be deposited'
        );
    }

    function testDepositRepaymentCalculatesYield() public {
        // List and fund invoice (two-step)
        uint256 tokenId = _listAndFundInvoice();

        // Calculate yield: principal * apr * days / (10000 * 365)
        // 10,000 USDC * 1200 * 30 / (10000 * 365) = 98.63 USDC
        uint256 expectedYield = (INVOICE_AMOUNT * APR * 30) / (10000 * 365);
        uint256 totalRepayment = INVOICE_AMOUNT + expectedYield;

        vm.prank(smb);
        paymentToken.approve(address(pool), totalRepayment);
        vm.prank(smb);
        pool.depositRepayment(tokenId);

        assertEq(
            pool.repaymentPool(tokenId),
            totalRepayment,
            'Should include yield'
        );
    }

    function testRevertDepositRepaymentNotFunded() public {
        // Try to deposit repayment for non-existent invoice (tokenId 999)
        vm.prank(smb);
        vm.expectRevert();
        pool.depositRepayment(999);
    }

    function testRevertDepositRepaymentAlreadyDeposited() public {
        // List and fund invoice (two-step)
        uint256 tokenId = _listAndFundInvoice();

        // Deposit repayment
        uint256 fundingTime = pool.fundingTimestamps(tokenId);
        (uint256 totalYield, , ) = pool.calculateYield(
            INVOICE_AMOUNT,
            APR,
            dueAt,
            fundingTime
        );
        uint256 totalRepayment = INVOICE_AMOUNT + totalYield;

        vm.prank(smb);
        paymentToken.approve(address(pool), totalRepayment * 2);
        vm.prank(smb);
        pool.depositRepayment(tokenId);

        // Try to deposit again (should fail because status is now FULLY_PAID, not FUNDED)
        vm.prank(smb);
        vm.expectRevert(
            abi.encodeWithSelector(
                IInvoiceFundingPool.InvoiceNotFunded.selector,
                tokenId,
                uint8(IInvoice.Status.FULLY_PAID)
            )
        );
        pool.depositRepayment(tokenId);
    }

    // ============ Repayment Settlement Tests ============

    function testSettleRepaymentSuccess() public {
        // List and fund invoice (two-step)
        uint256 tokenId = _listAndFundInvoice();

        // Deposit repayment
        uint256 fundingTime = pool.fundingTimestamps(tokenId);
        (uint256 totalYield, uint256 investorYield, ) = pool.calculateYield(
            INVOICE_AMOUNT,
            APR,
            dueAt,
            fundingTime
        );
        uint256 totalRepayment = INVOICE_AMOUNT + totalYield;
        uint256 expectedInvestorAmount = INVOICE_AMOUNT + investorYield;

        vm.prank(smb);
        paymentToken.approve(address(pool), totalRepayment);
        vm.prank(smb);
        pool.depositRepayment(tokenId);

        // Settle repayment
        vm.prank(admin);
        vm.expectEmit(true, true, false, true);
        emit InvoiceRepaid(tokenId, investor, expectedInvestorAmount);

        pool.settleRepayment(tokenId);

        // Check repayment pool cleared
        assertEq(
            pool.repaymentPool(tokenId),
            0,
            'Repayment pool should be cleared'
        );

        // Check status updated to REPAID
        IInvoice.InvoiceData memory data = invoice.getInvoice(tokenId);
        assertEq(
            uint8(data.status),
            uint8(IInvoice.Status.SETTLED),
            'Status should be SETTLED'
        );
    }

    function testSettleRepaymentTransfersToInvestor() public {
        // List and fund invoice (two-step)
        uint256 tokenId = _listAndFundInvoice();

        // Deposit repayment
        uint256 fundingTime = pool.fundingTimestamps(tokenId);
        (uint256 totalYield, , ) = pool.calculateYield(
            INVOICE_AMOUNT,
            APR,
            dueAt,
            fundingTime
        );
        uint256 totalRepayment = INVOICE_AMOUNT + totalYield;

        vm.prank(smb);
        paymentToken.approve(address(pool), totalRepayment);
        vm.prank(smb);
        pool.depositRepayment(tokenId);

        uint256 investorBalanceBefore = paymentToken.balanceOf(investor);
        uint256 treasuryBalanceBefore = paymentToken.balanceOf(
            platformTreasury
        );

        // Calculate expected distribution
        (, uint256 investorYield, uint256 platformFee) = pool.calculateYield(
            INVOICE_AMOUNT,
            APR,
            dueAt,
            fundingTime
        );
        uint256 expectedInvestorAmount = INVOICE_AMOUNT + investorYield;

        // Settle repayment
        vm.prank(admin);
        pool.settleRepayment(tokenId);

        uint256 investorBalanceAfter = paymentToken.balanceOf(investor);
        uint256 treasuryBalanceAfter = paymentToken.balanceOf(platformTreasury);

        assertEq(
            investorBalanceAfter - investorBalanceBefore,
            expectedInvestorAmount,
            'Investor should receive principal + investor yield (70% of yield)'
        );

        assertEq(
            treasuryBalanceAfter - treasuryBalanceBefore,
            platformFee,
            'Platform treasury should receive platform fee (30% of yield)'
        );
    }

    function testRevertSettleRepaymentNoDeposit() public {
        // List and fund invoice (two-step)
        uint256 tokenId = _listAndFundInvoice();

        // Try to settle without depositing repayment
        vm.prank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IInvoiceFundingPool.NoRepaymentDeposited.selector,
                tokenId
            )
        );
        pool.settleRepayment(tokenId);
    }

    function testRevertSettleRepaymentWithoutAdminRole() public {
        // List and fund invoice (two-step)
        uint256 tokenId = _listAndFundInvoice();

        uint256 fundingTime = pool.fundingTimestamps(tokenId);
        (uint256 totalYield, , ) = pool.calculateYield(
            INVOICE_AMOUNT,
            APR,
            dueAt,
            fundingTime
        );
        uint256 totalRepayment = INVOICE_AMOUNT + totalYield;

        vm.prank(smb);
        paymentToken.approve(address(pool), totalRepayment);
        vm.prank(smb);
        pool.depositRepayment(tokenId);

        // Try to settle without admin role
        vm.prank(investor);
        vm.expectRevert();
        pool.settleRepayment(tokenId);
    }

    // ============ Default Handling Tests ============

    function testMarkDefaultedSuccess() public {
        // List and fund invoice (two-step)
        uint256 tokenId = _listAndFundInvoice();

        // Fast forward past grace period (due date + 30 days)
        vm.warp(dueAt + 31 days);

        // Mark as defaulted
        vm.prank(admin);
        vm.expectEmit(true, true, false, true);
        emit InvoiceDefaulted(tokenId, investor, INVOICE_AMOUNT);

        pool.markDefaulted(tokenId);

        // Check status
        IInvoice.InvoiceData memory data = invoice.getInvoice(tokenId);
        assertEq(
            uint8(data.status),
            uint8(IInvoice.Status.DEFAULTED),
            'Status should be DEFAULTED'
        );
    }

    function testRevertMarkDefaultedBeforeGracePeriod() public {
        // List and fund invoice (two-step)
        uint256 tokenId = _listAndFundInvoice();

        // Fast forward to just before grace period ends
        vm.warp(dueAt + 29 days);

        // Try to mark as defaulted
        vm.prank(admin);
        vm.expectRevert(); // GracePeriodNotElapsed error with dynamic values
        pool.markDefaulted(tokenId);
    }

    function testRevertMarkDefaultedNotFunded() public {
        // Try to mark non-existent invoice as defaulted
        vm.prank(admin);
        vm.expectRevert();
        pool.markDefaulted(999);
    }

    function testRevertMarkDefaultedWithRepayment() public {
        // List and fund invoice (two-step)
        uint256 tokenId = _listAndFundInvoice();

        // Deposit repayment
        uint256 fundingTime = pool.fundingTimestamps(tokenId);
        (uint256 totalYield, , ) = pool.calculateYield(
            INVOICE_AMOUNT,
            APR,
            dueAt,
            fundingTime
        );
        uint256 totalRepayment = INVOICE_AMOUNT + totalYield;

        vm.prank(smb);
        paymentToken.approve(address(pool), totalRepayment);
        vm.prank(smb);
        pool.depositRepayment(tokenId);

        // Fast forward past grace period
        vm.warp(dueAt + 31 days);

        // Try to mark as defaulted (should fail because status is now FULLY_PAID, not FUNDED)
        vm.prank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IInvoiceFundingPool.InvoiceNotFunded.selector,
                tokenId,
                uint8(IInvoice.Status.FULLY_PAID)
            )
        );
        pool.markDefaulted(tokenId);
    }

    function testRevertMarkDefaultedWithoutAdminRole() public {
        // List and fund invoice (two-step)
        uint256 tokenId = _listAndFundInvoice();

        // Fast forward past grace period
        vm.warp(dueAt + 31 days);

        // Try to mark as defaulted without admin role
        vm.prank(investor);
        vm.expectRevert();
        pool.markDefaulted(tokenId);
    }

    // ============ Yield Calculation Tests ============

    function testCalculateYield30Days() public view {
        // 10,000 USDC * 12% APR * 30 days / 365 days = 98.63 USDC
        uint256 fundingTime = block.timestamp;
        (uint256 totalYield, , ) = pool.calculateYield(
            INVOICE_AMOUNT,
            APR,
            dueAt,
            fundingTime
        );
        uint256 expectedYield = (INVOICE_AMOUNT * APR * 30) / (10000 * 365);
        assertEq(totalYield, expectedYield, '30-day yield should be correct');
    }

    function testCalculateYield60Days() public view {
        uint256 fundingTime = block.timestamp;
        uint256 dueAt60 = block.timestamp + 60 days;

        // 10,000 USDC * 12% APR * 60 days / 365 days = 197.26 USDC
        (uint256 totalYield, , ) = pool.calculateYield(
            INVOICE_AMOUNT,
            APR,
            dueAt60,
            fundingTime
        );
        uint256 expectedYield = (INVOICE_AMOUNT * APR * 60) / (10000 * 365);
        assertEq(totalYield, expectedYield, '60-day yield should be correct');
    }

    function testCalculateYieldZeroAPR() public view {
        uint256 fundingTime = block.timestamp;
        (uint256 totalYield, , ) = pool.calculateYield(
            INVOICE_AMOUNT,
            0,
            dueAt,
            fundingTime
        );
        assertEq(totalYield, 0, 'Zero APR should give zero yield');
    }

    function testCalculateYieldHighAPR() public view {
        // 25% APR = 2500 basis points
        uint256 fundingTime = block.timestamp;
        uint256 highAPR = 2500;
        (uint256 totalYield, , ) = pool.calculateYield(
            INVOICE_AMOUNT,
            highAPR,
            dueAt,
            fundingTime
        );
        uint256 expectedYield = (INVOICE_AMOUNT * highAPR * 30) / (10000 * 365);
        assertEq(totalYield, expectedYield, 'High APR yield should be correct');
    }

    // ============ View Function Tests ============

    function testGetFundingInfoUnfunded() public view {
        // Query non-existent invoice
        (
            address investor_,
            uint256 principal,
            uint256 repaymentAmount,
            uint256 fundingTime
        ) = pool.getFundingInfo(999);

        assertEq(investor_, address(0), 'Investor should be zero address');
        assertEq(principal, 0, 'Principal should be zero');
        assertEq(repaymentAmount, 0, 'Repayment should be zero');
        assertEq(fundingTime, 0, 'Funding time should be zero');
    }

    function testGetFundingInfoFunded() public {
        // List and fund invoice (two-step)
        uint256 tokenId = _listAndFundInvoice();

        (
            address investor_,
            uint256 principal,
            uint256 repaymentAmount,
            uint256 fundingTime
        ) = pool.getFundingInfo(tokenId);

        assertEq(investor_, investor, 'Investor should be recorded');
        assertEq(principal, INVOICE_AMOUNT, 'Principal should match');
        assertEq(repaymentAmount, 0, 'Repayment should be zero');
        assertGt(fundingTime, 0, 'Funding time should be recorded');
    }

    function testGetFundingInfoWithRepayment() public {
        // List and fund invoice (two-step)
        uint256 tokenId = _listAndFundInvoice();

        // Deposit repayment
        uint256 fundingTimestamp = pool.fundingTimestamps(tokenId);
        (uint256 totalYield, , ) = pool.calculateYield(
            INVOICE_AMOUNT,
            APR,
            dueAt,
            fundingTimestamp
        );
        uint256 totalRepayment = INVOICE_AMOUNT + totalYield;

        vm.prank(smb);
        paymentToken.approve(address(pool), totalRepayment);
        vm.prank(smb);
        pool.depositRepayment(tokenId);

        (
            address investor_,
            uint256 principal,
            uint256 repaymentAmount,
            uint256 fundingTime
        ) = pool.getFundingInfo(tokenId);

        assertEq(investor_, investor, 'Investor should be recorded');
        assertEq(principal, INVOICE_AMOUNT, 'Principal should match');
        assertEq(
            repaymentAmount,
            totalRepayment,
            'Repayment should be recorded'
        );
        assertEq(fundingTime, fundingTimestamp, 'Funding time should match');
    }

    function testIsOverdueNotFunded() public {
        // Check non-existent invoice - should revert
        vm.expectRevert();
        pool.isOverdue(999);
    }

    function testIsOverdueNotOverdue() public {
        // List and fund invoice (two-step)
        uint256 tokenId = _listAndFundInvoice();

        // Check before grace period
        vm.warp(dueAt + 15 days);

        bool overdue = pool.isOverdue(tokenId);
        assertFalse(overdue, 'Should not be overdue during grace period');
    }

    function testIsOverdueAfterGracePeriod() public {
        // List and fund invoice (two-step)
        uint256 tokenId = _listAndFundInvoice();

        // Fast forward past grace period
        vm.warp(dueAt + 31 days);

        bool overdue = pool.isOverdue(tokenId);
        assertTrue(overdue, 'Should be overdue after grace period');
    }

    // ============ Access Control Tests ============

    function testGrantAdminRole() public {
        address newAdmin = address(7);

        vm.startPrank(admin);
        pool.grantRole(pool.OPERATOR_ROLE(), newAdmin);
        vm.stopPrank();

        assertTrue(
            pool.hasRole(pool.OPERATOR_ROLE(), newAdmin),
            'Should have operator role'
        );
    }

    function testRevokeAdminRole() public {
        vm.startPrank(admin);
        pool.revokeRole(pool.OPERATOR_ROLE(), admin);
        vm.stopPrank();

        assertFalse(
            pool.hasRole(pool.OPERATOR_ROLE(), admin),
            'Should not have operator role'
        );
    }

    // ============ Pausable Tests ============

    function testPauseFunding() public {
        // List invoice first
        vm.prank(admin);
        uint256 tokenId = pool.listInvoice(
            INVOICE_AMOUNT,
            dueAt,
            APR,
            smb,
            METADATA_URI
        );

        // Pause contract
        vm.prank(pauser);
        pool.pause();

        // Try to fund (should fail due to pause)
        vm.prank(investor);
        paymentToken.approve(address(pool), INVOICE_AMOUNT);
        vm.prank(investor);
        vm.expectRevert();
        pool.fundInvoice(tokenId);
    }

    function testPauseRepayment() public {
        // List and fund invoice (two-step)
        uint256 tokenId = _listAndFundInvoice();

        // Pause contract
        vm.prank(pauser);
        pool.pause();

        // Try to deposit repayment (should fail)
        uint256 fundingTime = pool.fundingTimestamps(tokenId);
        (uint256 totalYield, , ) = pool.calculateYield(
            INVOICE_AMOUNT,
            APR,
            dueAt,
            fundingTime
        );
        uint256 totalRepayment = INVOICE_AMOUNT + totalYield;

        vm.prank(smb);
        paymentToken.approve(address(pool), totalRepayment);

        vm.prank(smb);
        vm.expectRevert();
        pool.depositRepayment(tokenId);
    }

    function testUnpause() public {
        // Pause and unpause
        vm.startPrank(pauser);
        pool.pause();
        pool.unpause();
        vm.stopPrank();

        // Funding should work after unpause (two-step)
        uint256 tokenId = _listAndFundInvoice();

        assertEq(
            pool.invoiceInvestor(tokenId),
            investor,
            'Should fund successfully after unpause'
        );
    }

    function testRevertPauseWithoutPauserRole() public {
        vm.prank(investor);
        vm.expectRevert();
        pool.pause();
    }

    // ============ Edge Cases ============

    function testCompleteLifecycle() public {
        // 1. List and fund (two-step custody)
        uint256 tokenId = _listAndFundInvoice();

        IInvoice.InvoiceData memory data1 = invoice.getInvoice(tokenId);
        assertEq(
            uint8(data1.status),
            uint8(IInvoice.Status.FUNDED),
            'Should be FUNDED'
        );

        // 2. Deposit repayment
        uint256 fundingTime = pool.fundingTimestamps(tokenId);
        (uint256 totalYield, , ) = pool.calculateYield(
            INVOICE_AMOUNT,
            APR,
            dueAt,
            fundingTime
        );
        uint256 totalRepayment = INVOICE_AMOUNT + totalYield;

        vm.prank(smb);
        paymentToken.approve(address(pool), totalRepayment);
        vm.prank(smb);
        pool.depositRepayment(tokenId);

        // 3. Settle repayment
        vm.prank(admin);
        pool.settleRepayment(tokenId);

        IInvoice.InvoiceData memory data2 = invoice.getInvoice(tokenId);
        assertEq(
            uint8(data2.status),
            uint8(IInvoice.Status.SETTLED),
            'Should be REPAID'
        );

        // Check investor received funds
        assertTrue(
            paymentToken.balanceOf(investor) >= totalRepayment,
            'Investor should receive repayment'
        );
    }

    function testYieldRemainsConstantOverTime() public {
        // List and fund invoice with 30-day term (two-step)
        uint256 tokenId = _listAndFundInvoice();

        // Calculate yield immediately after funding
        uint256 fundingTime = pool.fundingTimestamps(tokenId);
        (uint256 yieldAtFunding, , ) = pool.calculateYield(
            INVOICE_AMOUNT,
            APR,
            dueAt,
            fundingTime
        );

        // Fast forward 15 days (halfway through the term)
        vm.warp(block.timestamp + 15 days);

        // Calculate yield again - should be the same!
        (uint256 yieldAfter15Days, , ) = pool.calculateYield(
            INVOICE_AMOUNT,
            APR,
            dueAt,
            fundingTime
        );

        // Fast forward to due date
        vm.warp(dueAt);

        // Calculate yield at due date - should still be the same!
        (uint256 yieldAtDueDate, , ) = pool.calculateYield(
            INVOICE_AMOUNT,
            APR,
            dueAt,
            fundingTime
        );

        // All yields should be equal (based on full 30-day term)
        assertEq(
            yieldAtFunding,
            yieldAfter15Days,
            'Yield should not change after 15 days'
        );
        assertEq(
            yieldAtFunding,
            yieldAtDueDate,
            'Yield should not change at due date'
        );

        // Expected yield: 10,000 USDC * 12% * 30 days / 365 days
        uint256 expectedYield = (INVOICE_AMOUNT * APR * 30) / (10000 * 365);
        assertEq(
            yieldAtFunding,
            expectedYield,
            'Yield should be based on full 30-day term'
        );
    }

    function testDepositRepaymentAfterDueDateUsesOriginalTerm() public {
        // List and fund invoice with 30-day term (two-step)
        uint256 tokenId = _listAndFundInvoice();

        // Fast forward past the due date (to day 35)
        vm.warp(dueAt + 5 days);

        // Deposit repayment late
        uint256 fundingTime = pool.fundingTimestamps(tokenId);
        (uint256 totalYield, , ) = pool.calculateYield(
            INVOICE_AMOUNT,
            APR,
            dueAt,
            fundingTime
        );

        // Yield should still be based on the original 30-day term, not negative or zero
        uint256 expectedYield = (INVOICE_AMOUNT * APR * 30) / (10000 * 365);
        assertEq(
            totalYield,
            expectedYield,
            'Late repayment should use original term'
        );

        // Should be able to deposit the calculated repayment
        uint256 totalRepayment = INVOICE_AMOUNT + totalYield;
        vm.prank(smb);
        paymentToken.approve(address(pool), totalRepayment);
        vm.prank(smb);
        pool.depositRepayment(tokenId);

        // Verify repayment was deposited correctly
        assertEq(
            pool.repaymentPool(tokenId),
            totalRepayment,
            'Repayment should be deposited'
        );
    }
}
