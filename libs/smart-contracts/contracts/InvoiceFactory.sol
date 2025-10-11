// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./InvoiceNFT.sol";
import "./FundingPool.sol";

/**
 * @title InvoiceFactory
 * @notice Factory contract for creating invoice NFTs and listing them
 * @dev Simplifies the invoice creation process for Orbbit admins
 */
contract InvoiceFactory is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    InvoiceNFT public immutable invoiceNFT;
    FundingPool public immutable fundingPool;

    event InvoiceCreated(
        uint256 indexed tokenId,
        uint256 amount,
        uint256 dueDate,
        string payer
    );

    constructor(address _invoiceNFT, address _fundingPool) {
        require(_invoiceNFT != address(0), "Invalid InvoiceNFT address");
        require(_fundingPool != address(0), "Invalid FundingPool address");

        invoiceNFT = InvoiceNFT(_invoiceNFT);
        fundingPool = FundingPool(_fundingPool);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Create and list a new invoice
     * @param amount Invoice amount in USDC
     * @param dueDate Invoice due date
     * @param riskScore Risk score 0-100
     * @param payer Payer company name
     * @param invoiceNumber External invoice reference
     * @param uri Token metadata URI
     * @return tokenId Newly created token ID
     */
    function createInvoice(
        uint256 amount,
        uint256 dueDate,
        uint8 riskScore,
        string memory payer,
        string memory invoiceNumber,
        string memory uri
    ) external onlyRole(ADMIN_ROLE) returns (uint256) {
        // Mint invoice NFT
        uint256 tokenId = invoiceNFT.mint(
            address(this),
            amount,
            dueDate,
            riskScore,
            payer,
            invoiceNumber,
            uri
        );

        // Automatically list on marketplace
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.Status.Listed);

        emit InvoiceCreated(tokenId, amount, dueDate, payer);

        return tokenId;
    }
}
