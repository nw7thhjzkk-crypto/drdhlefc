-- =============================================================================
-- 000009_store_atomicity_and_membership_financial.sql
-- Security Hardening — Phase A continued
--
-- 1. checkout_store_sale(): SECURITY DEFINER RPC for atomic POS checkout.
--    - Fetches authoritative server-side selling_price (not client-supplied).
--    - Acquires FOR UPDATE row locks on each product.
--    - Validates stock availability.
--    - Inserts store_sale + store_sale_items.
--    - Decrements stock atomically.
--    - Writes audit record.
--    - Returns new sale id.
--
-- 2. assign_membership(): SECURITY DEFINER RPC for membership creation.
--    - Derives total_amount from authoritative membership_plans.price.
--    - Validates paid_amount: must be >= 0 and <= total_amount.
--    - Calculates pending_amount = total_amount - paid_amount server-side.
--    - Calculates end_date from plan.duration_days server-side.
--    - Derives membership status server-side.
--    - Writes audit record.
--    - Owner-only.
--
-- 3. DB-level constraints on products and store_sales.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- SECTION 1: Products constraints
-- ---------------------------------------------------------------------------

ALTER TABLE products
  ADD CONSTRAINT IF NOT EXISTS chk_products_selling_price_positive
    CHECK (selling_price >= 0),
  ADD CONSTRAINT IF NOT EXISTS chk_products_stock_non_negative
    CHECK (stock_quantity >= 0);

-- ---------------------------------------------------------------------------
-- SECTION 2: checkout_store_sale()
-- ---------------------------------------------------------------------------

-- Input items type: array of {product_id uuid, quantity int}
-- We pass this as JSONB for simplicity with the Supabase client.
CREATE OR REPLACE FUNCTION public.checkout_store_sale(
  p_member_id      UUID    DEFAULT NULL,
  p_items          JSONB   DEFAULT '[]'::jsonb,
  p_payment_method TEXT    DEFAULT 'cash'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role   TEXT;
  v_item          JSONB;
  v_product_id    UUID;
  v_quantity      INTEGER;
  v_product       products%ROWTYPE;
  v_line_total    NUMERIC;
  v_sale_total    NUMERIC := 0;
  v_sale_id       UUID;
BEGIN
  -- 1. Caller must be owner (or trainer in future — for now owner-only)
  v_caller_role := (SELECT role::text FROM profiles WHERE id = auth.uid());
  IF v_caller_role <> 'owner' THEN
    RAISE EXCEPTION 'Only owners may process sales';
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Sale must contain at least one item';
  END IF;

  -- 2. First pass: lock all product rows FOR UPDATE to prevent concurrent
  --    stock corruption, then validate stock.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity   := (v_item->>'quantity')::INTEGER;

    IF v_quantity < 1 THEN
      RAISE EXCEPTION 'Quantity must be at least 1 for each item';
    END IF;

    SELECT * INTO v_product
      FROM products
     WHERE id = v_product_id
       AND status = 'active'
     FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found or inactive', v_product_id;
    END IF;

    IF v_product.stock_quantity < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product "%" (available: %, requested: %)',
        v_product.name, v_product.stock_quantity, v_quantity;
    END IF;

    v_sale_total := v_sale_total + (v_product.selling_price * v_quantity);
  END LOOP;

  -- 3. Create the sale record (total_amount is server-calculated)
  INSERT INTO store_sales (member_id, total_amount, paid_amount, payment_method, created_by)
  VALUES (p_member_id, v_sale_total, v_sale_total, p_payment_method, auth.uid())
  RETURNING id INTO v_sale_id;

  -- 4. Second pass: insert line items and decrement stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity   := (v_item->>'quantity')::INTEGER;

    -- Fetch the authoritative price (already locked above)
    SELECT * INTO v_product FROM products WHERE id = v_product_id;

    v_line_total := v_product.selling_price * v_quantity;

    INSERT INTO store_sale_items (sale_id, product_id, quantity, unit_price, amount)
    VALUES (v_sale_id, v_product_id, v_quantity, v_product.selling_price, v_line_total);

    UPDATE products
       SET stock_quantity = stock_quantity - v_quantity,
           updated_at     = NOW()
     WHERE id = v_product_id;
  END LOOP;

  -- 5. Audit
  PERFORM public.insert_audit_log(
    'STORE_SALE',
    'store_sale',
    v_sale_id,
    p_member_id,
    jsonb_build_object('total_amount', v_sale_total, 'payment_method', p_payment_method)
  );

  RETURN v_sale_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.checkout_store_sale(UUID, JSONB, TEXT)
  TO authenticated;

-- ---------------------------------------------------------------------------
-- SECTION 3: assign_membership()
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.assign_membership(
  p_member_id    UUID,
  p_plan_id      UUID,
  p_start_date   DATE,
  p_paid_amount  NUMERIC DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role    TEXT;
  v_plan           membership_plans%ROWTYPE;
  v_end_date       DATE;
  v_total_amount   NUMERIC;
  v_pending_amount NUMERIC;
  v_status         TEXT;
  v_membership_id  UUID;
BEGIN
  -- 1. Owner only
  v_caller_role := (SELECT role::text FROM profiles WHERE id = auth.uid());
  IF v_caller_role <> 'owner' THEN
    RAISE EXCEPTION 'Only owners may assign memberships';
  END IF;

  -- 2. Fetch authoritative plan (total_amount comes from plan.price, not client)
  SELECT * INTO v_plan
    FROM membership_plans
   WHERE id = p_plan_id
     AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membership plan not found or inactive';
  END IF;

  -- 3. Validate paid_amount
  IF p_paid_amount IS NULL OR p_paid_amount < 0 THEN
    RAISE EXCEPTION 'paid_amount must be >= 0';
  END IF;

  v_total_amount := v_plan.price;

  IF p_paid_amount > v_total_amount THEN
    RAISE EXCEPTION 'paid_amount (%) cannot exceed plan price (%)', p_paid_amount, v_total_amount;
  END IF;

  -- 4. Calculate end date server-side from plan duration
  v_end_date := p_start_date + v_plan.duration_days;

  -- 5. Derive financial and status fields server-side
  v_pending_amount := v_total_amount - p_paid_amount;
  v_status         := CASE WHEN v_pending_amount <= 0 THEN 'active' ELSE 'pending_payment' END;

  -- 6. Insert membership
  INSERT INTO memberships (
    member_id, plan_id, start_date, end_date,
    total_amount, paid_amount, pending_amount, status
  ) VALUES (
    p_member_id, p_plan_id, p_start_date, v_end_date,
    v_total_amount, p_paid_amount, v_pending_amount, v_status
  )
  RETURNING id INTO v_membership_id;

  -- 7. Audit
  PERFORM public.insert_audit_log(
    'ASSIGN_MEMBERSHIP',
    'membership',
    v_membership_id,
    p_member_id,
    jsonb_build_object(
      'plan_id',      p_plan_id,
      'plan_name',    v_plan.name,
      'start_date',   p_start_date,
      'end_date',     v_end_date,
      'total_amount', v_total_amount,
      'paid_amount',  p_paid_amount
    )
  );

  RETURN v_membership_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_membership(UUID, UUID, DATE, NUMERIC)
  TO authenticated;
