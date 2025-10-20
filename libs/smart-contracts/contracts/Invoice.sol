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
    mapping(uint256 => IInvoice.Data) private _invoices;

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
     * @param name_ Token name (e.g., "Orbbit Invoice")
     * @param symbol_ Token symbol (e.g., "ORBINV")
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
            revert IInvoice.InvalidWhitelistAddress(whitelist_);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _baseTokenURI = baseTokenURI_;
        _metadataExtension = metadataExtension_;
        whitelist = IWhitelist(whitelist_);
    }

    // ============ EXTERNAL FUNCTIONS ============

    /**
     * @notice Mints a new invoice NFT directly to the recipient (lazy minting)
     * @dev Implements {IInvoice-mint}
     * @param mintTo Address receiving the newly minted invoice NFT
     * @param amount Invoice amount in USDC (6 decimals)
     * @param dueDate Unix timestamp when payment is due
     * @param apy Annual percentage yield in basis points
     * @param issuer Address of the entity that issued the invoice and receives funding
     * @param metadataURI URI for invoice metadata (contains payer info and other details)
     * @return tokenId The newly minted invoice token ID
     * @dev Only callable by addresses with MINTER_ROLE (InvoiceFundingPool)
     * @dev NFT is minted with FUNDED status (skipping DRAFT/LISTED which are off-chain)
     * @dev This is the recommended function for true lazy minting
     */
    function mint(
        address mintTo,
        uint256 amount,
        uint256 dueDate,
        uint256 apy,
        address issuer,
        string memory metadataURI
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        if (mintTo == address(0)) revert IInvoice.InvalidRecipient(mintTo);
        if (amount == 0) revert IInvoice.InvalidAmount(amount);
        if (dueDate <= block.timestamp)
            revert IInvoice.InvalidDueDate(dueDate, block.timestamp);
        if (issuer == address(0)) revert IInvoice.InvalidIssuer(issuer);

        uint256 tokenId = ++_nextTokenId;

        // Store invoice data with FUNDED status (invoice already funded at mint time)
        _invoices[tokenId] = IInvoice.Data({
            amount: amount,
            dueDate: dueDate,
            apy: apy,
            status: IInvoice.Status.FUNDED,
            issuer: issuer,
            metadataURI: metadataURI
        });

        // Mint NFT directly to recipient (true lazy minting)
        _safeMint(mintTo, tokenId);

        emit InvoiceMinted(tokenId, amount, issuer, dueDate);

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

        IInvoice.Data storage invoice = _invoices[tokenId];
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
    ) external view returns (IInvoice.Data memory) {
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

        IInvoice.Data memory invoice = _invoices[tokenId];

        // If metadata URI is set, use it; otherwise use base URI + tokenId
        if (bytes(invoice.metadataURI).length > 0) {
            return invoice.metadataURI;
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
     *      DRAFT -> LISTED (off-chain only, should not occur on-chain)
     *      LISTED -> FUNDED (legacy path, for backward compatibility)
     *      FUNDED -> REPAID (primary happy path)
     *      FUNDED -> DEFAULTED (primary unhappy path)
     * @dev Note: With lazy minting, NFTs are created directly with FUNDED status
     */
    function _isValidTransition(
        IInvoice.Status from,
        IInvoice.Status to
    ) internal pure returns (bool) {
        if (from == IInvoice.Status.DRAFT && to == IInvoice.Status.LISTED)
            return true;
        if (from == IInvoice.Status.LISTED && to == IInvoice.Status.FUNDED)
            return true;
        if (from == IInvoice.Status.FUNDED && to == IInvoice.Status.REPAID)
            return true;
        if (from == IInvoice.Status.FUNDED && to == IInvoice.Status.DEFAULTED)
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
