const db = require('../db');

async function migrate() {
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await client.query(`
      ALTER TABLE maintenance
      ADD COLUMN IF NOT EXISTS id_tiket INTEGER REFERENCES tiket(id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_maintenance_tiket
      ON maintenance(id_tiket);
    `);
    await client.query('COMMIT');
    console.log('Migration 009 applied: maintenance ticket link created');
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
