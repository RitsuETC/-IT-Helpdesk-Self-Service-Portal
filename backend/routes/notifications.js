const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.use(verifyToken);

// List notifications for current user
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, tiket_id, message, is_read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200',
      [req.user.id]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil notifikasi', error: error.message });
  }
});

// Mark a notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const result = await db.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Notifikasi tidak ditemukan' });
    res.json({ message: 'Notifikasi ditandai sudah dibaca' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui notifikasi', error: error.message });
  }
});

// Unread count
router.get('/unread/count', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT count(*) AS cnt FROM notifications WHERE user_id = $1 AND is_read = FALSE', [req.user.id]);
    res.json({ data: { unread: Number(rows[0].cnt) } });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil jumlah notifikasi belum dibaca', error: error.message });
  }
});

module.exports = router;
