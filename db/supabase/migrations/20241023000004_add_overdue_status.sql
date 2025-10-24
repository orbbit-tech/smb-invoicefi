-- ============================================================================
-- Add OVERDUE status to lifecycle_status check constraint
-- ============================================================================
-- OVERDUE is a computed status based on due_at being past current time
-- This migration adds it to the allowed values in the check constraint
-- ============================================================================

-- Drop the existing check constraint
ALTER TABLE invoice.invoice
DROP CONSTRAINT IF EXISTS invoice_lifecycle_status_check;

-- Add the new check constraint with OVERDUE included
ALTER TABLE invoice.invoice
ADD CONSTRAINT invoice_lifecycle_status_check
CHECK (lifecycle_status IN (
    'DRAFT', 'SUBMITTED', 'UNDERWRITING', 'APPROVED', 'DECLINED',
    'LISTED', 'FUNDED', 'OVERDUE', 'AWAITING_PAYMENT', 'DUE_DATE', 'GRACE_PERIOD',
    'FULLY_PAID', 'SETTLED', 'DEFAULTED', 'COLLECTION', 'PARTIAL_PAID', 'UNPAID', 'CHARGE_OFF'
));
