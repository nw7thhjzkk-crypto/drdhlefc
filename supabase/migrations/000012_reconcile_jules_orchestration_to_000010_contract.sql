-- 000012_reconcile_jules_orchestration_to_000010_contract.sql
-- Reconciles the live legacy jules_orchestration_requests table to exactly match the contract in 000010.

-- 1. Add missing columns and alter existing column types/nullability
ALTER TABLE IF EXISTS public.jules_orchestration_requests
  ADD COLUMN IF NOT EXISTS repository text NOT NULL DEFAULT 'nw7thhjzkk-crypto/drdhlefc',
  ADD COLUMN IF NOT EXISTS production_branch text NOT NULL DEFAULT 'scaffold-gymsmart-erp-9743545895368865022',
  ADD COLUMN IF NOT EXISTS jules_session_url text;

-- Map session_id to jules_session_id if it doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jules_orchestration_requests' AND column_name = 'session_id') AND
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jules_orchestration_requests' AND column_name = 'jules_session_id') THEN
        ALTER TABLE public.jules_orchestration_requests RENAME COLUMN session_id TO jules_session_id;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jules_orchestration_requests' AND column_name = 'jules_session_id') THEN
        ALTER TABLE public.jules_orchestration_requests ADD COLUMN jules_session_id text;
    END IF;
END $$;

-- Handle 'title' NOT NULL requirement (fallback for existing rows)
UPDATE public.jules_orchestration_requests SET title = 'Untitled Task' WHERE title IS NULL;
ALTER TABLE IF EXISTS public.jules_orchestration_requests ALTER COLUMN title SET NOT NULL;

-- 2. Handle constraints and primary key renaming
-- Find and drop the status CHECK constraint
DO $$
DECLARE
    chk_name text;
BEGIN
    SELECT conname INTO chk_name
    FROM pg_constraint
    WHERE conrelid = 'public.jules_orchestration_requests'::regclass
      AND contype = 'c'
      AND pg_get_expr(conbin, conrelid) LIKE '%status%';

    IF chk_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.jules_orchestration_requests DROP CONSTRAINT ' || chk_name;
    END IF;
END $$;

-- Add new status CHECK constraint
ALTER TABLE IF EXISTS public.jules_orchestration_requests
  ADD CONSTRAINT jules_orchestration_requests_status_check
  CHECK (status IN ('pending', 'created', 'failed', 'completed', 'message_sent'));

-- Rename primary key column id to request_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jules_orchestration_requests' AND column_name = 'id') THEN
        ALTER TABLE public.jules_orchestration_requests RENAME COLUMN id TO request_id;
    END IF;
END $$;

-- 3. Drop requested_by and its foreign key constraint
DO $$
DECLARE
    fk_name text;
BEGIN
    -- Find the foreign key constraint for requested_by
    SELECT conname INTO fk_name
    FROM pg_constraint
    WHERE conrelid = 'public.jules_orchestration_requests'::regclass
      AND contype = 'f'
      AND conkey[1] = (
          SELECT attnum
          FROM pg_attribute
          WHERE attrelid = 'public.jules_orchestration_requests'::regclass
            AND attname = 'requested_by'
      );

    IF fk_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.jules_orchestration_requests DROP CONSTRAINT ' || fk_name;
    END IF;
END $$;

ALTER TABLE IF EXISTS public.jules_orchestration_requests DROP COLUMN IF EXISTS requested_by;

-- 4. Create new indexes and drop old one
-- Drop old index on requested_by (we just dropped the column, so the index might already be gone, but we can attempt to drop it if we know its name. Often it's generated, let's just drop if exists by common names or let cascade handle it.)
-- The prompt mentions: index (requested_by, created_at DESC). If we dropped requested_by, Postgres drops the index automatically.

CREATE INDEX IF NOT EXISTS idx_jules_orch_status ON public.jules_orchestration_requests (status);
CREATE INDEX IF NOT EXISTS idx_jules_orch_created ON public.jules_orchestration_requests (created_at DESC);

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.jules_orchestration_requests ENABLE ROW LEVEL SECURITY;

-- 5. Revoke client grants and grant to service_role
REVOKE ALL ON TABLE public.jules_orchestration_requests FROM PUBLIC;
REVOKE ALL ON TABLE public.jules_orchestration_requests FROM anon;
REVOKE ALL ON TABLE public.jules_orchestration_requests FROM authenticated;
GRANT ALL ON TABLE public.jules_orchestration_requests TO service_role;
