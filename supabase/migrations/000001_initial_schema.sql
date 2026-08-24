-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUMs
CREATE TYPE user_role AS ENUM ('owner', 'trainer', 'member');
CREATE TYPE assessment_source AS ENUM ('manual', 'device_api', 'bluetooth', 'manufacturer_app', 'csv_import', 'future_device');
CREATE TYPE plan_source AS ENUM ('owner', 'trainer', 'member', 'ai');
CREATE TYPE member_plan_status AS ENUM ('pending', 'accepted', 'declined', 'expired', 'revoked');
CREATE TYPE attendance_method AS ENUM ('face', 'qr', 'manual', 'future_device');

-- 1. profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    full_name TEXT,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. trainers
CREATE TABLE trainers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT,
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    qualification TEXT,
    specialization TEXT,
    joining_date DATE,
    salary_basic NUMERIC,
    salary_allowances NUMERIC,
    salary_deductions NUMERIC,
    status TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_trainers_profile_id ON trainers(profile_id);

-- 3. members
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    member_code TEXT UNIQUE,
    name TEXT,
    phone TEXT,
    email TEXT,
    dob DATE,
    gender TEXT,
    photo_url TEXT,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    primary_goal TEXT,
    secondary_goal TEXT,
    fitness_level TEXT,
    diet_preference TEXT,
    training_experience TEXT,
    notes TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_members_profile_id ON members(profile_id);

-- 4. member_trainers
CREATE TABLE member_trainers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    unassigned_at TIMESTAMPTZ,
    notes TEXT
);
CREATE INDEX idx_member_trainers_member_id ON member_trainers(member_id);
CREATE INDEX idx_member_trainers_trainer_id ON member_trainers(trainer_id);

-- 5. membership_plans
CREATE TABLE membership_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    duration_days INTEGER,
    price NUMERIC,
    plan_type TEXT,
    description TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. memberships
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES membership_plans(id) ON DELETE RESTRICT,
    start_date DATE,
    end_date DATE,
    total_amount NUMERIC,
    paid_amount NUMERIC DEFAULT 0,
    pending_amount NUMERIC,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_memberships_member_id ON memberships(member_id);
CREATE INDEX idx_memberships_plan_id ON memberships(plan_id);

-- 7. payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    membership_id UUID REFERENCES memberships(id) ON DELETE CASCADE,
    amount NUMERIC,
    method TEXT,
    reference TEXT,
    notes TEXT,
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);
CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_payments_membership_id ON payments(membership_id);
CREATE INDEX idx_payments_created_by ON payments(created_by);

-- 8. assessments
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    source assessment_source,
    device_name TEXT,
    device_model TEXT,
    external_reading_id TEXT,
    height_cm NUMERIC,
    weight_kg NUMERIC,
    bmi NUMERIC,
    body_fat_pct NUMERIC,
    fat_mass_kg NUMERIC,
    muscle_mass_kg NUMERIC,
    skeletal_muscle_kg NUMERIC,
    body_water_pct NUMERIC,
    visceral_fat NUMERIC,
    bmr_kcal NUMERIC,
    bone_mass_kg NUMERIC,
    waist_cm NUMERIC,
    chest_cm NUMERIC,
    arm_cm NUMERIC,
    thigh_cm NUMERIC,
    neck_cm NUMERIC,
    progress_photo_url TEXT,
    notes TEXT,
    raw_data JSONB
);
CREATE INDEX idx_assessments_member_id ON assessments(member_id);
CREATE INDEX idx_assessments_recorded_by ON assessments(recorded_by);

-- 9. diet_plans
CREATE TABLE diet_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    source plan_source,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    goal TEXT,
    target_calories NUMERIC,
    protein_g NUMERIC,
    carbs_g NUMERIC,
    fat_g NUMERIC,
    duration_days INTEGER,
    instructions TEXT,
    content JSONB,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_diet_plans_created_by ON diet_plans(created_by);

-- 10. workout_plans
CREATE TABLE workout_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    source plan_source,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    goal TEXT,
    duration_days INTEGER,
    instructions TEXT,
    content JSONB,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_workout_plans_created_by ON workout_plans(created_by);

-- 11. member_diet_plans
CREATE TABLE member_diet_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    diet_plan_id UUID REFERENCES diet_plans(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_recommendation BOOLEAN DEFAULT false,
    status member_plan_status,
    added_to_routine_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_member_diet_plans_member_id ON member_diet_plans(member_id);
CREATE INDEX idx_member_diet_plans_diet_plan_id ON member_diet_plans(diet_plan_id);
CREATE INDEX idx_member_diet_plans_assigned_by ON member_diet_plans(assigned_by);

-- 12. member_workout_plans
CREATE TABLE member_workout_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    workout_plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_recommendation BOOLEAN DEFAULT false,
    status member_plan_status,
    added_to_routine_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_member_workout_plans_member_id ON member_workout_plans(member_id);
CREATE INDEX idx_member_workout_plans_workout_plan_id ON member_workout_plans(workout_plan_id);
CREATE INDEX idx_member_workout_plans_assigned_by ON member_workout_plans(assigned_by);

-- 13. exercises
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    category TEXT,
    instructions TEXT,
    media_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. group_activities
CREATE TABLE group_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    description TEXT,
    trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
    start_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    location TEXT,
    capacity INTEGER,
    recurrence_rule TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_group_activities_trainer_id ON group_activities(trainer_id);

-- 15. activity_bookings
CREATE TABLE activity_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES group_activities(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_activity_bookings_activity_id ON activity_bookings(activity_id);
CREATE INDEX idx_activity_bookings_member_id ON activity_bookings(member_id);

-- 16. attendance
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    method attendance_method,
    device_name TEXT,
    external_event_id TEXT,
    check_in BOOLEAN,
    notes TEXT
);
CREATE INDEX idx_attendance_member_id ON attendance(member_id);
CREATE INDEX idx_attendance_trainer_id ON attendance(trainer_id);

-- 17. products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    sku TEXT UNIQUE,
    category TEXT,
    supplier TEXT,
    purchase_price NUMERIC,
    selling_price NUMERIC,
    stock_quantity INTEGER,
    minimum_stock INTEGER,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. store_sales
CREATE TABLE store_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    total_amount NUMERIC,
    paid_amount NUMERIC,
    payment_method TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_store_sales_member_id ON store_sales(member_id);
CREATE INDEX idx_store_sales_created_by ON store_sales(created_by);

-- 19. store_sale_items
CREATE TABLE store_sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES store_sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER,
    unit_price NUMERIC,
    amount NUMERIC
);
CREATE INDEX idx_store_sale_items_sale_id ON store_sale_items(sale_id);
CREATE INDEX idx_store_sale_items_product_id ON store_sale_items(product_id);

-- 20. leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    phone TEXT,
    email TEXT,
    source TEXT,
    language TEXT,
    stage TEXT,
    follow_up_at TIMESTAMPTZ,
    assigned_trainer UUID REFERENCES trainers(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_leads_assigned_trainer ON leads(assigned_trainer);

-- 21. notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT,
    body TEXT,
    channel TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_recipient_profile_id ON notifications(recipient_profile_id);

-- 22. audit_logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT,
    entity_type TEXT,
    entity_id UUID,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_actor_profile_id ON audit_logs(actor_profile_id);
CREATE INDEX idx_audit_logs_member_id ON audit_logs(member_id);

-- 23. integration_sources
CREATE TABLE integration_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    category TEXT,
    provider TEXT,
    status TEXT,
    configuration JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to prevent updating role
CREATE OR REPLACE FUNCTION prevent_role_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        RAISE EXCEPTION 'Cannot update role';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_role_update
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION prevent_role_update();
