BEGIN;

ALTER TABLE public.asset
  ADD COLUMN IF NOT EXISTS id_master_product INTEGER
    REFERENCES public.master_product(id) ON DELETE SET NULL;

ALTER TABLE public.sparepart
  ADD COLUMN IF NOT EXISTS id_master_sparepart INTEGER
    REFERENCES public.master_sparepart(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_asset_master_product
  ON public.asset(id_master_product);
CREATE INDEX IF NOT EXISTS idx_sparepart_master
  ON public.sparepart(id_master_sparepart);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sparepart_master_unique
  ON public.sparepart(id_master_sparepart)
  WHERE id_master_sparepart IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.ticket_asset (
  id_tiket INTEGER NOT NULL REFERENCES public.tiket(id) ON DELETE CASCADE,
  id_asset INTEGER NOT NULL REFERENCES public.asset(id_asset) ON DELETE RESTRICT,
  issue TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_tiket, id_asset)
);
CREATE INDEX IF NOT EXISTS idx_ticket_asset_asset
  ON public.ticket_asset(id_asset);

ALTER TABLE public.asset_movement
  ADD COLUMN IF NOT EXISTS id_tiket INTEGER REFERENCES public.tiket(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS id_procurement INTEGER REFERENCES public.procurement(id) ON DELETE SET NULL;

ALTER TABLE public.sparepart_transaction
  ADD COLUMN IF NOT EXISTS id_procurement INTEGER REFERENCES public.procurement(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stock_before INTEGER,
  ADD COLUMN IF NOT EXISTS stock_after INTEGER;

CREATE INDEX IF NOT EXISTS idx_asset_movement_ticket
  ON public.asset_movement(id_tiket);
CREATE INDEX IF NOT EXISTS idx_asset_movement_procurement
  ON public.asset_movement(id_procurement);
CREATE INDEX IF NOT EXISTS idx_sparepart_transaction_procurement
  ON public.sparepart_transaction(id_procurement);

COMMIT;
