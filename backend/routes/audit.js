const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');
const authorizeRole = require('../middleware/roleMiddleware');

const router = express.Router();

async function currentInventoryData(entityType, entityId) {
  const sources = {
    asset: ['asset', 'id_asset'],
    sparepart: ['sparepart', 'id'],
    master_product: ['master_product', 'id'],
    master_sparepart: ['master_sparepart', 'id'],
    maintenance: ['maintenance', 'id'],
    procurement: ['procurement', 'id'],
    inventory_movement: ['asset_movement', 'id'],
  };
  const source = sources[entityType];
  if (!source || !entityId) return null;
  const [table, key] = source;
  const { rows } = await db.query(`SELECT * FROM ${table} WHERE ${key} = $1`, [entityId]);
  return rows[0] || null;
}

// Audit records are intentionally read-only and only visible to administrators.
router.get('/', verifyToken, authorizeRole('admin'), async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const values = [];
    const filters = [];
    const add = (sql, value) => { values.push(value); filters.push(sql.replace('?', `$${values.length}`)); };
    if (req.query.action) add('action = ?', req.query.action);
    if (req.query.actor) add('actor_id = ?', req.query.actor);
    if (req.query.search) add('(actor_name ILIKE ? OR action ILIKE ? OR detail ILIKE ?)', `%${req.query.search}%`);
    // The search term appears in three placeholders.
    if (req.query.search) {
      const term = values.pop();
      values.push(term, term, term);
      filters[filters.length - 1] = `(actor_name ILIKE $${values.length - 2} OR action ILIKE $${values.length - 1} OR detail ILIKE $${values.length})`;
    }
    values.push(limit);
    const { rows } = await db.query(
      `SELECT id, actor_id, actor_name, action, detail, entity_type, entity_id, metadata, created_at
       FROM audit_log ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
       ORDER BY created_at DESC, id DESC LIMIT $${values.length}`,
      values
    );
    const data = await Promise.all(rows.map(async (row) => ({
      ...row,
      current_data: await currentInventoryData(row.entity_type, row.entity_id),
    })));
    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil log aktivitas', error: error.message });
  }
});

module.exports = router;
