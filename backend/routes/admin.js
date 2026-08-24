const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");
const authorizeRole = require("../middleware/roleMiddleware");

const router = express.Router();
router.use(verifyToken, authorizeRole("admin"));

router.get("/setup", async (_req, res) => {
  try {
    const [categories, rooms, users] = await Promise.all([
      db.query("SELECT id, nama_kategori FROM knowledge_kategori ORDER BY nama_kategori"),
      db.query("SELECT id, ruangan FROM unit ORDER BY ruangan"),
      db.query('SELECT id, "Nama" AS nama, email, role FROM login ORDER BY "Nama"'),
    ]);
    res.json({ data: { categories: categories.rows, rooms: rooms.rows, users: users.rows } });
  } catch (error) { res.status(500).json({ message: "Gagal mengambil data admin", error: error.message }); }
});

router.post("/categories", async (req, res) => {
  try {
    const name = req.body.nama_kategori?.trim();
    if (!name) return res.status(400).json({ message: "Nama kategori wajib diisi" });
    const { rows } = await db.query("INSERT INTO knowledge_kategori (nama_kategori) VALUES ($1) RETURNING id, nama_kategori", [name]);
    res.status(201).json({ data: rows[0] });
  } catch (error) { res.status(500).json({ message: "Gagal menambah kategori", error: error.message }); }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    const usage = await db.query(
      `SELECT
        (SELECT count(*) FROM tiket WHERE categori = $1) +
        (SELECT count(*) FROM knowledge_article WHERE id_categori = $1) AS total`,
      [req.params.id]
    );
    if (Number(usage.rows[0].total)) {
      return res.status(409).json({ message: "Kategori masih dipakai tiket atau Knowledge Base dan tidak dapat dihapus" });
    }
    const result = await db.query("DELETE FROM knowledge_kategori WHERE id = $1", [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: "Kategori tidak ditemukan" });
    res.json({ message: "Kategori berhasil dihapus" });
  } catch (error) { res.status(500).json({ message: "Gagal menghapus kategori", error: error.message }); }
});

router.post("/rooms", async (req, res) => {
  try {
    const room = req.body.ruangan?.trim();
    if (!room) return res.status(400).json({ message: "Nama ruangan wajib diisi" });
    const { rows } = await db.query("INSERT INTO unit (ruangan) VALUES ($1) RETURNING id, ruangan", [room]);
    res.status(201).json({ data: rows[0] });
  } catch (error) { res.status(500).json({ message: "Gagal menambah ruangan", error: error.message }); }
});

router.delete("/rooms/:id", async (req, res) => {
  try {
    const usage = await db.query("SELECT count(*) AS total FROM tiket WHERE ruangan = $1", [req.params.id]);
    if (Number(usage.rows[0].total)) return res.status(409).json({ message: "Ruangan masih dipakai tiket dan tidak dapat dihapus" });
    const result = await db.query("DELETE FROM unit WHERE id = $1", [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: "Ruangan tidak ditemukan" });
    res.json({ message: "Ruangan berhasil dihapus" });
  } catch (error) { res.status(500).json({ message: "Gagal menghapus ruangan", error: error.message }); }
});

router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin", "teknisi"].includes(role)) return res.status(400).json({ message: "Role tidak valid" });
    const result = await db.query("UPDATE login SET role = $1 WHERE id = $2", [role, req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: "Akun tidak ditemukan" });
    res.json({ message: "Role akun berhasil diperbarui" });
  } catch (error) { res.status(500).json({ message: "Gagal memperbarui role", error: error.message }); }
});

router.post("/users", async (req, res) => {
  try {
    const { nama, email, password, role = "user" } = req.body;
    if (!nama?.trim() || !email?.trim() || !password || !["user", "admin", "teknisi"].includes(role)) return res.status(400).json({ message: "Data akun tidak lengkap" });
    const existing = await db.query("SELECT id FROM login WHERE email = $1 LIMIT 1", [email.trim()]);
    if (existing.rowCount) return res.status(409).json({ message: "Email sudah digunakan" });
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query('INSERT INTO login ("Nama", email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, "Nama" AS nama, email, role', [nama.trim(), email.trim(), hash, role]);
    res.status(201).json({ data: rows[0] });
  } catch (error) { res.status(500).json({ message: "Gagal membuat akun", error: error.message }); }
});

router.delete("/users/:id", async (req, res) => {
  try {
    if (Number(req.params.id) === req.user.id) return res.status(400).json({ message: "Anda tidak dapat menghapus akun sendiri" });
    const usage = await db.query("SELECT count(*) AS total FROM tiket WHERE akun = $1 OR teknisi = $1", [req.params.id]);
    if (Number(usage.rows[0].total)) return res.status(409).json({ message: "Akun memiliki riwayat tiket dan tidak dapat dihapus" });
    const result = await db.query("DELETE FROM login WHERE id = $1", [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: "Akun tidak ditemukan" });
    res.json({ message: "Akun berhasil dihapus" });
  } catch (error) { res.status(500).json({ message: "Gagal menghapus akun", error: error.message }); }
});

module.exports = router;
