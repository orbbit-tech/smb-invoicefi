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
     * @notice Invoice lifecycle statuses
     * @dev Status transitions are enforced by the implementing contract
     * @dev DRAFT and LISTED are off-chain database statuses only (no NFT exists)
     * @dev FUNDED onwards are on-chain statuses (NFT exists and owned by investor)
     */
    enum Status {
        DRAFT, // 0 - Created off-chain in database, awaiting admin approval (no NFT)
        LISTED, // 1 - Approved, visible in marketplace (stored in database, no NFT yet)
        FUNDED, // 2 - NFT minted to investor, USDC transferred, awaiting repayment
        REPAID, // 3 - Repayment received, yield distributed to investor
        DEFAULTED // 4 - No repayment received after grace period, defaulted
    }

    // ============ ERRORS ============

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
     * @notice Thrown when an invalid whitelist address is provided
     * @param whitelist The invalid address provided
     */
    error InvalidWhitelistAddress(address whitelist);

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

    // ============ STRUCTS ============

    /**
     * @notice Invoice data structure
     * @param amount Invoice principal amount in USDC (6 decimals)
     * @param dueDate Unix timestamp when payment is due
     * @param apy Annual Percentage Yield in basis points (e.g., 1200 = 12%)
     * @param status Current lifecycle status of the invoice
     * @param issuer Address of the entity that issued the invoice and receives funding
     * @param metadataURI URI pointing to invoice metadata (IPFS/S3, contains payer info and other details)
     */
    struct Data {
        uint256 amount;
        uint256 dueDate;
        uint256 apy;
        Status status;
        address issuer;
        string metadataURI;
    }

    // ============ EVENTS ============

    event InvoiceMinted(
        uint256 indexed tokenId,
        uint256 amount,
        address indexed issuer,
        uint256 dueDate
    );

    event StatusUpdated(
        uint256 indexed tokenId,
        Status oldStatus,
        Status newStatus
    );

    // ============ FUNCTIONS ============

    /**
     * @notice Mints a new invoice NFT directly to the recipient (lazy minting)
     * @param mintTo Address receiving the newly minted invoice NFT
     * @param amount Invoice amount in USDC (6 decimals)
     * @param dueDate Unix timestamp when payment is due
     * @param apy Annual percentage yield in basis points
     * @param issuer Address of the entity that issued the invoice and receives funding
     * @param metadataURI URI for invoice metadata (contains payer info and other details)
     * @return tokenId The newly minted invoice token ID
     * @dev Only called by InvoiceFundingPool when an invoice is funded
     * @dev NFT is minted with FUNDED status (skipping DRAFT/LISTED which are off-chain)
     */
    function mint(
        address mintTo,
        uint256 amount,
        uint256 dueDate,
        uint256 apy,
        address issuer,
        string memory metadataURI
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
    function getInvoice(uint256 tokenId) external view returns (Data memory);

    /**
     * @notice Pauses all token transfers and minting
     */
    function pause() external;

    /**
     * @notice Unpauses all token transfers and minting
     */
    function unpause() external;
}
