// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/utils/Pausable.sol';

import './interfaces/IInvoice.sol';
import './interfaces/IWhitelist.sol';

/**
 * @title Invoice
 * @notice ERC-721 contract for tokenizing invoices with lifecycle status tracking
 * @dev Each invoice is represented as an NFT with immutable financial data and mutable status
 */
contract Invoice is IInvoice, ERC721, AccessControl, Pausable {
    // ============ ROLES ============

    bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');
    bytes32 public constant UPDATER_ROLE = keccak256('UPDATER_ROLE');
    bytes32 public constant PAUSER_ROLE = keccak256('PAUSER_ROLE');

    // ============ STATE VARIABLES ============

    /// @notice Next token ID to be minted (starts at 1)
    uint256 private _nextTokenId;

    /// @notice Mapping from token ID to invoice data
    mapping(uint256 => IInvoice.InvoiceData) private _invoices;

    /// @notice Base URI for token metadata
    string private _baseTokenURI;

    /// @notice File extension for metadata URIs (e.g., ".json", "" for no extension)
    /// @dev Cannot be immutable as strings are reference types in Solidity
    string private _metadataExtension;

    /// @notice Whitelist contract for KYC/KYB compliance on transfers
    IWhitelist public immutable whitelist;

    // ============ CONSTRUCTOR ============

    /**
     * @notice Initializes the Invoice contract
     * @param name_ Token name (e.g., "Invoice Token")
     * @param symbol_ Token symbol (e.g., "INV")
     * @param baseTokenURI_ Base URI for token metadata
     * @param metadataExtension_ File extension for metadata (e.g., ".json", "" for no extension)
     * @param whitelist_ Address of the Whitelist contract for KYC/KYB compliance
     */
    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseTokenURI_,
        string memory metadataExtension_,
        address whitelist_
    ) ERC721(name_, symbol_) {
        if (whitelist_ == address(0))
            revert IInvoice.WhitelistContractNotSet(whitelist_);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _baseTokenURI = baseTokenURI_;
        _metadataExtension = metadataExtension_;
        whitelist = IWhitelist(whitelist_);
    }

    // ============ EXTERNAL FUNCTIONS ============

    /**
     * @notice Mints a new invoice NFT with specified initial status (two-step custody)
     * @dev Implements {IInvoice-mint}
     * @param mintTo Address receiving the newly minted invoice NFT (contract for listing, investor for funding)
     * @param amount Invoice amount in payment token base units (e.g., for USDC with 6 decimals: 1_000_000 = $1)
     * @param paymentToken ERC20 stablecoin address used for settlement
     * @param dueAt Unix timestamp when payment is due
     * @param apr Annual percentage rate with 6 decimals (e.g., 120_000 = 12%, 365_000 = 36.5%)
     * @param issuer Address of the entity that issued the invoice and receives funding
     * @param uri URI for invoice metadata (contains payer info and other details)
     * @param initialStatus Initial status (LISTED when platform lists, FUNDED for direct funding)
     * @return tokenId The newly minted invoice token ID
     * @dev Only callable by addresses with MINTER_ROLE (InvoiceFundingPool)
     * @dev Two-step custody: First mint to contract with LISTED, then transfer to investor when funded
     * @dev APR precision: Uses 6 decimals where 1_000_000 = 100% for precise fee splitting
     */
    function mint(
        address mintTo,
        uint256 amount,
        address paymentToken,
        uint256 dueAt,
        uint256 apr,
        address issuer,
        string memory uri,
        IInvoice.Status initialStatus
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        if (mintTo == address(0)) revert IInvoice.InvalidRecipient(mintTo);
        if (amount == 0) revert IInvoice.InvalidAmount(amount);
        if (paymentToken == address(0)) revert IInvoice.InvalidRecipient(paymentToken);
        if (dueAt <= block.timestamp)
            revert IInvoice.InvalidDueAt(dueAt, block.timestamp);
        if (issuer == address(0)) revert IInvoice.InvalidIssuer(issuer);

        // Enforce whitelist: issuer must be whitelisted as SMB
        if (!whitelist.isWhitelisted(issuer, IWhitelist.Role.SMB)) {
            revert IInvoice.IssuerNotWhitelisted(issuer);
        }

        uint256 tokenId = ++_nextTokenId;

        // Store invoice data with specified initial status
        _invoices[tokenId] = IInvoice.InvoiceData({
            amount: amount,
            paymentToken: paymentToken,
            dueAt: dueAt,
            apr: apr,
            status: initialStatus,
            issuer: issuer,
            uri: uri
        });

        // Mint NFT to specified recipient (contract for LISTED, investor for FUNDED)
        _safeMint(mintTo, tokenId);

        emit InvoiceMinted(tokenId, mintTo, issuer, amount, paymentToken, dueAt, apr, uri);

        return tokenId;
    }

    /**
     * @notice Updates the status of an invoice
     * @dev Implements {IInvoice-updateStatus}
     * @param tokenId The ID of the invoice NFT
     * @param newStatus The new status to set
     * @dev Only callable by addresses with UPDATER_ROLE (InvoiceFundingPool)
     * @dev Enforces valid state transitions
     */
    function updateStatus(
        uint256 tokenId,
        IInvoice.Status newStatus
    ) external onlyRole(UPDATER_ROLE) {
        if (!_exists(tokenId)) revert IInvoice.InvoiceNotFound(tokenId);

        IInvoice.InvoiceData storage invoice = _invoices[tokenId];
        IInvoice.Status oldStatus = invoice.status;

        if (!_isValidTransition(oldStatus, newStatus)) {
            revert IInvoice.InvalidStatusTransition(
                tokenId,
                oldStatus,
                newStatus
            );
        }

        invoice.status = newStatus;

        emit StatusUpdated(tokenId, oldStatus, newStatus);
    }

    /**
     * @notice Gets the full invoice data for a token
     * @dev Implements {IInvoice-getInvoice}
     * @param tokenId The ID of the invoice NFT
     * @return The invoice data struct
     */
    function getInvoice(
        uint256 tokenId
    ) external view returns (IInvoice.InvoiceData memory) {
        if (!_exists(tokenId)) revert IInvoice.InvoiceNotFound(tokenId);
        return _invoices[tokenId];
    }

    /**
     * @notice Pauses all token transfers and minting
     * @dev Implements {IInvoice-pause} using {Pausable-_pause}
     * @dev Only callable by addresses with PAUSER_ROLE
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses all token transfers and minting
     * @dev Implements {IInvoice-unpause} using {Pausable-_unpause}
     * @dev Only callable by addresses with PAUSER_ROLE
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ PUBLIC FUNCTIONS ============

    /**
     * @notice Returns the URI for a given token ID
     * @dev Overrides {ERC721-tokenURI}
     * @param tokenId The ID of the invoice NFT
     * @return The token URI string
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        if (!_exists(tokenId)) revert IInvoice.InvoiceNotFound(tokenId);

        IInvoice.InvoiceData memory invoice = _invoices[tokenId];

        // If metadata URI is set, use it; otherwise use base URI + tokenId
        if (bytes(invoice.uri).length > 0) {
            return invoice.uri;
        }

        return
            string(
                abi.encodePacked(
                    _baseTokenURI,
                    Strings.toString(tokenId),
                    _metadataExtension
                )
            );
    }

    /**
     * @notice See {IERC165-supportsInterface}
     * @dev Overrides {ERC721-supportsInterface} and {AccessControl-supportsInterface}
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // ============ INTERNAL FUNCTIONS ============

    /**
     * @notice Checks if a status transition is valid
     * @param from Current status
     * @param to New status
     * @return True if the transition is valid
     * @dev Enforces the following valid transitions:
     *      LISTED -> FUNDED (investor funds invoice, two-step custody)
     *      FUNDED -> FULLY_PAID (happy path: repayment deposited)
     *      FULLY_PAID -> SETTLED (happy path: funds distributed)
     *      FUNDED -> DEFAULTED (unhappy path: no repayment after grace period)
     *      DEFAULTED -> FULLY_PAID (recovery path: collections succeed)
     * @dev Terminal states: SETTLED, DEFAULTED (unless recovered)
     * @dev Two-step custody: NFTs minted with LISTED status, then transition to FUNDED
     */
    function _isValidTransition(
        IInvoice.Status from,
        IInvoice.Status to
    ) internal pure returns (bool) {
        // Two-step custody: Listing → Funding
        if (from == IInvoice.Status.LISTED && to == IInvoice.Status.FUNDED)
            return true;

        // Happy path: Funding → Deposit → Settlement
        if (from == IInvoice.Status.FUNDED && to == IInvoice.Status.FULLY_PAID)
            return true;
        if (from == IInvoice.Status.FULLY_PAID && to == IInvoice.Status.SETTLED)
            return true;

        // Unhappy path: Default without repayment
        if (from == IInvoice.Status.FUNDED && to == IInvoice.Status.DEFAULTED)
            return true;

        // Recovery path: Collections succeed after default
        if (from == IInvoice.Status.DEFAULTED && to == IInvoice.Status.FULLY_PAID)
            return true;

        return false;
    }

    /**
     * @notice Checks if a token exists
     * @param tokenId The ID to check
     * @return True if the token has been minted
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @notice Hook that is called before any token transfer
     * @dev Overrides {ERC721-_update}
     * @dev Overridden to add pause functionality and whitelist enforcement
     * @dev Enforces that NFT recipients must be whitelisted as INVESTOR
     * @dev Allows minting (when previous owner is zero address)
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override whenNotPaused returns (address) {
        address previousOwner = _ownerOf(tokenId);

        // Enforce whitelist on transfers (not on minting or burning)
        if (to != address(0) && previousOwner != address(0)) {
            // This is a transfer (not a mint or burn)
            // Recipient must be whitelisted as INVESTOR to receive invoice NFTs
            if (!whitelist.isWhitelisted(to, IWhitelist.Role.INVESTOR)) {
                revert IInvoice.RecipientNotWhitelisted(to);
            }
        }

        return super._update(to, tokenId, auth);
    }
}
