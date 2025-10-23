// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
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
contract InvoiceFundingPool is IInvoiceFundingPool, AccessControl, ReentrancyGuard, Pausable, IERC721Receiver {
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

    /// @notice Mapping from token ID to invoice issuer (for listed invoices held by contract)
    mapping(uint256 => address) public invoiceIssuer;

    /// @notice Grace period in days before marking invoice as defaulted
    uint256 public immutable GRACE_PERIOD_DAYS;

    /// @notice Platform treasury address receiving protocol fees
    address public platformTreasury;

    /// @notice Platform fee rate in basis points (e.g., 2500 = 25%)
    uint256 public platformFeeRate;

    /// @notice APR decimal precision: 1_000_000 = 100% (6 decimals)
    uint256 public constant APR_DECIMALS = 1_000_000;

    /// @notice Minimum APR with 6 decimals (0 allows zero-interest promotional invoices)
    uint256 public constant MIN_APR = 0;

    /// @notice Maximum invoice amount in payment token base units
    /// @dev Sanity check to prevent input errors, backend enforces business-specific limits
    /// @dev Can be updated by admin as platform scales
    uint256 public maxInvoiceAmount;

    /// @notice Basis points precision: 10000 = 100% (used for platformFeeRate)
    uint256 public constant BASIS_POINTS = 10000;

    /// @notice Days in a year for yield calculations
    uint256 public constant DAYS_IN_YEAR = 365;

    // ============ CONSTRUCTOR ============

    /**
     * @notice Initializes the InvoiceFundingPool contract
     * @param paymentToken_ Address of the payment token contract (USDC for V1)
     * @param invoice_ Address of the Invoice contract
     * @param gracePeriodDays_ Number of days after due date before marking as defaulted
     * @param whitelist_ Address of the Whitelist contract for KYC/KYB compliance
     * @param platformTreasury_ Address of the platform treasury receiving protocol fees
     * @param platformFeeRate_ Platform fee rate in basis points (e.g., 2500 = 25%, max 10000 = 100%)
     * @param maxInvoiceAmount_ Maximum invoice amount in payment token base units (e.g., 10_000_000 * 1e6 = 10M USDC)
     */
    constructor(
        address paymentToken_,
        address invoice_,
        uint256 gracePeriodDays_,
        address whitelist_,
        address platformTreasury_,
        uint256 platformFeeRate_,
        uint256 maxInvoiceAmount_
    ) {
        if (paymentToken_ == address(0)) revert IInvoiceFundingPool.InvalidPaymentTokenAddress(paymentToken_);
        if (invoice_ == address(0)) revert IInvoiceFundingPool.InvalidInvoiceAddress(invoice_);
        if (gracePeriodDays_ == 0) revert IInvoiceFundingPool.InvalidGracePeriod(gracePeriodDays_);
        if (whitelist_ == address(0)) revert IInvoiceFundingPool.WhitelistContractNotSet(whitelist_);
        if (platformTreasury_ == address(0)) revert IInvoiceFundingPool.InvalidPlatformTreasury(platformTreasury_);
        if (platformFeeRate_ > BASIS_POINTS) revert IInvoiceFundingPool.InvalidPlatformFeeRate(platformFeeRate_);
        if (maxInvoiceAmount_ == 0) revert IInvoiceFundingPool.InvalidAmount(maxInvoiceAmount_);

        paymentToken = IERC20(paymentToken_);
        invoice = Invoice(invoice_);
        whitelist = IWhitelist(whitelist_);
        GRACE_PERIOD_DAYS = gracePeriodDays_;
        platformTreasury = platformTreasury_;
        platformFeeRate = platformFeeRate_;
        maxInvoiceAmount = maxInvoiceAmount_;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    // ============ LISTING & FUNDING FUNCTIONS ============

    /**
     * @notice Lists an invoice by minting NFT to contract (Step 1 of two-step custody)
     * @dev Implements {IInvoiceFundingPool-listInvoice}
     * @param amount Invoice principal amount in payment token base units (e.g., for USDC with 6 decimals: 1_000_000 = $1)
     * @param dueAt Unix timestamp when payment is due
     * @param apr Annual percentage rate with 6 decimals (e.g., 120_000 = 12%, 365_000 = 36.5%, no upper limit)
     * @param issuer Address of the entity that issued the invoice and receives funding
     * @param uri URI for invoice metadata (IPFS/S3, contains payer info and other details)
     * @return tokenId The newly minted invoice token ID
     * @dev Only callable by OPERATOR_ROLE (platform admins)
     * @dev NFT minted to contract address with LISTED status
     * @dev Invoice becomes visible on-chain for investor verification
     * @dev Platform pays gas for listing (~$3-5)
     * @dev APR precision: 1_000_000 = 100% allows precise fee splitting (e.g., 30% platform, 70% investor)
     * @dev APR must be >= 0, no maximum limit (allows high-risk invoice financing rates >100%)
     */
    function listInvoice(
        uint256 amount,
        uint256 dueAt,
        uint256 apr,
        address issuer,
        string memory uri
    )
        external
        onlyRole(OPERATOR_ROLE)
        nonReentrant
        whenNotPaused
        returns (uint256)
    {
        if (amount == 0 || amount > maxInvoiceAmount) revert IInvoiceFundingPool.InvalidAmount(amount);
        if (dueAt <= block.timestamp) revert IInvoiceFundingPool.InvalidDueAt(dueAt, block.timestamp);
        if (apr < MIN_APR) revert IInvoiceFundingPool.InvalidAmount(apr); // Reusing InvalidAmount error for APR
        if (issuer == address(0)) revert IInvoiceFundingPool.InvalidIssuer(issuer);

        // Check KYC/KYB compliance for issuer
        if (!whitelist.isWhitelisted(issuer, IWhitelist.Role.SMB)) {
            revert IInvoiceFundingPool.IssuerNotWhitelisted(issuer);
        }

        // Mint NFT to contract (custody) with LISTED status
        uint256 tokenId = invoice.mint(
            address(this),
            amount,
            address(paymentToken),
            dueAt,
            apr,
            issuer,
            uri,
            IInvoice.Status.LISTED
        );

        // Record issuer for later funding
        invoiceIssuer[tokenId] = issuer;

        emit IInvoiceFundingPool.InvoiceListed(tokenId, issuer, amount, dueAt, apr);

        return tokenId;
    }

    /**
     * @notice Funds an invoice by transferring NFT to investor (Step 2 of two-step custody)
     * @dev Implements {IInvoiceFundingPool-fundInvoice}
     * @param tokenId The ID of the invoice to fund (must be in LISTED status)
     * @return tokenId The funded invoice token ID
     * @dev Transfers NFT from contract to investor atomically with USDC transfer
     * @dev Investor only needs to provide tokenId - all params already on-chain
     * @dev Transfers payment token directly from investor to issuer wallet
     * @dev Single-investor model: each invoice fully funded by one investor
     * @dev Updates status from LISTED to FUNDED
     * @dev Investor pays gas for funding (~$10-15)
     */
    function fundInvoice(uint256 tokenId)
        external
        nonReentrant
        whenNotPaused
        returns (uint256)
    {
        // Get invoice data from already-minted NFT
        IInvoice.InvoiceData memory data = invoice.getInvoice(tokenId);

        // Validate invoice is in LISTED status
        if (data.status != IInvoice.Status.LISTED) {
            revert IInvoiceFundingPool.InvoiceNotListed(tokenId, uint8(data.status));
        }

        // Check investor is whitelisted
        if (!whitelist.isWhitelisted(msg.sender, IWhitelist.Role.INVESTOR)) {
            revert IInvoiceFundingPool.InvestorNotWhitelisted(msg.sender);
        }

        // Get issuer from mapping
        address issuer = invoiceIssuer[tokenId];

        // Transfer USDC from investor to issuer
        paymentToken.safeTransferFrom(msg.sender, issuer, data.amount);

        // Transfer NFT from contract to investor
        invoice.safeTransferFrom(address(this), msg.sender, tokenId);

        // Update status to FUNDED
        invoice.updateStatus(tokenId, IInvoice.Status.FUNDED);

        // Record funding details
        invoiceInvestor[tokenId] = msg.sender;
        fundedAmounts[tokenId] = data.amount;
        fundingTimestamps[tokenId] = block.timestamp;

        emit InvoiceFunded(tokenId, msg.sender, data.amount);

        return tokenId;
    }

    // ============ REPAYMENT FUNCTIONS ============

    /**
     * @notice Deposits repayment (principal + yield) to the contract
     * @dev Implements {IInvoiceFundingPool-depositRepayment}
     * @param tokenId The ID of the invoice NFT being repaid
     * @dev Step 1 of repayment: Only the invoice issuer can deposit directly
     * @dev Caller must approve this contract to spend payment token first
     * @dev Caller must be the invoice issuer (reverts with UnauthorizedRepayment otherwise)
     * @dev Updates invoice status to FULLY_PAID
     * @dev For third-party payments, use depositRepaymentOnBehalf instead
     */
    function depositRepayment(uint256 tokenId)
        external
        nonReentrant
        whenNotPaused
    {
        IInvoice.InvoiceData memory data = invoice.getInvoice(tokenId);

        // Only the issuer can deposit repayment directly
        if (msg.sender != data.issuer) {
            revert IInvoiceFundingPool.UnauthorizedRepayment(msg.sender, data.issuer);
        }

        if (data.status != IInvoice.Status.FUNDED) {
            revert IInvoiceFundingPool.InvoiceNotFunded(tokenId, uint8(data.status));
        }
        if (repaymentPool[tokenId] != 0) {
            revert IInvoiceFundingPool.RepaymentAlreadyDeposited(tokenId);
        }

        // Calculate total repayment (principal + yield)
        uint256 principal = fundedAmounts[tokenId];
        uint256 fundingTime = fundingTimestamps[tokenId];
        (uint256 totalYield,,) = calculateYield(principal, data.apr, data.dueAt, fundingTime);
        uint256 totalRepayment = principal + totalYield;

        // Transfer payment token from depositor to this contract
        paymentToken.safeTransferFrom(msg.sender, address(this), totalRepayment);

        // Store in repayment pool
        repaymentPool[tokenId] = totalRepayment;

        // Update status to FULLY_PAID
        invoice.updateStatus(tokenId, IInvoice.Status.FULLY_PAID);

        emit RepaymentDeposited(tokenId, msg.sender, totalRepayment);
    }

    /**
     * @notice Deposits repayment on behalf of another address (for ACH flow)
     * @dev Implements the ACH autopay flow: SMB → Moov → Coinbase → Hot Wallet → Contract
     * @param tokenId The ID of the invoice NFT being repaid
     * @param onBehalfOf The SMB address this repayment is for (must match invoice issuer)
     * @dev Only callable by OPERATOR_ROLE (hot wallet or admin)
     * @dev Used when admin converts fiat to stablecoin and deposits for SMB
     * @dev Caller (admin) must have approved this contract to spend payment token
     * @dev Updates invoice status to FULLY_PAID
     */
    function depositRepaymentOnBehalf(
        uint256 tokenId,
        address onBehalfOf
    )
        external
        onlyRole(OPERATOR_ROLE)
        nonReentrant
        whenNotPaused
    {
        IInvoice.InvoiceData memory data = invoice.getInvoice(tokenId);

        // Validate invoice is in correct state
        if (data.status != IInvoice.Status.FUNDED) {
            revert IInvoiceFundingPool.InvoiceNotFunded(tokenId, uint8(data.status));
        }

        // Validate onBehalfOf matches invoice issuer
        if (data.issuer != onBehalfOf) {
            revert IInvoiceFundingPool.InvalidIssuer(onBehalfOf);
        }

        // Validate repayment not already deposited
        if (repaymentPool[tokenId] != 0) {
            revert IInvoiceFundingPool.RepaymentAlreadyDeposited(tokenId);
        }

        // Calculate total repayment (principal + yield)
        uint256 principal = fundedAmounts[tokenId];
        uint256 fundingTime = fundingTimestamps[tokenId];
        (uint256 totalYield,,) = calculateYield(principal, data.apr, data.dueAt, fundingTime);
        uint256 totalRepayment = principal + totalYield;

        // Transfer from caller (admin/hot wallet) to this contract
        paymentToken.safeTransferFrom(msg.sender, address(this), totalRepayment);

        // Store in repayment pool
        repaymentPool[tokenId] = totalRepayment;

        // Update status to FULLY_PAID
        invoice.updateStatus(tokenId, IInvoice.Status.FULLY_PAID);

        emit IInvoiceFundingPool.RepaymentDepositedOnBehalf(tokenId, msg.sender, onBehalfOf, totalRepayment);
    }

    /**
     * @notice Settles repayment by distributing funds to investor and platform
     * @dev Implements {IInvoiceFundingPool-settleRepayment}
     * @param tokenId The ID of the invoice NFT to settle
     * @dev Step 2 of repayment: Admin triggers distribution to investor and platform treasury
     * @dev Only callable by addresses with OPERATOR_ROLE
     * @dev Splits yield between investor and platform based on platformFeeRate
     * @dev Updates invoice status to SETTLED
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
        uint256 principal = fundedAmounts[tokenId];

        // Get fee split
        IInvoice.InvoiceData memory data = invoice.getInvoice(tokenId);
        uint256 fundingTime = fundingTimestamps[tokenId];
        (, uint256 investorYield, uint256 platformFee) = calculateYield(
            principal,
            data.apr,
            data.dueAt,
            fundingTime
        );

        // Transfer principal + investor yield to investor
        uint256 investorAmount = principal + investorYield;
        paymentToken.safeTransfer(investor, investorAmount);

        // Transfer platform fee to treasury
        paymentToken.safeTransfer(platformTreasury, platformFee);

        // Clear repayment pool
        repaymentPool[tokenId] = 0;

        // Update status to SETTLED
        invoice.updateStatus(tokenId, IInvoice.Status.SETTLED);

        emit InvoiceRepaid(tokenId, investor, investorAmount);
        emit IInvoiceFundingPool.PlatformFeeCollected(tokenId, platformFee);
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
        IInvoice.InvoiceData memory data = invoice.getInvoice(tokenId);
        if (data.status != IInvoice.Status.FUNDED) {
            revert IInvoiceFundingPool.InvoiceNotFunded(tokenId, uint8(data.status));
        }

        // Check grace period has elapsed
        uint256 gracePeriodEnd = data.dueAt + (GRACE_PERIOD_DAYS * 1 days);
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
     * @notice Calculates yield split between investor and platform
     * @dev Implements {IInvoiceFundingPool-calculateYield}
     * @param principal The principal amount funded in payment token base units
     * @param apr Annual percentage rate with 6 decimals (e.g., 120_000 = 12%, 365_000 = 36.5%)
     * @param dueAt The due date of the invoice
     * @param fundingTimestamp The timestamp when the invoice was funded
     * @return totalYield Total yield amount in payment token base units (principal * apr * duration)
     * @return investorYield Yield amount going to investor in payment token base units
     * @return platformFee Fee amount going to platform treasury in payment token base units
     * @dev Uses simple interest: yield = principal * apr * days / (APR_DECIMALS * DAYS_IN_YEAR)
     * @dev APR uses 6 decimals where APR_DECIMALS (1_000_000) = 100%
     * @dev Platform fee = totalYield * platformFeeRate / BASIS_POINTS (platformFeeRate in basis points)
     * @dev Investor yield = totalYield - platformFee
     */
    function calculateYield(
        uint256 principal,
        uint256 apr,
        uint256 dueAt,
        uint256 fundingTimestamp
    ) public view returns (uint256 totalYield, uint256 investorYield, uint256 platformFee) {
        // Calculate duration in days from funding to due date
        uint256 durationDays = (dueAt - fundingTimestamp) / 1 days;

        // Calculate total yield: principal * apr * days / (APR_DECIMALS * DAYS_IN_YEAR)
        // APR uses 6 decimals where APR_DECIMALS (1_000_000) = 100% (e.g., 120_000 = 12%)
        totalYield = (principal * apr * durationDays) / (APR_DECIMALS * DAYS_IN_YEAR);

        // Split: platform gets platformFeeRate% of total yield
        // platformFeeRate is in basis points (e.g., 3000 = 30%)
        platformFee = (totalYield * platformFeeRate) / BASIS_POINTS;
        investorYield = totalYield - platformFee;

        return (totalYield, investorYield, platformFee);
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
        IInvoice.InvoiceData memory data = invoice.getInvoice(tokenId);

        if (data.status != IInvoice.Status.FUNDED) {
            return false;
        }

        uint256 gracePeriodEnd = data.dueAt + (GRACE_PERIOD_DAYS * 1 days);
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

    /**
     * @notice Updates the platform treasury address
     * @dev Implements {IInvoiceFundingPool-setPlatformTreasury}
     * @param newTreasury New treasury address
     * @dev Only callable by DEFAULT_ADMIN_ROLE
     */
    function setPlatformTreasury(address newTreasury)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (newTreasury == address(0)) {
            revert IInvoiceFundingPool.InvalidPlatformTreasury(newTreasury);
        }

        address oldTreasury = platformTreasury;
        platformTreasury = newTreasury;

        emit IInvoiceFundingPool.PlatformTreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Updates the platform fee rate
     * @dev Implements {IInvoiceFundingPool-setPlatformFeeRate}
     * @param newRate New fee rate in basis points (max 10000 = 100%)
     * @dev Only callable by DEFAULT_ADMIN_ROLE
     */
    function setPlatformFeeRate(uint256 newRate)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (newRate > BASIS_POINTS) {
            revert IInvoiceFundingPool.InvalidPlatformFeeRate(newRate);
        }

        uint256 oldRate = platformFeeRate;
        platformFeeRate = newRate;

        emit IInvoiceFundingPool.PlatformFeeRateUpdated(oldRate, newRate);
    }

    /**
     * @notice Updates the maximum invoice amount
     * @dev Implements {IInvoiceFundingPool-setMaxInvoiceAmount}
     * @param newMax New maximum invoice amount in payment token base units
     * @dev Only callable by DEFAULT_ADMIN_ROLE
     * @dev Must be greater than 0 to prevent operational issues
     */
    function setMaxInvoiceAmount(uint256 newMax)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (newMax == 0) {
            revert IInvoiceFundingPool.InvalidAmount(newMax);
        }

        uint256 oldMax = maxInvoiceAmount;
        maxInvoiceAmount = newMax;

        emit IInvoiceFundingPool.MaxInvoiceAmountUpdated(oldMax, newMax);
    }

    // ============ ERC721 RECEIVER ============

    /**
     * @notice Handles the receipt of an NFT
     * @dev Required to receive ERC721 tokens via safeTransferFrom
     * @dev This contract receives invoice NFTs during the listing phase (two-step custody)
     * @return bytes4 The function selector to confirm the token transfer
     */
    function onERC721Received(
        address /* operator */,
        address /* from */,
        uint256 /* tokenId */,
        bytes calldata /* data */
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
