const db = require('../db');

async function migrate() {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id BIGSERIAL PRIMARY KEY,
        actor_id INTEGER REFERENCES login(id) ON DELETE SET NULL,
        actor_name VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        detail TEXT NOT NULL,
        entity_type VARCHAR(100),
        entity_id VARCHAR(100),
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON audit_log(actor_id)');
    await client.query('COMMIT');
    console.log('Migration 007 applied: audit_log table created');
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
