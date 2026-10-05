const db = require('../db');

async function migrate() {
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'maintenance_type_check'
            AND conrelid = 'maintenance'::regclass
        ) THEN
          ALTER TABLE maintenance
            ADD CONSTRAINT maintenance_type_check
            CHECK (maintenance_type IN ('Preventive', 'Corrective', 'Inspection'));
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'maintenance_status_check'
            AND conrelid = 'maintenance'::regclass
        ) THEN
          ALTER TABLE maintenance
            ADD CONSTRAINT maintenance_status_check
            CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'));
        END IF;
      END $$;
    `);
    await client.query('COMMIT');
    console.log('Migration 011 applied: maintenance values constrained');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.end();
  }
}

migrate();