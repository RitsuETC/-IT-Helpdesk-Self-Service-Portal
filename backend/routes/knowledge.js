const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");
const authorizeRole = require("../middleware/roleMiddleware");

const router = express.Router();
let hasVideoUrl;

async function videoColumn() {
  if (hasVideoUrl !== undefined) return hasVideoUrl;
  const [columns] = await db.query("SHOW COLUMNS FROM knowledge_article");
  hasVideoUrl = columns.some((column) => column.Field === "video_url");
  return hasVideoUrl;
}

// GET semua artikel
router.get("/", verifyToken, async (req, res) => {
  try {
    const video = await videoColumn();
    const [rows] = await db.query(`
      SELECT 
        ka.id,
        ka.id_categori,
        kc.nama_kategori,
        ka.judul,
        ka.content,
        ${video ? "ka.video_url" : "NULL AS video_url"},
        ka.level,
        ka.helpful,
        ka.unhelpful
      FROM knowledge_article ka
      JOIN knowledge_kategori kc
        ON ka.id_categori = kc.id
      ORDER BY ka.id ASC
    `);

    res.json({
      message: "Data knowledge article berhasil diambil",
      data: rows
    });

  } catch (error) {
    console.error("Get knowledge article error:", error);

    res.status(500).json({
      message: "Gagal mengambil knowledge article",
      error: error.message
    });
  }
});

router.get("/categories", verifyToken, async (_req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nama_kategori FROM knowledge_kategori ORDER BY nama_kategori ASC"
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil kategori", error: error.message });
  }
});

// GET artikel berdasarkan ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const video = await videoColumn();

    const [rows] = await db.query(`
      SELECT 
        ka.id,
        ka.id_categori,
        kc.nama_kategori,
        ka.judul,
        ka.content,
        ${video ? "ka.video_url" : "NULL AS video_url"},
        ka.level,
        ka.helpful,
        ka.unhelpful
      FROM knowledge_article ka
      JOIN knowledge_kategori kc
        ON ka.id_categori = kc.id
      WHERE ka.id = ?
      LIMIT 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Knowledge article tidak ditemukan"
      });
    }

    res.json({
      message: "Knowledge article berhasil ditemukan",
      data: rows[0]
    });

  } catch (error) {
    console.error("Get knowledge article by ID error:", error);

    res.status(500).json({
      message: "Gagal mengambil knowledge article",
      error: error.message
    });
  }
});

router.post("/", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    const video = await videoColumn();
    const { id_categori, judul, content, level = "Level_1", video_url = null } = req.body;
    if (!id_categori || !judul?.trim() || !content?.trim()) {
      return res.status(400).json({ message: "Kategori, judul, dan isi artikel wajib diisi" });
    }
    if (video_url && !video) return res.status(400).json({ message: "Link YouTube belum dapat disimpan. Jalankan migration 001_knowledge_video_url.sql terlebih dahulu." });
    const [result] = await db.query(
      video
        ? "INSERT INTO knowledge_article (id_categori, judul, content, level, video_url) VALUES (?, ?, ?, ?, ?)"
        : "INSERT INTO knowledge_article (id_categori, judul, content, level) VALUES (?, ?, ?, ?)",
      video ? [id_categori, judul.trim(), content.trim(), level, video_url || null] : [id_categori, judul.trim(), content.trim(), level]
    );
    res.status(201).json({ message: "Knowledge berhasil ditambahkan", data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ message: "Gagal menambahkan knowledge", error: error.message });
  }
});

router.put("/:id", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    const video = await videoColumn();
    const { id_categori, judul, content, level = "Level_1", video_url = null } = req.body;
    if (!id_categori || !judul?.trim() || !content?.trim()) {
      return res.status(400).json({ message: "Kategori, judul, dan isi artikel wajib diisi" });
    }
    if (video_url && !video) return res.status(400).json({ message: "Link YouTube belum dapat disimpan. Jalankan migration 001_knowledge_video_url.sql terlebih dahulu." });
    const [result] = await db.query(
      video
        ? "UPDATE knowledge_article SET id_categori = ?, judul = ?, content = ?, level = ?, video_url = ? WHERE id = ?"
        : "UPDATE knowledge_article SET id_categori = ?, judul = ?, content = ?, level = ? WHERE id = ?",
      video ? [id_categori, judul.trim(), content.trim(), level, video_url || null, req.params.id] : [id_categori, judul.trim(), content.trim(), level, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Knowledge tidak ditemukan" });
    res.json({ message: "Knowledge berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui knowledge", error: error.message });
  }
});

router.delete("/:id", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM knowledge_article WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Knowledge tidak ditemukan" });
    res.json({ message: "Knowledge berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus knowledge", error: error.message });
  }
});

module.exports = router;
