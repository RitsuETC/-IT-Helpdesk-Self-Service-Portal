const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');
const authorizeRole = require('../middleware/roleMiddleware');

const router = express.Router();

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
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil log aktivitas', error: error.message });
  }
});

module.exports = router;
