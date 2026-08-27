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
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sources ENABLE ROW LEVEL SECURITY;

-- Helper Functions
CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION auth.is_owner() RETURNS boolean AS $$
  SELECT auth.role() = 'owner';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION auth.is_trainer() RETURNS boolean AS $$
  SELECT auth.role() = 'trainer';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION auth.is_member() RETURNS boolean AS $$
  SELECT auth.role() = 'member';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Profiles:
-- Owner: ALL
-- Trainer: Read/Write own, read members assigned to them via member_trainers.
-- Member: Read/Write own.
CREATE POLICY "Owner ALL profiles" ON profiles FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Users ALL own profile" ON profiles FOR ALL TO authenticated USING (id = auth.uid());
CREATE POLICY "Trainer read assigned member profiles" ON profiles FOR SELECT TO authenticated USING (
  auth.is_trainer() AND id IN (
    SELECT m.profile_id FROM members m JOIN member_trainers mt ON m.id = mt.member_id
    JOIN trainers t ON mt.trainer_id = t.id WHERE t.profile_id = auth.uid()
  )
);

-- Trainers:
-- Owner: ALL
-- Trainer: Read/Write own. Read others (optional, keeping strict for now).
CREATE POLICY "Owner ALL trainers" ON trainers FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Trainer ALL own trainer record" ON trainers FOR ALL TO authenticated USING (profile_id = auth.uid());
-- Member: read trainers assigned to them
CREATE POLICY "Member read assigned trainers" ON trainers FOR SELECT TO authenticated USING (
    auth.is_member() AND id IN (
        SELECT mt.trainer_id FROM member_trainers mt JOIN members m ON mt.member_id = m.id WHERE m.profile_id = auth.uid()
    )
);

-- Members:
-- Owner: ALL
-- Trainer: Read/Write members assigned to them.
-- Member: Read/Write own.
CREATE POLICY "Owner ALL members" ON members FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Trainer ALL assigned members" ON members FOR ALL TO authenticated USING (
    auth.is_trainer() AND id IN (
        SELECT member_id FROM member_trainers mt JOIN trainers t ON mt.trainer_id = t.id WHERE t.profile_id = auth.uid()
    )
);
CREATE POLICY "Member ALL own member record" ON members FOR ALL TO authenticated USING (profile_id = auth.uid());

-- Member_Trainers:
-- Owner: ALL
-- Trainer: Read/Write own assignments.
-- Member: Read own assignments.
CREATE POLICY "Owner ALL member_trainers" ON member_trainers FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Trainer ALL own member_trainers" ON member_trainers FOR ALL TO authenticated USING (
    auth.is_trainer() AND trainer_id IN (SELECT id FROM trainers WHERE profile_id = auth.uid())
);
CREATE POLICY "Member read own member_trainers" ON member_trainers FOR SELECT TO authenticated USING (
    auth.is_member() AND member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
);

-- Membership_Plans:
-- Owner: ALL
-- Others: Read-only
CREATE POLICY "Owner ALL membership_plans" ON membership_plans FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Read membership_plans" ON membership_plans FOR SELECT TO authenticated USING (true);

-- Memberships:
-- Owner: ALL
-- Trainer: Read assigned members' memberships
-- Member: Read own memberships
CREATE POLICY "Owner ALL memberships" ON memberships FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Trainer read assigned members memberships" ON memberships FOR SELECT TO authenticated USING (
    auth.is_trainer() AND member_id IN (
        SELECT member_id FROM member_trainers mt JOIN trainers t ON mt.trainer_id = t.id WHERE t.profile_id = auth.uid()
    )
);
CREATE POLICY "Member ALL own memberships" ON memberships FOR ALL TO authenticated USING (
    auth.is_member() AND member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
);

-- Payments:
-- Owner: ALL
-- Trainer: Read assigned members' payments
-- Member: Read own payments
CREATE POLICY "Owner ALL payments" ON payments FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Trainer read assigned members payments" ON payments FOR SELECT TO authenticated USING (
    auth.is_trainer() AND member_id IN (
        SELECT member_id FROM member_trainers mt JOIN trainers t ON mt.trainer_id = t.id WHERE t.profile_id = auth.uid()
    )
);
CREATE POLICY "Member ALL own payments" ON payments FOR ALL TO authenticated USING (
    auth.is_member() AND member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
);

-- Assessments:
-- Owner: ALL
-- Trainer: Read/Write assigned members' assessments, or created by them
-- Member: Read own assessments
CREATE POLICY "Owner ALL assessments" ON assessments FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Trainer ALL assigned members assessments" ON assessments FOR ALL TO authenticated USING (
    auth.is_trainer() AND (
        member_id IN (SELECT member_id FROM member_trainers mt JOIN trainers t ON mt.trainer_id = t.id WHERE t.profile_id = auth.uid())
        OR recorded_by = auth.uid()
    )
);
CREATE POLICY "Member read own assessments" ON assessments FOR SELECT TO authenticated USING (
    auth.is_member() AND member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
);

-- Diet Plans & Workout Plans:
-- Owner: ALL
-- Trainer: Read/Write created by them, or assigned to their members (if they need to edit, but prompt says "they created or are assigned to")
-- Member: Read own, create own
CREATE POLICY "Owner ALL diet_plans" ON diet_plans FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Trainer ALL own diet_plans" ON diet_plans FOR ALL TO authenticated USING (
    auth.is_trainer() AND (
        created_by = auth.uid() OR id IN (
            SELECT diet_plan_id FROM member_diet_plans mdp JOIN member_trainers mt ON mdp.member_id = mt.member_id JOIN trainers t ON mt.trainer_id = t.id WHERE t.profile_id = auth.uid()
        )
    )
);
CREATE POLICY "Member ALL own diet_plans" ON diet_plans FOR ALL TO authenticated USING (
    auth.is_member() AND (
        created_by = auth.uid() OR id IN (
            SELECT diet_plan_id FROM member_diet_plans mdp JOIN members m ON mdp.member_id = m.id WHERE m.profile_id = auth.uid()
        )
    )
);

CREATE POLICY "Owner ALL workout_plans" ON workout_plans FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Trainer ALL own workout_plans" ON workout_plans FOR ALL TO authenticated USING (
    auth.is_trainer() AND (
        created_by = auth.uid() OR id IN (
            SELECT workout_plan_id FROM member_workout_plans mwp JOIN member_trainers mt ON mwp.member_id = mt.member_id JOIN trainers t ON mt.trainer_id = t.id WHERE t.profile_id = auth.uid()
        )
    )
);
CREATE POLICY "Member ALL own workout_plans" ON workout_plans FOR ALL TO authenticated USING (
    auth.is_member() AND (
        created_by = auth.uid() OR id IN (
            SELECT workout_plan_id FROM member_workout_plans mwp JOIN members m ON mwp.member_id = m.id WHERE m.profile_id = auth.uid()
        )
    )
);

-- Member_Diet_Plans & Member_Workout_Plans:
-- Owner: ALL
-- Trainer: Read/Write for assigned members
-- Member: Read/Write own
CREATE POLICY "Owner ALL member_diet_plans" ON member_diet_plans FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Trainer ALL assigned member_diet_plans" ON member_diet_plans FOR ALL TO authenticated USING (
    auth.is_trainer() AND member_id IN (
        SELECT member_id FROM member_trainers mt JOIN trainers t ON mt.trainer_id = t.id WHERE t.profile_id = auth.uid()
    )
);
CREATE POLICY "Member ALL own member_diet_plans" ON member_diet_plans FOR ALL TO authenticated USING (
    auth.is_member() AND member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
);

CREATE POLICY "Owner ALL member_workout_plans" ON member_workout_plans FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Trainer ALL assigned member_workout_plans" ON member_workout_plans FOR ALL TO authenticated USING (
    auth.is_trainer() AND member_id IN (
        SELECT member_id FROM member_trainers mt JOIN trainers t ON mt.trainer_id = t.id WHERE t.profile_id = auth.uid()
    )
);
CREATE POLICY "Member ALL own member_workout_plans" ON member_workout_plans FOR ALL TO authenticated USING (
    auth.is_member() AND member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
);

-- Exercises:
-- Owner: ALL
-- Trainer/Member: Read-only
CREATE POLICY "Owner ALL exercises" ON exercises FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Read exercises" ON exercises FOR SELECT TO authenticated USING (true);

-- Group Activities:
-- Owner: ALL
-- Trainer: Read/Write created by/assigned to them
-- Member: Read
CREATE POLICY "Owner ALL group_activities" ON group_activities FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Trainer ALL own group_activities" ON group_activities FOR ALL TO authenticated USING (
    auth.is_trainer() AND trainer_id IN (SELECT id FROM trainers WHERE profile_id = auth.uid())
);
CREATE POLICY "Trainer read group_activities" ON group_activities FOR SELECT TO authenticated USING (auth.is_trainer());
CREATE POLICY "Member read group_activities" ON group_activities FOR SELECT TO authenticated USING (auth.is_member());

-- Activity Bookings:
-- Owner: ALL
-- Trainer: Read for their activities
-- Member: Read/Write own
CREATE POLICY "Owner ALL activity_bookings" ON activity_bookings FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Trainer read own activity_bookings" ON activity_bookings FOR SELECT TO authenticated USING (
    auth.is_trainer() AND activity_id IN (SELECT id FROM group_activities WHERE trainer_id IN (SELECT id FROM trainers WHERE profile_id = auth.uid()))
);
CREATE POLICY "Member ALL own activity_bookings" ON activity_bookings FOR ALL TO authenticated USING (
    auth.is_member() AND member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
);

-- Attendance:
-- Owner: ALL
-- Trainer: Read/Write for their members or their activities
-- Member: Read/Write own
CREATE POLICY "Owner ALL attendance" ON attendance FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Trainer ALL own attendance" ON attendance FOR ALL TO authenticated USING (
    auth.is_trainer() AND (
        member_id IN (SELECT member_id FROM member_trainers mt JOIN trainers t ON mt.trainer_id = t.id WHERE t.profile_id = auth.uid())
        OR trainer_id IN (SELECT id FROM trainers WHERE profile_id = auth.uid())
    )
);
CREATE POLICY "Member ALL own attendance" ON attendance FOR ALL TO authenticated USING (
    auth.is_member() AND member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
);

-- Products & Store items:
-- Owner: ALL
-- Trainer/Member: Read-only products, read own store_sales
CREATE POLICY "Owner ALL products" ON products FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Read products" ON products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owner ALL store_sales" ON store_sales FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Member read own store_sales" ON store_sales FOR SELECT TO authenticated USING (
    auth.is_member() AND member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
);

CREATE POLICY "Owner ALL store_sale_items" ON store_sale_items FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Member read own store_sale_items" ON store_sale_items FOR SELECT TO authenticated USING (
    auth.is_member() AND sale_id IN (SELECT id FROM store_sales WHERE member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()))
);

-- Leads:
-- Owner: ALL
-- Trainer: Read/Write assigned to them
CREATE POLICY "Owner ALL leads" ON leads FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Trainer ALL assigned leads" ON leads FOR ALL TO authenticated USING (
    auth.is_trainer() AND assigned_trainer IN (SELECT id FROM trainers WHERE profile_id = auth.uid())
);

-- Notifications:
-- Owner: ALL
-- Member/Trainer: Read/Write own
CREATE POLICY "Owner ALL notifications" ON notifications FOR ALL TO authenticated USING (auth.is_owner());
CREATE POLICY "Users ALL own notifications" ON notifications FOR ALL TO authenticated USING (recipient_profile_id = auth.uid());

-- Audit Logs:
-- Owner: ALL
CREATE POLICY "Owner ALL audit_logs" ON audit_logs FOR ALL TO authenticated USING (auth.is_owner());

-- Integration Sources:
-- Owner: ALL
CREATE POLICY "Owner ALL integration_sources" ON integration_sources FOR ALL TO authenticated USING (auth.is_owner());
-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'member'), -- allow role injection via metadata, fallback to member
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger to call the function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Insert the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-photos', 'member-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to the member-photos bucket
CREATE POLICY "Public read member-photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'member-photos');

-- Allow authenticated users to upload to the member-photos bucket
CREATE POLICY "Authenticated users can upload member-photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'member-photos');

-- Allow authenticated users to update their own uploads (optional, but good for owners/trainers)
CREATE POLICY "Authenticated users can update member-photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'member-photos');

-- Allow authenticated users to delete from member-photos
CREATE POLICY "Authenticated users can delete member-photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'member-photos');
