const db = require('../db');

async function migrate() {
  try {
    await db.query(`
      ALTER TABLE knowledge_article
      ADD COLUMN IF NOT EXISTS tags TEXT NOT NULL DEFAULT '';
    `);
    console.log('Migration applied: added knowledge article tags');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

migrate();