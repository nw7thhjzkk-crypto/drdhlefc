-- =============================================================================
-- 000008_security_hardening.sql
-- Security Hardening Milestone 1
--
-- Changes in this migration (forward-only, no rollback):
--
-- 1. MEMBER RLS: tighten memberships, payments, attendance, members to
--    SELECT-only for the member role.
--
-- 2. TRAINER RLS: tighten trainers (own row) and member_trainers to
--    SELECT-only for the trainer role. Salary/compensation is owner-only.
--
-- 3. AUDIT LOGS: make genuinely append-only.
--    - Drop the "Owner ALL audit_logs" FOR ALL policy.
--    - Add a SELECT-only policy for owners.
--    - Create a SECURITY DEFINER function insert_audit_log() that always
--      sets actor_profile_id = auth.uid() — callers cannot spoof identity.
--    - No INSERT/UPDATE/DELETE policy remains for any role; direct inserts
--      are impossible for authenticated clients.
--
-- 4. ACTIVITY BOOKINGS: transactional capacity enforcement.
--    - Add a partial UNIQUE index to prevent duplicate active bookings.
--    - Create SECURITY DEFINER RPC book_activity_for_member(activity_id)
--      that: derives member_id from auth.uid(), locks the activity row
--      FOR UPDATE, checks capacity against current booked count, checks
--      for an existing active booking, inserts the booking record, and
--      writes an audit entry.
--    - Create SECURITY DEFINER RPC cancel_activity_booking(booking_id)
--      for safe cancellation.
--    - Drop the "Member ALL own activity_bookings" policy; replace with
--      SELECT-only (all writes go through the RPCs).
--
-- 5. PAYMENTS: atomic, concurrency-safe, overpayment-protected.
--    - Create SECURITY DEFINER RPC record_payment_atomic(...) that:
--      validates amount > 0, locks the membership row FOR UPDATE, checks
--      for overpayment, inserts the payment, updates membership totals, and
--      writes an audit entry — all in one transaction.
--    - Tighten member payment policy to SELECT only (already handled above).
--
-- 6. DB-LEVEL CONSTRAINTS on memberships and payments.
--    - Add CHECK constraints so negative / impossible values are rejected
--      even on direct owner writes.
--
-- All changes are additive or replace named objects; the schema itself is
-- backward-compatible.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SECTION 1: MEMBER RLS — tighten to SELECT-only
-- -----------------------------------------------------------------------------

-- 1a. members table: member can only READ their own row (owner/trainer manage it)
DROP POLICY IF EXISTS "Member ALL own member record" ON members;
CREATE POLICY "Member SELECT own member record"
  ON members FOR SELECT TO authenticated
  USING (auth.is_member() AND profile_id = auth.uid());

-- 1b. memberships: member can only READ their own memberships
DROP POLICY IF EXISTS "Member ALL own memberships" ON memberships;
CREATE POLICY "Member SELECT own memberships"
  ON memberships FOR SELECT TO authenticated
  USING (
    auth.is_member() AND member_id IN (
      SELECT id FROM members WHERE profile_id = auth.uid()
    )
  );

-- 1c. payments: member can only READ their own payments
DROP POLICY IF EXISTS "Member ALL own payments" ON payments;
CREATE POLICY "Member SELECT own payments"
  ON payments FOR SELECT TO authenticated
  USING (
    auth.is_member() AND member_id IN (
      SELECT id FROM members WHERE profile_id = auth.uid()
    )
  );

-- 1d. attendance: member can only READ their own attendance
DROP POLICY IF EXISTS "Member ALL own attendance" ON attendance;
CREATE POLICY "Member SELECT own attendance"
  ON attendance FOR SELECT TO authenticated
  USING (
    auth.is_member() AND member_id IN (
      SELECT id FROM members WHERE profile_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- SECTION 2: TRAINER RLS — tighten trainers and member_trainers
-- -----------------------------------------------------------------------------

-- 2a. trainers: trainer may only READ their own row (owner manages salary etc.)
DROP POLICY IF EXISTS "Trainer ALL own trainer record" ON trainers;
CREATE POLICY "Trainer SELECT own trainer record"
  ON trainers FOR SELECT TO authenticated
  USING (auth.is_trainer() AND profile_id = auth.uid());

-- 2b. member_trainers: trainer may only READ assignments (owner manages these)
DROP POLICY IF EXISTS "Trainer ALL own member_trainers" ON member_trainers;
CREATE POLICY "Trainer SELECT own member_trainers"
  ON member_trainers FOR SELECT TO authenticated
  USING (
    auth.is_trainer() AND trainer_id IN (
      SELECT id FROM trainers WHERE profile_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- SECTION 3: AUDIT LOGS — append-only, identity enforced at DB level
-- -----------------------------------------------------------------------------

-- 3a. Drop the overly-permissive FOR ALL policy for owners
DROP POLICY IF EXISTS "Owner ALL audit_logs" ON audit_logs;

-- 3b. Owner can only SELECT audit records (cannot update or delete)
CREATE POLICY "Owner SELECT audit_logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (auth.is_owner());

-- 3c. SECURITY DEFINER function: the only way to write an audit record.
--     Callers supply action / entity details; actor_profile_id is ALWAYS
--     set to auth.uid() inside this function — it cannot be spoofed.
--     Returns the new audit log id.
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
    auth.uid(),       -- always the authenticated caller; callers cannot override
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

-- Grant execute to authenticated users (INSERT into the table itself is NOT
-- granted — only this function path can write audit records).
GRANT EXECUTE ON FUNCTION public.insert_audit_log(TEXT, TEXT, UUID, UUID, JSONB)
  TO authenticated;

-- Revoke direct INSERT/UPDATE/DELETE on audit_logs from the authenticated
-- role so that no policy path allows bypassing insert_audit_log().
-- (RLS USING checks still gate SELECT, but there are now no INSERT/UPDATE/
-- DELETE policies, so those operations are denied regardless.)
-- NOTE: We do NOT need an explicit REVOKE here because no INSERT/UPDATE/DELETE
-- policy exists for the authenticated role — denied by default under RLS.
-- The SECURITY DEFINER function runs as its owner (postgres/service role),
-- which bypasses RLS entirely when writing the row.

-- -----------------------------------------------------------------------------
-- SECTION 4: ACTIVITY BOOKINGS — transactional capacity enforcement
-- -----------------------------------------------------------------------------

-- 4a. Partial unique index: one active booking per member per activity
--     Allows the same member to rebook after cancellation.
CREATE UNIQUE INDEX IF NOT EXISTS uix_activity_bookings_active
  ON activity_bookings (activity_id, member_id)
  WHERE status = 'booked';

-- 4b. Drop the "Member ALL" policy; members can only read bookings directly.
--     Writes go exclusively through the SECURITY DEFINER RPCs below.
DROP POLICY IF EXISTS "Member ALL own activity_bookings" ON activity_bookings;
CREATE POLICY "Member SELECT own activity_bookings"
  ON activity_bookings FOR SELECT TO authenticated
  USING (
    auth.is_member() AND member_id IN (
      SELECT id FROM members WHERE profile_id = auth.uid()
    )
  );

-- 4c. SECURITY DEFINER RPC: book_activity_for_member
--     - Derives member_id from auth.uid() — never trusts caller-supplied value.
--     - Acquires a FOR UPDATE lock on the activity row (serialises concurrent
--       bookings for the same activity).
--     - Checks remaining capacity.
--     - Checks for an existing active booking (belt-and-suspenders alongside
--       the partial unique index).
--     - Inserts the booking.
--     - Writes an audit record via insert_audit_log().
--     Returns the new booking id.
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
  -- 1. Resolve member_id from the authenticated user's profile
  SELECT id INTO v_member_id
    FROM members
   WHERE profile_id = auth.uid()
   LIMIT 1;

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'No member record found for the current user';
  END IF;

  -- 2. Lock the activity row to serialise concurrent booking attempts
  SELECT * INTO v_activity
    FROM group_activities
   WHERE id = p_activity_id
     AND (deleted_at IS NULL OR deleted_at > NOW())
     AND status = 'active'
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity not found or not available';
  END IF;

  -- 3. Check for an existing active booking for this member
  IF EXISTS (
    SELECT 1 FROM activity_bookings
     WHERE activity_id = p_activity_id
       AND member_id   = v_member_id
       AND status      = 'booked'
  ) THEN
    RAISE EXCEPTION 'You already have an active booking for this activity';
  END IF;

  -- 4. Count current active bookings and check capacity
  SELECT COUNT(*) INTO v_booked_count
    FROM activity_bookings
   WHERE activity_id = p_activity_id
     AND status      = 'booked';

  IF v_activity.capacity IS NOT NULL AND v_booked_count >= v_activity.capacity THEN
    RAISE EXCEPTION 'Activity is fully booked (capacity: %)', v_activity.capacity;
  END IF;

  -- 5. Insert the booking
  INSERT INTO activity_bookings (activity_id, member_id, status)
  VALUES (p_activity_id, v_member_id, 'booked')
  RETURNING id INTO v_booking_id;

  -- 6. Write audit record (actor_profile_id is set to auth.uid() inside the function)
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

-- 4d. SECURITY DEFINER RPC: cancel_activity_booking
--     A member may cancel only their own booking.
--     Owner may cancel any booking (checked inside the function).
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
  -- 1. Fetch the booking row (lock it)
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

  -- 2. Authorisation: the caller must be the booking owner or an owner
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

  -- 3. Cancel
  UPDATE activity_bookings SET status = 'cancelled' WHERE id = p_booking_id;

  -- 4. Audit
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

-- -----------------------------------------------------------------------------
-- SECTION 5: PAYMENTS — atomic, concurrency-safe, overpayment-protected
-- -----------------------------------------------------------------------------

-- 5a. DB-level constraints on memberships (add only if not already present)
ALTER TABLE memberships
  ADD CONSTRAINT IF NOT EXISTS chk_memberships_total_amount_positive
    CHECK (total_amount >= 0),
  ADD CONSTRAINT IF NOT EXISTS chk_memberships_paid_amount_positive
    CHECK (paid_amount >= 0),
  ADD CONSTRAINT IF NOT EXISTS chk_memberships_pending_amount_positive
    CHECK (pending_amount >= 0);

-- 5b. DB-level constraint on payments
ALTER TABLE payments
  ADD CONSTRAINT IF NOT EXISTS chk_payments_amount_positive
    CHECK (amount > 0);

-- 5c. SECURITY DEFINER RPC: record_payment_atomic
--     - Requires auth.uid() to be an owner (checked inside function).
--     - Validates p_amount > 0.
--     - Locks the membership row FOR UPDATE (serialises concurrent payments).
--     - Prevents overpayment: paid_amount + p_amount must not exceed total_amount.
--     - Inserts payment with created_by = auth.uid().
--     - Atomically updates membership paid_amount, pending_amount, status.
--     - Writes audit record via insert_audit_log().
--     Returns the new payment id.
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
  -- 1. Caller must be owner
  v_caller_role := (SELECT role::text FROM profiles WHERE id = auth.uid());
  IF v_caller_role <> 'owner' THEN
    RAISE EXCEPTION 'Only owners may record payments';
  END IF;

  -- 2. Validate amount
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  -- 3. Lock the membership row
  SELECT * INTO v_membership
    FROM memberships
   WHERE id = p_membership_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membership not found';
  END IF;

  -- 4. Overpayment guard
  v_new_paid := COALESCE(v_membership.paid_amount, 0) + p_amount;
  IF v_new_paid > v_membership.total_amount THEN
    RAISE EXCEPTION
      'Payment of % would exceed total amount % (already paid: %)',
      p_amount, v_membership.total_amount, v_membership.paid_amount;
  END IF;

  v_new_pending := v_membership.total_amount - v_new_paid;
  v_new_status  := CASE WHEN v_new_pending <= 0 THEN 'active' ELSE 'pending_payment' END;

  -- 5. Insert the payment record
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

  -- 6. Update membership totals atomically
  UPDATE memberships
     SET paid_amount    = v_new_paid,
         pending_amount = v_new_pending,
         status         = v_new_status
   WHERE id = p_membership_id;

  -- 7. Audit
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
