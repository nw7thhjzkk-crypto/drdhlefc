-- OAuth 2.1 state for jules-mcp-oauth gateway only.
-- No MCP secrets, no Jules API keys stored.

CREATE TABLE IF NOT EXISTS public.jules_mcp_oauth_clients (
  client_id text PRIMARY KEY,
  client_secret_hash text,
  client_name text NOT NULL,
  redirect_uris text[] NOT NULL,
  grant_types text[] NOT NULL DEFAULT ARRAY['authorization_code', 'refresh_token'],
  token_endpoint_auth_method text NOT NULL DEFAULT 'none',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jules_mcp_oauth_codes (
  code_hash text PRIMARY KEY,
  client_id text NOT NULL REFERENCES public.jules_mcp_oauth_clients (client_id) ON DELETE CASCADE,
  redirect_uri text NOT NULL,
  code_challenge text NOT NULL,
  code_challenge_method text NOT NULL CHECK (code_challenge_method IN ('S256')),
  scope text NOT NULL DEFAULT 'mcp',
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jules_mcp_oauth_refresh_tokens (
  token_hash text PRIMARY KEY,
  client_id text NOT NULL REFERENCES public.jules_mcp_oauth_clients (client_id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'mcp',
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jules_mcp_oauth_codes_expires
  ON public.jules_mcp_oauth_codes (expires_at);
CREATE INDEX IF NOT EXISTS idx_jules_mcp_oauth_refresh_expires
  ON public.jules_mcp_oauth_refresh_tokens (expires_at);

ALTER TABLE public.jules_mcp_oauth_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jules_mcp_oauth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jules_mcp_oauth_refresh_tokens ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.jules_mcp_oauth_clients FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.jules_mcp_oauth_codes FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.jules_mcp_oauth_refresh_tokens FROM PUBLIC, anon, authenticated;

GRANT ALL ON TABLE public.jules_mcp_oauth_clients TO service_role;
GRANT ALL ON TABLE public.jules_mcp_oauth_codes TO service_role;
GRANT ALL ON TABLE public.jules_mcp_oauth_refresh_tokens TO service_role;
