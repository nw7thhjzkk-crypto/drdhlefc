-- Drop overly permissive FOR ALL policies
DROP POLICY IF EXISTS "Trainer ALL own diet_plans" ON diet_plans;
DROP POLICY IF EXISTS "Member ALL own diet_plans" ON diet_plans;
DROP POLICY IF EXISTS "Trainer ALL own workout_plans" ON workout_plans;
DROP POLICY IF EXISTS "Member ALL own workout_plans" ON workout_plans;

-- ==========================================
-- DIET PLANS RLS
-- ==========================================

-- Trainer: Can ALL on plans they authored
CREATE POLICY "Trainer ALL authored diet_plans" ON diet_plans
FOR ALL TO authenticated
USING (auth.is_trainer() AND created_by = auth.uid());

-- Trainer: Can SELECT plans assigned to their members
CREATE POLICY "Trainer SELECT assigned member diet_plans" ON diet_plans
FOR SELECT TO authenticated
USING (
    auth.is_trainer() AND id IN (
        SELECT diet_plan_id FROM member_diet_plans mdp
        JOIN member_trainers mt ON mdp.member_id = mt.member_id
        JOIN trainers t ON mt.trainer_id = t.id
        WHERE t.profile_id = auth.uid()
    )
);

-- Member: Can ALL on plans they authored (personal/AI plans saved)
CREATE POLICY "Member ALL authored diet_plans" ON diet_plans
FOR ALL TO authenticated
USING (auth.is_member() AND created_by = auth.uid());

-- Member: Can SELECT plans assigned/recommended to them
CREATE POLICY "Member SELECT assigned diet_plans" ON diet_plans
FOR SELECT TO authenticated
USING (
    auth.is_member() AND id IN (
        SELECT diet_plan_id FROM member_diet_plans mdp
        JOIN members m ON mdp.member_id = m.id
        WHERE m.profile_id = auth.uid()
    )
);

-- ==========================================
-- WORKOUT PLANS RLS
-- ==========================================

-- Trainer: Can ALL on plans they authored
CREATE POLICY "Trainer ALL authored workout_plans" ON workout_plans
FOR ALL TO authenticated
USING (auth.is_trainer() AND created_by = auth.uid());

-- Trainer: Can SELECT plans assigned to their members
CREATE POLICY "Trainer SELECT assigned member workout_plans" ON workout_plans
FOR SELECT TO authenticated
USING (
    auth.is_trainer() AND id IN (
        SELECT workout_plan_id FROM member_workout_plans mwp
        JOIN member_trainers mt ON mwp.member_id = mt.member_id
        JOIN trainers t ON mt.trainer_id = t.id
        WHERE t.profile_id = auth.uid()
    )
);

-- Member: Can ALL on plans they authored (personal/AI plans saved)
CREATE POLICY "Member ALL authored workout_plans" ON workout_plans
FOR ALL TO authenticated
USING (auth.is_member() AND created_by = auth.uid());

-- Member: Can SELECT plans assigned/recommended to them
CREATE POLICY "Member SELECT assigned workout_plans" ON workout_plans
FOR SELECT TO authenticated
USING (
    auth.is_member() AND id IN (
        SELECT workout_plan_id FROM member_workout_plans mwp
        JOIN members m ON mwp.member_id = m.id
        WHERE m.profile_id = auth.uid()
    )
);
