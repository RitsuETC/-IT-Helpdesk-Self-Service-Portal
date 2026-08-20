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
      db.query("SELECT id, Nama AS nama, email, role FROM login ORDER BY Nama"),
    ]);
    res.json({ data: { categories: categories[0], rooms: rooms[0], users: users[0] } });
  } catch (error) { res.status(500).json({ message: "Gagal mengambil data admin", error: error.message }); }
});

router.post("/categories", async (req, res) => {
  try {
    const name = req.body.nama_kategori?.trim();
    if (!name) return res.status(400).json({ message: "Nama kategori wajib diisi" });
    const [result] = await db.query("INSERT INTO knowledge_kategori (nama_kategori) VALUES (?)", [name]);
    res.status(201).json({ data: { id: result.insertId, nama_kategori: name } });
  } catch (error) { res.status(500).json({ message: "Gagal menambah kategori", error: error.message }); }
});

router.post("/rooms", async (req, res) => {
  try {
    const room = req.body.ruangan?.trim();
    if (!room) return res.status(400).json({ message: "Nama ruangan wajib diisi" });
    const [result] = await db.query("INSERT INTO unit (ruangan) VALUES (?)", [room]);
    res.status(201).json({ data: { id: result.insertId, ruangan: room } });
  } catch (error) { res.status(500).json({ message: "Gagal menambah ruangan", error: error.message }); }
});

router.patch("/users/:id/role", async (req, res) => {
  try {
    const role = req.body.role;
    if (!['user', 'admin', 'teknisi'].includes(role)) return res.status(400).json({ message: "Role tidak valid" });
    const [result] = await db.query("UPDATE login SET role = ? WHERE id = ?", [role, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Akun tidak ditemukan" });
    res.json({ message: "Role akun berhasil diperbarui" });
  } catch (error) { res.status(500).json({ message: "Gagal memperbarui role", error: error.message }); }
});

router.post("/users", async (req, res) => {
  try {
    const { nama, email, password, role = 'user' } = req.body;
    if (!nama?.trim() || !email?.trim() || !password || !['user', 'admin', 'teknisi'].includes(role)) return res.status(400).json({ message: "Data akun tidak lengkap" });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query("INSERT INTO login (Nama, email, password, role) VALUES (?, ?, ?, ?)", [nama.trim(), email.trim(), hash, role]);
    res.status(201).json({ data: { id: result.insertId, nama: nama.trim(), email: email.trim(), role } });
  } catch (error) { res.status(500).json({ message: "Gagal membuat akun", error: error.message }); }
});

module.exports = router;
