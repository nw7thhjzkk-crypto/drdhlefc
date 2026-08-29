-- Part 1: Add deleted_at columns for soft deletion
ALTER TABLE diet_plans ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

-- Part 3: Modify Foreign Keys to prevent destructive deletions of historical recommendations
ALTER TABLE member_diet_plans DROP CONSTRAINT IF EXISTS member_diet_plans_diet_plan_id_fkey;
ALTER TABLE member_diet_plans ADD CONSTRAINT member_diet_plans_diet_plan_id_fkey
FOREIGN KEY (diet_plan_id) REFERENCES diet_plans(id) ON DELETE SET NULL;

ALTER TABLE member_workout_plans DROP CONSTRAINT IF EXISTS member_workout_plans_workout_plan_id_fkey;
ALTER TABLE member_workout_plans ADD CONSTRAINT member_workout_plans_workout_plan_id_fkey
FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE SET NULL;

-- Modify activity_bookings early to prevent history loss
ALTER TABLE activity_bookings DROP CONSTRAINT IF EXISTS activity_bookings_activity_id_fkey;
ALTER TABLE activity_bookings ADD CONSTRAINT activity_bookings_activity_id_fkey
FOREIGN KEY (activity_id) REFERENCES group_activities(id) ON DELETE SET NULL;

-- Add partial indexes to improve performance for active plans queries
CREATE INDEX IF NOT EXISTS idx_diet_plans_active ON diet_plans(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workout_plans_active ON workout_plans(id) WHERE deleted_at IS NULL;
