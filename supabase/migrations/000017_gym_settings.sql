-- Create gym settings table (singleton)
CREATE TABLE IF NOT EXISTS public.gym_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_name TEXT NOT NULL,
    support_email TEXT NOT NULL,
    club_address TEXT NOT NULL,
    premium_theme BOOLEAN NOT NULL DEFAULT true,
    gemini_ai_features BOOLEAN NOT NULL DEFAULT true,
    google_drive_integration BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.gym_settings ENABLE ROW LEVEL SECURITY;

-- Owner can read and write
CREATE POLICY "Owner ALL gym_settings" ON public.gym_settings FOR ALL TO authenticated USING (public.is_owner());

-- Trainers and members can only read
CREATE POLICY "Trainers and members SELECT gym_settings" ON public.gym_settings FOR SELECT TO authenticated USING (public.is_trainer() OR public.is_member());
