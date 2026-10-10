const db = require('../db');

async function migrate() {
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await client.query(`
      ALTER TABLE sparepart_transaction
        ADD COLUMN IF NOT EXISTS id_movement INTEGER
          REFERENCES asset_movement(id) ON DELETE SET NULL;

      CREATE INDEX IF NOT EXISTS idx_sparepart_transaction_movement
        ON sparepart_transaction(id_movement);
    `);
    await client.query('COMMIT');
    console.log('Migration 014 applied: sparepart ledger links to movements');
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
