// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IInvoice
 * @notice Interface for the Invoice NFT contract
 * @dev Defines the public API, shared types, and events for invoice tokenization
 */
interface IInvoice {
    // ============ ENUMS ============

    /**
     * @notice Invoice lifecycle statuses (on-chain only)
     * @dev All pre-listing states (Draft, Submitted, Underwriting, Approved, Declined)
     *      are tracked off-chain in database
     * @dev All post-funding operational states (Awaiting_Payment, Due_Date, Grace_Period)
     *      are tracked off-chain in database
     * @dev All collections states (Collection, Partial_Paid, Unpaid, Charge_Off)
     *      are tracked off-chain in database
     * @dev Status transitions are enforced by the implementing contract
     */
    enum Status {
        LISTED, // 0 - NFT minted to contract, awaiting investor funding (two-step custody)
        FUNDED, // 1 - NFT transferred to investor, payment token transferred to SMB, awaiting repayment
        FULLY_PAID, // 2 - Repayment deposited to contract, awaiting admin settlement
        SETTLED, // 3 - Funds distributed to investor, invoice lifecycle complete (terminal)
        DEFAULTED // 4 - No repayment received after grace period, collections initiated (terminal)
    }

    // ============ ERRORS ============

    /**
     * @notice Thrown when an invalid issuer address is provided
     * @param issuer The invalid address provided
     */
    error InvalidIssuer(address issuer);

    /**
     * @notice Thrown when an invalid recipient address is provided
     * @param recipient The invalid address provided
     */
    error InvalidRecipient(address recipient);

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
     * @notice Thrown when the whitelist contract address is not set (zero address)
     * @param whitelist The invalid address provided
     */
    error WhitelistContractNotSet(address whitelist);

    /**
     * @notice Thrown when attempting to access a non-existent invoice
     * @param tokenId The token ID that does not exist
     */
    error InvoiceNotFound(uint256 tokenId);

    /**
     * @notice Thrown when an invalid status transition is attempted
     * @param tokenId The invoice token ID
     * @param from The current status
     * @param to The attempted new status
     */
    error InvalidStatusTransition(uint256 tokenId, Status from, Status to);

    /**
     * @notice Thrown when a transfer recipient is not whitelisted
     * @param recipient The address that is not whitelisted
     */
    error RecipientNotWhitelisted(address recipient);

    /**
     * @notice Thrown when an issuer is not whitelisted
     * @param issuer The address that is not whitelisted
     */
    error IssuerNotWhitelisted(address issuer);

    // ============ STRUCTS ============

    /**
     * @notice Invoice data structure
     * @param amount Invoice principal amount in payment token base units
     * @param paymentToken ERC20 stablecoin address used for settlement (USDC, XSGD, EURC, etc.)
     * @param dueAt Unix timestamp when payment is due
     * @param apr Annual Percentage Rate in basis points (e.g., 1200 = 12%)
     * @param status Current lifecycle status of the invoice
     * @param issuer Address of the entity that issued the invoice and receives funding
     * @param uri URI pointing to invoice metadata (IPFS/S3, contains payer info and other details)
     */
    struct InvoiceData {
        uint256 amount;
        address paymentToken;
        uint256 dueAt;
        uint256 apr;
        Status status;
        address issuer;
        string uri;
    }

    // ============ EVENTS ============

    /**
     * @notice Emitted when a new invoice NFT is minted
     * @param tokenId The ID of the newly minted invoice NFT
     * @param recipient The address receiving the invoice NFT (investor)
     * @param issuer The address of the entity that issued the invoice (SMB)
     * @param amount Invoice principal amount in payment token base units
     * @param paymentToken ERC20 stablecoin address used for settlement
     * @param dueAt Unix timestamp when payment is due
     * @param apr Annual Percentage Rate in basis points
     * @param uri URI pointing to invoice metadata
     */
    event InvoiceMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        address indexed issuer,
        uint256 amount,
        address paymentToken,
        uint256 dueAt,
        uint256 apr,
        string uri
    );

    event StatusUpdated(
        uint256 indexed tokenId,
        Status oldStatus,
        Status newStatus
    );

    // ============ FUNCTIONS ============

    /**
     * @notice Mints a new invoice NFT with specified initial status (two-step custody)
     * @param mintTo Address receiving the newly minted invoice NFT (contract for listing, investor for funding)
     * @param amount Invoice amount in payment token base units
     * @param paymentToken ERC20 stablecoin address used for settlement
     * @param dueAt Unix timestamp when payment is due
     * @param apr Annual percentage rate in basis points
     * @param issuer Address of the entity that issued the invoice and receives funding
     * @param uri URI for invoice metadata (contains payer info and other details)
     * @param initialStatus Initial status (LISTED when platform lists, FUNDED for legacy direct funding)
     * @return tokenId The newly minted invoice token ID
     * @dev Called by InvoiceFundingPool for both listing (LISTED) and funding (FUNDED)
     * @dev Two-step custody: First mint to contract with LISTED, then transfer to investor when funded
     */
    function mint(
        address mintTo,
        uint256 amount,
        address paymentToken,
        uint256 dueAt,
        uint256 apr,
        address issuer,
        string memory uri,
        Status initialStatus
    ) external returns (uint256);

    /**
     * @notice Updates the status of an invoice
     * @param tokenId The ID of the invoice NFT
     * @param newStatus The new status to set
     */
    function updateStatus(uint256 tokenId, Status newStatus) external;

    /**
     * @notice Gets the full invoice data for a token
     * @param tokenId The ID of the invoice NFT
     * @return The invoice data struct
     */
    function getInvoice(uint256 tokenId) external view returns (InvoiceData memory);

    /**
     * @notice Pauses all token transfers and minting
     */
    function pause() external;

    /**
     * @notice Unpauses all token transfers and minting
     */
    function unpause() external;
}
