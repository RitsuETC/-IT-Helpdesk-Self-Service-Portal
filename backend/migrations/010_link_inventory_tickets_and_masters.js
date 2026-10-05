const db = require('../db');

async function migrate() {
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await client.query(`
      ALTER TABLE asset
        ADD COLUMN IF NOT EXISTS id_master_product INTEGER
          REFERENCES master_product(id) ON DELETE SET NULL;
      ALTER TABLE sparepart
        ADD COLUMN IF NOT EXISTS id_master_sparepart INTEGER
          REFERENCES master_sparepart(id) ON DELETE SET NULL;

      CREATE INDEX IF NOT EXISTS idx_asset_master_product
        ON asset(id_master_product);
      CREATE INDEX IF NOT EXISTS idx_sparepart_master
        ON sparepart(id_master_sparepart);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sparepart_master_unique
        ON sparepart(id_master_sparepart)
        WHERE id_master_sparepart IS NOT NULL;

      CREATE TABLE IF NOT EXISTS ticket_asset (
        id_tiket INTEGER NOT NULL REFERENCES tiket(id) ON DELETE CASCADE,
        id_asset INTEGER NOT NULL REFERENCES asset(id_asset) ON DELETE RESTRICT,
        issue TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (id_tiket, id_asset)
      );
      CREATE INDEX IF NOT EXISTS idx_ticket_asset_asset
        ON ticket_asset(id_asset);

      ALTER TABLE asset_movement
        ADD COLUMN IF NOT EXISTS id_tiket INTEGER REFERENCES tiket(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS id_procurement INTEGER REFERENCES procurement(id) ON DELETE SET NULL;
      ALTER TABLE sparepart_transaction
        ADD COLUMN IF NOT EXISTS id_procurement INTEGER REFERENCES procurement(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS stock_before INTEGER,
        ADD COLUMN IF NOT EXISTS stock_after INTEGER;

      CREATE INDEX IF NOT EXISTS idx_asset_movement_ticket
        ON asset_movement(id_tiket);
      CREATE INDEX IF NOT EXISTS idx_asset_movement_procurement
        ON asset_movement(id_procurement);
      CREATE INDEX IF NOT EXISTS idx_sparepart_transaction_procurement
        ON sparepart_transaction(id_procurement);
    `);
    await client.query('COMMIT');
    console.log('Migration 010 applied: inventory master and ticket links created');
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