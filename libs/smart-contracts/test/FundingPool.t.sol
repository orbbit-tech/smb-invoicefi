// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/FundingPool.sol";
import "../contracts/InvoiceNFT.sol";
import "../contracts/mocks/MockUSDC.sol";

/**
 * @title FundingPoolTest
 * @notice Foundry unit tests for FundingPool contract
 */
contract FundingPoolTest is Test {
    FundingPool public fundingPool;
    InvoiceNFT public invoiceNFT;
    MockUSDC public usdc;

    address public admin = address(1);
    address public investor1 = address(2);
    address public investor2 = address(3);
    address public investor3 = address(4);
    address public user = address(5);

    // Sample invoice data
    uint256 constant INVOICE_AMOUNT = 10000 * 10**6; // 10,000 USDC
    uint256 constant DUE_DATE = 1735689600; // Jan 1, 2025
    uint8 constant RISK_SCORE = 25;
    string constant PAYER = "Acme Corp";
    string constant INVOICE_NUMBER = "INV-001";
    string constant TOKEN_URI = "ipfs://QmTest123";

    // Funding amounts
    uint256 constant DEPOSIT_1 = 3000 * 10**6; // 3,000 USDC (30%)
    uint256 constant DEPOSIT_2 = 5000 * 10**6; // 5,000 USDC (50%)
    uint256 constant DEPOSIT_3 = 2000 * 10**6; // 2,000 USDC (20%)

    event FundingReceived(
        uint256 indexed tokenId,
        address indexed investor,
        uint256 amount,
        uint256 totalFunded
    );

    event InvoiceFullyFunded(uint256 indexed tokenId, uint256 totalFunded);

    event RepaymentExecuted(
        uint256 indexed tokenId,
        uint256 repaymentAmount,
        uint256 investorCount
    );

    event YieldDistributed(
        uint256 indexed tokenId,
        address indexed investor,
        uint256 principalShare,
        uint256 payout
    );

    event InvestmentWithdrawn(
        uint256 indexed tokenId,
        address indexed investor,
        uint256 amount
    );

    function setUp() public {
        // Deploy contracts
        vm.startPrank(admin);
        usdc = new MockUSDC();
        invoiceNFT = new InvoiceNFT();
        fundingPool = new FundingPool(address(usdc), address(invoiceNFT));

        // Grant roles
        invoiceNFT.grantRole(invoiceNFT.MINTER_ROLE(), admin);
        invoiceNFT.grantRole(invoiceNFT.UPDATER_ROLE(), address(fundingPool));
        vm.stopPrank();

        // Mint USDC to investors
        usdc.mint(investor1, 50000 * 10**6);
        usdc.mint(investor2, 50000 * 10**6);
        usdc.mint(investor3, 50000 * 10**6);
        usdc.mint(admin, 100000 * 10**6);
    }

    function _createAndListInvoice() internal returns (uint256) {
        vm.prank(admin);
        uint256 tokenId = invoiceNFT.mint(
            admin,
            INVOICE_AMOUNT,
            DUE_DATE,
            RISK_SCORE,
            PAYER,
            INVOICE_NUMBER,
            TOKEN_URI
        );

        vm.prank(admin);
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Listed);

        return tokenId;
    }

    // ============ Deposit Tests ============

    function testDepositUSDCSuccess() public {
        uint256 tokenId = _createAndListInvoice();

        vm.startPrank(investor1);
        usdc.approve(address(fundingPool), DEPOSIT_1);

        vm.expectEmit(true, true, false, true);
        emit FundingReceived(tokenId, investor1, DEPOSIT_1, DEPOSIT_1);

        fundingPool.depositUSDC(tokenId, DEPOSIT_1);
        vm.stopPrank();

        // Check funding info
        (uint256 targetAmount, uint256 totalFunded, uint256 investorCount, bool isRepaid) =
            fundingPool.getFundingInfo(tokenId);

        assertEq(targetAmount, INVOICE_AMOUNT, "Target amount should match");
        assertEq(totalFunded, DEPOSIT_1, "Total funded should match deposit");
        assertEq(investorCount, 1, "Should have 1 investor");
        assertFalse(isRepaid, "Should not be repaid");

        // Check investor share
        uint256 share = fundingPool.getInvestorShare(tokenId, investor1);
        assertEq(share, DEPOSIT_1, "Investor share should match deposit");

        // Check USDC balance
        assertEq(usdc.balanceOf(address(fundingPool)), DEPOSIT_1, "Pool should hold USDC");
    }

    function testDepositUSDCPartiallyFunded() public {
        uint256 tokenId = _createAndListInvoice();

        vm.prank(investor1);
        usdc.approve(address(fundingPool), DEPOSIT_1);
        vm.prank(investor1);
        fundingPool.depositUSDC(tokenId, DEPOSIT_1);

        // Check status changed to PartiallyFunded
        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(uint8(invoice.status), uint8(InvoiceNFT.Status.PartiallyFunded), "Should be PartiallyFunded");
    }

    function testDepositUSDCFullyFunded() public {
        uint256 tokenId = _createAndListInvoice();

        // Three investors fund the full amount
        vm.startPrank(investor1);
        usdc.approve(address(fundingPool), DEPOSIT_1);
        fundingPool.depositUSDC(tokenId, DEPOSIT_1);
        vm.stopPrank();

        vm.startPrank(investor2);
        usdc.approve(address(fundingPool), DEPOSIT_2);
        fundingPool.depositUSDC(tokenId, DEPOSIT_2);
        vm.stopPrank();

        vm.startPrank(investor3);
        usdc.approve(address(fundingPool), DEPOSIT_3);

        vm.expectEmit(true, false, false, true);
        emit InvoiceFullyFunded(tokenId, INVOICE_AMOUNT);

        fundingPool.depositUSDC(tokenId, DEPOSIT_3);
        vm.stopPrank();

        // Check funding info
        (, uint256 totalFunded, uint256 investorCount,) = fundingPool.getFundingInfo(tokenId);
        assertEq(totalFunded, INVOICE_AMOUNT, "Should be fully funded");
        assertEq(investorCount, 3, "Should have 3 investors");

        // Check status
        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(uint8(invoice.status), uint8(InvoiceNFT.Status.FullyFunded), "Should be FullyFunded");
    }

    function testDepositUSDCMultipleDepositsFromSameInvestor() public {
        uint256 tokenId = _createAndListInvoice();

        vm.startPrank(investor1);
        usdc.approve(address(fundingPool), DEPOSIT_1 + DEPOSIT_2);
        fundingPool.depositUSDC(tokenId, DEPOSIT_1);
        fundingPool.depositUSDC(tokenId, DEPOSIT_2);
        vm.stopPrank();

        // Should track cumulative share
        uint256 share = fundingPool.getInvestorShare(tokenId, investor1);
        assertEq(share, DEPOSIT_1 + DEPOSIT_2, "Should accumulate shares");

        // Should not duplicate in investors array
        (, , uint256 investorCount,) = fundingPool.getFundingInfo(tokenId);
        assertEq(investorCount, 1, "Should still be 1 investor");
    }

    function testRevertDepositZeroAmount() public {
        uint256 tokenId = _createAndListInvoice();

        vm.prank(investor1);
        vm.expectRevert("Amount must be greater than 0");
        fundingPool.depositUSDC(tokenId, 0);
    }

    function testRevertDepositNotListed() public {
        vm.prank(admin);
        uint256 tokenId = invoiceNFT.mint(admin, INVOICE_AMOUNT, DUE_DATE, RISK_SCORE, PAYER, INVOICE_NUMBER, TOKEN_URI);
        // Not listed yet (still in Created status)

        vm.prank(investor1);
        usdc.approve(address(fundingPool), DEPOSIT_1);
        vm.prank(investor1);
        vm.expectRevert("Invoice not available for funding");
        fundingPool.depositUSDC(tokenId, DEPOSIT_1);
    }

    function testRevertDepositExceedsTarget() public {
        uint256 tokenId = _createAndListInvoice();

        vm.prank(investor1);
        usdc.approve(address(fundingPool), INVOICE_AMOUNT + 1);
        vm.prank(investor1);
        vm.expectRevert("Exceeds target amount");
        fundingPool.depositUSDC(tokenId, INVOICE_AMOUNT + 1);
    }

    function testRevertDepositWhenPaused() public {
        uint256 tokenId = _createAndListInvoice();

        vm.prank(admin);
        fundingPool.pause();

        vm.prank(investor1);
        usdc.approve(address(fundingPool), DEPOSIT_1);
        vm.prank(investor1);
        vm.expectRevert();
        fundingPool.depositUSDC(tokenId, DEPOSIT_1);
    }

    function testRevertDepositInsufficientUSDC() public {
        uint256 tokenId = _createAndListInvoice();

        address poorInvestor = address(6);
        // No USDC minted to poorInvestor

        vm.prank(poorInvestor);
        usdc.approve(address(fundingPool), DEPOSIT_1);
        vm.prank(poorInvestor);
        vm.expectRevert();
        fundingPool.depositUSDC(tokenId, DEPOSIT_1);
    }

    // ============ Repayment Tests ============

    function testTriggerRepaymentSuccess() public {
        uint256 tokenId = _createAndListInvoice();

        // Fully fund the invoice
        vm.prank(investor1);
        usdc.approve(address(fundingPool), DEPOSIT_1);
        vm.prank(investor1);
        fundingPool.depositUSDC(tokenId, DEPOSIT_1);

        vm.prank(investor2);
        usdc.approve(address(fundingPool), DEPOSIT_2);
        vm.prank(investor2);
        fundingPool.depositUSDC(tokenId, DEPOSIT_2);

        vm.prank(investor3);
        usdc.approve(address(fundingPool), DEPOSIT_3);
        vm.prank(investor3);
        fundingPool.depositUSDC(tokenId, DEPOSIT_3);

        // Repay with 10% yield
        uint256 repaymentAmount = INVOICE_AMOUNT * 110 / 100; // 11,000 USDC

        vm.startPrank(admin);
        usdc.approve(address(fundingPool), repaymentAmount);

        vm.expectEmit(true, false, false, true);
        emit RepaymentExecuted(tokenId, repaymentAmount, 3);

        fundingPool.triggerRepayment(tokenId, repaymentAmount);
        vm.stopPrank();

        // Check repaid status
        (,,, bool isRepaid) = fundingPool.getFundingInfo(tokenId);
        assertTrue(isRepaid, "Should be marked as repaid");

        // Check NFT status
        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(uint8(invoice.status), uint8(InvoiceNFT.Status.Repaid), "Should be Repaid");
    }

    function testTriggerRepaymentDistributesYieldPropotionally() public {
        uint256 tokenId = _createAndListInvoice();

        // Fund with known amounts
        vm.prank(investor1);
        usdc.approve(address(fundingPool), DEPOSIT_1);
        vm.prank(investor1);
        fundingPool.depositUSDC(tokenId, DEPOSIT_1); // 30%

        vm.prank(investor2);
        usdc.approve(address(fundingPool), DEPOSIT_2);
        vm.prank(investor2);
        fundingPool.depositUSDC(tokenId, DEPOSIT_2); // 50%

        vm.prank(investor3);
        usdc.approve(address(fundingPool), DEPOSIT_3);
        vm.prank(investor3);
        fundingPool.depositUSDC(tokenId, DEPOSIT_3); // 20%

        uint256 investor1BalanceBefore = usdc.balanceOf(investor1);
        uint256 investor2BalanceBefore = usdc.balanceOf(investor2);
        uint256 investor3BalanceBefore = usdc.balanceOf(investor3);

        // Repay with 10% yield (11,000 USDC total)
        uint256 repaymentAmount = 11000 * 10**6;

        vm.prank(admin);
        usdc.approve(address(fundingPool), repaymentAmount);
        vm.prank(admin);
        fundingPool.triggerRepayment(tokenId, repaymentAmount);

        // Calculate expected payouts
        // Investor1: 30% of 11,000 = 3,300
        // Investor2: 50% of 11,000 = 5,500
        // Investor3: 20% of 11,000 = 2,200

        uint256 investor1Payout = usdc.balanceOf(investor1) - investor1BalanceBefore;
        uint256 investor2Payout = usdc.balanceOf(investor2) - investor2BalanceBefore;
        uint256 investor3Payout = usdc.balanceOf(investor3) - investor3BalanceBefore;

        assertEq(investor1Payout, 3300 * 10**6, "Investor1 should receive 30%");
        assertEq(investor2Payout, 5500 * 10**6, "Investor2 should receive 50%");
        assertEq(investor3Payout, 2200 * 10**6, "Investor3 should receive 20%");
    }

    function testRevertRepaymentWithoutAdminRole() public {
        uint256 tokenId = _createAndListInvoice();

        vm.prank(investor1);
        usdc.approve(address(fundingPool), INVOICE_AMOUNT);
        vm.prank(investor1);
        fundingPool.depositUSDC(tokenId, INVOICE_AMOUNT);

        vm.prank(user);
        usdc.approve(address(fundingPool), INVOICE_AMOUNT);
        vm.prank(user);
        vm.expectRevert();
        fundingPool.triggerRepayment(tokenId, INVOICE_AMOUNT);
    }

    function testRevertRepaymentAlreadyRepaid() public {
        uint256 tokenId = _createAndListInvoice();

        vm.prank(investor1);
        usdc.approve(address(fundingPool), INVOICE_AMOUNT);
        vm.prank(investor1);
        fundingPool.depositUSDC(tokenId, INVOICE_AMOUNT);

        vm.prank(admin);
        usdc.approve(address(fundingPool), INVOICE_AMOUNT);
        vm.prank(admin);
        fundingPool.triggerRepayment(tokenId, INVOICE_AMOUNT);

        // Try to repay again
        vm.prank(admin);
        usdc.approve(address(fundingPool), INVOICE_AMOUNT);
        vm.prank(admin);
        vm.expectRevert("Already repaid");
        fundingPool.triggerRepayment(tokenId, INVOICE_AMOUNT);
    }

    function testRevertRepaymentBelowPrincipal() public {
        uint256 tokenId = _createAndListInvoice();

        vm.prank(investor1);
        usdc.approve(address(fundingPool), INVOICE_AMOUNT);
        vm.prank(investor1);
        fundingPool.depositUSDC(tokenId, INVOICE_AMOUNT);

        // Try to repay less than principal
        uint256 insufficientAmount = INVOICE_AMOUNT - 1;

        vm.prank(admin);
        usdc.approve(address(fundingPool), insufficientAmount);
        vm.prank(admin);
        vm.expectRevert("Repayment below principal");
        fundingPool.triggerRepayment(tokenId, insufficientAmount);
    }

    function testRevertRepaymentNotFullyFunded() public {
        uint256 tokenId = _createAndListInvoice();

        vm.prank(investor1);
        usdc.approve(address(fundingPool), DEPOSIT_1);
        vm.prank(investor1);
        fundingPool.depositUSDC(tokenId, DEPOSIT_1); // Partially funded

        vm.prank(admin);
        usdc.approve(address(fundingPool), INVOICE_AMOUNT);
        vm.prank(admin);
        vm.expectRevert("Invoice not ready for repayment");
        fundingPool.triggerRepayment(tokenId, INVOICE_AMOUNT);
    }

    // ============ Withdrawal Tests ============

    function testWithdrawInvestmentSuccess() public {
        uint256 tokenId = _createAndListInvoice();

        vm.prank(investor1);
        usdc.approve(address(fundingPool), DEPOSIT_1);
        vm.prank(investor1);
        fundingPool.depositUSDC(tokenId, DEPOSIT_1);

        uint256 balanceBefore = usdc.balanceOf(investor1);

        vm.prank(investor1);
        vm.expectEmit(true, true, false, true);
        emit InvestmentWithdrawn(tokenId, investor1, DEPOSIT_1);

        fundingPool.withdrawInvestment(tokenId);

        // Check USDC returned
        uint256 balanceAfter = usdc.balanceOf(investor1);
        assertEq(balanceAfter - balanceBefore, DEPOSIT_1, "Should return deposited amount");

        // Check funding updated
        (, uint256 totalFunded, uint256 investorCount,) = fundingPool.getFundingInfo(tokenId);
        assertEq(totalFunded, 0, "Total funded should be 0");
        assertEq(investorCount, 0, "Investor count should be 0");

        // Check share cleared
        uint256 share = fundingPool.getInvestorShare(tokenId, investor1);
        assertEq(share, 0, "Share should be 0");
    }

    function testWithdrawInvestmentMultipleInvestors() public {
        uint256 tokenId = _createAndListInvoice();

        // Two investors deposit
        vm.prank(investor1);
        usdc.approve(address(fundingPool), DEPOSIT_1);
        vm.prank(investor1);
        fundingPool.depositUSDC(tokenId, DEPOSIT_1);

        vm.prank(investor2);
        usdc.approve(address(fundingPool), DEPOSIT_2);
        vm.prank(investor2);
        fundingPool.depositUSDC(tokenId, DEPOSIT_2);

        // Investor1 withdraws
        vm.prank(investor1);
        fundingPool.withdrawInvestment(tokenId);

        // Check funding state
        (, uint256 totalFunded, uint256 investorCount,) = fundingPool.getFundingInfo(tokenId);
        assertEq(totalFunded, DEPOSIT_2, "Should only have investor2's deposit");
        assertEq(investorCount, 1, "Should have 1 investor");

        // Check investor2 still has share
        uint256 share2 = fundingPool.getInvestorShare(tokenId, investor2);
        assertEq(share2, DEPOSIT_2, "Investor2 share should remain");
    }

    function testRevertWithdrawNoInvestment() public {
        uint256 tokenId = _createAndListInvoice();

        vm.prank(user);
        vm.expectRevert("No investment to withdraw");
        fundingPool.withdrawInvestment(tokenId);
    }

    function testRevertWithdrawAfterFullyFunded() public {
        uint256 tokenId = _createAndListInvoice();

        // Fully fund
        vm.prank(investor1);
        usdc.approve(address(fundingPool), DEPOSIT_1);
        vm.prank(investor1);
        fundingPool.depositUSDC(tokenId, DEPOSIT_1);

        vm.prank(investor2);
        usdc.approve(address(fundingPool), DEPOSIT_2);
        vm.prank(investor2);
        fundingPool.depositUSDC(tokenId, DEPOSIT_2);

        vm.prank(investor3);
        usdc.approve(address(fundingPool), DEPOSIT_3);
        vm.prank(investor3);
        fundingPool.depositUSDC(tokenId, DEPOSIT_3);

        // Try to withdraw
        vm.prank(investor1);
        vm.expectRevert("Cannot withdraw after fully funded");
        fundingPool.withdrawInvestment(tokenId);
    }

    // ============ View Function Tests ============

    function testGetFundingInfo() public {
        uint256 tokenId = _createAndListInvoice();

        vm.prank(investor1);
        usdc.approve(address(fundingPool), DEPOSIT_1);
        vm.prank(investor1);
        fundingPool.depositUSDC(tokenId, DEPOSIT_1);

        (uint256 targetAmount, uint256 totalFunded, uint256 investorCount, bool isRepaid) =
            fundingPool.getFundingInfo(tokenId);

        assertEq(targetAmount, INVOICE_AMOUNT, "Target amount should match");
        assertEq(totalFunded, DEPOSIT_1, "Total funded should match");
        assertEq(investorCount, 1, "Should have 1 investor");
        assertFalse(isRepaid, "Should not be repaid");
    }

    function testGetInvestorShare() public {
        uint256 tokenId = _createAndListInvoice();

        vm.prank(investor1);
        usdc.approve(address(fundingPool), DEPOSIT_1);
        vm.prank(investor1);
        fundingPool.depositUSDC(tokenId, DEPOSIT_1);

        uint256 share = fundingPool.getInvestorShare(tokenId, investor1);
        assertEq(share, DEPOSIT_1, "Share should match deposit");

        uint256 noShare = fundingPool.getInvestorShare(tokenId, investor2);
        assertEq(noShare, 0, "Non-investor should have 0 share");
    }

    function testGetInvestors() public {
        uint256 tokenId = _createAndListInvoice();

        vm.prank(investor1);
        usdc.approve(address(fundingPool), DEPOSIT_1);
        vm.prank(investor1);
        fundingPool.depositUSDC(tokenId, DEPOSIT_1);

        vm.prank(investor2);
        usdc.approve(address(fundingPool), DEPOSIT_2);
        vm.prank(investor2);
        fundingPool.depositUSDC(tokenId, DEPOSIT_2);

        address[] memory investors = fundingPool.getInvestors(tokenId);
        assertEq(investors.length, 2, "Should have 2 investors");
        assertEq(investors[0], investor1, "First investor should be investor1");
        assertEq(investors[1], investor2, "Second investor should be investor2");
    }

    function testCalculateExpectedPayout() public {
        uint256 tokenId = _createAndListInvoice();

        // Fund with known percentages
        vm.prank(investor1);
        usdc.approve(address(fundingPool), DEPOSIT_1);
        vm.prank(investor1);
        fundingPool.depositUSDC(tokenId, DEPOSIT_1); // 30%

        vm.prank(investor2);
        usdc.approve(address(fundingPool), DEPOSIT_2);
        vm.prank(investor2);
        fundingPool.depositUSDC(tokenId, DEPOSIT_2); // 50%

        vm.prank(investor3);
        usdc.approve(address(fundingPool), DEPOSIT_3);
        vm.prank(investor3);
        fundingPool.depositUSDC(tokenId, DEPOSIT_3); // 20%

        uint256 repaymentAmount = 11000 * 10**6; // 10% yield

        uint256 payout1 = fundingPool.calculateExpectedPayout(tokenId, investor1, repaymentAmount);
        uint256 payout2 = fundingPool.calculateExpectedPayout(tokenId, investor2, repaymentAmount);
        uint256 payout3 = fundingPool.calculateExpectedPayout(tokenId, investor3, repaymentAmount);

        assertEq(payout1, 3300 * 10**6, "Investor1 expected payout");
        assertEq(payout2, 5500 * 10**6, "Investor2 expected payout");
        assertEq(payout3, 2200 * 10**6, "Investor3 expected payout");
    }

    function testCalculateExpectedPayoutNoInvestment() public {
        uint256 tokenId = _createAndListInvoice();

        uint256 payout = fundingPool.calculateExpectedPayout(tokenId, user, INVOICE_AMOUNT);
        assertEq(payout, 0, "Non-investor should have 0 payout");
    }

    // ============ Pause/Unpause Tests ============

    function testPauseUnpause() public {
        uint256 tokenId = _createAndListInvoice();

        vm.prank(admin);
        fundingPool.pause();

        // Cannot deposit when paused
        vm.prank(investor1);
        usdc.approve(address(fundingPool), DEPOSIT_1);
        vm.prank(investor1);
        vm.expectRevert();
        fundingPool.depositUSDC(tokenId, DEPOSIT_1);

        vm.prank(admin);
        fundingPool.unpause();

        // Can deposit after unpause
        vm.prank(investor1);
        fundingPool.depositUSDC(tokenId, DEPOSIT_1);

        uint256 share = fundingPool.getInvestorShare(tokenId, investor1);
        assertEq(share, DEPOSIT_1, "Should deposit after unpause");
    }

    function testRevertPauseWithoutAdminRole() public {
        vm.prank(user);
        vm.expectRevert();
        fundingPool.pause();
    }

    function testRevertUnpauseWithoutAdminRole() public {
        vm.prank(admin);
        fundingPool.pause();

        vm.prank(user);
        vm.expectRevert();
        fundingPool.unpause();
    }

    // ============ Edge Cases ============

    function testDepositMinimalAmount() public {
        uint256 tokenId = _createAndListInvoice();

        vm.prank(investor1);
        usdc.approve(address(fundingPool), 1);
        vm.prank(investor1);
        fundingPool.depositUSDC(tokenId, 1);

        uint256 share = fundingPool.getInvestorShare(tokenId, investor1);
        assertEq(share, 1, "Should accept minimal deposit");
    }

    function testRepaymentExactlyPrincipal() public {
        uint256 tokenId = _createAndListInvoice();

        vm.prank(investor1);
        usdc.approve(address(fundingPool), INVOICE_AMOUNT);
        vm.prank(investor1);
        fundingPool.depositUSDC(tokenId, INVOICE_AMOUNT);

        uint256 balanceBefore = usdc.balanceOf(investor1);

        // Repay exactly principal (no yield)
        vm.prank(admin);
        usdc.approve(address(fundingPool), INVOICE_AMOUNT);
        vm.prank(admin);
        fundingPool.triggerRepayment(tokenId, INVOICE_AMOUNT);

        uint256 balanceAfter = usdc.balanceOf(investor1);
        assertEq(balanceAfter - balanceBefore, INVOICE_AMOUNT, "Should receive exactly principal");
    }

    function testSingleInvestorFullyFunds() public {
        uint256 tokenId = _createAndListInvoice();

        vm.prank(investor1);
        usdc.approve(address(fundingPool), INVOICE_AMOUNT);
        vm.prank(investor1);
        fundingPool.depositUSDC(tokenId, INVOICE_AMOUNT);

        (, uint256 totalFunded, uint256 investorCount,) = fundingPool.getFundingInfo(tokenId);
        assertEq(totalFunded, INVOICE_AMOUNT, "Should be fully funded");
        assertEq(investorCount, 1, "Should have 1 investor");

        // Repay with yield
        uint256 repaymentAmount = INVOICE_AMOUNT * 115 / 100; // 15% yield

        uint256 balanceBefore = usdc.balanceOf(investor1);

        vm.prank(admin);
        usdc.approve(address(fundingPool), repaymentAmount);
        vm.prank(admin);
        fundingPool.triggerRepayment(tokenId, repaymentAmount);

        uint256 balanceAfter = usdc.balanceOf(investor1);
        assertEq(balanceAfter - balanceBefore, repaymentAmount, "Single investor should receive full repayment");
    }
}
