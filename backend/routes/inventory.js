const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');
const authorizeRole = require('../middleware/roleMiddleware');
const { logAudit } = require('../utils/audit');

const router = express.Router();
router.use(verifyToken, authorizeRole('admin', 'teknisi'));
const adminOnly = authorizeRole('admin');
const workRoles = authorizeRole('admin', 'teknisi');

const positiveInt = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const dateValue = (value) => value || null;

router.get('/setup', async (_req, res) => {
  try {
    const [categories, sparepartCategories, rooms, users, tickets] = await Promise.all([
      db.query('SELECT id, name FROM asset_category ORDER BY name'),
      db.query('SELECT id, name FROM sparepart_category ORDER BY name'),
      db.query('SELECT id, ruangan FROM unit ORDER BY ruangan'),
      db.query('SELECT id, "Nama" AS name, email, role FROM login ORDER BY "Nama"'),
      db.query('SELECT id, judul FROM tiket ORDER BY id DESC LIMIT 100')
    ]);
    res.json({ data: { categories: categories.rows, sparepartCategories: sparepartCategories.rows, rooms: rooms.rows, users: users.rows, tickets: tickets.rows } });
  } catch (error) { res.status(500).json({ message: 'Gagal mengambil data referensi inventaris', error: error.message }); }
});

router.get('/dashboard', async (_req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        (SELECT count(*) FROM asset) AS total_assets,
        (SELECT count(*) FROM asset WHERE status = 'available') AS available_assets,
        (SELECT count(*) FROM asset WHERE status IN ('in_use', 'used', 'digunakan')) AS in_use_assets,
        (SELECT count(*) FROM asset WHERE condition IN ('broken', 'rusak')) AS broken_assets,
        (SELECT coalesce(sum(stock), 0) FROM sparepart) AS total_spareparts,
        (SELECT count(*) FROM sparepart WHERE stock <= min_stock) AS low_stock_spareparts,
        (SELECT count(*) FROM maintenance WHERE status IN ('scheduled', 'in_progress', 'berjalan')) AS active_maintenance,
        (SELECT count(*) FROM procurement WHERE status IN ('submitted', 'approved', 'ordered', 'in_progress', 'berjalan')) AS active_procurement
    `);
    res.json({ data: rows[0] });
  } catch (error) { res.status(500).json({ message: 'Gagal mengambil dashboard inventaris', error: error.message }); }
});

router.get('/assets', async (req, res) => {
  try {
    const values = [];
    const filters = [];
    const add = (sql, value) => { values.push(value); filters.push(sql.replace('?', `$${values.length}`)); };
    if (req.query.search) { values.push(`%${req.query.search}%`); filters.push(`(a.asset_code ILIKE $${values.length} OR a.brand_model ILIKE $${values.length} OR a.serial_number ILIKE $${values.length})`); }
    if (req.query.category) add('a.id_category = ?', req.query.category);
    if (req.query.location) add('a.id_ruangan = ?', req.query.location);
    if (req.query.status) add('a.status = ?', req.query.status);
    if (req.query.condition) add('a.condition = ?', req.query.condition);
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const result = await db.query(`SELECT a.*, c.name AS category_name, u.ruangan, l."Nama" AS user_name FROM asset a LEFT JOIN asset_category c ON c.id = a.id_category LEFT JOIN unit u ON u.id = a.id_ruangan LEFT JOIN login l ON l.id = a.id_user ${where} ORDER BY a.id_asset DESC`, values);
    res.json({ data: result.rows });
  } catch (error) { res.status(500).json({ message: 'Gagal mengambil aset', error: error.message }); }
});

const assetFields = ['asset_code', 'id_ruangan', 'id_category', 'id_user', 'brand_model', 'serial_number', 'purchase_year', 'price', 'status', 'condition', 'notes', 'specifications'];
router.post('/assets', adminOnly, async (req, res) => {
  try {
    const { asset_code, id_ruangan } = req.body;
    if (!asset_code?.trim() || !positiveInt(id_ruangan)) return res.status(400).json({ message: 'Kode aset dan lokasi wajib diisi' });
    const values = assetFields.map((field) => req.body[field] ?? (field === 'status' ? 'available' : field === 'condition' ? 'good' : null));
    const { rows } = await db.query(`INSERT INTO asset (${assetFields.join(', ')}) VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`, values);
    await logAudit(db, req, { action: 'CREATE_ASSET', detail: `Menambahkan aset ${rows[0].asset_code}`, entityType: 'asset', entityId: rows[0].id_asset });
    res.status(201).json({ data: rows[0] });
  } catch (error) { res.status(error.code === '23505' ? 409 : 500).json({ message: error.code === '23505' ? 'Kode atau serial number aset sudah digunakan' : 'Gagal menambah aset', error: error.message }); }
});

router.put('/assets/:id', adminOnly, async (req, res) => {
  try {
    const values = assetFields.map((field) => req.body[field] ?? null);
    values.push(req.params.id);
    const { rows } = await db.query(`UPDATE asset SET ${assetFields.map((field, i) => `${field} = $${i + 1}`).join(', ')}, updated_at = NOW() WHERE id_asset = $${values.length} RETURNING *`, values);
    if (!rows.length) return res.status(404).json({ message: 'Aset tidak ditemukan' });
    await logAudit(db, req, { action: 'UPDATE_ASSET', detail: `Memperbarui aset ${rows[0].asset_code}`, entityType: 'asset', entityId: rows[0].id_asset });
    res.json({ data: rows[0] });
  } catch (error) { res.status(500).json({ message: 'Gagal mengubah aset', error: error.message }); }
});

router.delete('/assets/:id', adminOnly, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM asset WHERE id_asset = $1 RETURNING id_asset, asset_code', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Aset tidak ditemukan' });
    await logAudit(db, req, { action: 'DELETE_ASSET', detail: `Menghapus aset ${result.rows[0].asset_code}`, entityType: 'asset', entityId: result.rows[0].id_asset });
    res.json({ message: 'Aset berhasil dihapus' });
  } catch (error) { res.status(409).json({ message: 'Aset tidak dapat dihapus karena masih memiliki riwayat', error: error.message }); }
});

router.get('/spareparts', async (req, res) => {
  try {
    const values = [];
    let where = '';
    if (req.query.search) { values.push(`%${req.query.search}%`); where = 'WHERE s.name ILIKE $1 OR s.supplier ILIKE $1'; }
    if (req.query.category) { values.push(req.query.category); where += `${where ? ' AND' : 'WHERE'} s.id_category = $${values.length}`; }
    const { rows } = await db.query(`SELECT s.*, c.name AS category_name, s.stock <= s.min_stock AS low_stock FROM sparepart s LEFT JOIN sparepart_category c ON c.id = s.id_category ${where} ORDER BY s.id DESC`, values);
    res.json({ data: rows });
  } catch (error) { res.status(500).json({ message: 'Gagal mengambil sparepart', error: error.message }); }
});
const sparepartFields = ['name', 'id_category', 'stock', 'min_stock', 'unit', 'price', 'supplier', 'notes'];
router.post('/spareparts', adminOnly, async (req, res) => {
  try { const values = sparepartFields.map((field) => req.body[field] ?? null); const { rows } = await db.query(`INSERT INTO sparepart (${sparepartFields.join(', ')}) VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`, values); await logAudit(db, req, { action: 'CREATE_SPAREPART', detail: `Menambahkan sparepart ${rows[0].name}`, entityType: 'sparepart', entityId: rows[0].id }); res.status(201).json({ data: rows[0] }); }
  catch (error) { res.status(500).json({ message: 'Gagal menambah sparepart', error: error.message }); }
});
router.put('/spareparts/:id', adminOnly, async (req, res) => {
  try { const values = sparepartFields.map((field) => req.body[field] ?? null); values.push(req.params.id); const { rows } = await db.query(`UPDATE sparepart SET ${sparepartFields.map((field, i) => `${field} = $${i + 1}`).join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`, values); if (!rows.length) return res.status(404).json({ message: 'Sparepart tidak ditemukan' }); await logAudit(db, req, { action: 'UPDATE_SPAREPART', detail: `Memperbarui sparepart ${rows[0].name}`, entityType: 'sparepart', entityId: rows[0].id }); res.json({ data: rows[0] }); }
  catch (error) { res.status(500).json({ message: 'Gagal mengubah sparepart', error: error.message }); }
});
router.delete('/spareparts/:id', adminOnly, async (req, res) => {
  try { const result = await db.query('DELETE FROM sparepart WHERE id = $1 RETURNING id, name', [req.params.id]); if (!result.rowCount) return res.status(404).json({ message: 'Sparepart tidak ditemukan' }); await logAudit(db, req, { action: 'DELETE_SPAREPART', detail: `Menghapus sparepart ${result.rows[0].name}`, entityType: 'sparepart', entityId: result.rows[0].id }); res.json({ message: 'Sparepart berhasil dihapus' }); }
  catch (error) { res.status(409).json({ message: 'Sparepart tidak dapat dihapus karena memiliki transaksi', error: error.message }); }
});

router.get('/movements', async (_req, res) => { try { const { rows } = await db.query(`SELECT m.*, a.asset_code, u1.ruangan AS from_room, u2.ruangan AS to_room, l."Nama" AS user_name, p."Nama" AS pic_name FROM asset_movement m JOIN asset a ON a.id_asset = m.id_asset LEFT JOIN unit u1 ON u1.id = m.from_location LEFT JOIN unit u2 ON u2.id = m.to_location LEFT JOIN login l ON l.id = m.id_user LEFT JOIN login p ON p.id = m.id_pic ORDER BY m.movement_date DESC`); res.json({ data: rows }); } catch (error) { res.status(500).json({ message: 'Gagal mengambil pergerakan aset', error: error.message }); } });
router.post('/movements', workRoles, async (req, res) => {
  const client = await db.connect();
  try {
    const { id_asset, id_user, from_location, to_location, movement_type, movement_date, condition, notes, id_pic } = req.body;
    if (!positiveInt(id_asset) || !movement_type) return res.status(400).json({ message: 'Aset dan jenis pergerakan wajib diisi' });
    await client.query('BEGIN');
    const asset = await client.query('SELECT asset_code FROM asset WHERE id_asset = $1 FOR UPDATE', [id_asset]);
    if (!asset.rowCount) return res.status(404).json({ message: 'Aset tidak ditemukan' });
    const result = await client.query('INSERT INTO asset_movement (id_asset, id_user, from_location, to_location, movement_type, movement_date, condition, notes, id_pic) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *', [id_asset, id_user || null, from_location || null, to_location || null, movement_type, dateValue(movement_date), condition || null, notes || null, id_pic || req.user.id]);
    await client.query('UPDATE asset SET id_user = COALESCE($1, id_user), id_ruangan = COALESCE($2, id_ruangan), condition = COALESCE($3, condition), updated_at = NOW() WHERE id_asset = $4', [id_user || null, to_location || null, condition || null, id_asset]);
    await logAudit(client, req, { action: 'TRANSFER_ASSET', detail: `Mencatat pergerakan aset ${asset.rows[0].asset_code} (${movement_type})`, entityType: 'asset', entityId: id_asset, metadata: { from_location, to_location, id_user, movement_type } });
    await client.query('COMMIT');
    res.status(201).json({ data: result.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); res.status(500).json({ message: 'Gagal mencatat pergerakan aset', error: error.message }); } finally { client.release(); }
});

router.get('/transactions', async (_req, res) => { try { const { rows } = await db.query(`SELECT t.*, s.name AS sparepart_name, l."Nama" AS pic_name, tk.judul AS ticket_title FROM sparepart_transaction t JOIN sparepart s ON s.id = t.id_sparepart LEFT JOIN login l ON l.id = t.id_pic LEFT JOIN tiket tk ON tk.id = t.id_tiket ORDER BY t.transaction_date DESC`); res.json({ data: rows }); } catch (error) { res.status(500).json({ message: 'Gagal mengambil transaksi sparepart', error: error.message }); } });
router.post('/transactions', workRoles, async (req, res) => {
  const client = await db.connect();
  try {
    const { id_sparepart, transaction_type, quantity, transaction_date, id_tiket, notes, id_pic } = req.body;
    if (!positiveInt(id_sparepart) || !['MASUK', 'KELUAR'].includes(transaction_type) || !positiveInt(quantity)) return res.status(400).json({ message: 'Sparepart, jenis transaksi, dan jumlah wajib valid' });
    await client.query('BEGIN');
    const stock = await client.query('SELECT name, stock FROM sparepart WHERE id = $1 FOR UPDATE', [id_sparepart]);
    if (!stock.rows.length) return res.status(404).json({ message: 'Sparepart tidak ditemukan' });
    const nextStock = Number(stock.rows[0].stock) + (transaction_type === 'MASUK' ? Number(quantity) : -Number(quantity));
    if (nextStock < 0) return res.status(400).json({ message: 'Stok tidak mencukupi' });
    const result = await client.query('INSERT INTO sparepart_transaction (id_sparepart, transaction_type, quantity, transaction_date, id_tiket, notes, id_pic) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [id_sparepart, transaction_type, quantity, dateValue(transaction_date), id_tiket || null, notes || null, id_pic || req.user.id]);
    await client.query('UPDATE sparepart SET stock = $1, updated_at = NOW() WHERE id = $2', [nextStock, id_sparepart]);
    await logAudit(client, req, { action: 'UPDATE_STOCK_SPAREPART', detail: `${transaction_type === 'MASUK' ? 'Menambah' : 'Mengurangi'} stok ${stock.rows[0].name} sebanyak ${quantity}`, entityType: 'sparepart', entityId: id_sparepart, metadata: { transaction_type, quantity: Number(quantity), before_stock: Number(stock.rows[0].stock), after_stock: nextStock, ticket_id: id_tiket || null } });
    await client.query('COMMIT');
    res.status(201).json({ data: result.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); res.status(500).json({ message: 'Gagal mencatat transaksi sparepart', error: error.message }); } finally { client.release(); }
});

const maintenanceFields = ['id_asset', 'maintenance_type', 'start_date', 'end_date', 'complaint', 'action', 'result', 'cost', 'status', 'vendor', 'id_pic', 'notes'];
router.get('/maintenance', async (_req, res) => { try { const { rows } = await db.query(`SELECT m.*, a.asset_code, l."Nama" AS pic_name FROM maintenance m JOIN asset a ON a.id_asset = m.id_asset LEFT JOIN login l ON l.id = m.id_pic ORDER BY m.start_date DESC`); res.json({ data: rows }); } catch (error) { res.status(500).json({ message: 'Gagal mengambil maintenance', error: error.message }); } });
router.post('/maintenance', workRoles, async (req, res) => { try { const values = maintenanceFields.map((field) => req.body[field] ?? (field === 'id_pic' ? req.user.id : field === 'status' ? 'scheduled' : field === 'cost' ? 0 : null)); const { rows } = await db.query(`INSERT INTO maintenance (${maintenanceFields.join(', ')}) VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`, values); await logAudit(db, req, { action: 'CREATE_MAINTENANCE', detail: `Mencatat maintenance aset #${rows[0].id_asset}`, entityType: 'maintenance', entityId: rows[0].id }); res.status(201).json({ data: rows[0] }); } catch (error) { res.status(500).json({ message: 'Gagal mencatat maintenance', error: error.message }); } });
router.put('/maintenance/:id', workRoles, async (req, res) => { try { const values = maintenanceFields.map((field) => req.body[field] ?? null); values.push(req.params.id); const { rows } = await db.query(`UPDATE maintenance SET ${maintenanceFields.map((field, i) => `${field} = $${i + 1}`).join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`, values); if (!rows.length) return res.status(404).json({ message: 'Maintenance tidak ditemukan' }); await logAudit(db, req, { action: 'UPDATE_MAINTENANCE', detail: `Memperbarui maintenance aset #${rows[0].id_asset}`, entityType: 'maintenance', entityId: rows[0].id }); res.json({ data: rows[0] }); } catch (error) { res.status(500).json({ message: 'Gagal mengubah maintenance', error: error.message }); } });

const procurementFields = ['po_number', 'request_date', 'approval_date', 'received_date', 'supplier', 'status', 'total_cost', 'notes'];
router.get('/procurement', async (_req, res) => { try { const procurements = await db.query('SELECT * FROM procurement ORDER BY request_date DESC'); const details = await db.query('SELECT * FROM procurement_detail ORDER BY id'); res.json({ data: procurements.rows.map((item) => ({ ...item, details: details.rows.filter((detail) => detail.id_procurement === item.id) })) }); } catch (error) { res.status(500).json({ message: 'Gagal mengambil pengadaan', error: error.message }); } });
router.post('/procurement', adminOnly, async (req, res) => { const client = await db.connect(); try { const { details = [] } = req.body; const values = procurementFields.map((field) => req.body[field] ?? (field === 'status' ? 'draft' : field === 'total_cost' ? details.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0) : null)); await client.query('BEGIN'); const procurement = await client.query(`INSERT INTO procurement (${procurementFields.join(', ')}) VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`, values); for (const detail of details) { await client.query('INSERT INTO procurement_detail (id_procurement, item_name, quantity, unit_price, notes) VALUES ($1,$2,$3,$4,$5)', [procurement.rows[0].id, detail.item_name, detail.quantity, detail.unit_price, detail.notes || null]); } await logAudit(client, req, { action: 'CREATE_PROCUREMENT', detail: `Membuat pengadaan ${procurement.rows[0].po_number}`, entityType: 'procurement', entityId: procurement.rows[0].id }); await client.query('COMMIT'); res.status(201).json({ data: procurement.rows[0] }); } catch (error) { await client.query('ROLLBACK'); res.status(500).json({ message: 'Gagal mencatat pengadaan', error: error.message }); } finally { client.release(); } });
router.put('/procurement/:id', adminOnly, async (req, res) => { try { const values = procurementFields.map((field) => req.body[field] ?? null); values.push(req.params.id); const { rows } = await db.query(`UPDATE procurement SET ${procurementFields.map((field, i) => `${field} = $${i + 1}`).join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`, values); if (!rows.length) return res.status(404).json({ message: 'Pengadaan tidak ditemukan' }); await logAudit(db, req, { action: 'UPDATE_PROCUREMENT', detail: `Memperbarui pengadaan ${rows[0].po_number}`, entityType: 'procurement', entityId: rows[0].id }); res.json({ data: rows[0] }); } catch (error) { res.status(500).json({ message: 'Gagal mengubah pengadaan', error: error.message }); } });
router.delete('/procurement/:id', adminOnly, async (req, res) => { try { const result = await db.query('DELETE FROM procurement WHERE id = $1 RETURNING id, po_number', [req.params.id]); if (!result.rowCount) return res.status(404).json({ message: 'Pengadaan tidak ditemukan' }); await logAudit(db, req, { action: 'DELETE_PROCUREMENT', detail: `Menghapus pengadaan ${result.rows[0].po_number}`, entityType: 'procurement', entityId: result.rows[0].id }); res.json({ message: 'Pengadaan berhasil dihapus' }); } catch (error) { res.status(500).json({ message: 'Gagal menghapus pengadaan', error: error.message }); } });

module.exports = router;
