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
     * @notice Thrown when an invalid Whitelist address is provided
     * @param whitelist The invalid address provided
     */
    error InvalidWhitelistAddress(address whitelist);

    /**
     * @notice Thrown when an invalid amount is provided
     * @param amount The invalid amount provided
     */
    error InvalidAmount(uint256 amount);

    /**
     * @notice Thrown when an invalid due date is provided
     * @param dueDate The invalid due date provided
     * @param currentTime The current block timestamp
     */
    error InvalidDueDate(uint256 dueDate, uint256 currentTime);

    /**
     * @notice Thrown when an invalid issuer address is provided
     * @param issuer The invalid address provided
     */
    error InvalidIssuer(address issuer);

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
    error GracePeriodNotElapsed(uint256 tokenId, uint256 gracePeriodEnd, uint256 currentTime);

    // ============ EVENTS ============

    /**
     * @notice Emitted when an invoice is funded
     * @param tokenId The ID of the newly minted invoice NFT
     * @param investor The address of the investor who funded the invoice
     * @param amount The principal amount funded in payment token (USDC, 6 decimals)
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

    // ============ FUNCTIONS ============

    /**
     * @notice Funds an invoice with payment token and mints NFT directly to investor (lazy minting)
     * @param amount Invoice principal amount in payment token (USDC, 6 decimals)
     * @param dueDate Unix timestamp when payment is due
     * @param apy Annual percentage yield in basis points (e.g., 1200 = 12%)
     * @param issuer Address of the entity that issued the invoice and receives funding
     * @param metadataURI URI for invoice metadata (IPFS/S3, contains payer info and other details)
     * @return tokenId The newly minted invoice token ID
     * @dev Implements true lazy minting - NFT only created when investor funds
     * @dev Transfers payment token (USDC) directly from investor to issuer wallet
     * @dev Single-investor model: each invoice fully funded by one investor
     * @dev V1: Currently USDC-only on Base (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
     */
    function fundInvoice(
        uint256 amount,
        uint256 dueDate,
        uint256 apy,
        address issuer,
        string memory metadataURI
    ) external returns (uint256 tokenId);

    /**
     * @notice Deposits repayment (principal + yield) to the contract
     * @param tokenId The ID of the invoice NFT being repaid
     * @dev Step 1 of repayment: SMB or admin deposits funds to contract
     * @dev Caller must approve this contract to spend payment token (USDC) first
     */
    function depositRepayment(uint256 tokenId) external;

    /**
     * @notice Settles repayment by distributing funds to investor
     * @param tokenId The ID of the invoice NFT to settle
     * @dev Step 2 of repayment: Admin triggers distribution to investor
     * @dev Only callable by addresses with OPERATOR_ROLE
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
     * @notice Calculates yield for an invoice
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
    ) external pure returns (uint256);

    /**
     * @notice Gets funding information for an invoice
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
}
