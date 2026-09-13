-- Migration 000024: Add timezone and business hours to gym_settings

ALTER TABLE public.gym_settings
    ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Asia/Kolkata' NOT NULL,
    ADD COLUMN IF NOT EXISTS phone text,
    ADD COLUMN IF NOT EXISTS business_hours jsonb DEFAULT '{
        "monday": {"open": "06:00", "close": "22:00", "closed": false},
        "tuesday": {"open": "06:00", "close": "22:00", "closed": false},
        "wednesday": {"open": "06:00", "close": "22:00", "closed": false},
        "thursday": {"open": "06:00", "close": "22:00", "closed": false},
        "friday": {"open": "06:00", "close": "22:00", "closed": false},
        "saturday": {"open": "06:00", "close": "20:00", "closed": false},
        "sunday": {"open": "08:00", "close": "14:00", "closed": false}
    }'::jsonb NOT NULL;
