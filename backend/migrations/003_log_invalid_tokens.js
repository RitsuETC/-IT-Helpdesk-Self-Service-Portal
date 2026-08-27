const db = require('../db');

async function migrate() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS invalid_tokens (
        id SERIAL PRIMARY KEY,
        token_hash TEXT NOT NULL,
        token_preview TEXT,
        user_id INTEGER,
        reason TEXT,
        ip TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Migration applied: created invalid_tokens table');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

migrate();
