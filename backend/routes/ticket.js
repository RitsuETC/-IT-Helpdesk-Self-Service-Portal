const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");
const authorizeRole = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT t.*, u.ruangan AS nama_ruangan, k.nama_kategori
       FROM tiket t
       JOIN unit u ON u.id = t.ruangan
       JOIN knowledge_kategori k ON k.id = t.categori
       WHERE t.akun = $1 ORDER BY t.id DESC`,
      [req.user.id]
    );
    res.json({ message: "Data tiket berhasil diambil", data: rows });
  } catch (error) {
    console.error("Get ticket error:", error);
    res.status(500).json({ message: "Gagal mengambil data tiket", error: error.message });
  }
});

router.get("/meta/options", verifyToken, async (_req, res) => {
  try {
    const [categories, rooms, priorities] = await Promise.all([
      db.query("SELECT id, nama_kategori FROM knowledge_kategori ORDER BY nama_kategori"),
      db.query("SELECT id, ruangan FROM unit ORDER BY ruangan"),
      db.query("SELECT level FROM level ORDER BY level"),
    ]);
    res.json({ data: { categories: categories.rows, rooms: rooms.rows, priorities: priorities.rows } });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil pilihan tiket", error: error.message });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const { judul, kategori, ruangan, prioritas, deskripsi } = req.body;
    if (!judul?.trim() || !kategori || !ruangan || !prioritas || !deskripsi?.trim()) {
      return res.status(400).json({ message: "Semua data tiket wajib diisi" });
    }
    const { rows } = await db.query(
      `INSERT INTO tiket (judul, categori, ruangan, prioritas, deskripsi, akun)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, judul, categori AS kategori, ruangan, prioritas, deskripsi, akun, status`,
      [judul.trim(), kategori, ruangan, prioritas, deskripsi.trim(), req.user.id]
    );
    res.status(201).json({ message: "Tiket berhasil dibuat", ticket: rows[0] });
  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json({ message: `Gagal membuat tiket: ${error.message}`, error: error.message });
  }
});

router.patch("/:id/assign", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    const { teknisi } = req.body;
    if (!teknisi) return res.status(400).json({ message: "ID teknisi wajib diisi" });
    const technician = await db.query('SELECT id, "Nama" AS nama, email, role FROM login WHERE id = $1 AND role = $2 LIMIT 1', [teknisi, "teknisi"]);
    if (!technician.rowCount) return res.status(400).json({ message: "Akun yang dipilih bukan teknisi" });
    const ticket = await db.query("SELECT id, status FROM tiket WHERE id = $1 LIMIT 1", [req.params.id]);
    if (!ticket.rowCount) return res.status(404).json({ message: "Tiket tidak ditemukan" });
    if (ticket.rows[0].status !== "NEW") return res.status(400).json({ message: `Tiket tidak dapat di-assign karena status saat ini ${ticket.rows[0].status}` });
    await db.query("UPDATE tiket SET teknisi = $1, status = 'ASSIGNED' WHERE id = $2", [teknisi, req.params.id]);
    res.json({ message: "Teknisi berhasil ditugaskan", data: { tiket_id: Number(req.params.id), teknisi: technician.rows[0], status: "ASSIGNED" } });
  } catch (error) { res.status(500).json({ message: "Gagal menugaskan teknisi", error: error.message }); }
});

router.patch("/:id/start", verifyToken, authorizeRole("teknisi"), async (req, res) => {
  try {
    const ticket = await db.query("SELECT id, teknisi, status FROM tiket WHERE id = $1 LIMIT 1", [req.params.id]);
    if (!ticket.rowCount) return res.status(404).json({ message: "Tiket tidak ditemukan" });
    if (ticket.rows[0].teknisi !== req.user.id) return res.status(403).json({ message: "Tiket ini bukan ditugaskan kepada Anda" });
    if (ticket.rows[0].status !== "ASSIGNED") return res.status(400).json({ message: `Tiket tidak dapat dimulai karena status saat ini ${ticket.rows[0].status}` });
    await db.query("UPDATE tiket SET status = 'IN_PROGRESS' WHERE id = $1", [req.params.id]);
    res.json({ message: "Tiket berhasil dimulai", data: { tiket_id: Number(req.params.id), teknisi_id: req.user.id, status: "IN_PROGRESS" } });
  } catch (error) { res.status(500).json({ message: "Gagal memulai tiket", error: error.message }); }
});

router.patch("/:id/resolve", verifyToken, authorizeRole("teknisi"), async (req, res) => {
  try {
    const { solusi } = req.body;
    if (!solusi?.trim()) return res.status(400).json({ message: "Solusi wajib diisi" });
    const ticket = await db.query("SELECT id, teknisi, status FROM tiket WHERE id = $1 LIMIT 1", [req.params.id]);
    if (!ticket.rowCount) return res.status(404).json({ message: "Tiket tidak ditemukan" });
    if (ticket.rows[0].teknisi !== req.user.id) return res.status(403).json({ message: "Tiket ini bukan ditugaskan kepada Anda" });
    if (ticket.rows[0].status !== "IN_PROGRESS") return res.status(400).json({ message: `Tiket tidak dapat diselesaikan karena status saat ini ${ticket.rows[0].status}` });
    await db.query("UPDATE tiket SET solusi = $1, status = 'RESOLVED' WHERE id = $2", [solusi.trim(), req.params.id]);
    res.json({ message: "Tiket berhasil diselesaikan", data: { tiket_id: Number(req.params.id), teknisi_id: req.user.id, solusi: solusi.trim(), status: "RESOLVED" } });
  } catch (error) { res.status(500).json({ message: "Gagal menyelesaikan tiket", error: error.message }); }
});

router.patch("/:id/close", verifyToken, async (req, res) => {
  try {
    const ticket = await db.query("SELECT id, akun, status FROM tiket WHERE id = $1 LIMIT 1", [req.params.id]);
    if (!ticket.rowCount) return res.status(404).json({ message: "Tiket tidak ditemukan" });
    if (ticket.rows[0].akun !== req.user.id) return res.status(403).json({ message: "Anda tidak memiliki akses untuk menutup tiket ini" });
    if (ticket.rows[0].status !== "RESOLVED") return res.status(400).json({ message: `Tiket tidak dapat ditutup karena status saat ini ${ticket.rows[0].status}` });
    await db.query("UPDATE tiket SET status = 'CLOSED' WHERE id = $1", [req.params.id]);
    res.json({ message: "Tiket berhasil ditutup", data: { tiket_id: Number(req.params.id), akun_id: req.user.id, status: "CLOSED" } });
  } catch (error) { res.status(500).json({ message: "Gagal menutup tiket", error: error.message }); }
});

module.exports = router;
