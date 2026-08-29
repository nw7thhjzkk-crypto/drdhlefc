-- Add soft deletion for group activities
ALTER TABLE group_activities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

-- Create an index for active activities
CREATE INDEX IF NOT EXISTS idx_group_activities_active ON group_activities(id) WHERE deleted_at IS NULL;
