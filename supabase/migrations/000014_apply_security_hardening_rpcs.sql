-- 000014_apply_security_hardening_rpcs.sql
-- live never applied sequential 000008; this forward migration is the apply path.
-- Role helpers live in public (is_owner/is_trainer/is_member), not auth.*

-- 1a. members table: member can only READ their own row (owner/trainer manage it)
DROP POLICY IF EXISTS "Member ALL own member record" ON members;
CREATE POLICY "Member SELECT own member record"
  ON members FOR SELECT TO authenticated
  USING (public.is_member() AND profile_id = auth.uid());

-- 1b. memberships: member can only READ their own memberships
DROP POLICY IF EXISTS "Member ALL own memberships" ON memberships;
CREATE POLICY "Member SELECT own memberships"
  ON memberships FOR SELECT TO authenticated
  USING (
    public.is_member() AND member_id IN (
      SELECT id FROM members WHERE profile_id = auth.uid()
    )
  );

-- 1c. payments: member can only READ their own payments
DROP POLICY IF EXISTS "Member ALL own payments" ON payments;
CREATE POLICY "Member SELECT own payments"
  ON payments FOR SELECT TO authenticated
  USING (
    public.is_member() AND member_id IN (
      SELECT id FROM members WHERE profile_id = auth.uid()
    )
  );

-- 1d. attendance: member can only READ their own attendance
DROP POLICY IF EXISTS "Member ALL own attendance" ON attendance;
CREATE POLICY "Member SELECT own attendance"
  ON attendance FOR SELECT TO authenticated
  USING (
    public.is_member() AND member_id IN (
      SELECT id FROM members WHERE profile_id = auth.uid()
    )
  );

-- 2a. trainers: trainer may only READ their own row (owner manages salary etc.)
DROP POLICY IF EXISTS "Trainer ALL own trainer record" ON trainers;
CREATE POLICY "Trainer SELECT own trainer record"
  ON trainers FOR SELECT TO authenticated
  USING (public.is_trainer() AND profile_id = auth.uid());

-- 2b. member_trainers: trainer may only READ assignments (owner manages these)
DROP POLICY IF EXISTS "Trainer ALL own member_trainers" ON member_trainers;
CREATE POLICY "Trainer SELECT own member_trainers"
  ON member_trainers FOR SELECT TO authenticated
  USING (
    public.is_trainer() AND trainer_id IN (
      SELECT id FROM trainers WHERE profile_id = auth.uid()
    )
  );

-- 3a. Drop overly-permissive / prior SELECT policies for owners
DROP POLICY IF EXISTS "Owner SELECT audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Owner ALL audit_logs" ON audit_logs;

-- 3b. Owner can only SELECT audit records (cannot update or delete)
CREATE POLICY "Owner SELECT audit_logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (public.is_owner());

-- 3c. SECURITY DEFINER function: the only way to write an audit record.
CREATE OR REPLACE FUNCTION public.insert_audit_log(
  p_action        TEXT,
  p_entity_type   TEXT,
  p_entity_id     UUID    DEFAULT NULL,
  p_member_id     UUID    DEFAULT NULL,
  p_details       JSONB   DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO audit_logs (
    actor_profile_id,
    action,
    entity_type,
    entity_id,
    member_id,
    details
  ) VALUES (
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_member_id,
    p_details
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_audit_log(TEXT, TEXT, UUID, UUID, JSONB)
  TO authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS uix_activity_bookings_active
  ON activity_bookings (activity_id, member_id)
  WHERE status = 'booked';

DROP POLICY IF EXISTS "Member ALL own activity_bookings" ON activity_bookings;
CREATE POLICY "Member SELECT own activity_bookings"
  ON activity_bookings FOR SELECT TO authenticated
  USING (
    public.is_member() AND member_id IN (
      SELECT id FROM members WHERE profile_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.book_activity_for_member(
  p_activity_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id     UUID;
  v_activity      group_activities%ROWTYPE;
  v_booked_count  INTEGER;
  v_booking_id    UUID;
BEGIN
  SELECT id INTO v_member_id
    FROM members
   WHERE profile_id = auth.uid()
   LIMIT 1;

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'No member record found for the current user';
  END IF;

  SELECT * INTO v_activity
    FROM group_activities
   WHERE id = p_activity_id
     AND (deleted_at IS NULL OR deleted_at > NOW())
     AND status = 'active'
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity not found or not available';
  END IF;

  IF EXISTS (
    SELECT 1 FROM activity_bookings
     WHERE activity_id = p_activity_id
       AND member_id   = v_member_id
       AND status      = 'booked'
  ) THEN
    RAISE EXCEPTION 'You already have an active booking for this activity';
  END IF;

  SELECT COUNT(*) INTO v_booked_count
    FROM activity_bookings
   WHERE activity_id = p_activity_id
     AND status      = 'booked';

  IF v_activity.capacity IS NOT NULL AND v_booked_count >= v_activity.capacity THEN
    RAISE EXCEPTION 'Activity is fully booked (capacity: %)', v_activity.capacity;
  END IF;

  INSERT INTO activity_bookings (activity_id, member_id, status)
  VALUES (p_activity_id, v_member_id, 'booked')
  RETURNING id INTO v_booking_id;

  PERFORM public.insert_audit_log(
    'BOOK_ACTIVITY',
    'activity_booking',
    v_booking_id,
    v_member_id,
    jsonb_build_object('activity_id', p_activity_id)
  );

  RETURN v_booking_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_activity_for_member(UUID)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_activity_booking(
  p_booking_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking       activity_bookings%ROWTYPE;
  v_member_id     UUID;
  v_caller_role   TEXT;
BEGIN
  SELECT * INTO v_booking
    FROM activity_bookings
   WHERE id = p_booking_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking.status <> 'booked' THEN
    RAISE EXCEPTION 'Booking is not in an active state (status: %)', v_booking.status;
  END IF;

  v_caller_role := (SELECT role::text FROM profiles WHERE id = auth.uid());

  IF v_caller_role = 'member' THEN
    SELECT id INTO v_member_id
      FROM members WHERE profile_id = auth.uid() LIMIT 1;
    IF v_booking.member_id <> v_member_id THEN
      RAISE EXCEPTION 'Not authorised to cancel this booking';
    END IF;
  ELSIF v_caller_role <> 'owner' THEN
    RAISE EXCEPTION 'Not authorised to cancel bookings';
  END IF;

  UPDATE activity_bookings SET status = 'cancelled' WHERE id = p_booking_id;

  PERFORM public.insert_audit_log(
    'CANCEL_BOOKING',
    'activity_booking',
    p_booking_id,
    v_booking.member_id,
    jsonb_build_object('activity_id', v_booking.activity_id)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_activity_booking(UUID)
  TO authenticated;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_memberships_total_amount_positive') THEN
        ALTER TABLE memberships ADD CONSTRAINT chk_memberships_total_amount_positive CHECK (total_amount >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_memberships_paid_amount_positive') THEN
        ALTER TABLE memberships ADD CONSTRAINT chk_memberships_paid_amount_positive CHECK (paid_amount >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_memberships_pending_amount_positive') THEN
        ALTER TABLE memberships ADD CONSTRAINT chk_memberships_pending_amount_positive CHECK (pending_amount >= 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_payments_amount_positive') THEN
        ALTER TABLE payments ADD CONSTRAINT chk_payments_amount_positive CHECK (amount > 0);
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.record_payment_atomic(
  p_membership_id UUID,
  p_amount        NUMERIC,
  p_method        TEXT    DEFAULT NULL,
  p_reference     TEXT    DEFAULT NULL,
  p_notes         TEXT    DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership    memberships%ROWTYPE;
  v_new_paid      NUMERIC;
  v_new_pending   NUMERIC;
  v_new_status    TEXT;
  v_payment_id    UUID;
  v_caller_role   TEXT;
BEGIN
  v_caller_role := (SELECT role::text FROM profiles WHERE id = auth.uid());
  IF v_caller_role <> 'owner' THEN
    RAISE EXCEPTION 'Only owners may record payments';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  SELECT * INTO v_membership
    FROM memberships
   WHERE id = p_membership_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membership not found';
  END IF;

  v_new_paid := COALESCE(v_membership.paid_amount, 0) + p_amount;
  IF v_new_paid > v_membership.total_amount THEN
    RAISE EXCEPTION
      'Payment of % would exceed total amount % (already paid: %)',
      p_amount, v_membership.total_amount, v_membership.paid_amount;
  END IF;

  v_new_pending := v_membership.total_amount - v_new_paid;
  v_new_status  := CASE WHEN v_new_pending <= 0 THEN 'active' ELSE 'pending_payment' END;

  INSERT INTO payments (
    member_id, membership_id, amount, method, reference, notes, created_by
  ) VALUES (
    v_membership.member_id,
    p_membership_id,
    p_amount,
    p_method,
    p_reference,
    p_notes,
    auth.uid()
  )
  RETURNING id INTO v_payment_id;

  UPDATE memberships
     SET paid_amount    = v_new_paid,
         pending_amount = v_new_pending,
         status         = v_new_status
   WHERE id = p_membership_id;

  PERFORM public.insert_audit_log(
    'RECORD_PAYMENT',
    'payment',
    v_payment_id,
    v_membership.member_id,
    jsonb_build_object(
      'membership_id', p_membership_id,
      'amount',        p_amount,
      'method',        p_method
    )
  );

  RETURN v_payment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_payment_atomic(UUID, NUMERIC, TEXT, TEXT, TEXT)
  TO authenticated;
