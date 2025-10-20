// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IInvoice.sol";
import "./interfaces/IInvoiceFundingPool.sol";
import "./interfaces/IWhitelist.sol";
import "./Invoice.sol";

/**
 * @title InvoiceFundingPool
 * @notice Manages payment token deposits, investor tracking, and yield distribution for invoice financing
 * @dev Implements single-investor model for MVP - each invoice is fully funded by one investor
 * @dev V1: Currently USDC-only on Base (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 */
contract InvoiceFundingPool is IInvoiceFundingPool, AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ ROLES ============

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // ============ STATE VARIABLES ============

    /// @notice Payment token contract (USDC for V1)
    IERC20 public immutable paymentToken;

    /// @notice Invoice contract
    Invoice public immutable invoice;

    /// @notice Whitelist contract for KYC/KYB compliance
    IWhitelist public immutable whitelist;

    /// @notice Mapping from token ID to investor address
    mapping(uint256 => address) public invoiceInvestor;

    /// @notice Mapping from token ID to funded amount
    mapping(uint256 => uint256) public fundedAmounts;

    /// @notice Mapping from token ID to repayment pool (temporary holding)
    mapping(uint256 => uint256) public repaymentPool;

    /// @notice Mapping from token ID to funding timestamp
    mapping(uint256 => uint256) public fundingTimestamps;

    /// @notice Grace period in days before marking invoice as defaulted
    uint256 public immutable GRACE_PERIOD_DAYS;

    // ============ CONSTRUCTOR ============

    /**
     * @notice Initializes the InvoiceFundingPool contract
     * @param paymentToken_ Address of the payment token contract (USDC for V1)
     * @param invoice_ Address of the Invoice contract
     * @param gracePeriodDays_ Number of days after due date before marking as defaulted
     * @param whitelist_ Address of the Whitelist contract for KYC/KYB compliance
     */
    constructor(
        address paymentToken_,
        address invoice_,
        uint256 gracePeriodDays_,
        address whitelist_
    ) {
        if (paymentToken_ == address(0)) revert IInvoiceFundingPool.InvalidPaymentTokenAddress(paymentToken_);
        if (invoice_ == address(0)) revert IInvoiceFundingPool.InvalidInvoiceAddress(invoice_);
        if (gracePeriodDays_ == 0) revert IInvoiceFundingPool.InvalidGracePeriod(gracePeriodDays_);
        if (whitelist_ == address(0)) revert IInvoiceFundingPool.InvalidWhitelistAddress(whitelist_);

        paymentToken = IERC20(paymentToken_);
        invoice = Invoice(invoice_);
        whitelist = IWhitelist(whitelist_);
        GRACE_PERIOD_DAYS = gracePeriodDays_;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    // ============ FUNDING FUNCTIONS ============

    /**
     * @notice Funds an invoice with payment token and mints NFT directly to investor (lazy minting)
     * @dev Implements {IInvoiceFundingPool-fundInvoice}
     * @param amount Invoice principal amount in payment token (USDC, 6 decimals)
     * @param dueDate Unix timestamp when payment is due
     * @param apy Annual percentage yield in basis points (e.g., 1200 = 12%)
     * @param issuer Address of the entity that issued the invoice and receives funding
     * @param metadataURI URI for invoice metadata (IPFS/S3, contains payer info and other details)
     * @dev Implements true lazy minting - NFT only created when investor funds
     * @dev Transfers payment token (USDC) directly from investor to issuer wallet
     * @dev Single-investor model: each invoice fully funded by one investor
     * @return tokenId The newly minted invoice token ID
     */
    function fundInvoice(
        uint256 amount,
        uint256 dueDate,
        uint256 apy,
        address issuer,
        string memory metadataURI
    )
        external
        nonReentrant
        whenNotPaused
        returns (uint256)
    {
        if (amount == 0) revert IInvoiceFundingPool.InvalidAmount(amount);
        if (dueDate <= block.timestamp) revert IInvoiceFundingPool.InvalidDueDate(dueDate, block.timestamp);
        if (issuer == address(0)) revert IInvoiceFundingPool.InvalidIssuer(issuer);

        // Check KYC/KYB compliance via whitelist
        if (!whitelist.isWhitelisted(msg.sender, IWhitelist.Role.INVESTOR)) {
            revert IInvoiceFundingPool.InvestorNotWhitelisted(msg.sender);
        }
        if (!whitelist.isWhitelisted(issuer, IWhitelist.Role.SMB)) {
            revert IInvoiceFundingPool.IssuerNotWhitelisted(issuer);
        }

        // Transfer payment token from investor to issuer wallet (happens before minting)
        paymentToken.safeTransferFrom(msg.sender, issuer, amount);

        // Mint NFT directly to investor with FUNDED status (lazy minting happens here!)
        uint256 tokenId = invoice.mint(
            msg.sender,
            amount,
            dueDate,
            apy,
            issuer,
            metadataURI
        );

        // Record funding details
        invoiceInvestor[tokenId] = msg.sender;
        fundedAmounts[tokenId] = amount;
        fundingTimestamps[tokenId] = block.timestamp;

        emit InvoiceFunded(tokenId, msg.sender, amount);

        return tokenId;
    }

    // ============ REPAYMENT FUNCTIONS ============

    /**
     * @notice Deposits repayment (principal + yield) to the contract
     * @dev Implements {IInvoiceFundingPool-depositRepayment}
     * @param tokenId The ID of the invoice NFT being repaid
     * @dev Step 1 of repayment: SMB or admin deposits funds to contract
     * @dev Caller must approve this contract to spend payment token (USDC) first
     */
    function depositRepayment(uint256 tokenId)
        external
        nonReentrant
        whenNotPaused
    {
        IInvoice.Data memory data = invoice.getInvoice(tokenId);
        if (data.status != IInvoice.Status.FUNDED) {
            revert IInvoiceFundingPool.InvoiceNotFunded(tokenId, uint8(data.status));
        }
        if (repaymentPool[tokenId] != 0) {
            revert IInvoiceFundingPool.RepaymentAlreadyDeposited(tokenId);
        }

        // Calculate total repayment (principal + yield)
        uint256 principal = fundedAmounts[tokenId];
        uint256 fundingTime = fundingTimestamps[tokenId];
        uint256 yield = calculateYield(principal, data.apy, data.dueDate, fundingTime);
        uint256 totalRepayment = principal + yield;

        // Transfer payment token from depositor to this contract
        paymentToken.safeTransferFrom(msg.sender, address(this), totalRepayment);

        // Store in repayment pool
        repaymentPool[tokenId] = totalRepayment;

        emit RepaymentDeposited(tokenId, msg.sender, totalRepayment);
    }

    /**
     * @notice Settles repayment by distributing funds to investor
     * @dev Implements {IInvoiceFundingPool-settleRepayment}
     * @param tokenId The ID of the invoice NFT to settle
     * @dev Step 2 of repayment: Admin triggers distribution to investor
     * @dev Only callable by addresses with OPERATOR_ROLE
     */
    function settleRepayment(uint256 tokenId)
        external
        onlyRole(OPERATOR_ROLE)
        nonReentrant
        whenNotPaused
    {
        if (repaymentPool[tokenId] == 0) {
            revert IInvoiceFundingPool.NoRepaymentDeposited(tokenId);
        }

        address investor = invoiceInvestor[tokenId];
        uint256 amount = repaymentPool[tokenId];

        // Transfer from contract to investor
        paymentToken.safeTransfer(investor, amount);

        // Clear repayment pool
        repaymentPool[tokenId] = 0;

        // Update invoice status to REPAID
        invoice.updateStatus(tokenId, IInvoice.Status.REPAID);

        emit InvoiceRepaid(tokenId, investor, amount);
    }

    // ============ DEFAULT HANDLING ============

    /**
     * @notice Marks an invoice as defaulted
     * @dev Implements {IInvoiceFundingPool-markDefaulted}
     * @param tokenId The ID of the invoice NFT to mark as defaulted
     * @dev Only callable by addresses with OPERATOR_ROLE
     * @dev Can only be called after grace period has elapsed
     * @dev Grace period = due date + 30 days
     */
    function markDefaulted(uint256 tokenId)
        external
        onlyRole(OPERATOR_ROLE)
    {
        IInvoice.Data memory data = invoice.getInvoice(tokenId);
        if (data.status != IInvoice.Status.FUNDED) {
            revert IInvoiceFundingPool.InvoiceNotFunded(tokenId, uint8(data.status));
        }

        // Check grace period has elapsed
        uint256 gracePeriodEnd = data.dueDate + (GRACE_PERIOD_DAYS * 1 days);
        if (block.timestamp <= gracePeriodEnd) {
            revert IInvoiceFundingPool.GracePeriodNotElapsed(tokenId, gracePeriodEnd, block.timestamp);
        }

        // Ensure no repayment has been deposited
        if (repaymentPool[tokenId] != 0) {
            revert IInvoiceFundingPool.RepaymentAlreadyDeposited(tokenId);
        }

        // Update status to DEFAULTED
        invoice.updateStatus(tokenId, IInvoice.Status.DEFAULTED);

        address investor = invoiceInvestor[tokenId];
        uint256 principal = fundedAmounts[tokenId];

        emit InvoiceDefaulted(tokenId, investor, principal);

        // Future: Trigger automated collections workflow, insurance claim, etc.
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Calculates yield for an invoice
     * @dev Implements {IInvoiceFundingPool-calculateYield}
     * @param principal The principal amount funded
     * @param apy Annual percentage yield in basis points
     * @param dueDate The due date of the invoice
     * @param fundingTimestamp The timestamp when the invoice was funded
     * @return The calculated yield amount
     * @dev Uses simple interest calculation: yield = principal * apy * days / (10000 * 365)
     * @dev Yield is calculated from funding time to due date (fixed at funding time)
     */
    function calculateYield(
        uint256 principal,
        uint256 apy,
        uint256 dueDate,
        uint256 fundingTimestamp
    ) public pure returns (uint256) {
        // Calculate duration in days from funding to due date
        uint256 durationDays = (dueDate - fundingTimestamp) / 1 days;

        // Simple interest: yield = principal * apy * days / (10000 * 365)
        // APY is in basis points (e.g., 1200 = 12%)
        return (principal * apy * durationDays) / (10000 * 365);
    }

    /**
     * @notice Gets funding information for an invoice
     * @dev Implements {IInvoiceFundingPool-getFundingInfo}
     * @param tokenId The ID of the invoice NFT
     * @return investor Address of the investor (zero address if not funded)
     * @return principal Amount funded
     * @return repaymentAmount Amount deposited for repayment
     * @return fundingTime Timestamp when the invoice was funded
     */
    function getFundingInfo(uint256 tokenId)
        external
        view
        returns (
            address investor,
            uint256 principal,
            uint256 repaymentAmount,
            uint256 fundingTime
        )
    {
        return (
            invoiceInvestor[tokenId],
            fundedAmounts[tokenId],
            repaymentPool[tokenId],
            fundingTimestamps[tokenId]
        );
    }

    /**
     * @notice Checks if an invoice is overdue (past due date + grace period)
     * @dev Implements {IInvoiceFundingPool-isOverdue}
     * @param tokenId The ID of the invoice NFT
     * @return True if the invoice is overdue
     */
    function isOverdue(uint256 tokenId) external view returns (bool) {
        IInvoice.Data memory data = invoice.getInvoice(tokenId);

        if (data.status != IInvoice.Status.FUNDED) {
            return false;
        }

        uint256 gracePeriodEnd = data.dueDate + (GRACE_PERIOD_DAYS * 1 days);
        return block.timestamp > gracePeriodEnd && repaymentPool[tokenId] == 0;
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @notice Pauses all contract operations
     * @dev Implements {IInvoiceFundingPool-pause} using {Pausable-_pause}
     * @dev Only callable by addresses with PAUSER_ROLE
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses all contract operations
     * @dev Implements {IInvoiceFundingPool-unpause} using {Pausable-_unpause}
     * @dev Only callable by addresses with PAUSER_ROLE
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
