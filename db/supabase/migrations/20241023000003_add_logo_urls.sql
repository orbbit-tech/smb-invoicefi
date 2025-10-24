-- ============================================================================
-- Add logo_url columns to organization and payer_company tables
-- ============================================================================
-- This migration adds logo_url fields to support displaying company logos
-- in the frontend applications (both SMB and Investor apps)
-- ============================================================================

-- Add logo_url to organization table (SMB companies)
ALTER TABLE identity.organization
ADD COLUMN logo_url TEXT;

-- Add logo_url to payer_company table (Invoice payers like Walmart, Target, etc.)
ALTER TABLE business.payer_company
ADD COLUMN logo_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN identity.organization.logo_url IS 'URL to the organization logo image (e.g., https://media.cdn.orbbit.co/demo/logos/company-logo.png)';
COMMENT ON COLUMN business.payer_company.logo_url IS 'URL to the payer company logo image (e.g., https://media.cdn.orbbit.co/demo/logos/walmart-logo.png)';
