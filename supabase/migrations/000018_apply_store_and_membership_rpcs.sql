-- =============================================================================
-- 000018_apply_store_and_membership_rpcs.sql
-- Forward SoT for live-missing 000009 RPCs: checkout_store_sale + assign_membership.
-- Uses public.is_owner() (live helper) instead of raw profiles.role checks.
-- Idempotent CREATE OR REPLACE; revoke anon EXECUTE.
-- =============================================================================

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
  v_item          JSONB;
  v_product_id    UUID;
  v_quantity      INTEGER;
  v_product       products%ROWTYPE;
  v_line_total    NUMERIC;
  v_sale_total    NUMERIC := 0;
  v_sale_id       UUID;
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Only owners may process sales';
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Sale must contain at least one item';
  END IF;

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

  INSERT INTO store_sales (member_id, total_amount, paid_amount, payment_method, created_by)
  VALUES (p_member_id, v_sale_total, v_sale_total, p_payment_method, auth.uid())
  RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity   := (v_item->>'quantity')::INTEGER;

    SELECT * INTO v_product FROM products WHERE id = v_product_id;

    v_line_total := v_product.selling_price * v_quantity;

    INSERT INTO store_sale_items (sale_id, product_id, quantity, unit_price, amount)
    VALUES (v_sale_id, v_product_id, v_quantity, v_product.selling_price, v_line_total);

    UPDATE products
       SET stock_quantity = stock_quantity - v_quantity,
           updated_at     = NOW()
     WHERE id = v_product_id;
  END LOOP;

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
  v_plan           membership_plans%ROWTYPE;
  v_end_date       DATE;
  v_total_amount   NUMERIC;
  v_pending_amount NUMERIC;
  v_status         TEXT;
  v_membership_id  UUID;
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Only owners may assign memberships';
  END IF;

  SELECT * INTO v_plan
    FROM membership_plans
   WHERE id = p_plan_id
     AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membership plan not found or inactive';
  END IF;

  IF p_paid_amount IS NULL OR p_paid_amount < 0 THEN
    RAISE EXCEPTION 'paid_amount must be >= 0';
  END IF;

  v_total_amount := v_plan.price;

  IF p_paid_amount > v_total_amount THEN
    RAISE EXCEPTION 'paid_amount (%) cannot exceed plan price (%)', p_paid_amount, v_total_amount;
  END IF;

  v_end_date := p_start_date + v_plan.duration_days;
  v_pending_amount := v_total_amount - p_paid_amount;
  v_status := CASE WHEN v_pending_amount <= 0 THEN 'active' ELSE 'pending_payment' END;

  INSERT INTO memberships (
    member_id, plan_id, start_date, end_date,
    total_amount, paid_amount, pending_amount, status
  ) VALUES (
    p_member_id, p_plan_id, p_start_date, v_end_date,
    v_total_amount, p_paid_amount, v_pending_amount, v_status
  )
  RETURNING id INTO v_membership_id;

  PERFORM public.insert_audit_log(
    'ASSIGN_MEMBERSHIP',
    'membership',
    v_membership_id,
    p_member_id,
    jsonb_build_object(
      'plan_id', p_plan_id,
      'plan_name', v_plan.name,
      'start_date', p_start_date,
      'end_date', v_end_date,
      'total_amount', v_total_amount,
      'paid_amount', p_paid_amount
    )
  );

  RETURN v_membership_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.checkout_store_sale(UUID, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_membership(UUID, UUID, DATE, NUMERIC) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.checkout_store_sale(UUID, JSONB, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.assign_membership(UUID, UUID, DATE, NUMERIC) FROM PUBLIC, anon;
