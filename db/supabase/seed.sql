-- ============================================================================
-- Orbbit Web3 Invoice Financing - Seed Data
-- ============================================================================
-- Comprehensive test data covering full invoice lifecycle with 3-5 invoices
--
-- UPDATED: Uses 6-decimal precision matching smart contract conventions
-- - Amounts: 6 decimals for USDC (e.g., 1,000,000 = $1, $50,000 = 50,000,000,000)
-- - APR/Rates: 6 decimals (e.g., 36.5% = 365,000 where 1,000,000 = 100%)
--
-- Data includes:
-- - 3 SMB organizations (issuers)
-- - 3 investors (users)
-- - 4 payer companies (invoice debtors)
-- - 5 invoices covering all lifecycle states
-- - Related NFTs, transactions, positions, and distributions
-- ============================================================================

-- ============================================================================
-- IDENTITY DATA
-- ============================================================================

-- Organizations (SMBs that issue invoices)
INSERT INTO identity.organization (id, name, legal_name, wallet_address, timezone, email, kyb_status, is_whitelisted, created_at) VALUES
('org_01tech', 'TechSupply Co.', 'TechSupply Company LLC', '0x1111111111111111111111111111111111111111', 'America/New_York', 'admin@techsupply.example', 'APPROVED', true, NOW() - INTERVAL '90 days'),
('org_02food', 'FoodDistrib Inc.', 'Food Distribution Inc.', '0x2222222222222222222222222222222222222222', 'America/Chicago', 'admin@fooddistrib.example', 'APPROVED', true, NOW() - INTERVAL '60 days'),
('org_03retail', 'RetailWholesale LLC', 'Retail Wholesale Limited Liability Company', '0x3333333333333333333333333333333333333333', 'America/Los_Angeles', 'admin@retailwholesale.example', 'APPROVED', true, NOW() - INTERVAL '30 days');

-- Users (Individual Investors)
INSERT INTO identity.user (id, email, wallet_address, first_name, last_name, kyc_status, is_whitelisted, is_accredited_investor, created_at) VALUES
('user_01alice', 'alice.investor@example.com', '0xaaaa111111111111111111111111111111111111', 'Alice', 'Johnson', 'APPROVED', true, true, NOW() - INTERVAL '80 days'),
('user_02bob', 'bob.crypto@example.com', '0xbbbb222222222222222222222222222222222222', 'Bob', 'Smith', 'APPROVED', true, true, NOW() - INTERVAL '70 days'),
('user_03charlie', 'charlie.fund@example.com', '0xcccc333333333333333333333333333333333333', 'Charlie', 'Davis', 'APPROVED', true, true, NOW() - INTERVAL '50 days');

-- Members (Organization team members)
INSERT INTO identity.member (id, email, wallet_address, first_name, last_name, created_at) VALUES
('member_01tech', 'john.cfo@techsupply.example', '0x1111111111111111111111111111111111111112', 'John', 'CFO', NOW() - INTERVAL '85 days'),
('member_02food', 'jane.ops@fooddistrib.example', '0x2222222222222222222222222222222222222223', 'Jane', 'Operations', NOW() - INTERVAL '55 days'),
('member_03retail', 'mike.owner@retailwholesale.example', '0x3333333333333333333333333333333333333334', 'Mike', 'Owner', NOW() - INTERVAL '25 days');

-- Organization-Member relationships
INSERT INTO identity.organization_member (organization_id, member_id, role, joined_at, created_at) VALUES
('org_01tech', 'member_01tech', 'ADMIN', NOW() - INTERVAL '85 days', NOW() - INTERVAL '85 days'),
('org_02food', 'member_02food', 'ADMIN', NOW() - INTERVAL '55 days', NOW() - INTERVAL '55 days'),
('org_03retail', 'member_03retail', 'OWNER', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days');

-- ============================================================================
-- BUSINESS DATA
-- ============================================================================

-- Payer Companies (Invoice debtors - major retailers)
INSERT INTO business.payer_company (id, name, legal_name, industry, credit_score, payment_terms_days, created_at) VALUES
('payer_01walmart', 'Walmart', 'Walmart Inc.', 'Retail', 'AAA', 60, NOW() - INTERVAL '365 days'),
('payer_02target', 'Target', 'Target Corporation', 'Retail', 'AA', 90, NOW() - INTERVAL '365 days'),
('payer_03amazon', 'Amazon', 'Amazon.com, Inc.', 'E-commerce', 'AAA', 30, NOW() - INTERVAL '365 days'),
('payer_04costco', 'Costco', 'Costco Wholesale Corporation', 'Retail', 'AA', 60, NOW() - INTERVAL '365 days');

-- Payer Relationships (SMB-to-Payer payment history)
INSERT INTO business.payer_relationship (id, organization_id, payer_company_id, total_invoices_count, total_invoices_value, paid_on_time_count, late_payment_count, default_count, reliability_score, created_at) VALUES
('rel_tech_walmart', 'org_01tech', 'payer_01walmart', 12, 24000000, 11, 1, 0, 91.67, NOW() - INTERVAL '365 days'),
('rel_tech_costco', 'org_01tech', 'payer_04costco', 5, 6000000, 3, 1, 1, 60.00, NOW() - INTERVAL '200 days'),
('rel_food_target', 'org_02food', 'payer_02target', 8, 12000000, 8, 0, 0, 100.00, NOW() - INTERVAL '180 days'),
('rel_retail_amazon', 'org_03retail', 'payer_03amazon', 3, 5400000, 3, 0, 0, 100.00, NOW() - INTERVAL '60 days');

-- ============================================================================
-- INVOICE DATA
-- ============================================================================

-- Invoice 1: SETTLED (Happy path - completed successfully)
-- TechSupply → Walmart, $2, 60 days, funded by Alice, repaid on time
INSERT INTO invoice.invoice (id, organization_id, payer_company_id, amount, apr, discount_rate, invoice_date, due_at, lifecycle_status, on_chain_status, invoice_number, risk_score, created_at) VALUES
('inv_01settled', 'org_01tech', 'payer_01walmart', 2000000, 365000, 60000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '80 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() - INTERVAL '20 days'))::BIGINT, 'SETTLED', 'SETTLED', 'INV-2024-001', 'LOW', NOW() - INTERVAL '80 days');

-- Invoice 2: FUNDED (Currently active, awaiting payment)
-- FoodDistrib → Target, $1.50, 90 days, funded by Bob, due in 60 days
INSERT INTO invoice.invoice (id, organization_id, payer_company_id, amount, apr, discount_rate, invoice_date, due_at, lifecycle_status, on_chain_status, invoice_number, risk_score, created_at) VALUES
('inv_02funded', 'org_02food', 'payer_02target', 1500000, 365000, 90000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '30 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() + INTERVAL '60 days'))::BIGINT, 'AWAITING_PAYMENT', 'FUNDED', 'INV-2024-002', 'LOW', NOW() - INTERVAL '35 days');

-- Invoice 3: LISTED (Available for funding on marketplace)
-- RetailWholesale → Amazon, $1.80, 30 days, awaiting investor
INSERT INTO invoice.invoice (id, organization_id, payer_company_id, amount, apr, discount_rate, invoice_date, due_at, lifecycle_status, on_chain_status, invoice_number, risk_score, created_at) VALUES
('inv_03listed', 'org_03retail', 'payer_03amazon', 1800000, 365000, 30000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() + INTERVAL '25 days'))::BIGINT, 'LISTED', 'LISTED', 'INV-2024-003', 'LOW', NOW() - INTERVAL '7 days');

-- Invoice 4: DEFAULTED (In collections workflow)
-- TechSupply → Costco, $1.20, 60 days, funded by Charlie, defaulted after grace period
INSERT INTO invoice.invoice (id, organization_id, payer_company_id, amount, apr, discount_rate, invoice_date, due_at, lifecycle_status, on_chain_status, invoice_number, risk_score, created_at) VALUES
('inv_04defaulted', 'org_01tech', 'payer_04costco', 1200000, 365000, 60000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '100 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() - INTERVAL '40 days'))::BIGINT, 'COLLECTION', 'DEFAULTED', 'INV-2024-004', 'MEDIUM', NOW() - INTERVAL '105 days');

-- Invoice 5: DECLINED (Rejected during underwriting)
-- FoodDistrib → Unknown Payer, $5, failed risk assessment
INSERT INTO invoice.invoice (id, organization_id, payer_company_id, amount, apr, invoice_date, due_at, lifecycle_status, invoice_number, risk_score, created_at) VALUES
('inv_05declined', 'org_02food', 'payer_02target', 5000000, 365000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '15 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() + INTERVAL '75 days'))::BIGINT, 'DECLINED', 'INV-2024-005', 'HIGH', NOW() - INTERVAL '18 days');

-- ============================================================================
-- INVOICE UNDERWRITING DATA
-- ============================================================================

INSERT INTO invoice.invoice_underwriting (id, invoice_id, decision, decision_reason, approved_amount, approved_apr, assessed_risk_score, fraud_check_status, payer_verification_status, completed_at, created_at) VALUES
('uw_01', 'inv_01settled', 'APPROVED', 'Strong payer credit (AAA), good payment history', 2000000, 365000, 'LOW', 'PASSED', 'VERIFIED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '78 days'))::BIGINT, NOW() - INTERVAL '78 days'),
('uw_02', 'inv_02funded', 'APPROVED', 'Excellent payer reliability, verified relationship', 1500000, 365000, 'LOW', 'PASSED', 'VERIFIED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '33 days'))::BIGINT, NOW() - INTERVAL '33 days'),
('uw_03', 'inv_03listed', 'APPROVED', 'AAA payer, strong SMB credentials', 1800000, 365000, 'LOW', 'PASSED', 'VERIFIED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '6 days'))::BIGINT, NOW() - INTERVAL '6 days'),
('uw_04', 'inv_04defaulted', 'APPROVED', 'Borderline approval, elevated risk', 1200000, 365000, 'MEDIUM', 'PASSED', 'VERIFIED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '103 days'))::BIGINT, NOW() - INTERVAL '103 days'),
('uw_05', 'inv_05declined', 'DECLINED', 'Excessive amount for SMB size, high-risk payer relationship', NULL, NULL, 'HIGH', 'PASSED', 'NOT_VERIFIED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '17 days'))::BIGINT, NOW() - INTERVAL '17 days');

-- ============================================================================
-- INVOICE FUNDING DATA
-- ============================================================================

-- Invoice 1: Funded by Alice (discount_rate = 6%, so funding = $2 * 0.94 = $1.88, repayment = $2)
INSERT INTO invoice.invoice_funding_detail (id, invoice_id, investor_address, funded_amount, funded_at, funding_tx_hash, payment_token_address, expected_repayment, expected_return, created_at) VALUES
('fund_01', 'inv_01settled', '0xaaaa111111111111111111111111111111111111', 1880000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '75 days'))::BIGINT, '0xfund111111111111111111111111111111111111111111111111111111111111', '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 2000000, 60000, NOW() - INTERVAL '75 days');

-- Invoice 2: Funded by Bob (discount_rate = 9%, so funding = $1.50 * 0.91 = $1.365, repayment = $1.50)
INSERT INTO invoice.invoice_funding_detail (id, invoice_id, investor_address, funded_amount, funded_at, funding_tx_hash, payment_token_address, expected_repayment, expected_return, created_at) VALUES
('fund_02', 'inv_02funded', '0xbbbb222222222222222222222222222222222222', 1365000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '30 days'))::BIGINT, '0xfund222222222222222222222222222222222222222222222222222222222222', '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 1500000, 90000, NOW() - INTERVAL '30 days');

-- Invoice 4: Funded by Charlie (defaulted) (discount_rate = 6%, so funding = $1.20 * 0.94 = $1.128, repayment = $1.20)
INSERT INTO invoice.invoice_funding_detail (id, invoice_id, investor_address, funded_amount, funded_at, funding_tx_hash, payment_token_address, expected_repayment, expected_return, created_at) VALUES
('fund_04', 'inv_04defaulted', '0xcccc333333333333333333333333333333333333', 1128000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '95 days'))::BIGINT, '0xfund444444444444444444444444444444444444444444444444444444444444', '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 1200000, 60000, NOW() - INTERVAL '95 days');

-- ============================================================================
-- INVOICE REPAYMENT DATA
-- ============================================================================

-- Invoice 1: Fully repaid and settled
INSERT INTO invoice.invoice_repayment (id, invoice_id, repayment_amount, deposited_by, deposited_at, settled_at, repayment_tx_hash, settlement_tx_hash, repayment_method, created_at) VALUES
('rep_01', 'inv_01settled', 2000000, '0x1111111111111111111111111111111111111111', EXTRACT(EPOCH FROM (NOW() - INTERVAL '20 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() - INTERVAL '18 days'))::BIGINT, '0xrepay11111111111111111111111111111111111111111111111111111111111', '0xsettle1111111111111111111111111111111111111111111111111111111111', 'WALLET', NOW() - INTERVAL '20 days');

-- ============================================================================
-- INVOICE DEFAULT DATA
-- ============================================================================

-- Invoice 4: Defaulted, in collections
INSERT INTO invoice.invoice_default (id, invoice_id, defaulted_at, grace_period_end, collection_initiated_at, collection_status, recovered_amount, notes, created_at) VALUES
('def_04', 'inv_04defaulted', EXTRACT(EPOCH FROM (NOW() - INTERVAL '25 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() - INTERVAL '25 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() - INTERVAL '20 days'))::BIGINT, 'IN_PROGRESS', 0, 'Payer experiencing financial difficulties, collection agency engaged', NOW() - INTERVAL '25 days');

-- ============================================================================
-- INVOICE STATUS HISTORY
-- ============================================================================

-- Invoice 1 history (SETTLED)
INSERT INTO invoice.invoice_status_history (invoice_id, from_status, to_status, changed_at, created_at) VALUES
('inv_01settled', 'DRAFT', 'SUBMITTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '80 days'))::BIGINT, NOW() - INTERVAL '80 days'),
('inv_01settled', 'SUBMITTED', 'UNDERWRITING', EXTRACT(EPOCH FROM (NOW() - INTERVAL '79 days'))::BIGINT, NOW() - INTERVAL '79 days'),
('inv_01settled', 'UNDERWRITING', 'APPROVED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '78 days'))::BIGINT, NOW() - INTERVAL '78 days'),
('inv_01settled', 'APPROVED', 'LISTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '77 days'))::BIGINT, NOW() - INTERVAL '77 days'),
('inv_01settled', 'LISTED', 'FUNDED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '75 days'))::BIGINT, NOW() - INTERVAL '75 days'),
('inv_01settled', 'FUNDED', 'AWAITING_PAYMENT', EXTRACT(EPOCH FROM (NOW() - INTERVAL '75 days'))::BIGINT, NOW() - INTERVAL '75 days'),
('inv_01settled', 'AWAITING_PAYMENT', 'FULLY_PAID', EXTRACT(EPOCH FROM (NOW() - INTERVAL '20 days'))::BIGINT, NOW() - INTERVAL '20 days'),
('inv_01settled', 'FULLY_PAID', 'SETTLED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '18 days'))::BIGINT, NOW() - INTERVAL '18 days');

-- Invoice 2 history (FUNDED - active)
INSERT INTO invoice.invoice_status_history (invoice_id, from_status, to_status, changed_at, created_at) VALUES
('inv_02funded', 'DRAFT', 'SUBMITTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '35 days'))::BIGINT, NOW() - INTERVAL '35 days'),
('inv_02funded', 'SUBMITTED', 'UNDERWRITING', EXTRACT(EPOCH FROM (NOW() - INTERVAL '34 days'))::BIGINT, NOW() - INTERVAL '34 days'),
('inv_02funded', 'UNDERWRITING', 'APPROVED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '33 days'))::BIGINT, NOW() - INTERVAL '33 days'),
('inv_02funded', 'APPROVED', 'LISTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '32 days'))::BIGINT, NOW() - INTERVAL '32 days'),
('inv_02funded', 'LISTED', 'FUNDED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '30 days'))::BIGINT, NOW() - INTERVAL '30 days'),
('inv_02funded', 'FUNDED', 'AWAITING_PAYMENT', EXTRACT(EPOCH FROM (NOW() - INTERVAL '30 days'))::BIGINT, NOW() - INTERVAL '30 days');

-- Invoice 3 history (LISTED)
INSERT INTO invoice.invoice_status_history (invoice_id, from_status, to_status, changed_at, created_at) VALUES
('inv_03listed', 'DRAFT', 'SUBMITTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '7 days'))::BIGINT, NOW() - INTERVAL '7 days'),
('inv_03listed', 'SUBMITTED', 'UNDERWRITING', EXTRACT(EPOCH FROM (NOW() - INTERVAL '6 days'))::BIGINT, NOW() - INTERVAL '6 days'),
('inv_03listed', 'UNDERWRITING', 'APPROVED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '6 days'))::BIGINT, NOW() - INTERVAL '6 days'),
('inv_03listed', 'APPROVED', 'LISTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days'))::BIGINT, NOW() - INTERVAL '5 days');

-- Invoice 4 history (DEFAULTED)
INSERT INTO invoice.invoice_status_history (invoice_id, from_status, to_status, changed_at, created_at) VALUES
('inv_04defaulted', 'DRAFT', 'SUBMITTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '105 days'))::BIGINT, NOW() - INTERVAL '105 days'),
('inv_04defaulted', 'SUBMITTED', 'UNDERWRITING', EXTRACT(EPOCH FROM (NOW() - INTERVAL '104 days'))::BIGINT, NOW() - INTERVAL '104 days'),
('inv_04defaulted', 'UNDERWRITING', 'APPROVED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '103 days'))::BIGINT, NOW() - INTERVAL '103 days'),
('inv_04defaulted', 'APPROVED', 'LISTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '100 days'))::BIGINT, NOW() - INTERVAL '100 days'),
('inv_04defaulted', 'LISTED', 'FUNDED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '95 days'))::BIGINT, NOW() - INTERVAL '95 days'),
('inv_04defaulted', 'FUNDED', 'AWAITING_PAYMENT', EXTRACT(EPOCH FROM (NOW() - INTERVAL '95 days'))::BIGINT, NOW() - INTERVAL '95 days'),
('inv_04defaulted', 'AWAITING_PAYMENT', 'GRACE_PERIOD', EXTRACT(EPOCH FROM (NOW() - INTERVAL '40 days'))::BIGINT, NOW() - INTERVAL '40 days'),
('inv_04defaulted', 'GRACE_PERIOD', 'DEFAULTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '25 days'))::BIGINT, NOW() - INTERVAL '25 days'),
('inv_04defaulted', 'DEFAULTED', 'COLLECTION', EXTRACT(EPOCH FROM (NOW() - INTERVAL '20 days'))::BIGINT, NOW() - INTERVAL '20 days');

-- Invoice 5 history (DECLINED)
INSERT INTO invoice.invoice_status_history (invoice_id, from_status, to_status, changed_at, created_at) VALUES
('inv_05declined', 'DRAFT', 'SUBMITTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '18 days'))::BIGINT, NOW() - INTERVAL '18 days'),
('inv_05declined', 'SUBMITTED', 'UNDERWRITING', EXTRACT(EPOCH FROM (NOW() - INTERVAL '17 days'))::BIGINT, NOW() - INTERVAL '17 days'),
('inv_05declined', 'UNDERWRITING', 'DECLINED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '17 days'))::BIGINT, NOW() - INTERVAL '17 days');

-- ============================================================================
-- BLOCKCHAIN DATA
-- ============================================================================

-- NFTs (only for invoices that reached LISTED status)
INSERT INTO blockchain.invoice_nft (id, invoice_id, token_id, contract_address, chain_id, owner_address, metadata_uri, minted_at, minted_tx_hash, created_at) VALUES
('nft_01', 'inv_01settled', '1', '0x5555555555555555555555555555555555555555', 8453, '0xaaaa111111111111111111111111111111111111', 'ipfs://QmInvoice001', EXTRACT(EPOCH FROM (NOW() - INTERVAL '77 days'))::BIGINT, '0xmint111111111111111111111111111111111111111111111111111111111111', NOW() - INTERVAL '77 days'),
('nft_02', 'inv_02funded', '2', '0x5555555555555555555555555555555555555555', 8453, '0xbbbb222222222222222222222222222222222222', 'ipfs://QmInvoice002', EXTRACT(EPOCH FROM (NOW() - INTERVAL '32 days'))::BIGINT, '0xmint222222222222222222222222222222222222222222222222222222222222', NOW() - INTERVAL '32 days'),
('nft_03', 'inv_03listed', '3', '0x5555555555555555555555555555555555555555', 8453, '0x5555555555555555555555555555555555555555', 'ipfs://QmInvoice003', EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days'))::BIGINT, '0xmint333333333333333333333333333333333333333333333333333333333333', NOW() - INTERVAL '5 days'),
('nft_04', 'inv_04defaulted', '4', '0x5555555555555555555555555555555555555555', 8453, '0xcccc333333333333333333333333333333333333', 'ipfs://QmInvoice004', EXTRACT(EPOCH FROM (NOW() - INTERVAL '100 days'))::BIGINT, '0xmint444444444444444444444444444444444444444444444444444444444444', NOW() - INTERVAL '100 days');

-- Transactions
INSERT INTO blockchain.transaction (nft_id, tx_hash, tx_type, from_address, to_address, amount, block_number, block_timestamp, gas_used, gas_price_wei, status, created_at) VALUES
-- Invoice 1 transactions
('nft_01', '0xmint111111111111111111111111111111111111111111111111111111111111', 'MINT', '0x0000000000000000000000000000000000000000', '0x5555555555555555555555555555555555555555', 0, 12345001, EXTRACT(EPOCH FROM (NOW() - INTERVAL '77 days'))::BIGINT, 150000, 1000000000, 'CONFIRMED', NOW() - INTERVAL '77 days'),
('nft_01', '0xfund111111111111111111111111111111111111111111111111111111111111', 'FUNDING', '0xaaaa111111111111111111111111111111111111', '0x1111111111111111111111111111111111111111', 1880000, 12345100, EXTRACT(EPOCH FROM (NOW() - INTERVAL '75 days'))::BIGINT, 200000, 1000000000, 'CONFIRMED', NOW() - INTERVAL '75 days'),
('nft_01', '0xrepay11111111111111111111111111111111111111111111111111111111111', 'REPAYMENT', '0x1111111111111111111111111111111111111111', '0x5555555555555555555555555555555555555555', 2000000, 12456789, EXTRACT(EPOCH FROM (NOW() - INTERVAL '20 days'))::BIGINT, 180000, 1000000000, 'CONFIRMED', NOW() - INTERVAL '20 days'),
('nft_01', '0xsettle1111111111111111111111111111111111111111111111111111111111', 'SETTLEMENT', '0x5555555555555555555555555555555555555555', '0xaaaa111111111111111111111111111111111111', 1964000, 12457890, EXTRACT(EPOCH FROM (NOW() - INTERVAL '18 days'))::BIGINT, 170000, 1000000000, 'CONFIRMED', NOW() - INTERVAL '18 days'),
-- Invoice 2 transactions
('nft_02', '0xmint222222222222222222222222222222222222222222222222222222222222', 'MINT', '0x0000000000000000000000000000000000000000', '0x5555555555555555555555555555555555555555', 0, 12350001, EXTRACT(EPOCH FROM (NOW() - INTERVAL '32 days'))::BIGINT, 150000, 1000000000, 'CONFIRMED', NOW() - INTERVAL '32 days'),
('nft_02', '0xfund222222222222222222222222222222222222222222222222222222222222', 'FUNDING', '0xbbbb222222222222222222222222222222222222', '0x2222222222222222222222222222222222222222', 1365000, 12350100, EXTRACT(EPOCH FROM (NOW() - INTERVAL '30 days'))::BIGINT, 200000, 1000000000, 'CONFIRMED', NOW() - INTERVAL '30 days'),
-- Invoice 3 transactions (only mint, awaiting funding)
('nft_03', '0xmint333333333333333333333333333333333333333333333333333333333333', 'MINT', '0x0000000000000000000000000000000000000000', '0x5555555555555555555555555555555555555555', 0, 12460001, EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days'))::BIGINT, 150000, 1000000000, 'CONFIRMED', NOW() - INTERVAL '5 days'),
-- Invoice 4 transactions (funded but defaulted)
('nft_04', '0xmint444444444444444444444444444444444444444444444444444444444444', 'MINT', '0x0000000000000000000000000000000000000000', '0x5555555555555555555555555555555555555555', 0, 12340001, EXTRACT(EPOCH FROM (NOW() - INTERVAL '100 days'))::BIGINT, 150000, 1000000000, 'CONFIRMED', NOW() - INTERVAL '100 days'),
('nft_04', '0xfund444444444444444444444444444444444444444444444444444444444444', 'FUNDING', '0xcccc333333333333333333333333333333333333', '0x1111111111111111111111111111111111111111', 1128000, 12340100, EXTRACT(EPOCH FROM (NOW() - INTERVAL '95 days'))::BIGINT, 200000, 1000000000, 'CONFIRMED', NOW() - INTERVAL '95 days');

-- Autopay Configurations
INSERT INTO blockchain.wallet_autopay_config (id, invoice_id, organization_id, method, enabled, wallet_address, approved_amount, approved_at, created_at) VALUES
('autopay_01', 'inv_01settled', 'org_01tech', 'WALLET', true, '0x1111111111111111111111111111111111111111', 2000000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '75 days'))::BIGINT, NOW() - INTERVAL '75 days'),
('autopay_02', 'inv_02funded', 'org_02food', 'WALLET', true, '0x2222222222222222222222222222222222222222', 1500000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '30 days'))::BIGINT, NOW() - INTERVAL '30 days'),
('autopay_04', 'inv_04defaulted', 'org_01tech', 'WALLET', true, '0x1111111111111111111111111111111111111111', 1200000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '95 days'))::BIGINT, NOW() - INTERVAL '95 days');

-- Contract Events
INSERT INTO blockchain.contract_event (event_name, contract_address, tx_hash, block_number, block_timestamp, log_index, invoice_token_id, event_data, processed, created_at) VALUES
('InvoiceMinted', '0x5555555555555555555555555555555555555555', '0xmint111111111111111111111111111111111111111111111111111111111111', 12345001, EXTRACT(EPOCH FROM (NOW() - INTERVAL '77 days'))::BIGINT, 0, '1', '{"tokenId": "1", "issuer": "0x1111111111111111111111111111111111111111", "amount": "2000000"}', true, NOW() - INTERVAL '77 days'),
('InvoiceFunded', '0x5555555555555555555555555555555555555555', '0xfund111111111111111111111111111111111111111111111111111111111111', 12345100, EXTRACT(EPOCH FROM (NOW() - INTERVAL '75 days'))::BIGINT, 1, '1', '{"tokenId": "1", "investor": "0xaaaa111111111111111111111111111111111111", "amount": "1880000"}', true, NOW() - INTERVAL '75 days'),
('RepaymentDeposited', '0x5555555555555555555555555555555555555555', '0xrepay11111111111111111111111111111111111111111111111111111111111', 12456789, EXTRACT(EPOCH FROM (NOW() - INTERVAL '20 days'))::BIGINT, 2, '1', '{"tokenId": "1", "amount": "2000000"}', true, NOW() - INTERVAL '20 days'),
('InvoiceRepaid', '0x5555555555555555555555555555555555555555', '0xsettle1111111111111111111111111111111111111111111111111111111111', 12457890, EXTRACT(EPOCH FROM (NOW() - INTERVAL '18 days'))::BIGINT, 3, '1', '{"tokenId": "1", "investor": "0xaaaa111111111111111111111111111111111111", "totalAmount": "1964000"}', true, NOW() - INTERVAL '18 days'),
('InvoiceMinted', '0x5555555555555555555555555555555555555555', '0xmint222222222222222222222222222222222222222222222222222222222222', 12350001, EXTRACT(EPOCH FROM (NOW() - INTERVAL '32 days'))::BIGINT, 0, '2', '{"tokenId": "2", "issuer": "0x2222222222222222222222222222222222222222", "amount": "1500000"}', true, NOW() - INTERVAL '32 days'),
('InvoiceFunded', '0x5555555555555555555555555555555555555555', '0xfund222222222222222222222222222222222222222222222222222222222222', 12350100, EXTRACT(EPOCH FROM (NOW() - INTERVAL '30 days'))::BIGINT, 1, '2', '{"tokenId": "2", "investor": "0xbbbb222222222222222222222222222222222222", "amount": "1365000"}', true, NOW() - INTERVAL '30 days'),
('InvoiceMinted', '0x5555555555555555555555555555555555555555', '0xmint333333333333333333333333333333333333333333333333333333333333', 12460001, EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days'))::BIGINT, 0, '3', '{"tokenId": "3", "issuer": "0x3333333333333333333333333333333333333333", "amount": "1800000"}', true, NOW() - INTERVAL '5 days'),
('InvoiceDefaulted', '0x5555555555555555555555555555555555555555', '0xdefault444444444444444444444444444444444444444444444444444444444', 12440000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '25 days'))::BIGINT, 0, '4', '{"tokenId": "4", "investor": "0xcccc333333333333333333333333333333333333", "principal": "1128000"}', true, NOW() - INTERVAL '25 days');

-- ============================================================================
-- INVESTMENT DATA
-- ============================================================================

-- Investor Positions
INSERT INTO investment.investor_position (id, user_id, invoice_id, nft_id, principal_amount, expected_return, actual_return, apr, funded_at, maturity_date, position_status, created_at) VALUES
('pos_01', 'user_01alice', 'inv_01settled', 'nft_01', 1880000, 2000000, 1964000, 365000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '75 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() - INTERVAL '20 days'))::BIGINT, 'CLOSED', NOW() - INTERVAL '75 days'),
('pos_02', 'user_02bob', 'inv_02funded', 'nft_02', 1365000, 1500000, NULL, 365000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '30 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() + INTERVAL '60 days'))::BIGINT, 'ACTIVE', NOW() - INTERVAL '30 days'),
('pos_04', 'user_03charlie', 'inv_04defaulted', 'nft_04', 1128000, 1200000, 0, 365000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '95 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() - INTERVAL '40 days'))::BIGINT, 'DEFAULTED', NOW() - INTERVAL '95 days');

-- Yield Calculations
INSERT INTO investment.yield_calculation (id, position_id, principal, apr, funding_timestamp, due_timestamp, duration_days, total_yield, investor_yield, platform_fee, platform_fee_rate, calculated_at, created_at) VALUES
('yield_01', 'pos_01', 1880000, 365000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '75 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() - INTERVAL '20 days'))::BIGINT, 55, 120000, 84000, 36000, 300000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '75 days'))::BIGINT, NOW() - INTERVAL '75 days'),
('yield_02', 'pos_02', 1365000, 365000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '30 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() + INTERVAL '60 days'))::BIGINT, 90, 135000, 94500, 40500, 300000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '30 days'))::BIGINT, NOW() - INTERVAL '30 days'),
('yield_04', 'pos_04', 1128000, 365000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '95 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() - INTERVAL '40 days'))::BIGINT, 55, 72000, 50400, 21600, 300000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '95 days'))::BIGINT, NOW() - INTERVAL '95 days');

-- Repayment Distributions
INSERT INTO investment.repayment_distribution (id, position_id, invoice_id, investor_address, principal_returned, yield_received, total_amount, distributed_at, distribution_tx_hash, created_at) VALUES
('dist_01', 'pos_01', 'inv_01settled', '0xaaaa111111111111111111111111111111111111', 1880000, 84000, 1964000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '18 days'))::BIGINT, '0xsettle1111111111111111111111111111111111111111111111111111111111', NOW() - INTERVAL '18 days');

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Data Summary:
-- - 3 Organizations (TechSupply Co., FoodDistrib Inc., RetailWholesale LLC)
-- - 3 Investors (Alice, Bob, Charlie)
-- - 4 Payer Companies (Walmart, Target, Amazon, Costco)
-- - 5 Invoices covering full lifecycle:
--   1. inv_01settled: SETTLED (Happy path - funded by Alice, repaid on time)
--   2. inv_02funded: FUNDED/AWAITING_PAYMENT (Active - funded by Bob, due in 60 days)
--   3. inv_03listed: LISTED (Available for funding on marketplace)
--   4. inv_04defaulted: COLLECTION (Defaulted - funded by Charlie, in collections)
--   5. inv_05declined: DECLINED (Rejected during underwriting)
-- - 4 NFTs minted (for invoices 1-4)
-- - 14 Blockchain transactions (minting, funding, repayment, settlement, default)
-- - 3 Investor positions (Alice, Bob, Charlie)
-- - 3 Yield calculations (with 30/70 platform/investor fee split)
-- - 1 Repayment distribution (Alice received principal + yield)
