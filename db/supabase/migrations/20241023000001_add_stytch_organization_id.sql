-- Add stytch_organization_id column to identity.organization table
-- This column stores the Stytch organization ID for authentication integration

ALTER TABLE identity.organization
ADD COLUMN stytch_organization_id TEXT UNIQUE;

-- Add index for efficient lookups by Stytch organization ID
CREATE INDEX idx_organization_stytch_org_id
ON identity.organization(stytch_organization_id)
WHERE stytch_organization_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN identity.organization.stytch_organization_id IS 'Stytch organization ID for B2B authentication';
