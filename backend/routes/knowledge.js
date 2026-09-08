const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");
const authorizeRole = require("../middleware/roleMiddleware");

const router = express.Router();
let hasVideoUrl;
let hasTags;

// Cek keberadaan kolom video_url
async function videoColumn() {
  if (hasVideoUrl !== undefined) return hasVideoUrl;
  const result = await db.query(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'knowledge_article' AND column_name = 'video_url'"
  );
  hasVideoUrl = Boolean(result.rowCount);
  return hasVideoUrl;
}

// Cek keberadaan kolom tags
async function tagsColumn() {
  if (hasTags !== undefined) return hasTags;
  const result = await db.query(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'knowledge_article' AND column_name = 'tags'"
  );
  hasTags = Boolean(result.rowCount);
  return hasTags;
}

function articleQuery(video, tags, where = "") {
  return `SELECT ka.id, ka.id_categori, kc.nama_kategori, ka.judul, ka.content,
    ${video ? "ka.video_url" : "NULL::text AS video_url"},
    ${tags ? "ka.tags" : "NULL::text AS tags"},
    ka.level, ka.helpful, ka.unhelpful
    FROM knowledge_article ka 
    LEFT JOIN knowledge_kategori kc ON kc.id = ka.id_categori ${where}`;
}

function normalizeTags(tags) {
  const values = Array.isArray(tags) ? tags : String(tags || '').split(',');
  return [...new Set(values.map((tag) => String(tag).trim()).filter(Boolean))].join(', ');
}

router.get("/", async (_req, res) => {
  try {
    const video = await videoColumn();
    const tags = await tagsColumn();
    const { rows } = await db.query(`${articleQuery(video, tags)} ORDER BY ka.id ASC`);
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
    const tags = await tagsColumn();
    const { rows } = await db.query(`${articleQuery(video, tags, "WHERE ka.id = $1")} LIMIT 1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Knowledge article tidak ditemukan" });
    res.json({ message: "Knowledge article berhasil ditemukan", data: rows[0] });
  } catch (error) { res.status(500).json({ message: "Gagal mengambil knowledge article", error: error.message }); }
});

router.post("/", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    let { id_categori, tags, judul, content, level = "Level_1", video_url = null } = req.body;
    tags = normalizeTags(tags);
    
    // Jika id_categori tidak dikirim oleh frontend, ambil kategori pertama dari database sebagai fallback
    if (!id_categori) {
      const catCheck = await db.query("SELECT id FROM knowledge_kategori ORDER BY id ASC LIMIT 1");
      if (catCheck.rows.length) id_categori = catCheck.rows[0].id;
    }

    if (!id_categori || !judul?.trim() || !content?.trim()) {
      return res.status(400).json({ message: "Kategori, judul, dan isi artikel wajib diisi" });
    }

    const video = await videoColumn();
    const hasTagsCol = await tagsColumn();

    const fields = ["id_categori", "judul", "content", "level"];
    const values = [id_categori, judul.trim(), content.trim(), level];
    const placeholders = ["$1", "$2", "$3", "$4"];

    if (video) {
      fields.push("video_url");
      values.push(video_url || null);
      placeholders.push(`$${values.length}`);
    }

    if (hasTagsCol) {
      fields.push("tags");
      values.push(tags);
      placeholders.push(`$${values.length}`);
    }

    const query = `INSERT INTO knowledge_article (${fields.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING id`;
    const result = await db.query(query, values);

    res.status(201).json({ message: "Knowledge berhasil ditambahkan", data: result.rows[0] });
  } catch (error) { res.status(500).json({ message: "Gagal menambahkan knowledge", error: error.message }); }
});

router.put("/:id", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    let { id_categori, tags, judul, content, level = "Level_1", video_url = null } = req.body;
    tags = normalizeTags(tags);

    if (!id_categori) {
      const catCheck = await db.query("SELECT id FROM knowledge_kategori ORDER BY id ASC LIMIT 1");
      if (catCheck.rows.length) id_categori = catCheck.rows[0].id;
    }

    if (!id_categori || !judul?.trim() || !content?.trim()) {
      return res.status(400).json({ message: "Kategori, judul, dan isi artikel wajib diisi" });
    }

    const video = await videoColumn();
    const hasTagsCol = await tagsColumn();

    const updates = ["id_categori = $1", "judul = $2", "content = $3", "level = $4"];
    const values = [id_categori, judul.trim(), content.trim(), level];

    if (video) {
      values.push(video_url || null);
      updates.push(`video_url = $${values.length}`);
    }

    if (hasTagsCol) {
      values.push(tags);
      updates.push(`tags = $${values.length}`);
    }

    values.push(req.params.id);
    const query = `UPDATE knowledge_article SET ${updates.join(", ")} WHERE id = $${values.length}`;
    const result = await db.query(query, values);

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