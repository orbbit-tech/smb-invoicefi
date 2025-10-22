// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IInvoiceFundingPool
 * @notice Interface for the InvoiceFundingPool contract
 * @dev Defines the public API and events for invoice funding, repayment, and default handling
 */
interface IInvoiceFundingPool {
    // ============ ERRORS ============

    /**
     * @notice Thrown when an invalid payment token address is provided
     * @param paymentToken The invalid address provided
     */
    error InvalidPaymentTokenAddress(address paymentToken);

    /**
     * @notice Thrown when an invalid Invoice contract address is provided
     * @param invoice The invalid address provided
     */
    error InvalidInvoiceAddress(address invoice);

    /**
     * @notice Thrown when an invalid grace period is provided
     * @param gracePeriod The invalid grace period provided
     */
    error InvalidGracePeriod(uint256 gracePeriod);

    /**
     * @notice Thrown when the whitelist contract address is not set (zero address)
     * @param whitelist The invalid address provided
     */
    error WhitelistContractNotSet(address whitelist);

    /**
     * @notice Thrown when an invalid amount is provided
     * @param amount The invalid amount provided
     */
    error InvalidAmount(uint256 amount);

    /**
     * @notice Thrown when an invalid due date is provided
     * @param dueAt The invalid due date provided
     * @param currentTime The current block timestamp
     */
    error InvalidDueAt(uint256 dueAt, uint256 currentTime);

    /**
     * @notice Thrown when an invalid issuer address is provided
     * @param issuer The invalid address provided
     */
    error InvalidIssuer(address issuer);

    /**
     * @notice Thrown when caller is not authorized to deposit repayment
     * @param caller The address attempting to deposit
     * @param issuer The authorized issuer address
     */
    error UnauthorizedRepayment(address caller, address issuer);

    /**
     * @notice Thrown when an investor is not whitelisted
     * @param investor The address that is not whitelisted
     */
    error InvestorNotWhitelisted(address investor);

    /**
     * @notice Thrown when an issuer is not whitelisted
     * @param issuer The address that is not whitelisted
     */
    error IssuerNotWhitelisted(address issuer);

    /**
     * @notice Thrown when an invoice is not in FUNDED status
     * @param tokenId The invoice token ID
     * @param currentStatus The current status of the invoice
     */
    error InvoiceNotFunded(uint256 tokenId, uint8 currentStatus);

    /**
     * @notice Thrown when an invoice is not in LISTED status
     * @param tokenId The invoice token ID
     * @param currentStatus The current status of the invoice
     */
    error InvoiceNotListed(uint256 tokenId, uint8 currentStatus);

    /**
     * @notice Thrown when repayment has already been deposited
     * @param tokenId The invoice token ID
     */
    error RepaymentAlreadyDeposited(uint256 tokenId);

    /**
     * @notice Thrown when no repayment has been deposited
     * @param tokenId The invoice token ID
     */
    error NoRepaymentDeposited(uint256 tokenId);

    /**
     * @notice Thrown when grace period has not elapsed yet
     * @param tokenId The invoice token ID
     * @param gracePeriodEnd The timestamp when grace period ends
     * @param currentTime The current block timestamp
     */
    error GracePeriodNotElapsed(
        uint256 tokenId,
        uint256 gracePeriodEnd,
        uint256 currentTime
    );

    /**
     * @notice Thrown when an invalid platform treasury address is provided
     * @param treasury The invalid address provided
     */
    error InvalidPlatformTreasury(address treasury);

    /**
     * @notice Thrown when an invalid platform fee rate is provided
     * @param rate The invalid rate provided (must be <= 10000 = 100%)
     */
    error InvalidPlatformFeeRate(uint256 rate);

    // ============ EVENTS ============

    /**
     * @notice Emitted when an invoice is listed (minted to contract with LISTED status)
     * @param tokenId The ID of the newly listed invoice NFT
     * @param issuer The address of the SMB that issued the invoice
     * @param amount The principal amount in payment token base units
     * @param dueAt Unix timestamp when payment is due
     * @param apr Annual percentage rate in basis points
     */
    event InvoiceListed(
        uint256 indexed tokenId,
        address indexed issuer,
        uint256 amount,
        uint256 dueAt,
        uint256 apr
    );

    /**
     * @notice Emitted when an invoice is funded (NFT transferred to investor)
     * @param tokenId The ID of the invoice NFT
     * @param investor The address of the investor who funded the invoice
     * @param amount The principal amount funded in payment token base units
     */
    event InvoiceFunded(
        uint256 indexed tokenId,
        address indexed investor,
        uint256 amount
    );

    /**
     * @notice Emitted when a repayment is deposited to the contract
     * @param tokenId The ID of the invoice NFT being repaid
     * @param depositor The address that deposited the repayment
     * @param amount The total repayment amount (principal + yield)
     */
    event RepaymentDeposited(
        uint256 indexed tokenId,
        address indexed depositor,
        uint256 amount
    );

    /**
     * @notice Emitted when a repayment is settled and distributed to investor
     * @param tokenId The ID of the invoice NFT that was repaid
     * @param investor The address of the investor who received the repayment
     * @param totalAmount The total amount distributed (principal + yield)
     */
    event InvoiceRepaid(
        uint256 indexed tokenId,
        address indexed investor,
        uint256 totalAmount
    );

    /**
     * @notice Emitted when an invoice is marked as defaulted
     * @param tokenId The ID of the defaulted invoice NFT
     * @param investor The address of the investor who funded the invoice
     * @param principal The principal amount that was not repaid
     */
    event InvoiceDefaulted(
        uint256 indexed tokenId,
        address indexed investor,
        uint256 principal
    );

    /**
     * @notice Emitted when repayment is deposited on behalf of another address
     * @param tokenId The ID of the invoice NFT being repaid
     * @param depositor The address that deposited funds (admin/hot wallet)
     * @param onBehalfOf The SMB address who owes the repayment
     * @param amount The total repayment amount (principal + yield)
     */
    event RepaymentDepositedOnBehalf(
        uint256 indexed tokenId,
        address indexed depositor,
        address indexed onBehalfOf,
        uint256 amount
    );

    /**
     * @notice Emitted when platform fee is collected
     * @param tokenId The ID of the invoice
     * @param feeAmount The platform fee amount collected
     */
    event PlatformFeeCollected(uint256 indexed tokenId, uint256 feeAmount);

    /**
     * @notice Emitted when platform treasury address is updated
     * @param oldTreasury Previous treasury address
     * @param newTreasury New treasury address
     */
    event PlatformTreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury
    );

    /**
     * @notice Emitted when platform fee rate is updated
     * @param oldRate Previous fee rate in basis points
     * @param newRate New fee rate in basis points
     */
    event PlatformFeeRateUpdated(uint256 oldRate, uint256 newRate);

    // ============ FUNCTIONS ============

    /**
     * @notice Lists an invoice by minting NFT to contract (Step 1 of two-step custody)
     * @param amount Invoice principal amount in payment token base units
     * @param dueAt Unix timestamp when payment is due
     * @param apr Annual percentage rate in basis points (e.g., 1200 = 12%)
     * @param issuer Address of the entity that issued the invoice and receives funding
     * @param uri URI for invoice metadata (IPFS/S3, contains payer info and other details)
     * @return tokenId The newly minted invoice token ID
     * @dev Only callable by OPERATOR_ROLE (platform admins)
     * @dev NFT minted to contract address with LISTED status
     * @dev Invoice becomes visible on-chain for investor verification
     * @dev Platform pays gas for listing (~$3-5)
     */
    function listInvoice(
        uint256 amount,
        uint256 dueAt,
        uint256 apr,
        address issuer,
        string memory uri
    ) external returns (uint256 tokenId);

    /**
     * @notice Funds an invoice by transferring NFT to investor (Step 2 of two-step custody)
     * @param tokenId The ID of the invoice to fund (must be in LISTED status)
     * @return tokenId The funded invoice token ID
     * @dev Transfers NFT from contract to investor atomically with USDC transfer
     * @dev Investor only needs to provide tokenId - all params already on-chain
     * @dev Transfers payment token directly from investor to issuer wallet
     * @dev Single-investor model: each invoice fully funded by one investor
     * @dev Updates status from LISTED to FUNDED
     * @dev Investor pays gas for funding (~$10-15)
     */
    function fundInvoice(uint256 tokenId) external returns (uint256);

    /**
     * @notice Deposits repayment (principal + yield) to the contract
     * @param tokenId The ID of the invoice NFT being repaid
     * @dev Step 1 of repayment: Only the invoice issuer can deposit directly
     * @dev Caller must approve this contract to spend payment token first
     * @dev Caller must be the invoice issuer (reverts with UnauthorizedRepayment otherwise)
     * @dev Updates invoice status to FULLY_PAID
     * @dev For third-party payments, use depositRepaymentOnBehalf instead
     */
    function depositRepayment(uint256 tokenId) external;

    /**
     * @notice Deposits repayment on behalf of another address (for ACH flow)
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
    ) external;

    /**
     * @notice Settles repayment by distributing funds to investor and platform
     * @param tokenId The ID of the invoice NFT to settle
     * @dev Step 2 of repayment: Admin triggers distribution to investor and platform treasury
     * @dev Only callable by addresses with OPERATOR_ROLE
     * @dev Splits yield between investor and platform based on platformFeeRate
     * @dev Updates invoice status to SETTLED
     */
    function settleRepayment(uint256 tokenId) external;

    /**
     * @notice Marks an invoice as defaulted
     * @param tokenId The ID of the invoice NFT to mark as defaulted
     * @dev Only callable by addresses with OPERATOR_ROLE
     * @dev Can only be called after grace period has elapsed
     */
    function markDefaulted(uint256 tokenId) external;

    /**
     * @notice Calculates yield split between investor and platform
     * @param principal The principal amount funded
     * @param apr Annual percentage rate in basis points (total fee SMB pays)
     * @param dueAt The due date of the invoice
     * @param fundingTimestamp The timestamp when the invoice was funded
     * @return totalYield Total yield amount (principal * apr * duration)
     * @return investorYield Yield amount going to investor
     * @return platformFee Fee amount going to platform treasury
     * @dev Uses simple interest: yield = principal * apr * days / (10000 * 365)
     * @dev Platform fee = totalYield * platformFeeRate / 10000
     * @dev Investor yield = totalYield - platformFee
     */
    function calculateYield(
        uint256 principal,
        uint256 apr,
        uint256 dueAt,
        uint256 fundingTimestamp
    )
        external
        view
        returns (
            uint256 totalYield,
            uint256 investorYield,
            uint256 platformFee
        );

    /**
     * @notice Gets funding information for an invoice
     * @param tokenId The ID of the invoice NFT
     * @return investor Address of the investor (zero address if not funded)
     * @return principal Amount funded
     * @return repaymentAmount Amount deposited for repayment
     * @return fundingTime Timestamp when the invoice was funded
     */
    function getFundingInfo(
        uint256 tokenId
    )
        external
        view
        returns (
            address investor,
            uint256 principal,
            uint256 repaymentAmount,
            uint256 fundingTime
        );

    /**
     * @notice Checks if an invoice is overdue (past due date + grace period)
     * @param tokenId The ID of the invoice NFT
     * @return True if the invoice is overdue
     */
    function isOverdue(uint256 tokenId) external view returns (bool);

    /**
     * @notice Pauses all contract operations
     * @dev Only callable by addresses with PAUSER_ROLE
     */
    function pause() external;

    /**
     * @notice Unpauses all contract operations
     * @dev Only callable by addresses with PAUSER_ROLE
     */
    function unpause() external;

    /**
     * @notice Updates the platform treasury address
     * @param newTreasury New treasury address
     * @dev Only callable by DEFAULT_ADMIN_ROLE
     */
    function setPlatformTreasury(address newTreasury) external;

    /**
     * @notice Updates the platform fee rate
     * @param newRate New fee rate in basis points (max 10000 = 100%)
     * @dev Only callable by DEFAULT_ADMIN_ROLE
     */
    function setPlatformFeeRate(uint256 newRate) external;
}
