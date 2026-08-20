const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.post("/", verifyToken, async (req, res) => {
  try {
    const { id_tiket, lampiran, tindakan, hasil } = req.body;
    if (!id_tiket || !lampiran || !tindakan || !hasil) return res.status(400).json({ message: "Semua data troubleshooting wajib diisi" });
    const ticket = await db.query("SELECT id FROM tiket WHERE id = $1 LIMIT 1", [id_tiket]);
    if (!ticket.rowCount) return res.status(404).json({ message: "Tiket tidak ditemukan" });
    const result = await db.query(
      "INSERT INTO troubleshooting (id_tiket, lampiran, tindakan, hasil) VALUES ($1, $2, $3, $4) RETURNING id, id_tiket, lampiran, tindakan, hasil",
      [id_tiket, lampiran, tindakan, hasil]
    );
    res.status(201).json({ message: "Data troubleshooting berhasil dibuat", data: result.rows[0] });
  } catch (error) { res.status(500).json({ message: "Gagal membuat data troubleshooting", error: error.message }); }
});

router.get("/:id_tiket", verifyToken, async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM troubleshooting WHERE id_tiket = $1 ORDER BY id ASC", [req.params.id_tiket]);
    res.json({ message: "Data troubleshooting berhasil diambil", data: rows });
  } catch (error) { res.status(500).json({ message: "Gagal mengambil data troubleshooting", error: error.message }); }
});

module.exports = router;
