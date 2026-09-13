-- Atomic restock RPC: reads current stock with FOR UPDATE, adds delta, writes back.
-- Fixes race condition in restockProduct server action (was read-modify-write without lock).

CREATE OR REPLACE FUNCTION public.restock_product(
  p_product_id   uuid,
  p_quantity_delta integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_stock integer;
  v_new_stock integer;
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  IF p_quantity_delta < 1 THEN
    RAISE EXCEPTION 'quantity_delta must be positive' USING ERRCODE = '22023';
  END IF;

  SELECT stock_quantity INTO v_current_stock
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product_not_found' USING ERRCODE = '42P01';
  END IF;

  v_new_stock := coalesce(v_current_stock, 0) + p_quantity_delta;

  UPDATE public.products
  SET stock_quantity = v_new_stock,
      updated_at = now()
  WHERE id = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restock_product(uuid, integer) TO authenticated;

COMMENT ON FUNCTION public.restock_product(uuid, integer) IS
  'Atomic restock: FOR UPDATE lock prevents race conditions on concurrent restocks (migration 000022)';
