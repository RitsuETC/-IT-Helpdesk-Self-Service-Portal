BEGIN;

ALTER TABLE public.sparepart_transaction
  ADD COLUMN IF NOT EXISTS id_movement INTEGER
    REFERENCES public.asset_movement(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sparepart_transaction_movement
  ON public.sparepart_transaction(id_movement);

COMMIT;
