ALTER TABLE public.ticket_comments
  ADD COLUMN IF NOT EXISTS id_asset INTEGER REFERENCES public.asset(id_asset) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ticket_comments_asset
  ON public.ticket_comments(id_asset);