import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type {
  InvoiceNFT,
  FundingPool,
  InvoiceFactory,
  MockUSDC,
} from "../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Integration tests for complete invoice financing lifecycle
 * Tests the full workflow from invoice creation to repayment
 */
describe("Invoice Lifecycle Integration", function () {
  let invoiceNFT: InvoiceNFT;
  let fundingPool: FundingPool;
  let factory: InvoiceFactory;
  let usdc: MockUSDC;

  let admin: SignerWithAddress;
  let investor1: SignerWithAddress;
  let investor2: SignerWithAddress;
  let investor3: SignerWithAddress;

  const INVOICE_AMOUNT = ethers.parseUnits("10000", 6); // 10,000 USDC
  const DUE_DATE = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 days from now
  const RISK_SCORE = 25;
  const PAYER = "Acme Corporation";
  const INVOICE_NUMBER = "INV-2025-001";
  const TOKEN_URI = "ipfs://QmTest123";

  beforeEach(async function () {
    [admin, investor1, investor2, investor3] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDCFactory.deploy();
    await usdc.waitForDeployment();

    // Deploy InvoiceNFT
    const InvoiceNFTFactory = await ethers.getContractFactory("InvoiceNFT");
    invoiceNFT = await InvoiceNFTFactory.deploy();
    await invoiceNFT.waitForDeployment();

    // Deploy FundingPool
    const FundingPoolFactory = await ethers.getContractFactory("FundingPool");
    fundingPool = await FundingPoolFactory.deploy(
      await usdc.getAddress(),
      await invoiceNFT.getAddress()
    );
    await fundingPool.waitForDeployment();

    // Deploy InvoiceFactory
    const InvoiceFactoryFactory = await ethers.getContractFactory("InvoiceFactory");
    factory = await InvoiceFactoryFactory.deploy(
      await invoiceNFT.getAddress(),
      await fundingPool.getAddress()
    );
    await factory.waitForDeployment();

    // Setup roles
    const MINTER_ROLE = await invoiceNFT.MINTER_ROLE();
    const UPDATER_ROLE = await invoiceNFT.UPDATER_ROLE();

    await invoiceNFT.grantRole(MINTER_ROLE, await factory.getAddress());
    await invoiceNFT.grantRole(UPDATER_ROLE, await factory.getAddress());
    await invoiceNFT.grantRole(UPDATER_ROLE, await fundingPool.getAddress());

    // Mint USDC to investors
    await usdc.mint(investor1.address, ethers.parseUnits("50000", 6));
    await usdc.mint(investor2.address, ethers.parseUnits("50000", 6));
    await usdc.mint(investor3.address, ethers.parseUnits("50000", 6));
    await usdc.mint(admin.address, ethers.parseUnits("100000", 6));
  });

  describe("Full Invoice Lifecycle", function () {
    it("Should complete entire lifecycle from creation to repayment", async function () {
      // Step 1: Create invoice via factory
      const tx = await factory.createInvoice(
        INVOICE_AMOUNT,
        DUE_DATE,
        RISK_SCORE,
        PAYER,
        INVOICE_NUMBER,
        TOKEN_URI
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "InvoiceCreated"
      );
      expect(event).to.not.be.undefined;

      const tokenId = 1n;

      // Verify invoice is listed
      const invoice = await invoiceNFT.getInvoice(tokenId);
      expect(invoice.status).to.equal(1); // Status.Listed

      // Step 2: Investor1 deposits 30%
      const deposit1 = ethers.parseUnits("3000", 6);
      await usdc.connect(investor1).approve(await fundingPool.getAddress(), deposit1);
      await fundingPool.connect(investor1).depositUSDC(tokenId, deposit1);

      // Verify status changed to PartiallyFunded
      let updatedInvoice = await invoiceNFT.getInvoice(tokenId);
      expect(updatedInvoice.status).to.equal(2); // Status.PartiallyFunded

      // Step 3: Investor2 deposits 50%
      const deposit2 = ethers.parseUnits("5000", 6);
      await usdc.connect(investor2).approve(await fundingPool.getAddress(), deposit2);
      await fundingPool.connect(investor2).depositUSDC(tokenId, deposit2);

      // Step 4: Investor3 deposits remaining 20%
      const deposit3 = ethers.parseUnits("2000", 6);
      await usdc.connect(investor3).approve(await fundingPool.getAddress(), deposit3);
      await fundingPool.connect(investor3).depositUSDC(tokenId, deposit3);

      // Verify status changed to FullyFunded
      updatedInvoice = await invoiceNFT.getInvoice(tokenId);
      expect(updatedInvoice.status).to.equal(3); // Status.FullyFunded

      // Verify funding info
      const fundingInfo = await fundingPool.getFundingInfo(tokenId);
      expect(fundingInfo.totalFunded).to.equal(INVOICE_AMOUNT);
      expect(fundingInfo.investorCount).to.equal(3);

      // Step 5: Admin triggers repayment with 10% yield
      const repaymentAmount = ethers.parseUnits("11000", 6); // 10% yield

      const investor1BalanceBefore = await usdc.balanceOf(investor1.address);
      const investor2BalanceBefore = await usdc.balanceOf(investor2.address);
      const investor3BalanceBefore = await usdc.balanceOf(investor3.address);

      await usdc.approve(await fundingPool.getAddress(), repaymentAmount);
      await fundingPool.triggerRepayment(tokenId, repaymentAmount);

      // Verify status changed to Repaid
      updatedInvoice = await invoiceNFT.getInvoice(tokenId);
      expect(updatedInvoice.status).to.equal(6); // Status.Repaid

      // Verify yield distribution
      const investor1BalanceAfter = await usdc.balanceOf(investor1.address);
      const investor2BalanceAfter = await usdc.balanceOf(investor2.address);
      const investor3BalanceAfter = await usdc.balanceOf(investor3.address);

      // Investor1: 30% of 11,000 = 3,300 USDC
      expect(investor1BalanceAfter - investor1BalanceBefore).to.equal(
        ethers.parseUnits("3300", 6)
      );

      // Investor2: 50% of 11,000 = 5,500 USDC
      expect(investor2BalanceAfter - investor2BalanceBefore).to.equal(
        ethers.parseUnits("5500", 6)
      );

      // Investor3: 20% of 11,000 = 2,200 USDC
      expect(investor3BalanceAfter - investor3BalanceBefore).to.equal(
        ethers.parseUnits("2200", 6)
      );
    });

    it("Should handle single investor funding entire invoice", async function () {
      const tx = await factory.createInvoice(
        INVOICE_AMOUNT,
        DUE_DATE,
        RISK_SCORE,
        PAYER,
        INVOICE_NUMBER,
        TOKEN_URI
      );
      await tx.wait();

      const tokenId = 1n;

      // Single investor funds entire amount
      await usdc.connect(investor1).approve(await fundingPool.getAddress(), INVOICE_AMOUNT);
      await fundingPool.connect(investor1).depositUSDC(tokenId, INVOICE_AMOUNT);

      // Verify FullyFunded
      const invoice = await invoiceNFT.getInvoice(tokenId);
      expect(invoice.status).to.equal(3); // Status.FullyFunded

      // Verify only one investor
      const fundingInfo = await fundingPool.getFundingInfo(tokenId);
      expect(fundingInfo.investorCount).to.equal(1);

      // Repay with 15% yield
      const repaymentAmount = ethers.parseUnits("11500", 6);
      const investor1BalanceBefore = await usdc.balanceOf(investor1.address);

      await usdc.approve(await fundingPool.getAddress(), repaymentAmount);
      await fundingPool.triggerRepayment(tokenId, repaymentAmount);

      // Investor should receive full repayment
      const investor1BalanceAfter = await usdc.balanceOf(investor1.address);
      expect(investor1BalanceAfter - investor1BalanceBefore).to.equal(repaymentAmount);
    });

    it("Should allow investor to withdraw before fully funded", async function () {
      const tx = await factory.createInvoice(
        INVOICE_AMOUNT,
        DUE_DATE,
        RISK_SCORE,
        PAYER,
        INVOICE_NUMBER,
        TOKEN_URI
      );
      await tx.wait();

      const tokenId = 1n;

      // Investor1 deposits
      const deposit1 = ethers.parseUnits("3000", 6);
      await usdc.connect(investor1).approve(await fundingPool.getAddress(), deposit1);
      await fundingPool.connect(investor1).depositUSDC(tokenId, deposit1);

      const balanceBefore = await usdc.balanceOf(investor1.address);

      // Investor1 withdraws
      await fundingPool.connect(investor1).withdrawInvestment(tokenId);

      // Verify USDC returned
      const balanceAfter = await usdc.balanceOf(investor1.address);
      expect(balanceAfter - balanceBefore).to.equal(deposit1);

      // Verify funding info updated
      const fundingInfo = await fundingPool.getFundingInfo(tokenId);
      expect(fundingInfo.totalFunded).to.equal(0);
      expect(fundingInfo.investorCount).to.equal(0);

      // Status should revert to Listed
      const invoice = await invoiceNFT.getInvoice(tokenId);
      expect(invoice.status).to.equal(1); // Status.Listed
    });

    it("Should prevent withdrawal after fully funded", async function () {
      const tx = await factory.createInvoice(
        INVOICE_AMOUNT,
        DUE_DATE,
        RISK_SCORE,
        PAYER,
        INVOICE_NUMBER,
        TOKEN_URI
      );
      await tx.wait();

      const tokenId = 1n;

      // Fully fund the invoice
      await usdc.connect(investor1).approve(await fundingPool.getAddress(), INVOICE_AMOUNT);
      await fundingPool.connect(investor1).depositUSDC(tokenId, INVOICE_AMOUNT);

      // Attempt to withdraw should fail
      await expect(
        fundingPool.connect(investor1).withdrawInvestment(tokenId)
      ).to.be.revertedWith("Cannot withdraw after fully funded");
    });
  });

  describe("Multiple Invoices", function () {
    it("Should handle multiple invoices independently", async function () {
      // Create three invoices
      await factory.createInvoice(
        INVOICE_AMOUNT,
        DUE_DATE,
        20,
        "Company A",
        "INV-A",
        TOKEN_URI
      );

      await factory.createInvoice(
        ethers.parseUnits("5000", 6),
        DUE_DATE,
        50,
        "Company B",
        "INV-B",
        TOKEN_URI
      );

      await factory.createInvoice(
        ethers.parseUnits("15000", 6),
        DUE_DATE,
        80,
        "Company C",
        "INV-C",
        TOKEN_URI
      );

      // Fund invoice 1 fully
      await usdc.connect(investor1).approve(await fundingPool.getAddress(), INVOICE_AMOUNT);
      await fundingPool.connect(investor1).depositUSDC(1, INVOICE_AMOUNT);

      // Fund invoice 2 partially
      const partialAmount = ethers.parseUnits("2000", 6);
      await usdc.connect(investor2).approve(await fundingPool.getAddress(), partialAmount);
      await fundingPool.connect(investor2).depositUSDC(2, partialAmount);

      // Don't fund invoice 3

      // Check statuses
      const invoice1 = await invoiceNFT.getInvoice(1);
      const invoice2 = await invoiceNFT.getInvoice(2);
      const invoice3 = await invoiceNFT.getInvoice(3);

      expect(invoice1.status).to.equal(3); // FullyFunded
      expect(invoice2.status).to.equal(2); // PartiallyFunded
      expect(invoice3.status).to.equal(1); // Listed

      // Repay invoice 1
      const repaymentAmount = ethers.parseUnits("11000", 6);
      await usdc.approve(await fundingPool.getAddress(), repaymentAmount);
      await fundingPool.triggerRepayment(1, repaymentAmount);

      // Invoice 1 should be Repaid, others unchanged
      const invoice1Updated = await invoiceNFT.getInvoice(1);
      const invoice2Updated = await invoiceNFT.getInvoice(2);
      const invoice3Updated = await invoiceNFT.getInvoice(3);

      expect(invoice1Updated.status).to.equal(6); // Repaid
      expect(invoice2Updated.status).to.equal(2); // Still PartiallyFunded
      expect(invoice3Updated.status).to.equal(1); // Still Listed
    });
  });

  describe("Edge Cases", function () {
    it("Should handle exact principal repayment (no yield)", async function () {
      const tx = await factory.createInvoice(
        INVOICE_AMOUNT,
        DUE_DATE,
        RISK_SCORE,
        PAYER,
        INVOICE_NUMBER,
        TOKEN_URI
      );
      await tx.wait();

      const tokenId = 1n;

      await usdc.connect(investor1).approve(await fundingPool.getAddress(), INVOICE_AMOUNT);
      await fundingPool.connect(investor1).depositUSDC(tokenId, INVOICE_AMOUNT);

      const balanceBefore = await usdc.balanceOf(investor1.address);

      // Repay exactly principal
      await usdc.approve(await fundingPool.getAddress(), INVOICE_AMOUNT);
      await fundingPool.triggerRepayment(tokenId, INVOICE_AMOUNT);

      const balanceAfter = await usdc.balanceOf(investor1.address);
      expect(balanceAfter - balanceBefore).to.equal(INVOICE_AMOUNT);
    });

    it("Should handle high yield repayment", async function () {
      const tx = await factory.createInvoice(
        INVOICE_AMOUNT,
        DUE_DATE,
        RISK_SCORE,
        PAYER,
        INVOICE_NUMBER,
        TOKEN_URI
      );
      await tx.wait();

      const tokenId = 1n;

      await usdc.connect(investor1).approve(await fundingPool.getAddress(), INVOICE_AMOUNT);
      await fundingPool.connect(investor1).depositUSDC(tokenId, INVOICE_AMOUNT);

      const balanceBefore = await usdc.balanceOf(investor1.address);

      // Repay with 50% yield
      const repaymentAmount = ethers.parseUnits("15000", 6);
      await usdc.approve(await fundingPool.getAddress(), repaymentAmount);
      await fundingPool.triggerRepayment(tokenId, repaymentAmount);

      const balanceAfter = await usdc.balanceOf(investor1.address);
      expect(balanceAfter - balanceBefore).to.equal(repaymentAmount);
    });

    it("Should prevent deposit exceeding target amount", async function () {
      const tx = await factory.createInvoice(
        INVOICE_AMOUNT,
        DUE_DATE,
        RISK_SCORE,
        PAYER,
        INVOICE_NUMBER,
        TOKEN_URI
      );
      await tx.wait();

      const tokenId = 1n;

      const excessAmount = INVOICE_AMOUNT + ethers.parseUnits("1", 6);

      await usdc.connect(investor1).approve(await fundingPool.getAddress(), excessAmount);

      await expect(
        fundingPool.connect(investor1).depositUSDC(tokenId, excessAmount)
      ).to.be.revertedWith("Exceeds target amount");
    });

    it("Should allow same investor to make multiple deposits", async function () {
      const tx = await factory.createInvoice(
        INVOICE_AMOUNT,
        DUE_DATE,
        RISK_SCORE,
        PAYER,
        INVOICE_NUMBER,
        TOKEN_URI
      );
      await tx.wait();

      const tokenId = 1n;

      // Investor makes three separate deposits
      const deposit1 = ethers.parseUnits("2000", 6);
      const deposit2 = ethers.parseUnits("3000", 6);
      const deposit3 = ethers.parseUnits("5000", 6);

      await usdc
        .connect(investor1)
        .approve(await fundingPool.getAddress(), deposit1 + deposit2 + deposit3);

      await fundingPool.connect(investor1).depositUSDC(tokenId, deposit1);
      await fundingPool.connect(investor1).depositUSDC(tokenId, deposit2);
      await fundingPool.connect(investor1).depositUSDC(tokenId, deposit3);

      // Verify cumulative share
      const share = await fundingPool.getInvestorShare(tokenId, investor1.address);
      expect(share).to.equal(INVOICE_AMOUNT);

      // Should still be counted as single investor
      const fundingInfo = await fundingPool.getFundingInfo(tokenId);
      expect(fundingInfo.investorCount).to.equal(1);
    });
  });

  describe("Pause Functionality", function () {
    it("Should prevent deposits when paused", async function () {
      const tx = await factory.createInvoice(
        INVOICE_AMOUNT,
        DUE_DATE,
        RISK_SCORE,
        PAYER,
        INVOICE_NUMBER,
        TOKEN_URI
      );
      await tx.wait();

      const tokenId = 1n;

      // Pause the pool
      await fundingPool.pause();

      const depositAmount = ethers.parseUnits("5000", 6);
      await usdc.connect(investor1).approve(await fundingPool.getAddress(), depositAmount);

      await expect(
        fundingPool.connect(investor1).depositUSDC(tokenId, depositAmount)
      ).to.be.reverted;

      // Unpause and deposit should work
      await fundingPool.unpause();

      await fundingPool.connect(investor1).depositUSDC(tokenId, depositAmount);

      const fundingInfo = await fundingPool.getFundingInfo(tokenId);
      expect(fundingInfo.totalFunded).to.equal(depositAmount);
    });
  });

  describe("Event Emissions", function () {
    it("Should emit FundingReceived event on deposit", async function () {
      const tx = await factory.createInvoice(
        INVOICE_AMOUNT,
        DUE_DATE,
        RISK_SCORE,
        PAYER,
        INVOICE_NUMBER,
        TOKEN_URI
      );
      await tx.wait();

      const tokenId = 1n;
      const depositAmount = ethers.parseUnits("5000", 6);

      await usdc.connect(investor1).approve(await fundingPool.getAddress(), depositAmount);

      await expect(fundingPool.connect(investor1).depositUSDC(tokenId, depositAmount))
        .to.emit(fundingPool, "FundingReceived")
        .withArgs(tokenId, investor1.address, depositAmount, depositAmount);
    });

    it("Should emit InvoiceFullyFunded event when target reached", async function () {
      const tx = await factory.createInvoice(
        INVOICE_AMOUNT,
        DUE_DATE,
        RISK_SCORE,
        PAYER,
        INVOICE_NUMBER,
        TOKEN_URI
      );
      await tx.wait();

      const tokenId = 1n;

      await usdc.connect(investor1).approve(await fundingPool.getAddress(), INVOICE_AMOUNT);

      await expect(fundingPool.connect(investor1).depositUSDC(tokenId, INVOICE_AMOUNT))
        .to.emit(fundingPool, "InvoiceFullyFunded")
        .withArgs(tokenId, INVOICE_AMOUNT);
    });

    it("Should emit RepaymentExecuted event on repayment", async function () {
      const tx = await factory.createInvoice(
        INVOICE_AMOUNT,
        DUE_DATE,
        RISK_SCORE,
        PAYER,
        INVOICE_NUMBER,
        TOKEN_URI
      );
      await tx.wait();

      const tokenId = 1n;

      await usdc.connect(investor1).approve(await fundingPool.getAddress(), INVOICE_AMOUNT);
      await fundingPool.connect(investor1).depositUSDC(tokenId, INVOICE_AMOUNT);

      const repaymentAmount = ethers.parseUnits("11000", 6);
      await usdc.approve(await fundingPool.getAddress(), repaymentAmount);

      await expect(fundingPool.triggerRepayment(tokenId, repaymentAmount))
        .to.emit(fundingPool, "RepaymentExecuted")
        .withArgs(tokenId, repaymentAmount, 1);
    });
  });
});
