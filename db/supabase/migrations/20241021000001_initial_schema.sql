-- ============================================================================
-- Orbbit Web3 Invoice Financing - Initial Schema
-- ============================================================================
-- This migration creates the complete database schema for the Web3 invoice
-- financing system, including identity, business, invoice, blockchain, and
-- investment domains.
--
-- Conventions:
-- - Currency: BIGINT in cents (e.g., $10,000 = 1000000)
-- - Percentages: BIGINT in basis points (e.g., 36.5% = 3650)
-- - Timestamps: BIGINT Unix timestamps in UTC
-- - Primary Keys: TEXT with prefixes (inv_, nft_, txn_, etc.)
-- - Audit Fields: created_at, updated_at, deleted_at
-- ============================================================================

-- ============================================================================
-- EXTENSIONS & SCHEMAS
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS business;
CREATE SCHEMA IF NOT EXISTS invoice;
CREATE SCHEMA IF NOT EXISTS blockchain;
CREATE SCHEMA IF NOT EXISTS investment;

-- ============================================================================
-- IDENTITY SCHEMA
-- ============================================================================

-- Organizations (SMBs)
CREATE TABLE identity.organization (
    id TEXT PRIMARY KEY DEFAULT 'org_' || encode(gen_random_bytes(16), 'hex'),
    name TEXT NOT NULL,
    legal_name TEXT,
    tax_id TEXT,
    wallet_address TEXT UNIQUE,
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    email TEXT,
    phone TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'US',
    kyb_status TEXT CHECK (kyb_status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
    kyb_completed_at BIGINT,
    is_whitelisted BOOLEAN DEFAULT FALSE,
    whitelisted_at BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Individual Users (Investors)
CREATE TABLE identity.user (
    id TEXT PRIMARY KEY DEFAULT 'user_' || encode(gen_random_bytes(16), 'hex'),
    email TEXT UNIQUE NOT NULL,
    wallet_address TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    country TEXT,
    kyc_status TEXT CHECK (kyc_status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
    kyc_completed_at BIGINT,
    is_whitelisted BOOLEAN DEFAULT FALSE,
    whitelisted_at BIGINT,
    is_accredited_investor BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Organization Members (B2B Users)
CREATE TABLE identity.member (
    id TEXT PRIMARY KEY DEFAULT 'member_' || encode(gen_random_bytes(16), 'hex'),
    email TEXT UNIQUE NOT NULL,
    wallet_address TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Junction table for member-organization relationships
CREATE TABLE identity.organization_member (
    organization_id TEXT NOT NULL REFERENCES identity.organization(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL REFERENCES identity.member(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    PRIMARY KEY (organization_id, member_id)
);

-- ============================================================================
-- BUSINESS SCHEMA
-- ============================================================================

-- Invoice Payer Companies (Walmart, Target, Amazon, etc.)
CREATE TABLE business.payer_company (
    id TEXT PRIMARY KEY DEFAULT 'payer_' || encode(gen_random_bytes(16), 'hex'),
    name TEXT NOT NULL,
    legal_name TEXT,
    tax_id TEXT,
    industry TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'US',
    credit_score TEXT CHECK (credit_score IN ('AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C', 'D')),
    payment_terms_days INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- SMB-to-Payer Relationship Tracking
CREATE TABLE business.payer_relationship (
    id TEXT PRIMARY KEY DEFAULT 'rel_' || encode(gen_random_bytes(16), 'hex'),
    organization_id TEXT NOT NULL REFERENCES identity.organization(id) ON DELETE CASCADE,
    payer_company_id TEXT NOT NULL REFERENCES business.payer_company(id) ON DELETE CASCADE,
    total_invoices_count INT DEFAULT 0,
    total_invoices_value_cents BIGINT DEFAULT 0,
    paid_on_time_count INT DEFAULT 0,
    late_payment_count INT DEFAULT 0,
    default_count INT DEFAULT 0,
    average_payment_delay_days DECIMAL(10, 2),
    reliability_score DECIMAL(5, 2) CHECK (reliability_score >= 0 AND reliability_score <= 100),
    first_invoice_date BIGINT,
    last_invoice_date BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE (organization_id, payer_company_id)
);

-- ============================================================================
-- INVOICE SCHEMA
-- ============================================================================

-- Core Invoice Entity
CREATE TABLE invoice.invoice (
    id TEXT PRIMARY KEY DEFAULT 'inv_' || encode(gen_random_bytes(16), 'hex'),
    organization_id TEXT NOT NULL REFERENCES identity.organization(id) ON DELETE CASCADE,
    payer_company_id TEXT NOT NULL REFERENCES business.payer_company(id) ON DELETE RESTRICT,

    -- Financial Details (in cents and basis points)
    amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
    apr_bps BIGINT CHECK (apr_bps >= 0),
    discount_rate_bps BIGINT CHECK (discount_rate_bps >= 0),

    -- Dates (Unix timestamps)
    invoice_date BIGINT NOT NULL,
    due_at BIGINT NOT NULL,

    -- Status Management
    lifecycle_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (lifecycle_status IN (
        'DRAFT', 'SUBMITTED', 'UNDERWRITING', 'APPROVED', 'DECLINED',
        'LISTED', 'FUNDED', 'AWAITING_PAYMENT', 'DUE_DATE', 'GRACE_PERIOD',
        'FULLY_PAID', 'SETTLED', 'DEFAULTED', 'COLLECTION', 'PARTIAL_PAID', 'UNPAID', 'CHARGE_OFF'
    )),
    on_chain_status TEXT CHECK (on_chain_status IN (
        'LISTED', 'FUNDED', 'FULLY_PAID', 'SETTLED', 'DEFAULTED'
    )),

    -- Invoice Details
    invoice_number TEXT NOT NULL,
    description TEXT,
    metadata_uri TEXT,

    -- Risk Assessment
    risk_score TEXT CHECK (risk_score IN ('LOW', 'MEDIUM', 'HIGH')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,

    UNIQUE (organization_id, invoice_number)
);

-- Invoice Documents (PDFs, Metadata URIs)
CREATE TABLE invoice.invoice_document (
    id TEXT PRIMARY KEY DEFAULT 'doc_' || encode(gen_random_bytes(16), 'hex'),
    invoice_id TEXT NOT NULL REFERENCES invoice.invoice(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('INVOICE_PDF', 'METADATA_JSON', 'SUPPORTING_DOC', 'PROOF_OF_DELIVERY')),
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size_bytes BIGINT,
    mime_type TEXT,
    ipfs_hash TEXT,
    uploaded_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Invoice Underwriting Records
CREATE TABLE invoice.invoice_underwriting (
    id TEXT PRIMARY KEY DEFAULT 'uw_' || encode(gen_random_bytes(16), 'hex'),
    invoice_id TEXT NOT NULL REFERENCES invoice.invoice(id) ON DELETE CASCADE,
    underwriter_id TEXT,
    decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'DECLINED', 'PENDING', 'REQUIRES_INFO')),
    decision_reason TEXT,
    approved_amount_cents BIGINT,
    approved_apr_bps BIGINT,
    assessed_risk_score TEXT CHECK (assessed_risk_score IN ('LOW', 'MEDIUM', 'HIGH')),
    fraud_check_status TEXT,
    payer_verification_status TEXT,
    completed_at BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Invoice Funding Details
CREATE TABLE invoice.invoice_funding_detail (
    id TEXT PRIMARY KEY DEFAULT 'fund_' || encode(gen_random_bytes(16), 'hex'),
    invoice_id TEXT NOT NULL UNIQUE REFERENCES invoice.invoice(id) ON DELETE CASCADE,
    investor_address TEXT NOT NULL,
    funded_amount_cents BIGINT NOT NULL CHECK (funded_amount_cents > 0),
    funded_at BIGINT NOT NULL,
    funding_tx_hash TEXT,
    payment_token_address TEXT,
    expected_repayment_cents BIGINT,
    expected_return_bps BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Invoice Repayment Tracking
CREATE TABLE invoice.invoice_repayment (
    id TEXT PRIMARY KEY DEFAULT 'rep_' || encode(gen_random_bytes(16), 'hex'),
    invoice_id TEXT NOT NULL UNIQUE REFERENCES invoice.invoice(id) ON DELETE CASCADE,
    repayment_amount_cents BIGINT NOT NULL CHECK (repayment_amount_cents > 0),
    deposited_by TEXT,
    deposited_at BIGINT NOT NULL,
    settled_at BIGINT,
    repayment_tx_hash TEXT,
    settlement_tx_hash TEXT,
    repayment_method TEXT CHECK (repayment_method IN ('WALLET', 'ACH', 'MANUAL')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Invoice Default Tracking
CREATE TABLE invoice.invoice_default (
    id TEXT PRIMARY KEY DEFAULT 'def_' || encode(gen_random_bytes(16), 'hex'),
    invoice_id TEXT NOT NULL UNIQUE REFERENCES invoice.invoice(id) ON DELETE CASCADE,
    defaulted_at BIGINT NOT NULL,
    grace_period_end BIGINT NOT NULL,
    collection_initiated_at BIGINT,
    collection_agency TEXT,
    recovered_amount_cents BIGINT DEFAULT 0,
    recovery_cost_cents BIGINT DEFAULT 0,
    final_loss_cents BIGINT,
    collection_status TEXT CHECK (collection_status IN ('PENDING', 'IN_PROGRESS', 'PARTIAL_RECOVERY', 'FULL_RECOVERY', 'WRITTEN_OFF')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Invoice Status History (Audit Trail)
CREATE TABLE invoice.invoice_status_history (
    id TEXT PRIMARY KEY DEFAULT 'hist_' || encode(gen_random_bytes(16), 'hex'),
    invoice_id TEXT NOT NULL REFERENCES invoice.invoice(id) ON DELETE CASCADE,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    changed_by TEXT,
    changed_at BIGINT NOT NULL,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- BLOCKCHAIN SCHEMA
-- ============================================================================

-- Invoice NFT Details
CREATE TABLE blockchain.invoice_nft (
    id TEXT PRIMARY KEY DEFAULT 'nft_' || encode(gen_random_bytes(16), 'hex'),
    invoice_id TEXT NOT NULL UNIQUE REFERENCES invoice.invoice(id) ON DELETE CASCADE,
    token_id TEXT NOT NULL,
    contract_address TEXT NOT NULL,
    chain_id INT NOT NULL DEFAULT 8453, -- Base mainnet
    owner_address TEXT,
    metadata_uri TEXT,
    minted_at BIGINT NOT NULL,
    minted_tx_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE (contract_address, token_id)
);

-- Blockchain Transactions
CREATE TABLE blockchain.transaction (
    id TEXT PRIMARY KEY DEFAULT 'txn_' || encode(gen_random_bytes(16), 'hex'),
    nft_id TEXT REFERENCES blockchain.invoice_nft(id) ON DELETE SET NULL,
    tx_hash TEXT NOT NULL UNIQUE,
    tx_type TEXT NOT NULL CHECK (tx_type IN ('MINT', 'LISTING', 'FUNDING', 'REPAYMENT', 'SETTLEMENT', 'DEFAULT', 'TRANSFER')),
    from_address TEXT,
    to_address TEXT,
    amount_cents BIGINT,
    block_number BIGINT NOT NULL,
    block_timestamp BIGINT NOT NULL,
    gas_used BIGINT,
    gas_price_wei BIGINT,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED')) DEFAULT 'CONFIRMED',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Wallet Autopay Configuration
CREATE TABLE blockchain.wallet_autopay_config (
    id TEXT PRIMARY KEY DEFAULT 'autopay_' || encode(gen_random_bytes(16), 'hex'),
    invoice_id TEXT NOT NULL UNIQUE REFERENCES invoice.invoice(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES identity.organization(id) ON DELETE CASCADE,
    method TEXT NOT NULL CHECK (method IN ('WALLET', 'ACH')),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    wallet_address TEXT,
    approved_amount_cents BIGINT,
    approved_at BIGINT,
    ach_bank_account_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Smart Contract Event Log
CREATE TABLE blockchain.contract_event (
    id TEXT PRIMARY KEY DEFAULT 'evt_' || encode(gen_random_bytes(16), 'hex'),
    event_name TEXT NOT NULL CHECK (event_name IN (
        'InvoiceMinted', 'InvoiceListed', 'InvoiceFunded',
        'RepaymentDeposited', 'InvoiceRepaid', 'InvoiceDefaulted', 'StatusUpdated'
    )),
    contract_address TEXT NOT NULL,
    tx_hash TEXT NOT NULL,
    block_number BIGINT NOT NULL,
    block_timestamp BIGINT NOT NULL,
    log_index INT NOT NULL,
    invoice_token_id TEXT,
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at BIGINT,
    processing_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tx_hash, log_index)
);

-- ============================================================================
-- INVESTMENT SCHEMA
-- ============================================================================

-- Investor Positions (NFT Holdings)
CREATE TABLE investment.investor_position (
    id TEXT PRIMARY KEY DEFAULT 'pos_' || encode(gen_random_bytes(16), 'hex'),
    user_id TEXT NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    invoice_id TEXT NOT NULL REFERENCES invoice.invoice(id) ON DELETE CASCADE,
    nft_id TEXT NOT NULL UNIQUE REFERENCES blockchain.invoice_nft(id) ON DELETE CASCADE,
    principal_amount_cents BIGINT NOT NULL CHECK (principal_amount_cents > 0),
    expected_return_cents BIGINT NOT NULL,
    actual_return_cents BIGINT,
    apr_bps BIGINT NOT NULL,
    funded_at BIGINT NOT NULL,
    maturity_date BIGINT NOT NULL,
    position_status TEXT NOT NULL CHECK (position_status IN ('ACTIVE', 'MATURED', 'DEFAULTED', 'CLOSED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE (user_id, invoice_id)
);

-- Yield Calculations
CREATE TABLE investment.yield_calculation (
    id TEXT PRIMARY KEY DEFAULT 'yield_' || encode(gen_random_bytes(16), 'hex'),
    position_id TEXT NOT NULL UNIQUE REFERENCES investment.investor_position(id) ON DELETE CASCADE,
    principal_cents BIGINT NOT NULL,
    apr_bps BIGINT NOT NULL,
    funding_timestamp BIGINT NOT NULL,
    due_timestamp BIGINT NOT NULL,
    duration_days INT NOT NULL,

    -- Yield Breakdown (in cents)
    total_yield_cents BIGINT NOT NULL,
    investor_yield_cents BIGINT NOT NULL,
    platform_fee_cents BIGINT NOT NULL,

    -- Platform Fee Rate (basis points, default 3000 = 30%)
    platform_fee_rate_bps BIGINT NOT NULL DEFAULT 3000,

    calculated_at BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Repayment Distributions
CREATE TABLE investment.repayment_distribution (
    id TEXT PRIMARY KEY DEFAULT 'dist_' || encode(gen_random_bytes(16), 'hex'),
    position_id TEXT NOT NULL REFERENCES investment.investor_position(id) ON DELETE CASCADE,
    invoice_id TEXT NOT NULL REFERENCES invoice.invoice(id) ON DELETE CASCADE,
    investor_address TEXT NOT NULL,
    principal_returned_cents BIGINT NOT NULL,
    yield_received_cents BIGINT NOT NULL,
    total_amount_cents BIGINT NOT NULL,
    distributed_at BIGINT NOT NULL,
    distribution_tx_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Identity Indexes
CREATE INDEX idx_organization_wallet ON identity.organization(wallet_address) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_wallet ON identity.user(wallet_address) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_email ON identity.user(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_member_email ON identity.member(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_member_org ON identity.organization_member(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_member_member ON identity.organization_member(member_id) WHERE deleted_at IS NULL;

-- Business Indexes
CREATE INDEX idx_payer_company_name ON business.payer_company(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_payer_rel_org ON business.payer_relationship(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payer_rel_payer ON business.payer_relationship(payer_company_id) WHERE deleted_at IS NULL;

-- Invoice Indexes
CREATE INDEX idx_invoice_org ON invoice.invoice(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoice_payer ON invoice.invoice(payer_company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoice_lifecycle_status ON invoice.invoice(lifecycle_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoice_on_chain_status ON invoice.invoice(on_chain_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoice_due_at ON invoice.invoice(due_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoice_created_at ON invoice.invoice(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoice_number ON invoice.invoice(organization_id, invoice_number) WHERE deleted_at IS NULL;

CREATE INDEX idx_invoice_doc_invoice ON invoice.invoice_document(invoice_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoice_underwriting ON invoice.invoice_underwriting(invoice_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoice_funding_invoice ON invoice.invoice_funding_detail(invoice_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoice_funding_investor ON invoice.invoice_funding_detail(investor_address) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoice_repayment_invoice ON invoice.invoice_repayment(invoice_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoice_status_history ON invoice.invoice_status_history(invoice_id, changed_at DESC);

-- Blockchain Indexes
CREATE INDEX idx_nft_invoice ON blockchain.invoice_nft(invoice_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_nft_token ON blockchain.invoice_nft(contract_address, token_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_nft_owner ON blockchain.invoice_nft(owner_address) WHERE deleted_at IS NULL;
CREATE INDEX idx_transaction_nft ON blockchain.transaction(nft_id);
CREATE INDEX idx_transaction_hash ON blockchain.transaction(tx_hash);
CREATE INDEX idx_transaction_type ON blockchain.transaction(tx_type, block_timestamp DESC);
CREATE INDEX idx_autopay_org ON blockchain.wallet_autopay_config(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contract_event_name ON blockchain.contract_event(event_name, block_timestamp DESC);
CREATE INDEX idx_contract_event_token ON blockchain.contract_event(invoice_token_id) WHERE invoice_token_id IS NOT NULL;
CREATE INDEX idx_contract_event_processed ON blockchain.contract_event(processed, created_at) WHERE NOT processed;

-- Investment Indexes
CREATE INDEX idx_position_user ON investment.investor_position(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_position_invoice ON investment.investor_position(invoice_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_position_status ON investment.investor_position(position_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_yield_calc_position ON investment.yield_calculation(position_id);
CREATE INDEX idx_repayment_dist_position ON investment.repayment_distribution(position_id);
CREATE INDEX idx_repayment_dist_invoice ON investment.repayment_distribution(invoice_id);
CREATE INDEX idx_repayment_dist_investor ON investment.repayment_distribution(investor_address);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- NOTE: RLS is disabled for hackathon MVP to simplify development
-- In production, enable RLS and implement proper authentication policies
-- For now, all data is publicly accessible in local development

-- Uncomment below to enable RLS in production:
/*
ALTER TABLE identity.organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.user ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.member ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.organization_member ENABLE ROW LEVEL SECURITY;

ALTER TABLE business.payer_company ENABLE ROW LEVEL SECURITY;
ALTER TABLE business.payer_relationship ENABLE ROW LEVEL SECURITY;

ALTER TABLE invoice.invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice.invoice_document ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice.invoice_underwriting ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice.invoice_funding_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice.invoice_repayment ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice.invoice_default ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice.invoice_status_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE blockchain.invoice_nft ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain.transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain.wallet_autopay_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain.contract_event ENABLE ROW LEVEL SECURITY;

ALTER TABLE investment.investor_position ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment.yield_calculation ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment.repayment_distribution ENABLE ROW LEVEL SECURITY;

-- Add RLS policies here when implementing production authentication
*/

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_organization_updated_at BEFORE UPDATE ON identity.organization
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON identity.user
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_updated_at BEFORE UPDATE ON identity.member
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_member_updated_at BEFORE UPDATE ON identity.organization_member
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payer_company_updated_at BEFORE UPDATE ON business.payer_company
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payer_relationship_updated_at BEFORE UPDATE ON business.payer_relationship
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_updated_at BEFORE UPDATE ON invoice.invoice
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_document_updated_at BEFORE UPDATE ON invoice.invoice_document
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_underwriting_updated_at BEFORE UPDATE ON invoice.invoice_underwriting
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_funding_detail_updated_at BEFORE UPDATE ON invoice.invoice_funding_detail
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_repayment_updated_at BEFORE UPDATE ON invoice.invoice_repayment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_default_updated_at BEFORE UPDATE ON invoice.invoice_default
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_nft_updated_at BEFORE UPDATE ON blockchain.invoice_nft
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_updated_at BEFORE UPDATE ON blockchain.transaction
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_autopay_config_updated_at BEFORE UPDATE ON blockchain.wallet_autopay_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investor_position_updated_at BEFORE UPDATE ON investment.investor_position
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yield_calculation_updated_at BEFORE UPDATE ON investment.yield_calculation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repayment_distribution_updated_at BEFORE UPDATE ON investment.repayment_distribution
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON SCHEMA identity IS 'Identity and access management for organizations, users, and members';
COMMENT ON SCHEMA business IS 'Business entities and payer relationships';
COMMENT ON SCHEMA invoice IS 'Invoice lifecycle management';
COMMENT ON SCHEMA blockchain IS 'Blockchain and NFT data';
COMMENT ON SCHEMA investment IS 'Investment positions and yield tracking';

COMMENT ON TABLE invoice.invoice IS 'Core invoice entity with two-tier status model (lifecycle_status for full journey, on_chain_status for smart contract states)';
COMMENT ON COLUMN invoice.invoice.amount_cents IS 'Invoice principal amount in cents (e.g., $10,000 = 1000000)';
COMMENT ON COLUMN invoice.invoice.apr_bps IS 'Annual Percentage Rate in basis points (e.g., 36.5% = 3650)';
COMMENT ON COLUMN invoice.invoice.due_at IS 'Unix timestamp when payment is due (UTC)';
COMMENT ON COLUMN invoice.invoice.lifecycle_status IS 'Complete lifecycle status (17 states: Draft → Settled/Defaulted)';
COMMENT ON COLUMN invoice.invoice.on_chain_status IS 'Smart contract status only (5 states: LISTED, FUNDED, FULLY_PAID, SETTLED, DEFAULTED)';
