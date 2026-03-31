ALTER TABLE public.packages
ADD COLUMN IF NOT EXISTS actual_price INTEGER;

UPDATE public.packages
SET actual_price = price
WHERE actual_price IS NULL;

ALTER TABLE public.packages
ALTER COLUMN actual_price SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'packages_actual_price_check'
  ) THEN
    ALTER TABLE public.packages
    ADD CONSTRAINT packages_actual_price_check
    CHECK (actual_price > 0 AND price > 0 AND actual_price >= price);
  END IF;
END $$;
