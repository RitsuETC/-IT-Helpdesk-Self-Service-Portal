const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");
const authorizeRole = require("../middleware/roleMiddleware");

const router = express.Router();
let hasVideoUrl;

async function videoColumn() {
  if (hasVideoUrl !== undefined) return hasVideoUrl;
  const result = await db.query(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'knowledge_article' AND column_name = 'video_url'"
  );
  hasVideoUrl = Boolean(result.rowCount);
  return hasVideoUrl;
}

function articleQuery(video, where = "") {
  return `SELECT ka.id, ka.id_categori, kc.nama_kategori, ka.judul, ka.content,
    ${video ? "ka.video_url" : "NULL::text AS video_url"}, ka.level, ka.helpful, ka.unhelpful
    FROM knowledge_article ka JOIN knowledge_kategori kc ON kc.id = ka.id_categori ${where}`;
}

router.get("/", async (_req, res) => {
  try {
    const video = await videoColumn();
    const { rows } = await db.query(`${articleQuery(video)} ORDER BY ka.id ASC`);
    res.json({ message: "Data knowledge article berhasil diambil", data: rows });
  } catch (error) { res.status(500).json({ message: "Gagal mengambil knowledge article", error: error.message }); }
});

router.get("/categories", async (_req, res) => {
  try {
    const { rows } = await db.query("SELECT id, nama_kategori FROM knowledge_kategori ORDER BY nama_kategori ASC");
    res.json({ data: rows });
  } catch (error) { res.status(500).json({ message: "Gagal mengambil kategori", error: error.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const video = await videoColumn();
    const { rows } = await db.query(`${articleQuery(video, "WHERE ka.id = $1")} LIMIT 1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Knowledge article tidak ditemukan" });
    res.json({ message: "Knowledge article berhasil ditemukan", data: rows[0] });
  } catch (error) { res.status(500).json({ message: "Gagal mengambil knowledge article", error: error.message }); }
});

router.post("/", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    const { id_categori, judul, content, level = "Level_1", video_url = null } = req.body;
    if (!id_categori || !judul?.trim() || !content?.trim()) return res.status(400).json({ message: "Kategori, judul, dan isi artikel wajib diisi" });
    const video = await videoColumn();
    if (video_url && !video) return res.status(400).json({ message: "Kolom video_url belum ada di Supabase. Jalankan migration schema terlebih dahulu." });
    const result = await db.query(
      video
        ? "INSERT INTO knowledge_article (id_categori, judul, content, level, video_url) VALUES ($1, $2, $3, $4, $5) RETURNING id"
        : "INSERT INTO knowledge_article (id_categori, judul, content, level) VALUES ($1, $2, $3, $4) RETURNING id",
      video ? [id_categori, judul.trim(), content.trim(), level, video_url || null] : [id_categori, judul.trim(), content.trim(), level]
    );
    res.status(201).json({ message: "Knowledge berhasil ditambahkan", data: result.rows[0] });
  } catch (error) { res.status(500).json({ message: "Gagal menambahkan knowledge", error: error.message }); }
});

router.put("/:id", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    const { id_categori, judul, content, level = "Level_1", video_url = null } = req.body;
    if (!id_categori || !judul?.trim() || !content?.trim()) return res.status(400).json({ message: "Kategori, judul, dan isi artikel wajib diisi" });
    const video = await videoColumn();
    if (video_url && !video) return res.status(400).json({ message: "Kolom video_url belum ada di Supabase. Jalankan migration schema terlebih dahulu." });
    const result = await db.query(
      video
        ? "UPDATE knowledge_article SET id_categori = $1, judul = $2, content = $3, level = $4, video_url = $5 WHERE id = $6"
        : "UPDATE knowledge_article SET id_categori = $1, judul = $2, content = $3, level = $4 WHERE id = $5",
      video ? [id_categori, judul.trim(), content.trim(), level, video_url || null, req.params.id] : [id_categori, judul.trim(), content.trim(), level, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ message: "Knowledge tidak ditemukan" });
    res.json({ message: "Knowledge berhasil diperbarui" });
  } catch (error) { res.status(500).json({ message: "Gagal memperbarui knowledge", error: error.message }); }
});

router.delete("/:id", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    const result = await db.query("DELETE FROM knowledge_article WHERE id = $1", [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: "Knowledge tidak ditemukan" });
    res.json({ message: "Knowledge berhasil dihapus" });
  } catch (error) { res.status(500).json({ message: "Gagal menghapus knowledge", error: error.message }); }
});

module.exports = router;
