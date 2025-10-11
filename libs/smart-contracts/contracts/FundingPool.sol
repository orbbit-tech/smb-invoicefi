// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./InvoiceNFT.sol";

/**
 * @title FundingPool
 * @notice Manages USDC deposits, investor tracking, and automated yield distribution
 * @dev Core financial contract for invoice financing - handles all USDC flows
 */
contract FundingPool is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // USDC token contract
    IERC20 public immutable usdc;

    // InvoiceNFT contract
    InvoiceNFT public immutable invoiceNFT;

    // Funding data per invoice
    struct FundingInfo {
        uint256 targetAmount;       // Target funding amount (from invoice)
        uint256 totalFunded;        // Current total funded
        address[] investors;        // List of investor addresses
        mapping(address => uint256) shares;  // Investor address => funded amount
        bool isRepaid;              // Whether repayment was executed
    }

    // Mapping from invoice token ID to funding info
    mapping(uint256 => FundingInfo) private _fundingInfo;

    // Events
    event FundingReceived(
        uint256 indexed tokenId,
        address indexed investor,
        uint256 amount,
        uint256 totalFunded
    );

    event InvoiceFullyFunded(
        uint256 indexed tokenId,
        uint256 totalFunded
    );

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

    /**
     * @notice Constructor
     * @param _usdc USDC token address on Base
     * @param _invoiceNFT InvoiceNFT contract address
     */
    constructor(address _usdc, address _invoiceNFT) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_invoiceNFT != address(0), "Invalid InvoiceNFT address");

        usdc = IERC20(_usdc);
        invoiceNFT = InvoiceNFT(_invoiceNFT);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Deposit USDC to fund a specific invoice
     * @param tokenId Invoice NFT token ID
     * @param amount Amount of USDC to deposit (6 decimals)
     */
    function depositUSDC(uint256 tokenId, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        require(amount > 0, "Amount must be greater than 0");

        // Get invoice data from NFT
        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);

        // Check invoice is in correct status
        require(
            invoice.status == InvoiceNFT.Status.Listed ||
            invoice.status == InvoiceNFT.Status.PartiallyFunded,
            "Invoice not available for funding"
        );

        // Initialize funding info if first deposit
        FundingInfo storage funding = _fundingInfo[tokenId];
        if (funding.targetAmount == 0) {
            funding.targetAmount = invoice.amount;
        }

        // Check funding cap
        uint256 newTotal = funding.totalFunded + amount;
        require(newTotal <= funding.targetAmount, "Exceeds target amount");

        // Track investor if new
        if (funding.shares[msg.sender] == 0) {
            funding.investors.push(msg.sender);
        }

        // Update investor share
        funding.shares[msg.sender] += amount;
        funding.totalFunded = newTotal;

        // Transfer USDC from investor to contract
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit FundingReceived(tokenId, msg.sender, amount, newTotal);

        // Check if fully funded
        if (newTotal == funding.targetAmount) {
            // Update NFT status to FullyFunded
            invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.FullyFunded);
            emit InvoiceFullyFunded(tokenId, newTotal);
        } else {
            // Update NFT status to PartiallyFunded if first deposit
            if (invoice.status == InvoiceNFT.Status.Listed) {
                invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.PartiallyFunded);
            }
        }
    }

    /**
     * @notice Trigger repayment and distribute yield (admin only)
     * @param tokenId Invoice NFT token ID
     * @param repaymentAmount Total USDC amount to distribute (principal + yield)
     * @dev Called by Orbbit admin after SMB repays invoice
     */
    function triggerRepayment(uint256 tokenId, uint256 repaymentAmount)
        external
        onlyRole(ADMIN_ROLE)
        nonReentrant
    {
        // Get invoice data
        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        require(
            invoice.status == InvoiceNFT.Status.FullyFunded ||
            invoice.status == InvoiceNFT.Status.Disbursed ||
            invoice.status == InvoiceNFT.Status.PendingRepayment,
            "Invoice not ready for repayment"
        );

        FundingInfo storage funding = _fundingInfo[tokenId];
        require(!funding.isRepaid, "Already repaid");
        require(funding.totalFunded > 0, "No funding to repay");
        require(repaymentAmount >= funding.totalFunded, "Repayment below principal");

        // Mark as repaid
        funding.isRepaid = true;

        // Transfer USDC from admin to contract
        usdc.safeTransferFrom(msg.sender, address(this), repaymentAmount);

        emit RepaymentExecuted(tokenId, repaymentAmount, funding.investors.length);

        // Distribute proportionally to all investors
        _distributeYield(tokenId, repaymentAmount);

        // Update NFT status
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Repaid);
    }

    /**
     * @notice Distribute yield to all investors proportionally
     * @param tokenId Invoice NFT token ID
     * @param totalDistribution Total amount to distribute
     */
    function _distributeYield(uint256 tokenId, uint256 totalDistribution) private {
        FundingInfo storage funding = _fundingInfo[tokenId];
        uint256 totalFunded = funding.totalFunded;

        // Iterate through all investors
        for (uint256 i = 0; i < funding.investors.length; i++) {
            address investor = funding.investors[i];
            uint256 principalShare = funding.shares[investor];

            // Calculate proportional payout
            uint256 payout = (principalShare * totalDistribution) / totalFunded;

            // Send USDC to investor (push-based, no claim needed)
            usdc.safeTransfer(investor, payout);

            emit YieldDistributed(tokenId, investor, principalShare, payout);
        }
    }

    /**
     * @notice Withdraw investment before invoice is fully funded (emergency only)
     * @param tokenId Invoice NFT token ID
     * @dev Only works if invoice is not yet fully funded
     */
    function withdrawInvestment(uint256 tokenId) external nonReentrant {
        FundingInfo storage funding = _fundingInfo[tokenId];
        uint256 investedAmount = funding.shares[msg.sender];

        require(investedAmount > 0, "No investment to withdraw");

        // Get invoice status
        InvoiceNFT.InvoiceData memory invoice = invoiceNFT.getInvoice(tokenId);
        require(
            invoice.status == InvoiceNFT.Status.Listed ||
            invoice.status == InvoiceNFT.Status.PartiallyFunded,
            "Cannot withdraw after fully funded"
        );

        // Update state
        funding.shares[msg.sender] = 0;
        funding.totalFunded -= investedAmount;

        // Remove from investors array (gas inefficient but rare operation)
        _removeInvestor(tokenId, msg.sender);

        // Transfer USDC back to investor
        usdc.safeTransfer(msg.sender, investedAmount);

        emit InvestmentWithdrawn(tokenId, msg.sender, investedAmount);
    }

    /**
     * @notice Get funding information for an invoice
     * @param tokenId Invoice NFT token ID
     * @return targetAmount Target funding amount
     * @return totalFunded Current total funded
     * @return investorCount Number of unique investors
     * @return isRepaid Whether repayment was executed
     */
    function getFundingInfo(uint256 tokenId)
        external
        view
        returns (
            uint256 targetAmount,
            uint256 totalFunded,
            uint256 investorCount,
            bool isRepaid
        )
    {
        FundingInfo storage funding = _fundingInfo[tokenId];
        return (
            funding.targetAmount,
            funding.totalFunded,
            funding.investors.length,
            funding.isRepaid
        );
    }

    /**
     * @notice Get investor's share for a specific invoice
     * @param tokenId Invoice NFT token ID
     * @param investor Investor address
     * @return Amount invested by the investor
     */
    function getInvestorShare(uint256 tokenId, address investor)
        external
        view
        returns (uint256)
    {
        return _fundingInfo[tokenId].shares[investor];
    }

    /**
     * @notice Get all investors for an invoice
     * @param tokenId Invoice NFT token ID
     * @return Array of investor addresses
     */
    function getInvestors(uint256 tokenId) external view returns (address[] memory) {
        return _fundingInfo[tokenId].investors;
    }

    /**
     * @notice Calculate expected payout for an investor
     * @param tokenId Invoice NFT token ID
     * @param investor Investor address
     * @param repaymentAmount Total repayment amount including yield
     * @return Expected payout for the investor
     */
    function calculateExpectedPayout(
        uint256 tokenId,
        address investor,
        uint256 repaymentAmount
    ) external view returns (uint256) {
        FundingInfo storage funding = _fundingInfo[tokenId];
        uint256 principalShare = funding.shares[investor];

        if (funding.totalFunded == 0 || principalShare == 0) {
            return 0;
        }

        return (principalShare * repaymentAmount) / funding.totalFunded;
    }

    /**
     * @notice Remove investor from array (helper function)
     * @param tokenId Invoice NFT token ID
     * @param investor Address to remove
     */
    function _removeInvestor(uint256 tokenId, address investor) private {
        FundingInfo storage funding = _fundingInfo[tokenId];
        address[] storage investors = funding.investors;

        for (uint256 i = 0; i < investors.length; i++) {
            if (investors[i] == investor) {
                investors[i] = investors[investors.length - 1];
                investors.pop();
                break;
            }
        }
    }

    /**
     * @notice Pause contract (emergency only)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
