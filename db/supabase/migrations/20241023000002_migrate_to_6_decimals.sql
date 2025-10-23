-- ============================================================================
-- Migration: Align Database with Smart Contract Conventions (6 Decimals)
-- ============================================================================
-- This migration converts amount and rate storage from cents/basis points
-- to 6-decimal precision matching USDC and smart contract standards.
--
-- Conversions:
-- - Amount: cents → 6 decimals (multiply by 10,000)
--   Example: $10,000 = 1,000,000 cents → 10,000,000,000 (6 decimals)
-- - APR/Rates: basis points → 6 decimals (multiply by 100)
--   Example: 36.5% = 3,650 bps → 365,000 (where 1,000,000 = 100%)
-- ============================================================================

-- ============================================================================
-- STEP 1: Add new columns with correct names
-- ============================================================================

-- invoice.invoice
ALTER TABLE invoice.invoice
  ADD COLUMN amount BIGINT,
  ADD COLUMN apr BIGINT,
  ADD COLUMN discount_rate BIGINT;

-- invoice.invoice_underwriting
ALTER TABLE invoice.invoice_underwriting
  ADD COLUMN approved_amount BIGINT,
  ADD COLUMN approved_apr BIGINT;

-- invoice.invoice_funding_detail
ALTER TABLE invoice.invoice_funding_detail
  ADD COLUMN funded_amount BIGINT,
  ADD COLUMN expected_repayment BIGINT,
  ADD COLUMN expected_return BIGINT;

-- invoice.invoice_repayment
ALTER TABLE invoice.invoice_repayment
  ADD COLUMN repayment_amount BIGINT;

-- invoice.invoice_default
ALTER TABLE invoice.invoice_default
  ADD COLUMN recovered_amount BIGINT,
  ADD COLUMN recovery_cost BIGINT,
  ADD COLUMN final_loss BIGINT;

-- investment.investor_position
ALTER TABLE investment.investor_position
  ADD COLUMN principal_amount BIGINT,
  ADD COLUMN expected_return BIGINT,
  ADD COLUMN actual_return BIGINT,
  ADD COLUMN apr BIGINT;

-- investment.yield_calculation
ALTER TABLE investment.yield_calculation
  ADD COLUMN principal BIGINT,
  ADD COLUMN apr BIGINT,
  ADD COLUMN total_yield BIGINT,
  ADD COLUMN investor_yield BIGINT,
  ADD COLUMN platform_fee BIGINT,
  ADD COLUMN platform_fee_rate BIGINT;

-- investment.repayment_distribution
ALTER TABLE investment.repayment_distribution
  ADD COLUMN principal_returned BIGINT,
  ADD COLUMN yield_received BIGINT,
  ADD COLUMN total_amount BIGINT;

-- business.payer_relationship
ALTER TABLE business.payer_relationship
  ADD COLUMN total_invoices_value BIGINT;

-- blockchain.transaction
ALTER TABLE blockchain.transaction
  ADD COLUMN amount BIGINT;

-- blockchain.wallet_autopay_config
ALTER TABLE blockchain.wallet_autopay_config
  ADD COLUMN approved_amount BIGINT;

-- ============================================================================
-- STEP 2: Migrate data with conversion
-- ============================================================================

-- invoice.invoice (multiply amounts by 10,000, rates by 100)
UPDATE invoice.invoice SET
  amount = amount_cents * 10000,
  apr = apr_bps * 100,
  discount_rate = discount_rate_bps * 100
WHERE amount_cents IS NOT NULL;

-- invoice.invoice_underwriting
UPDATE invoice.invoice_underwriting SET
  approved_amount = approved_amount_cents * 10000,
  approved_apr = approved_apr_bps * 100
WHERE approved_amount_cents IS NOT NULL;

-- invoice.invoice_funding_detail
UPDATE invoice.invoice_funding_detail SET
  funded_amount = funded_amount_cents * 10000,
  expected_repayment = expected_repayment_cents * 10000,
  expected_return = expected_return_bps * 100
WHERE funded_amount_cents IS NOT NULL;

-- invoice.invoice_repayment
UPDATE invoice.invoice_repayment SET
  repayment_amount = repayment_amount_cents * 10000
WHERE repayment_amount_cents IS NOT NULL;

-- invoice.invoice_default
UPDATE invoice.invoice_default SET
  recovered_amount = recovered_amount_cents * 10000,
  recovery_cost = recovery_cost_cents * 10000,
  final_loss = final_loss_cents * 10000
WHERE recovered_amount_cents IS NOT NULL OR recovery_cost_cents IS NOT NULL;

-- investment.investor_position
UPDATE investment.investor_position SET
  principal_amount = principal_amount_cents * 10000,
  expected_return = expected_return_cents * 10000,
  actual_return = actual_return_cents * 10000,
  apr = apr_bps * 100
WHERE principal_amount_cents IS NOT NULL;

-- investment.yield_calculation
UPDATE investment.yield_calculation SET
  principal = principal_cents * 10000,
  apr = apr_bps * 100,
  total_yield = total_yield_cents * 10000,
  investor_yield = investor_yield_cents * 10000,
  platform_fee = platform_fee_cents * 10000,
  platform_fee_rate = platform_fee_rate_bps * 100
WHERE principal_cents IS NOT NULL;

-- investment.repayment_distribution
UPDATE investment.repayment_distribution SET
  principal_returned = principal_returned_cents * 10000,
  yield_received = yield_received_cents * 10000,
  total_amount = total_amount_cents * 10000
WHERE principal_returned_cents IS NOT NULL;

-- business.payer_relationship
UPDATE business.payer_relationship SET
  total_invoices_value = total_invoices_value_cents * 10000
WHERE total_invoices_value_cents IS NOT NULL;

-- blockchain.transaction
UPDATE blockchain.transaction SET
  amount = amount_cents * 10000
WHERE amount_cents IS NOT NULL;

-- blockchain.wallet_autopay_config
UPDATE blockchain.wallet_autopay_config SET
  approved_amount = approved_amount_cents * 10000
WHERE approved_amount_cents IS NOT NULL;

-- ============================================================================
-- STEP 3: Add NOT NULL constraints where original had them
-- ============================================================================

-- invoice.invoice
ALTER TABLE invoice.invoice
  ALTER COLUMN amount SET NOT NULL,
  ADD CONSTRAINT invoice_amount_positive CHECK (amount > 0);

ALTER TABLE invoice.invoice
  ADD CONSTRAINT invoice_apr_non_negative CHECK (apr >= 0),
  ADD CONSTRAINT invoice_discount_rate_non_negative CHECK (discount_rate >= 0);

-- invoice.invoice_funding_detail
ALTER TABLE invoice.invoice_funding_detail
  ALTER COLUMN funded_amount SET NOT NULL,
  ADD CONSTRAINT funding_detail_amount_positive CHECK (funded_amount > 0);

-- invoice.invoice_repayment
ALTER TABLE invoice.invoice_repayment
  ALTER COLUMN repayment_amount SET NOT NULL,
  ADD CONSTRAINT repayment_amount_positive CHECK (repayment_amount > 0);

-- investment.investor_position
ALTER TABLE investment.investor_position
  ALTER COLUMN principal_amount SET NOT NULL,
  ALTER COLUMN expected_return SET NOT NULL,
  ALTER COLUMN apr SET NOT NULL,
  ADD CONSTRAINT position_principal_positive CHECK (principal_amount > 0);

-- investment.yield_calculation
ALTER TABLE investment.yield_calculation
  ALTER COLUMN principal SET NOT NULL,
  ALTER COLUMN apr SET NOT NULL,
  ALTER COLUMN total_yield SET NOT NULL,
  ALTER COLUMN investor_yield SET NOT NULL,
  ALTER COLUMN platform_fee SET NOT NULL,
  ALTER COLUMN platform_fee_rate SET NOT NULL;

-- investment.repayment_distribution
ALTER TABLE investment.repayment_distribution
  ALTER COLUMN principal_returned SET NOT NULL,
  ALTER COLUMN yield_received SET NOT NULL,
  ALTER COLUMN total_amount SET NOT NULL;

-- ============================================================================
-- STEP 4: Drop old columns
-- ============================================================================

-- invoice.invoice
ALTER TABLE invoice.invoice
  DROP COLUMN amount_cents,
  DROP COLUMN apr_bps,
  DROP COLUMN discount_rate_bps;

-- invoice.invoice_underwriting
ALTER TABLE invoice.invoice_underwriting
  DROP COLUMN approved_amount_cents,
  DROP COLUMN approved_apr_bps;

-- invoice.invoice_funding_detail
ALTER TABLE invoice.invoice_funding_detail
  DROP COLUMN funded_amount_cents,
  DROP COLUMN expected_repayment_cents,
  DROP COLUMN expected_return_bps;

-- invoice.invoice_repayment
ALTER TABLE invoice.invoice_repayment
  DROP COLUMN repayment_amount_cents;

-- invoice.invoice_default
ALTER TABLE invoice.invoice_default
  DROP COLUMN recovered_amount_cents,
  DROP COLUMN recovery_cost_cents,
  DROP COLUMN final_loss_cents;

-- investment.investor_position
ALTER TABLE investment.investor_position
  DROP COLUMN principal_amount_cents,
  DROP COLUMN expected_return_cents,
  DROP COLUMN actual_return_cents,
  DROP COLUMN apr_bps;

-- investment.yield_calculation
ALTER TABLE investment.yield_calculation
  DROP COLUMN principal_cents,
  DROP COLUMN apr_bps,
  DROP COLUMN total_yield_cents,
  DROP COLUMN investor_yield_cents,
  DROP COLUMN platform_fee_cents,
  DROP COLUMN platform_fee_rate_bps;

-- investment.repayment_distribution
ALTER TABLE investment.repayment_distribution
  DROP COLUMN principal_returned_cents,
  DROP COLUMN yield_received_cents,
  DROP COLUMN total_amount_cents;

-- business.payer_relationship
ALTER TABLE business.payer_relationship
  DROP COLUMN total_invoices_value_cents;

-- blockchain.transaction
ALTER TABLE blockchain.transaction
  DROP COLUMN amount_cents;

-- blockchain.wallet_autopay_config
ALTER TABLE blockchain.wallet_autopay_config
  DROP COLUMN approved_amount_cents;

-- ============================================================================
-- STEP 5: Update comments for documentation
-- ============================================================================

COMMENT ON COLUMN invoice.invoice.amount IS 'Invoice principal amount in 6-decimal format (e.g., for USDC: 1,000,000 = $1, so $10,000 = 10,000,000,000)';
COMMENT ON COLUMN invoice.invoice.apr IS 'Annual Percentage Rate with 6 decimals (e.g., 36.5% = 365,000, where 1,000,000 = 100%)';
COMMENT ON COLUMN invoice.invoice.due_at IS 'Unix timestamp when payment is due (UTC)';
COMMENT ON COLUMN invoice.invoice.lifecycle_status IS 'Complete lifecycle status (17 states: Draft → Settled/Defaulted)';
COMMENT ON COLUMN invoice.invoice.on_chain_status IS 'Smart contract status only (5 states: LISTED, FUNDED, FULLY_PAID, SETTLED, DEFAULTED)';
