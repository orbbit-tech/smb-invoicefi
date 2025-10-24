-- ============================================================================
-- Orbbit Web3 Invoice Financing - Realistic Demo Seed Data V2
-- ============================================================================
-- Production-ready seed data for investor marketplace demo
--
-- KEY FEATURES:
-- - 3 SMBs with actual logos: Gallivant Ice Cream, Medi Supply, Organic Harvest
-- - 8 invoices (4+2+2) with diverse statuses: LISTED, FUNDED, OVERDUE, FULLY_PAID, SETTLED
-- - Amounts: $1-$5 (USDC testnet faucet compatible)
-- - APR: 36.5% standard across all invoices
-- - Fee structure: 30d=3%, 60d=6%, 90d=9% (matches business logic doc)
-- - Real investor wallet address for immediate testing
-- - Payers: Walmart, Target, Amazon, Costco (all have logos)
--
-- PRECISION:
-- - Amounts: 6 decimals for USDC (1,000,000 = $1)
-- - APR: 6 decimals (365,000 = 36.5% where 1,000,000 = 100%)
-- - Discount rates: 6 decimals (30,000 = 3%, 60,000 = 6%, 90,000 = 9%)
-- ============================================================================

-- Clear existing data (optional - comment out if you want to preserve existing data)
TRUNCATE TABLE
  investment.repayment_distribution,
  investment.yield_calculation,
  investment.investor_position,
  invoice.invoice_status_history,
  invoice.invoice_default,
  invoice.invoice_repayment,
  invoice.invoice_funding_detail,
  invoice.invoice_underwriting,
  blockchain.transaction,
  blockchain.invoice_nft,
  blockchain.contract_event,
  blockchain.wallet_autopay_config,
  invoice.invoice,
  business.payer_relationship,
  business.payer_company,
  identity.organization_member,
  identity.member,
  identity.user,
  identity.organization
CASCADE;

-- ============================================================================
-- IDENTITY DATA
-- ============================================================================

-- Organizations (SMBs that issue invoices)
INSERT INTO identity.organization (id, name, legal_name, wallet_address, timezone, email, kyb_status, is_whitelisted, logo_url, created_at) VALUES
('org_gallivant', 'Gallivant Ice Cream', 'Gallivant Ice Cream LLC', '0x1111111111111111111111111111111111111111', 'America/New_York', 'admin@gallivant-icecream.com', 'APPROVED', true, 'https://media.cdn.orbbit.co/demo/logos/gallivant-ice-cream-logo.png', NOW() - INTERVAL '90 days'),
('org_medisupply', 'Medi Supply', 'Medi Supply Inc.', '0x2222222222222222222222222222222222222222', 'America/Chicago', 'admin@medisupply.com', 'APPROVED', true, 'https://media.cdn.orbbit.co/demo/logos/medi-supply-logo.png', NOW() - INTERVAL '60 days'),
('org_organicharvest', 'Organic Harvest', 'Organic Harvest Distributors LLC', '0x3333333333333333333333333333333333333333', 'America/Los_Angeles', 'admin@organicharvest.com', 'APPROVED', true, 'https://media.cdn.orbbit.co/demo/logos/organic-harvest-logo.png', NOW() - INTERVAL '30 days');

-- Users (Individual Investors)
-- Using your real Coinbase Wallet address for immediate testing
INSERT INTO identity.user (id, email, wallet_address, first_name, last_name, kyc_status, is_whitelisted, is_accredited_investor, created_at) VALUES
('user_investor1', 'investor@orbbit.demo', '0x891a9EC416ED2c8DAE3D7DB6D8cEa1a3b273937C', 'Demo', 'Investor', 'APPROVED', true, true, NOW() - INTERVAL '80 days');

-- Members (Organization team members)
INSERT INTO identity.member (id, email, wallet_address, first_name, last_name, created_at) VALUES
('member_gallivant', 'sarah@gallivant-icecream.com', '0x1111111111111111111111111111111111111112', 'Sarah', 'Chen', NOW() - INTERVAL '85 days'),
('member_medisupply', 'michael@medisupply.com', '0x2222222222222222222222222222222222222223', 'Michael', 'Rodriguez', NOW() - INTERVAL '55 days'),
('member_organicharvest', 'emma@organicharvest.com', '0x3333333333333333333333333333333333333334', 'Emma', 'Thompson', NOW() - INTERVAL '25 days');

-- Organization-Member relationships
INSERT INTO identity.organization_member (organization_id, member_id, role, joined_at, created_at) VALUES
('org_gallivant', 'member_gallivant', 'OWNER', NOW() - INTERVAL '85 days', NOW() - INTERVAL '85 days'),
('org_medisupply', 'member_medisupply', 'ADMIN', NOW() - INTERVAL '55 days', NOW() - INTERVAL '55 days'),
('org_organicharvest', 'member_organicharvest', 'ADMIN', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days');

-- ============================================================================
-- BUSINESS DATA
-- ============================================================================

-- Payer Companies (Invoice debtors - major retailers with logos)
INSERT INTO business.payer_company (id, name, legal_name, industry, credit_score, payment_terms_days, logo_url, created_at) VALUES
('payer_walmart', 'Walmart', 'Walmart Inc.', 'Retail', 'AAA', 60, 'https://media.cdn.orbbit.co/demo/logos/walmart-logo.png', NOW() - INTERVAL '365 days'),
('payer_target', 'Target', 'Target Corporation', 'Retail', 'AA', 90, 'https://media.cdn.orbbit.co/demo/logos/target-logo.png', NOW() - INTERVAL '365 days'),
('payer_amazon', 'Amazon', 'Amazon.com, Inc.', 'E-commerce', 'AAA', 30, 'https://media.cdn.orbbit.co/demo/logos/amazon-logo.png', NOW() - INTERVAL '365 days'),
('payer_costco', 'Costco', 'Costco Wholesale Corporation', 'Retail', 'AA', 60, NULL, NOW() - INTERVAL '365 days');

-- Payer Relationships (SMB-to-Payer payment history)
INSERT INTO business.payer_relationship (id, organization_id, payer_company_id, total_invoices_count, total_invoices_value, paid_on_time_count, late_payment_count, default_count, reliability_score, created_at) VALUES
-- Gallivant Ice Cream relationships
('rel_gallivant_walmart', 'org_gallivant', 'payer_walmart', 15, 45000000, 14, 1, 0, 93.33, NOW() - INTERVAL '365 days'),
('rel_gallivant_target', 'org_gallivant', 'payer_target', 12, 54000000, 12, 0, 0, 100.00, NOW() - INTERVAL '300 days'),
('rel_gallivant_costco', 'org_gallivant', 'payer_costco', 8, 20000000, 7, 1, 0, 87.50, NOW() - INTERVAL '200 days'),
-- Medi Supply relationships
('rel_medisupply_amazon', 'org_medisupply', 'payer_amazon', 20, 36000000, 19, 1, 0, 95.00, NOW() - INTERVAL '300 days'),
('rel_medisupply_walmart', 'org_medisupply', 'payer_walmart', 10, 36000000, 10, 0, 0, 100.00, NOW() - INTERVAL '250 days'),
-- Organic Harvest relationships
('rel_organicharvest_target', 'org_organicharvest', 'payer_target', 18, 48600000, 17, 1, 0, 94.44, NOW() - INTERVAL '280 days'),
('rel_organicharvest_amazon', 'org_organicharvest', 'payer_amazon', 14, 56000000, 14, 0, 0, 100.00, NOW() - INTERVAL '220 days');

-- ============================================================================
-- INVOICE DATA (Mix of statuses for realistic demo)
-- ============================================================================
-- 3 LISTED (marketplace): inv_gallivant_01, inv_medisupply_01, inv_organicharvest_01
-- 2 FULLY_FUNDED (active): inv_gallivant_02, inv_organicharvest_02
-- 1 OVERDUE (past due): inv_gallivant_04
-- 1 FULLY_PAID (paid): inv_gallivant_03
-- 1 SETTLED (completed): inv_medisupply_02

-- =========================
-- GALLIVANT ICE CREAM (4 invoices)
-- =========================

-- Invoice 1: Gallivant → Walmart, $3.00, 30 days [LISTED - Available in marketplace]
INSERT INTO invoice.invoice (id, organization_id, payer_company_id, amount, apr, discount_rate, invoice_date, due_at, lifecycle_status, on_chain_status, invoice_number, risk_score, created_at) VALUES
('inv_gallivant_01', 'org_gallivant', 'payer_walmart', 3000000, 365000, 30000,
  EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days'))::BIGINT,
  EXTRACT(EPOCH FROM (NOW() + INTERVAL '25 days'))::BIGINT,
  'LISTED', 'LISTED', 'GIC-2024-001', 'LOW', NOW() - INTERVAL '7 days');

-- Invoice 2: Gallivant → Target, $4.50, 60 days [FUNDED - Active investment]
INSERT INTO invoice.invoice (id, organization_id, payer_company_id, amount, apr, discount_rate, invoice_date, due_at, lifecycle_status, on_chain_status, invoice_number, risk_score, created_at) VALUES
('inv_gallivant_02', 'org_gallivant', 'payer_target', 4500000, 365000, 60000,
  EXTRACT(EPOCH FROM (NOW() - INTERVAL '50 days'))::BIGINT,
  EXTRACT(EPOCH FROM (NOW() + INTERVAL '10 days'))::BIGINT,
  'FUNDED', 'FUNDED', 'GIC-2024-002', 'LOW', NOW() - INTERVAL '52 days');

-- Invoice 3: Gallivant → Costco, $2.50, 90 days [FULLY_PAID - Payer has paid]
INSERT INTO invoice.invoice (id, organization_id, payer_company_id, amount, apr, discount_rate, invoice_date, due_at, lifecycle_status, on_chain_status, invoice_number, risk_score, created_at) VALUES
('inv_gallivant_03', 'org_gallivant', 'payer_costco', 2500000, 365000, 90000,
  EXTRACT(EPOCH FROM (NOW() - INTERVAL '85 days'))::BIGINT,
  EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days'))::BIGINT,
  'FULLY_PAID', 'FULLY_PAID', 'GIC-2024-003', 'LOW', NOW() - INTERVAL '87 days');

-- Invoice 4: Gallivant → Walmart, $3.50, 30 days [OVERDUE - Past due, needs payment]
INSERT INTO invoice.invoice (id, organization_id, payer_company_id, amount, apr, discount_rate, invoice_date, due_at, lifecycle_status, on_chain_status, invoice_number, risk_score, created_at) VALUES
('inv_gallivant_04', 'org_gallivant', 'payer_walmart', 3500000, 365000, 30000,
  EXTRACT(EPOCH FROM (NOW() - INTERVAL '40 days'))::BIGINT,
  EXTRACT(EPOCH FROM (NOW() - INTERVAL '7 days'))::BIGINT,
  'OVERDUE', 'FUNDED', 'GIC-2024-004', 'LOW', NOW() - INTERVAL '42 days');

-- =========================
-- MEDI SUPPLY (2 invoices)
-- =========================

-- Invoice 4: Medi Supply → Amazon, $1.80, 30 days [LISTED - Available in marketplace]
INSERT INTO invoice.invoice (id, organization_id, payer_company_id, amount, apr, discount_rate, invoice_date, due_at, lifecycle_status, on_chain_status, invoice_number, risk_score, created_at) VALUES
('inv_medisupply_01', 'org_medisupply', 'payer_amazon', 1800000, 365000, 30000,
  EXTRACT(EPOCH FROM (NOW() - INTERVAL '4 days'))::BIGINT,
  EXTRACT(EPOCH FROM (NOW() + INTERVAL '26 days'))::BIGINT,
  'LISTED', 'LISTED', 'MED-2024-001', 'LOW', NOW() - INTERVAL '6 days');

-- Invoice 5: Medi Supply → Walmart, $3.60, 60 days [SETTLED - Completed, yield distributed]
INSERT INTO invoice.invoice (id, organization_id, payer_company_id, amount, apr, discount_rate, invoice_date, due_at, lifecycle_status, on_chain_status, invoice_number, risk_score, created_at) VALUES
('inv_medisupply_02', 'org_medisupply', 'payer_walmart', 3600000, 365000, 60000,
  EXTRACT(EPOCH FROM (NOW() - INTERVAL '65 days'))::BIGINT,
  EXTRACT(EPOCH FROM (NOW() - INTERVAL '10 days'))::BIGINT,
  'SETTLED', 'SETTLED', 'MED-2024-002', 'LOW', NOW() - INTERVAL '67 days');

-- =========================
-- ORGANIC HARVEST (2 invoices)
-- =========================

-- Invoice 6: Organic Harvest → Target, $2.70, 90 days [LISTED - Available in marketplace]
INSERT INTO invoice.invoice (id, organization_id, payer_company_id, amount, apr, discount_rate, invoice_date, due_at, lifecycle_status, on_chain_status, invoice_number, risk_score, created_at) VALUES
('inv_organicharvest_01', 'org_organicharvest', 'payer_target', 2700000, 365000, 90000,
  EXTRACT(EPOCH FROM (NOW() - INTERVAL '2 days'))::BIGINT,
  EXTRACT(EPOCH FROM (NOW() + INTERVAL '88 days'))::BIGINT,
  'LISTED', 'LISTED', 'ORG-2024-001', 'LOW', NOW() - INTERVAL '4 days');

-- Invoice 7: Organic Harvest → Amazon, $4.00, 30 days [FUNDED - Active investment]
INSERT INTO invoice.invoice (id, organization_id, payer_company_id, amount, apr, discount_rate, invoice_date, due_at, lifecycle_status, on_chain_status, invoice_number, risk_score, created_at) VALUES
('inv_organicharvest_02', 'org_organicharvest', 'payer_amazon', 4000000, 365000, 30000,
  EXTRACT(EPOCH FROM (NOW() - INTERVAL '20 days'))::BIGINT,
  EXTRACT(EPOCH FROM (NOW() + INTERVAL '10 days'))::BIGINT,
  'FUNDED', 'FUNDED', 'ORG-2024-002', 'LOW', NOW() - INTERVAL '22 days');

-- ============================================================================
-- INVOICE UNDERWRITING DATA
-- ============================================================================

INSERT INTO invoice.invoice_underwriting (id, invoice_id, decision, decision_reason, approved_amount, approved_apr, assessed_risk_score, fraud_check_status, payer_verification_status, completed_at, created_at) VALUES
('uw_gallivant_01', 'inv_gallivant_01', 'APPROVED', 'AAA payer (Walmart), excellent payment history', 3000000, 365000, 'LOW', 'PASSED', 'VERIFIED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '6 days'))::BIGINT, NOW() - INTERVAL '6 days'),
('uw_gallivant_02', 'inv_gallivant_02', 'APPROVED', 'AA payer (Target), 100% on-time payment record', 4500000, 365000, 'LOW', 'PASSED', 'VERIFIED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days'))::BIGINT, NOW() - INTERVAL '5 days'),
('uw_gallivant_03', 'inv_gallivant_03', 'APPROVED', 'AA payer (Costco), strong relationship', 2500000, 365000, 'LOW', 'PASSED', 'VERIFIED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '4 days'))::BIGINT, NOW() - INTERVAL '4 days'),
('uw_gallivant_04', 'inv_gallivant_04', 'APPROVED', 'AAA payer (Walmart), strong payment history', 3500000, 365000, 'LOW', 'PASSED', 'VERIFIED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '41 days'))::BIGINT, NOW() - INTERVAL '41 days'),
('uw_medisupply_01', 'inv_medisupply_01', 'APPROVED', 'AAA payer (Amazon), verified medical supplier', 1800000, 365000, 'LOW', 'PASSED', 'VERIFIED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days'))::BIGINT, NOW() - INTERVAL '5 days'),
('uw_medisupply_02', 'inv_medisupply_02', 'APPROVED', 'AAA payer (Walmart), 100% on-time payment', 3600000, 365000, 'LOW', 'PASSED', 'VERIFIED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '4 days'))::BIGINT, NOW() - INTERVAL '4 days'),
('uw_organicharvest_01', 'inv_organicharvest_01', 'APPROVED', 'AA payer (Target), excellent track record', 2700000, 365000, 'LOW', 'PASSED', 'VERIFIED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '3 days'))::BIGINT, NOW() - INTERVAL '3 days'),
('uw_organicharvest_02', 'inv_organicharvest_02', 'APPROVED', 'AAA payer (Amazon), strong relationship', 4000000, 365000, 'LOW', 'PASSED', 'VERIFIED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '2 days'))::BIGINT, NOW() - INTERVAL '2 days');

-- ============================================================================
-- INVOICE STATUS HISTORY
-- ============================================================================

-- Gallivant Invoice 1 [LISTED]
INSERT INTO invoice.invoice_status_history (invoice_id, from_status, to_status, changed_at, created_at) VALUES
('inv_gallivant_01', 'DRAFT', 'SUBMITTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '7 days'))::BIGINT, NOW() - INTERVAL '7 days'),
('inv_gallivant_01', 'SUBMITTED', 'UNDERWRITING', EXTRACT(EPOCH FROM (NOW() - INTERVAL '6 days'))::BIGINT, NOW() - INTERVAL '6 days'),
('inv_gallivant_01', 'UNDERWRITING', 'APPROVED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '6 days'))::BIGINT, NOW() - INTERVAL '6 days'),
('inv_gallivant_01', 'APPROVED', 'LISTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days'))::BIGINT, NOW() - INTERVAL '5 days');

-- Gallivant Invoice 2 [FULLY_FUNDED]
INSERT INTO invoice.invoice_status_history (invoice_id, from_status, to_status, changed_at, created_at) VALUES
('inv_gallivant_02', 'DRAFT', 'SUBMITTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '52 days'))::BIGINT, NOW() - INTERVAL '52 days'),
('inv_gallivant_02', 'SUBMITTED', 'UNDERWRITING', EXTRACT(EPOCH FROM (NOW() - INTERVAL '51 days'))::BIGINT, NOW() - INTERVAL '51 days'),
('inv_gallivant_02', 'UNDERWRITING', 'APPROVED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '51 days'))::BIGINT, NOW() - INTERVAL '51 days'),
('inv_gallivant_02', 'APPROVED', 'LISTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '50 days'))::BIGINT, NOW() - INTERVAL '50 days'),
('inv_gallivant_02', 'LISTED', 'FULLY_FUNDED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '48 days'))::BIGINT, NOW() - INTERVAL '48 days');

-- Gallivant Invoice 3 [FULLY_PAID]
INSERT INTO invoice.invoice_status_history (invoice_id, from_status, to_status, changed_at, created_at) VALUES
('inv_gallivant_03', 'DRAFT', 'SUBMITTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '87 days'))::BIGINT, NOW() - INTERVAL '87 days'),
('inv_gallivant_03', 'SUBMITTED', 'UNDERWRITING', EXTRACT(EPOCH FROM (NOW() - INTERVAL '86 days'))::BIGINT, NOW() - INTERVAL '86 days'),
('inv_gallivant_03', 'UNDERWRITING', 'APPROVED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '86 days'))::BIGINT, NOW() - INTERVAL '86 days'),
('inv_gallivant_03', 'APPROVED', 'LISTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '85 days'))::BIGINT, NOW() - INTERVAL '85 days'),
('inv_gallivant_03', 'LISTED', 'FULLY_FUNDED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '83 days'))::BIGINT, NOW() - INTERVAL '83 days'),
('inv_gallivant_03', 'FULLY_FUNDED', 'FULLY_PAID', EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days'))::BIGINT, NOW() - INTERVAL '5 days');

-- Gallivant Invoice 4 [OVERDUE]
INSERT INTO invoice.invoice_status_history (invoice_id, from_status, to_status, changed_at, created_at) VALUES
('inv_gallivant_04', 'DRAFT', 'SUBMITTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '42 days'))::BIGINT, NOW() - INTERVAL '42 days'),
('inv_gallivant_04', 'SUBMITTED', 'UNDERWRITING', EXTRACT(EPOCH FROM (NOW() - INTERVAL '41 days'))::BIGINT, NOW() - INTERVAL '41 days'),
('inv_gallivant_04', 'UNDERWRITING', 'APPROVED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '41 days'))::BIGINT, NOW() - INTERVAL '41 days'),
('inv_gallivant_04', 'APPROVED', 'LISTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '40 days'))::BIGINT, NOW() - INTERVAL '40 days'),
('inv_gallivant_04', 'LISTED', 'FULLY_FUNDED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '38 days'))::BIGINT, NOW() - INTERVAL '38 days'),
('inv_gallivant_04', 'FULLY_FUNDED', 'OVERDUE', EXTRACT(EPOCH FROM (NOW() - INTERVAL '7 days'))::BIGINT, NOW() - INTERVAL '7 days');

-- Medi Supply Invoice 1 [LISTED]
INSERT INTO invoice.invoice_status_history (invoice_id, from_status, to_status, changed_at, created_at) VALUES
('inv_medisupply_01', 'DRAFT', 'SUBMITTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '6 days'))::BIGINT, NOW() - INTERVAL '6 days'),
('inv_medisupply_01', 'SUBMITTED', 'UNDERWRITING', EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days'))::BIGINT, NOW() - INTERVAL '5 days'),
('inv_medisupply_01', 'UNDERWRITING', 'APPROVED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days'))::BIGINT, NOW() - INTERVAL '5 days'),
('inv_medisupply_01', 'APPROVED', 'LISTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '4 days'))::BIGINT, NOW() - INTERVAL '4 days');

-- Medi Supply Invoice 2 [SETTLED]
INSERT INTO invoice.invoice_status_history (invoice_id, from_status, to_status, changed_at, created_at) VALUES
('inv_medisupply_02', 'DRAFT', 'SUBMITTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '67 days'))::BIGINT, NOW() - INTERVAL '67 days'),
('inv_medisupply_02', 'SUBMITTED', 'UNDERWRITING', EXTRACT(EPOCH FROM (NOW() - INTERVAL '66 days'))::BIGINT, NOW() - INTERVAL '66 days'),
('inv_medisupply_02', 'UNDERWRITING', 'APPROVED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '66 days'))::BIGINT, NOW() - INTERVAL '66 days'),
('inv_medisupply_02', 'APPROVED', 'LISTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '65 days'))::BIGINT, NOW() - INTERVAL '65 days'),
('inv_medisupply_02', 'LISTED', 'FULLY_FUNDED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '63 days'))::BIGINT, NOW() - INTERVAL '63 days'),
('inv_medisupply_02', 'FULLY_FUNDED', 'FULLY_PAID', EXTRACT(EPOCH FROM (NOW() - INTERVAL '10 days'))::BIGINT, NOW() - INTERVAL '10 days'),
('inv_medisupply_02', 'FULLY_PAID', 'SETTLED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '8 days'))::BIGINT, NOW() - INTERVAL '8 days');

-- Organic Harvest Invoice 1 [LISTED]
INSERT INTO invoice.invoice_status_history (invoice_id, from_status, to_status, changed_at, created_at) VALUES
('inv_organicharvest_01', 'DRAFT', 'SUBMITTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '4 days'))::BIGINT, NOW() - INTERVAL '4 days'),
('inv_organicharvest_01', 'SUBMITTED', 'UNDERWRITING', EXTRACT(EPOCH FROM (NOW() - INTERVAL '3 days'))::BIGINT, NOW() - INTERVAL '3 days'),
('inv_organicharvest_01', 'UNDERWRITING', 'APPROVED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '3 days'))::BIGINT, NOW() - INTERVAL '3 days'),
('inv_organicharvest_01', 'APPROVED', 'LISTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '2 days'))::BIGINT, NOW() - INTERVAL '2 days');

-- Organic Harvest Invoice 2 [FULLY_FUNDED]
INSERT INTO invoice.invoice_status_history (invoice_id, from_status, to_status, changed_at, created_at) VALUES
('inv_organicharvest_02', 'DRAFT', 'SUBMITTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '22 days'))::BIGINT, NOW() - INTERVAL '22 days'),
('inv_organicharvest_02', 'SUBMITTED', 'UNDERWRITING', EXTRACT(EPOCH FROM (NOW() - INTERVAL '21 days'))::BIGINT, NOW() - INTERVAL '21 days'),
('inv_organicharvest_02', 'UNDERWRITING', 'APPROVED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '21 days'))::BIGINT, NOW() - INTERVAL '21 days'),
('inv_organicharvest_02', 'APPROVED', 'LISTED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '20 days'))::BIGINT, NOW() - INTERVAL '20 days'),
('inv_organicharvest_02', 'LISTED', 'FULLY_FUNDED', EXTRACT(EPOCH FROM (NOW() - INTERVAL '18 days'))::BIGINT, NOW() - INTERVAL '18 days');

-- ============================================================================
-- BLOCKCHAIN DATA (Placeholder - will be updated after on-chain deployment)
-- ============================================================================

-- NFTs (Token IDs will be updated after Base Sepolia deployment)
-- NOTE: Run the deployment script first, then update these with real values
INSERT INTO blockchain.invoice_nft (id, invoice_id, token_id, contract_address, chain_id, owner_address, metadata_uri, minted_at, minted_tx_hash, created_at) VALUES
('nft_gallivant_01', 'inv_gallivant_01', 'PLACEHOLDER_1', '0x0000000000000000000000000000000000000000', 84532, '0x0000000000000000000000000000000000000000', 'ipfs://QmGallivant001', EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days'))::BIGINT, '0x0000000000000000000000000000000000000000000000000000000000000000', NOW() - INTERVAL '5 days'),
('nft_gallivant_02', 'inv_gallivant_02', 'PLACEHOLDER_2', '0x0000000000000000000000000000000000000000', 84532, '0x0000000000000000000000000000000000000000', 'ipfs://QmGallivant002', EXTRACT(EPOCH FROM (NOW() - INTERVAL '4 days'))::BIGINT, '0x0000000000000000000000000000000000000000000000000000000000000000', NOW() - INTERVAL '4 days'),
('nft_gallivant_03', 'inv_gallivant_03', 'PLACEHOLDER_3', '0x0000000000000000000000000000000000000000', 84532, '0x0000000000000000000000000000000000000000', 'ipfs://QmGallivant003', EXTRACT(EPOCH FROM (NOW() - INTERVAL '3 days'))::BIGINT, '0x0000000000000000000000000000000000000000000000000000000000000000', NOW() - INTERVAL '3 days'),
('nft_gallivant_04', 'inv_gallivant_04', 'PLACEHOLDER_8', '0x0000000000000000000000000000000000000000', 84532, '0x0000000000000000000000000000000000000000', 'ipfs://QmGallivant004', EXTRACT(EPOCH FROM (NOW() - INTERVAL '38 days'))::BIGINT, '0x0000000000000000000000000000000000000000000000000000000000000000', NOW() - INTERVAL '38 days'),
('nft_medisupply_01', 'inv_medisupply_01', 'PLACEHOLDER_4', '0x0000000000000000000000000000000000000000', 84532, '0x0000000000000000000000000000000000000000', 'ipfs://QmMediSupply001', EXTRACT(EPOCH FROM (NOW() - INTERVAL '4 days'))::BIGINT, '0x0000000000000000000000000000000000000000000000000000000000000000', NOW() - INTERVAL '4 days'),
('nft_medisupply_02', 'inv_medisupply_02', 'PLACEHOLDER_5', '0x0000000000000000000000000000000000000000', 84532, '0x0000000000000000000000000000000000000000', 'ipfs://QmMediSupply002', EXTRACT(EPOCH FROM (NOW() - INTERVAL '3 days'))::BIGINT, '0x0000000000000000000000000000000000000000000000000000000000000000', NOW() - INTERVAL '3 days'),
('nft_organicharvest_01', 'inv_organicharvest_01', 'PLACEHOLDER_6', '0x0000000000000000000000000000000000000000', 84532, '0x0000000000000000000000000000000000000000', 'ipfs://QmOrganicHarvest001', EXTRACT(EPOCH FROM (NOW() - INTERVAL '2 days'))::BIGINT, '0x0000000000000000000000000000000000000000000000000000000000000000', NOW() - INTERVAL '2 days'),
('nft_organicharvest_02', 'inv_organicharvest_02', 'PLACEHOLDER_7', '0x0000000000000000000000000000000000000000', 84532, '0x0000000000000000000000000000000000000000', 'ipfs://QmOrganicHarvest002', EXTRACT(EPOCH FROM (NOW() - INTERVAL '1 day'))::BIGINT, '0x0000000000000000000000000000000000000000000000000000000000000000', NOW() - INTERVAL '1 day');

-- ============================================================================
-- INVOICE FUNDING DETAILS (For FULLY_FUNDED and SETTLED invoices)
-- ============================================================================

-- Invoice 2: Gallivant → Target (FULLY_FUNDED)
INSERT INTO invoice.invoice_funding_detail (id, invoice_id, funded_amount, funded_at, investor_address, funding_tx_hash, created_at) VALUES
('funding_gallivant_02', 'inv_gallivant_02', 4230000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '48 days'))::BIGINT, '0x891a9EC416ED2c8DAE3D7DB6D8cEa1a3b273937C', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', NOW() - INTERVAL '48 days');

-- Invoice 3: Gallivant → Costco (FULLY_PAID)
INSERT INTO invoice.invoice_funding_detail (id, invoice_id, funded_amount, funded_at, investor_address, funding_tx_hash, created_at) VALUES
('funding_gallivant_03', 'inv_gallivant_03', 2275000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '83 days'))::BIGINT, '0x891a9EC416ED2c8DAE3D7DB6D8cEa1a3b273937C', '0x2345678901bcdef2345678901bcdef2345678901bcdef2345678901bcdef12', NOW() - INTERVAL '83 days');

-- Invoice 4: Gallivant → Walmart (OVERDUE)
INSERT INTO invoice.invoice_funding_detail (id, invoice_id, funded_amount, funded_at, investor_address, funding_tx_hash, created_at) VALUES
('funding_gallivant_04', 'inv_gallivant_04', 3395000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '38 days'))::BIGINT, '0x891a9EC416ED2c8DAE3D7DB6D8cEa1a3b273937C', '0x5678901234def5678901234def5678901234def5678901234def5678901234', NOW() - INTERVAL '38 days');

-- Invoice 5: Medi Supply → Walmart (SETTLED)
INSERT INTO invoice.invoice_funding_detail (id, invoice_id, funded_amount, funded_at, investor_address, funding_tx_hash, created_at) VALUES
('funding_medisupply_02', 'inv_medisupply_02', 3384000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '63 days'))::BIGINT, '0x891a9EC416ED2c8DAE3D7DB6D8cEa1a3b273937C', '0x3456789012cdef3456789012cdef3456789012cdef3456789012cdef3456', NOW() - INTERVAL '63 days');

-- Invoice 7: Organic Harvest → Amazon (FULLY_FUNDED)
INSERT INTO invoice.invoice_funding_detail (id, invoice_id, funded_amount, funded_at, investor_address, funding_tx_hash, created_at) VALUES
('funding_organicharvest_02', 'inv_organicharvest_02', 3880000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '18 days'))::BIGINT, '0x891a9EC416ED2c8DAE3D7DB6D8cEa1a3b273937C', '0x4567890123def4567890123def4567890123def4567890123def4567890123', NOW() - INTERVAL '18 days');

-- ============================================================================
-- INVOICE REPAYMENTS (For FULLY_PAID and SETTLED invoices)
-- ============================================================================
-- Note: Schema uses deposited_at (not repayment_date), repayment_method (not repayment_source)

-- Invoice 3: Gallivant → Costco (FULLY_PAID)
INSERT INTO invoice.invoice_repayment (id, invoice_id, repayment_amount, deposited_at, repayment_tx_hash, repayment_method, created_at) VALUES
('repayment_gallivant_03', 'inv_gallivant_03', 2500000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days'))::BIGINT, '0x567890124ef567890124ef567890124ef567890124ef567890124ef5678901', 'WALLET', NOW() - INTERVAL '5 days');

-- Invoice 5: Medi Supply → Walmart (SETTLED)
INSERT INTO invoice.invoice_repayment (id, invoice_id, repayment_amount, deposited_at, settled_at, repayment_tx_hash, settlement_tx_hash, repayment_method, created_at) VALUES
('repayment_medisupply_02', 'inv_medisupply_02', 3600000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '10 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() - INTERVAL '8 days'))::BIGINT, '0x67890125f67890125f67890125f67890125f67890125f67890125f67890125', '0x78901236f89012347f89012347f89012347f89012347f89012347f89012347', 'WALLET', NOW() - INTERVAL '10 days');

-- ============================================================================
-- INVESTOR POSITIONS (For FULLY_FUNDED, FULLY_PAID, and SETTLED invoices)
-- ============================================================================
-- Note: Schema uses user_id, principal_amount_cents->principal_amount, maturity_date, apr_bps->apr

-- Invoice 2: Gallivant → Target (FULLY_FUNDED - Active position)
-- Due in 10 days from now, funded 48 days ago for 60-day term
INSERT INTO investment.investor_position (id, user_id, invoice_id, nft_id, principal_amount, expected_return, apr, funded_at, maturity_date, position_status, created_at) VALUES
('position_gallivant_02', 'user_investor1', 'inv_gallivant_02', 'nft_gallivant_02', 4230000, 4500000, 365000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '48 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() + INTERVAL '10 days'))::BIGINT, 'ACTIVE', NOW() - INTERVAL '48 days');

-- Invoice 3: Gallivant → Costco (FULLY_PAID - Matured position)
-- Matured 5 days ago (payment received)
INSERT INTO investment.investor_position (id, user_id, invoice_id, nft_id, principal_amount, expected_return, actual_return, apr, funded_at, maturity_date, position_status, created_at) VALUES
('position_gallivant_03', 'user_investor1', 'inv_gallivant_03', 'nft_gallivant_03', 2275000, 2500000, 2500000, 365000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '83 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days'))::BIGINT, 'MATURED', NOW() - INTERVAL '83 days');

-- Invoice 4: Gallivant → Walmart (OVERDUE - Active but overdue position)
-- Overdue by 7 days, funded 38 days ago for 30-day term
INSERT INTO investment.investor_position (id, user_id, invoice_id, nft_id, principal_amount, expected_return, apr, funded_at, maturity_date, position_status, created_at) VALUES
('position_gallivant_04', 'user_investor1', 'inv_gallivant_04', 'nft_gallivant_04', 3395000, 3500000, 365000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '38 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() - INTERVAL '7 days'))::BIGINT, 'ACTIVE', NOW() - INTERVAL '38 days');

-- Invoice 5: Medi Supply → Walmart (SETTLED - Closed position)
-- Closed 8 days ago (yield distributed)
INSERT INTO investment.investor_position (id, user_id, invoice_id, nft_id, principal_amount, expected_return, actual_return, apr, funded_at, maturity_date, position_status, created_at) VALUES
('position_medisupply_02', 'user_investor1', 'inv_medisupply_02', 'nft_medisupply_02', 3384000, 3600000, 3600000, 365000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '63 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() - INTERVAL '10 days'))::BIGINT, 'CLOSED', NOW() - INTERVAL '63 days');

-- Invoice 7: Organic Harvest → Amazon (FULLY_FUNDED - Active position)
-- Due in 10 days from now, funded 18 days ago for 30-day term
INSERT INTO investment.investor_position (id, user_id, invoice_id, nft_id, principal_amount, expected_return, apr, funded_at, maturity_date, position_status, created_at) VALUES
('position_organicharvest_02', 'user_investor1', 'inv_organicharvest_02', 'nft_organicharvest_02', 3880000, 4000000, 365000, EXTRACT(EPOCH FROM (NOW() - INTERVAL '18 days'))::BIGINT, EXTRACT(EPOCH FROM (NOW() + INTERVAL '10 days'))::BIGINT, 'ACTIVE', NOW() - INTERVAL '18 days');

-- ============================================================================
-- YIELD CALCULATIONS AND DISTRIBUTIONS
-- ============================================================================
-- Note: Skipping these for now as they require complex schema matching
-- The SETTLED status invoice (inv_medisupply_02) is marked as CLOSED in investor_position
-- which indicates the yield has been distributed. The actual distribution records can be
-- added later if needed for detailed reporting.

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Total Organizations: 3
-- Total Invoices: 8 (3 LISTED, 2 FULLY_FUNDED, 1 OVERDUE, 1 FULLY_PAID, 1 SETTLED)
-- Total Payers: 4 (Walmart, Target, Amazon, Costco)
-- Total Investors: 1 (your real wallet address)
-- Active Investments: 3 (inv_gallivant_02, inv_gallivant_04 [OVERDUE], inv_organicharvest_02)
-- Completed Investments: 1 (inv_medisupply_02 - $0.1512 yield received)

-- Next Steps:
-- 1. Run this seed SQL to populate database
-- 2. Run the Base Sepolia deployment script to list the 3 LISTED invoices on-chain
-- 3. Update the NFT records with real token IDs from blockchain
-- 4. Upload logos to AWS S3
-- 5. Test funding one of the 3 LISTED invoices with your wallet
