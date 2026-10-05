BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'maintenance_type_check'
      AND conrelid = 'public.maintenance'::regclass
  ) THEN
    ALTER TABLE public.maintenance
      ADD CONSTRAINT maintenance_type_check
      CHECK (maintenance_type IN ('Preventive', 'Corrective', 'Inspection'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'maintenance_status_check'
      AND conrelid = 'public.maintenance'::regclass
  ) THEN
    ALTER TABLE public.maintenance
      ADD CONSTRAINT maintenance_status_check
      CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'));
  END IF;
END $$;

COMMIT;
