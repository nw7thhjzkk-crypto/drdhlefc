ALTER TABLE member_trainers ADD COLUMN IF NOT EXISTS unassigned_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_member_trainers_active_assignment ON member_trainers(member_id, trainer_id) WHERE unassigned_at IS NULL;
