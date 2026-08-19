const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// GET semua artikel
router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        ka.id,
        ka.id_categori,
        kc.nama_kategori,
        ka.judul,
        ka.content,
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

// GET artikel berdasarkan ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(`
      SELECT 
        ka.id,
        ka.id_categori,
        kc.nama_kategori,
        ka.judul,
        ka.content,
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

module.exports = router;