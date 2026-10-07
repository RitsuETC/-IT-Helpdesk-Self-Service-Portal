BEGIN;

ALTER TABLE public.maintenance
  ALTER COLUMN id_asset DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS id_sparepart INTEGER
    REFERENCES public.sparepart(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS sparepart_quantity INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.maintenance
  DROP CONSTRAINT IF EXISTS maintenance_target_check,
  ADD CONSTRAINT maintenance_target_check
    CHECK (id_asset IS NOT NULL OR id_sparepart IS NOT NULL),
  DROP CONSTRAINT IF EXISTS maintenance_sparepart_quantity_check,
  ADD CONSTRAINT maintenance_sparepart_quantity_check
    CHECK (sparepart_quantity > 0);

CREATE INDEX IF NOT EXISTS idx_maintenance_sparepart
  ON public.maintenance(id_sparepart);

COMMIT;
