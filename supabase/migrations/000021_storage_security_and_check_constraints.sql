-- Security hardening: private member-photos bucket, storage policy fixes,
-- and CHECK constraints for financial/data integrity columns.

-- 1. Make member-photos bucket private (was public: true — violates AGENTS.md)
UPDATE storage.buckets
SET public = false
WHERE id = 'member-photos';

-- 2. Drop overly permissive storage policies
DROP POLICY IF EXISTS "Public read member-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update member-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete member-photos" ON storage.objects;

-- 3. Owner-only read access to member photos (via signed URLs)
CREATE POLICY "Owner can view member-photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'member-photos'
  AND public.is_owner()
);

-- 4. Owner-only upload (insert)
CREATE POLICY "Owner can upload member-photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'member-photos'
  AND public.is_owner()
  AND (storage.extension(name) = 'jpg' OR storage.extension(name) = 'jpeg' OR storage.extension(name) = 'png' OR storage.extension(name) = 'webp')
);

-- 5. Owner-only update (replace)
CREATE POLICY "Owner can update member-photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'member-photos'
  AND public.is_owner()
);

-- 6. Owner-only delete
CREATE POLICY "Owner can delete member-photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'member-photos'
  AND public.is_owner()
);

-- 7. CHECK constraints for financial/data integrity
-- Products: non-negative prices and stock
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_selling_price_nonneg') THEN
    ALTER TABLE public.products ADD CONSTRAINT chk_products_selling_price_nonneg
      CHECK (selling_price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_purchase_price_nonneg') THEN
    ALTER TABLE public.products ADD CONSTRAINT chk_products_purchase_price_nonneg
      CHECK (purchase_price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_stock_quantity_nonneg') THEN
    ALTER TABLE public.products ADD CONSTRAINT chk_products_stock_quantity_nonneg
      CHECK (stock_quantity >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_minimum_stock_nonneg') THEN
    ALTER TABLE public.products ADD CONSTRAINT chk_products_minimum_stock_nonneg
      CHECK (minimum_stock >= 0);
  END IF;
END $$;

-- Store sales: non-negative amounts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_store_sales_total_nonneg') THEN
    ALTER TABLE public.store_sales ADD CONSTRAINT chk_store_sales_total_nonneg
      CHECK (total_amount >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_store_sales_paid_nonneg') THEN
    ALTER TABLE public.store_sales ADD CONSTRAINT chk_store_sales_paid_nonneg
      CHECK (paid_amount >= 0);
  END IF;
END $$;

-- Store sale items: positive quantity
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_store_sale_items_quantity_positive') THEN
    ALTER TABLE public.store_sale_items ADD CONSTRAINT chk_store_sale_items_quantity_positive
      CHECK (quantity >= 1);
  END IF;
END $$;

-- Membership plans: non-negative price, positive duration
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_plans_price_nonneg') THEN
    ALTER TABLE public.membership_plans ADD CONSTRAINT chk_plans_price_nonneg
      CHECK (price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_plans_duration_positive') THEN
    ALTER TABLE public.membership_plans ADD CONSTRAINT chk_plans_duration_positive
      CHECK (duration_days >= 1);
  END IF;
END $$;

-- Payments: positive amounts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_payments_amount_positive') THEN
    ALTER TABLE public.payments ADD CONSTRAINT chk_payments_amount_positive
      CHECK (amount > 0);
  END IF;
END $$;

COMMENT ON TABLE public.products IS 'CHECK constraints enforce non-negative prices/stock at database level (migration 000021)';
COMMENT ON TABLE public.store_sales IS 'CHECK constraints enforce non-negative financial amounts (migration 000021)';
COMMENT ON TABLE public.store_sale_items IS 'CHECK constraints enforce positive quantity (migration 000021)';
COMMENT ON TABLE public.membership_plans IS 'CHECK constraints enforce non-negative price and positive duration (migration 000021)';
