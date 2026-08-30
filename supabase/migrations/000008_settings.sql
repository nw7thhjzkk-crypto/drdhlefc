CREATE TABLE gym_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gym_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner ALL gym_settings" ON gym_settings FOR ALL TO authenticated USING (auth.is_owner());
