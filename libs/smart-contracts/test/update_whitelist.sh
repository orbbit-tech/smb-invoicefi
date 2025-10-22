#!/bin/bash

# Helper function for two-step listing and funding
helper_func='
    /// @notice Helper to list and fund an invoice in one go (two-step process)
    function _listAndFundInvoice(
        uint256 dueAt,
        address smb,
        address investor,
        string memory uri
    ) internal returns (uint256 tokenId) {
        // Step 1: Platform lists
        tokenId = pool.listInvoice(INVOICE_AMOUNT, dueAt, APR, smb, uri);

        // Step 2: Investor funds
        vm.prank(investor);
        usdc.approve(address(pool), INVOICE_AMOUNT);
        vm.prank(investor);
        pool.fundInvoice(tokenId);
    }
'

# Read and process file
perl -i -p0e 's/\/\/ First fund an invoice\s+uint256 dueAt = block\.timestamp \+ DUE_DATE_OFFSET;\s+vm\.startPrank\(whitelistedInvestor\);\s+usdc\.approve\(address\(pool\), INVOICE_AMOUNT\);\s+uint256 tokenId = pool\.fundInvoice\(\s+INVOICE_AMOUNT,\s+dueAt,\s+APR,\s+whitelistedSMB,\s+"ipfs:\/\/metadata"\s+\);\s+vm\.stopPrank\(\);/\/\/ First fund an invoice (two-step)\n        uint256 dueAt = block.timestamp + DUE_DATE_OFFSET;\n        uint256 tokenId = _listAndFundInvoice(dueAt, whitelistedSMB, whitelistedInvestor, "ipfs:\/\/metadata");/g' WhitelistIntegration.t.sol

echo "File updated"
