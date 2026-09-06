-- Jules external orchestrator request store (idempotent session creation).
-- No API keys stored. Service-role / Edge Function only; RLS denies clients.

CREATE TABLE IF NOT EXISTS public.jules_orchestration_requests (
  request_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL,
  title text NOT NULL,
  prompt text NOT NULL,
  repository text NOT NULL DEFAULT 'nw7thhjzkk-crypto/drdhlefc',
  production_branch text NOT NULL DEFAULT 'scaffold-gymsmart-erp-9743545895368865022',
  jules_session_id text,
  jules_session_url text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',
      'created',
      'failed',
      'completed',
      'message_sent'
    )),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT jules_orchestration_requests_idempotency_key_unique UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_jules_orch_status
  ON public.jules_orchestration_requests (status);

CREATE INDEX IF NOT EXISTS idx_jules_orch_created
  ON public.jules_orchestration_requests (created_at DESC);

ALTER TABLE public.jules_orchestration_requests ENABLE ROW LEVEL SECURITY;

-- No client policies: only service role / Edge Function (bypass RLS).
-- Explicit deny-all for authenticated/anon keeps fail-closed posture.

COMMENT ON TABLE public.jules_orchestration_requests IS
  'Idempotent Jules orchestration requests from the external bridge. No secrets.';
