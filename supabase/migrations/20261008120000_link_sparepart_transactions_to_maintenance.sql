BEGIN;

ALTER TABLE public.sparepart_transaction
  ADD COLUMN IF NOT EXISTS id_maintenance INTEGER
    REFERENCES public.maintenance(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sparepart_transaction_maintenance
  ON public.sparepart_transaction(id_maintenance);

COMMIT;
