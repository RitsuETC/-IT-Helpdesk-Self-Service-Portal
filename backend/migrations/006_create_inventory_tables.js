const db = require('../db');

async function migrate() {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. asset_category table
    await client.query(`
      CREATE TABLE IF NOT EXISTS asset_category (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Extend asset table with all required fields. The existing status enum
    // is converted to text because inventory needs more than two statuses.
    await client.query(`
      ALTER TABLE asset 
      ADD COLUMN IF NOT EXISTS id_category INTEGER REFERENCES asset_category(id),
      ADD COLUMN IF NOT EXISTS id_user INTEGER REFERENCES login(id),
      ADD COLUMN IF NOT EXISTS brand_model VARCHAR(255),
      ADD COLUMN IF NOT EXISTS serial_number VARCHAR(255) UNIQUE,
      ADD COLUMN IF NOT EXISTS purchase_year INTEGER,
      ADD COLUMN IF NOT EXISTS price NUMERIC(15,2),
      ADD COLUMN IF NOT EXISTS condition VARCHAR(50) DEFAULT 'good',
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS specifications JSONB,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `);
    await client.query(`
      ALTER TABLE asset
      ALTER COLUMN status TYPE VARCHAR(50) USING status::text,
      ALTER COLUMN status SET DEFAULT 'available',
      ALTER COLUMN condition SET DEFAULT 'good';
    `);

    // 3. sparepart_category table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sparepart_category (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 4. sparepart table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sparepart (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        id_category INTEGER REFERENCES sparepart_category(id),
        stock INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 0,
        unit VARCHAR(50),
        price NUMERIC(15,2),
        supplier VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 5. asset_movement table
    await client.query(`
      CREATE TABLE IF NOT EXISTS asset_movement (
        id SERIAL PRIMARY KEY,
        id_asset INTEGER NOT NULL REFERENCES asset(id_asset),
        id_user INTEGER REFERENCES login(id),
        from_location INTEGER REFERENCES unit(id),
        to_location INTEGER REFERENCES unit(id),
        movement_type VARCHAR(50) NOT NULL,
        movement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        condition VARCHAR(50),
        notes TEXT,
        id_pic INTEGER REFERENCES login(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 6. sparepart_transaction table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sparepart_transaction (
        id SERIAL PRIMARY KEY,
        id_sparepart INTEGER NOT NULL REFERENCES sparepart(id),
        transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('MASUK', 'KELUAR')),
        quantity INTEGER NOT NULL,
        transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        id_tiket INTEGER REFERENCES tiket(id),
        notes TEXT,
        id_pic INTEGER REFERENCES login(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 7. maintenance table
    await client.query(`
      CREATE TABLE IF NOT EXISTS maintenance (
        id SERIAL PRIMARY KEY,
        id_asset INTEGER NOT NULL REFERENCES asset(id_asset),
        maintenance_type VARCHAR(100) NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE,
        complaint TEXT,
        action TEXT,
        result TEXT,
        cost NUMERIC(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'scheduled',
        vendor VARCHAR(255),
        id_pic INTEGER REFERENCES login(id),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 8. procurement table
    await client.query(`
      CREATE TABLE IF NOT EXISTS procurement (
        id SERIAL PRIMARY KEY,
        po_number VARCHAR(100) NOT NULL UNIQUE,
        request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        approval_date TIMESTAMP WITH TIME ZONE,
        received_date TIMESTAMP WITH TIME ZONE,
        supplier VARCHAR(255),
        status VARCHAR(50) DEFAULT 'draft',
        total_cost NUMERIC(15,2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 9. procurement_detail table
    await client.query(`
      CREATE TABLE IF NOT EXISTS procurement_detail (
        id SERIAL PRIMARY KEY,
        id_procurement INTEGER NOT NULL REFERENCES procurement(id) ON DELETE CASCADE,
        item_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price NUMERIC(15,2) NOT NULL,
        subtotal NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    await client.query(`
      ALTER TABLE procurement ADD COLUMN IF NOT EXISTS supplier VARCHAR(255);
    `);

    // Create indexes for performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_asset_category ON asset(id_category);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_asset_user ON asset(id_user);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_asset_status ON asset(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_asset_condition ON asset(condition);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_asset_location ON asset(id_ruangan);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sparepart_category ON sparepart(id_category);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_asset_movement_asset ON asset_movement(id_asset);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_asset_movement_user ON asset_movement(id_user);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sparepart_transaction_sparepart ON sparepart_transaction(id_sparepart);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sparepart_transaction_tiket ON sparepart_transaction(id_tiket);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_maintenance_asset ON maintenance(id_asset);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_procurement_status ON procurement(status);`);

    await client.query('COMMIT');
    console.log('Migration 006 applied: inventory tables created');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.end();
  }
}

migrate();