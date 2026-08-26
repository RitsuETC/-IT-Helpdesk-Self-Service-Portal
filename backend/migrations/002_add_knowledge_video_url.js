const db = require('../db');

async function migrate() {
  try {
    await db.query("ALTER TABLE public.knowledge_article ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);");
    console.log('Migration applied: added video_url to knowledge_article');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

migrate();
