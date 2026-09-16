const db = require('../db');

async function migrate() {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CREATE TABLE IF NOT EXISTS ticket_comments (
      id BIGSERIAL PRIMARY KEY,
      ticket_id INTEGER NOT NULL REFERENCES tiket(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES login(id) ON DELETE SET NULL,
      message TEXT NOT NULL CHECK (length(trim(message)) > 0),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS ticket_ratings (
      id BIGSERIAL PRIMARY KEY,
      ticket_id INTEGER NOT NULL UNIQUE REFERENCES tiket(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES login(id) ON DELETE SET NULL,
      rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )`);
    await client.query('CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id, created_at)');
    await client.query('COMMIT');
    console.log('Migration 008 applied: ticket collaboration tables created');
  } catch (error) { await client.query('ROLLBACK'); console.error('Migration failed:', error.message); process.exitCode = 1 } finally { client.release(); await db.end() }
}
migrate();
