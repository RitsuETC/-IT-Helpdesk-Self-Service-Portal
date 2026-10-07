const db = require('../db');

async function migrate() {
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await client.query(`
      ALTER TABLE maintenance
        ALTER COLUMN id_asset DROP NOT NULL,
        ADD COLUMN IF NOT EXISTS id_sparepart INTEGER
          REFERENCES sparepart(id) ON DELETE RESTRICT,
        ADD COLUMN IF NOT EXISTS sparepart_quantity INTEGER NOT NULL DEFAULT 1;

      ALTER TABLE maintenance
        DROP CONSTRAINT IF EXISTS maintenance_target_check,
        ADD CONSTRAINT maintenance_target_check
          CHECK (id_asset IS NOT NULL OR id_sparepart IS NOT NULL),
        DROP CONSTRAINT IF EXISTS maintenance_sparepart_quantity_check,
        ADD CONSTRAINT maintenance_sparepart_quantity_check
          CHECK (sparepart_quantity > 0);

      CREATE INDEX IF NOT EXISTS idx_maintenance_sparepart
        ON maintenance(id_sparepart);
    `);
    await client.query('COMMIT');
    console.log('Migration 012 applied: maintenance supports assets and spareparts');
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