// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title InvoiceNFT
 * @notice ERC-721 token representing tokenized invoices for onchain invoice financing
 * @dev Each token represents a unique invoice with associated metadata and lifecycle status
 */
contract InvoiceNFT is ERC721, ERC721URIStorage, AccessControl {
    using Counters for Counters.Counter;

    // Role for minting invoices (assigned to InvoiceFactory)
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Role for updating invoice status (assigned to FundingPool)
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");

    // Invoice lifecycle status
    enum Status {
        Created,           // Invoice NFT minted
        Listed,            // Posted to marketplace
        PartiallyFunded,   // Some funding received
        FullyFunded,       // 100% funded
        Disbursed,         // SMB received payment
        PendingRepayment,  // Waiting for invoice due date
        Repaid,            // SMB repaid, yield distributed
        Overdue,           // Past due date without payment
        Defaulted          // Collection failed
    }

    // Invoice metadata structure
    struct InvoiceData {
        uint256 amount;        // Invoice amount in USDC (6 decimals)
        uint256 dueDate;       // Invoice due date (Unix timestamp)
        uint256 createdAt;     // Creation timestamp
        uint8 riskScore;       // Risk score 0-100 (0=safest, 100=riskiest)
        Status status;         // Current lifecycle status
        string payer;          // Payer company name
        string invoiceNumber;  // External invoice ID/reference
    }

    // Token ID counter
    Counters.Counter private _tokenIds;

    // Mapping from token ID to invoice data
    mapping(uint256 => InvoiceData) private _invoices;

    // Events
    event InvoiceMinted(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 amount,
        uint256 dueDate,
        string payer
    );

    event InvoiceStatusUpdated(
        uint256 indexed tokenId,
        Status previousStatus,
        Status newStatus
    );

    /**
     * @notice Contract constructor
     */
    constructor() ERC721("Orbbit Invoice", "ORBINV") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Mint a new invoice NFT
     * @param to Address to mint the NFT to (usually Orbbit admin wallet)
     * @param amount Invoice amount in USDC (6 decimals)
     * @param dueDate Invoice due date (Unix timestamp)
     * @param riskScore Risk score 0-100
     * @param payer Payer company name
     * @param invoiceNumber External invoice reference
     * @param uri Token metadata URI (IPFS or centralized storage)
     * @return tokenId The newly minted token ID
     */
    function mint(
        address to,
        uint256 amount,
        uint256 dueDate,
        uint8 riskScore,
        string memory payer,
        string memory invoiceNumber,
        string memory uri
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(dueDate > block.timestamp, "Due date must be in the future");
        require(riskScore <= 100, "Risk score must be 0-100");
        require(bytes(payer).length > 0, "Payer cannot be empty");

        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        _invoices[tokenId] = InvoiceData({
            amount: amount,
            dueDate: dueDate,
            createdAt: block.timestamp,
            riskScore: riskScore,
            status: Status.Created,
            payer: payer,
            invoiceNumber: invoiceNumber
        });

        emit InvoiceMinted(tokenId, to, amount, dueDate, payer);

        return tokenId;
    }

    /**
     * @notice Update invoice status
     * @param tokenId Token ID to update
     * @param newStatus New status to set
     */
    function updateStatus(uint256 tokenId, Status newStatus)
        external
        onlyRole(UPDATER_ROLE)
    {
        require(_exists(tokenId), "Token does not exist");

        Status previousStatus = _invoices[tokenId].status;
        require(newStatus != previousStatus, "Status unchanged");

        // Validate status transition logic
        _validateStatusTransition(previousStatus, newStatus);

        _invoices[tokenId].status = newStatus;

        emit InvoiceStatusUpdated(tokenId, previousStatus, newStatus);
    }

    /**
     * @notice Get invoice data for a token
     * @param tokenId Token ID to query
     * @return Invoice data struct
     */
    function getInvoice(uint256 tokenId) external view returns (InvoiceData memory) {
        require(_exists(tokenId), "Token does not exist");
        return _invoices[tokenId];
    }

    /**
     * @notice Get current total supply of invoice NFTs
     * @return Total number of minted invoices
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIds.current();
    }

    /**
     * @notice Validate status transition is allowed
     * @param from Current status
     * @param to New status
     */
    function _validateStatusTransition(Status from, Status to) private pure {
        // Define valid status transitions
        if (from == Status.Created) {
            require(to == Status.Listed, "Can only transition to Listed");
        } else if (from == Status.Listed) {
            require(
                to == Status.PartiallyFunded || to == Status.FullyFunded,
                "Can only transition to PartiallyFunded or FullyFunded"
            );
        } else if (from == Status.PartiallyFunded) {
            require(to == Status.FullyFunded, "Can only transition to FullyFunded");
        } else if (from == Status.FullyFunded) {
            require(to == Status.Disbursed, "Can only transition to Disbursed");
        } else if (from == Status.Disbursed) {
            require(to == Status.PendingRepayment, "Can only transition to PendingRepayment");
        } else if (from == Status.PendingRepayment) {
            require(
                to == Status.Repaid || to == Status.Overdue,
                "Can only transition to Repaid or Overdue"
            );
        } else if (from == Status.Overdue) {
            require(
                to == Status.Repaid || to == Status.Defaulted,
                "Can only transition to Repaid or Defaulted"
            );
        } else {
            revert("Invalid status transition");
        }
    }

    // Required overrides
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
}
