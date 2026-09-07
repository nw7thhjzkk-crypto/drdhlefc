-- Migration 000017: Gym Settings

CREATE TABLE IF NOT EXISTS public.gym_settings (
    id uuid PRIMARY KEY,
    club_name text NOT NULL,
    support_email text,
    club_address text,
    premium_theme boolean DEFAULT true NOT NULL,
    gemini_ai_enabled boolean DEFAULT false NOT NULL,
    google_drive_enabled boolean DEFAULT false NOT NULL,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES auth.users,
    CONSTRAINT single_row_check CHECK (id = '00000000-0000-0000-0000-000000000000')
);

ALTER TABLE public.gym_settings ENABLE ROW LEVEL SECURITY;

-- Only owners can view or modify gym settings
CREATE POLICY "Owners can manage gym settings" ON public.gym_settings
    FOR ALL
    TO authenticated
    USING (public.is_owner());

-- Seed the initial row
INSERT INTO public.gym_settings (
    id,
    club_name,
    support_email,
    club_address,
    premium_theme,
    gemini_ai_enabled,
    google_drive_enabled
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Dr DHL Elite Fitness Club',
    'admin@drdhlelite.com',
    '123 Elite Avenue, Fitness City',
    true,
    false,
    false
) ON CONFLICT (id) DO NOTHING;
