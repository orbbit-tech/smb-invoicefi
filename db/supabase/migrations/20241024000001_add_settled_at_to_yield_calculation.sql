-- Migration: Add settled_at column to yield_calculation table
-- Purpose: Track when a yield calculation was settled/paid out to investors
-- Date: 2025-10-24

-- Add settled_at column (nullable, as not all positions are settled immediately)
ALTER TABLE investment.yield_calculation
ADD COLUMN settled_at BIGINT;

-- Add index for query performance on settled_at
CREATE INDEX idx_yield_calc_settled_at ON investment.yield_calculation(settled_at)
WHERE settled_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN investment.yield_calculation.settled_at IS 'Unix timestamp when the yield was settled/distributed to the investor (UTC)';
