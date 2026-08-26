const db = require('../db');

async function migrate() {
  try {
    await db.query("ALTER TABLE tiket ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()");
    await db.query("ALTER TABLE tiket ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE");
    await db.query("ALTER TABLE tiket ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE");
    console.log('Migration applied: added created_at, resolved_at, closed_at to tiket');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

migrate();
