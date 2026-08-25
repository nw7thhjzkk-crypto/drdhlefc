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
