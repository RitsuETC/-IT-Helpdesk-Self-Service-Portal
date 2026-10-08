const db = require('../db');

async function migrate() {
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await client.query(`
      ALTER TABLE sparepart_transaction
        ADD COLUMN IF NOT EXISTS id_maintenance INTEGER
          REFERENCES maintenance(id) ON DELETE SET NULL;

      CREATE INDEX IF NOT EXISTS idx_sparepart_transaction_maintenance
        ON sparepart_transaction(id_maintenance);
    `);
    await client.query('COMMIT');
    console.log('Migration 013 applied: sparepart ledger links to maintenance');
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