const db = require('../db');

async function migrate() {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('ALTER TABLE ticket_comments ADD COLUMN IF NOT EXISTS id_asset INTEGER REFERENCES asset(id_asset) ON DELETE SET NULL');
    await client.query('CREATE INDEX IF NOT EXISTS idx_ticket_comments_asset ON ticket_comments(id_asset)');
    await client.query('COMMIT');
    console.log('Migration 015 applied: ticket comments can reference related assets');
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