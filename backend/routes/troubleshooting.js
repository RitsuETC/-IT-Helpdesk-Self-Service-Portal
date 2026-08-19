const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// Membuat data troubleshooting
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      id_tiket,
      lampiran,
      tindakan,
      hasil
    } = req.body;

    // Validasi input
    if (
      !id_tiket ||
      !lampiran ||
      !tindakan ||
      !hasil
    ) {
      return res.status(400).json({
        message: "Semua data troubleshooting wajib diisi"
      });
    }

    // Cek apakah tiket ada
    const [tickets] = await db.query(
      "SELECT id FROM tiket WHERE id = ? LIMIT 1",
      [id_tiket]
    );

    if (tickets.length === 0) {
      return res.status(404).json({
        message: "Tiket tidak ditemukan"
      });
    }

    // Simpan troubleshooting
    const [result] = await db.query(
      `INSERT INTO troubleshooting
      (id_tiket, lampiran, tindakan, hasil)
      VALUES (?, ?, ?, ?)`,
      [
        id_tiket,
        lampiran,
        tindakan,
        hasil
      ]
    );

    res.status(201).json({
      message: "Data troubleshooting berhasil dibuat",
      data: {
        id: result.insertId,
        id_tiket,
        lampiran,
        tindakan,
        hasil
      }
    });

  } catch (error) {
    console.error("Create troubleshooting error:", error);

    res.status(500).json({
      message: "Gagal membuat data troubleshooting",
      error: error.message
    });
  }
});


// Melihat troubleshooting berdasarkan tiket
router.get("/:id_tiket", verifyToken, async (req, res) => {
  try {
    const { id_tiket } = req.params;

    const [rows] = await db.query(
      `SELECT *
       FROM troubleshooting
       WHERE id_tiket = ?
       ORDER BY id ASC`,
      [id_tiket]
    );

    res.json({
      message: "Data troubleshooting berhasil diambil",
      data: rows
    });

  } catch (error) {
    console.error("Get troubleshooting error:", error);

    res.status(500).json({
      message: "Gagal mengambil data troubleshooting",
      error: error.message
    });
  }
});

module.exports = router;