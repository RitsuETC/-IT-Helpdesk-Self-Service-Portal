const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// ======================================================
// POST membuat data troubleshooting
// ADMIN  -> boleh membuat pada tiket apa pun
// TEKNISI -> hanya tiket yang ditugaskan kepadanya
// USER   -> tidak boleh
// ======================================================
router.post("/", verifyToken, async (req, res) => {
  try {
    const { id_tiket, lampiran, tindakan, hasil } = req.body;

    if (!id_tiket || !tindakan?.trim() || !hasil?.trim()) {
      return res.status(400).json({
        message: "ID tiket, tindakan, dan hasil wajib diisi",
      });
    }

    // Cek tiket
    const ticket = await db.query(
      `SELECT id, akun, teknisi, status
       FROM tiket
       WHERE id = $1
       LIMIT 1`,
      [id_tiket]
    );

    if (!ticket.rowCount) {
      return res.status(404).json({
        message: "Tiket tidak ditemukan",
      });
    }

    const tiket = ticket.rows[0];

    // USER tidak boleh membuat tindakan
    if (req.user.role === "user") {
      return res.status(403).json({
        message: "Anda tidak memiliki akses untuk membuat tindakan",
      });
    }

    // TEKNISI hanya boleh menangani tiket yang ditugaskan kepadanya
    if (req.user.role === "teknisi") {
      if (tiket.teknisi !== req.user.id) {
        return res.status(403).json({
          message: "Tiket ini bukan ditugaskan kepada Anda",
        });
      }
    }

    // Role selain admin/teknisi
    if (req.user.role !== "admin" && req.user.role !== "teknisi") {
      return res.status(403).json({
        message: "Role tidak memiliki akses untuk membuat tindakan",
      });
    }

    const result = await db.query(
      `INSERT INTO troubleshooting
        (id_tiket, lampiran, tindakan, hasil)
       VALUES ($1, $2, $3, $4)
       RETURNING id, id_tiket, lampiran, tindakan, hasil`,
      [
        id_tiket,
        // DB expects integer for lampiran; use 0 when not provided
        lampiran !== undefined && lampiran !== null ? lampiran : 0,
        tindakan.trim(),
        hasil.trim(),
      ]
    );

    res.status(201).json({
      message: "Data troubleshooting berhasil dibuat",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create troubleshooting error:", error);

    res.status(500).json({
      message: "Gagal membuat data troubleshooting",
      error: error.message,
    });
  }
});

// ======================================================
// GET troubleshooting berdasarkan tiket
//
// ADMIN    -> semua tiket
// TEKNISI  -> tiket yang ditugaskan kepadanya
// USER     -> hanya tiket miliknya
// ======================================================
router.get("/:id_tiket", verifyToken, async (req, res) => {
  try {
    const ticket = await db.query(
      `SELECT id, akun, teknisi
       FROM tiket
       WHERE id = $1
       LIMIT 1`,
      [req.params.id_tiket]
    );

    if (!ticket.rowCount) {
      return res.status(404).json({
        message: "Tiket tidak ditemukan",
      });
    }

    const tiket = ticket.rows[0];

    // ADMIN boleh melihat semua troubleshooting
    if (req.user.role === "admin") {
      // lanjut
    }

    // USER hanya boleh melihat troubleshooting tiket miliknya
    else if (req.user.role === "user") {
      if (tiket.akun !== req.user.id) {
        return res.status(403).json({
          message:
            "Anda tidak memiliki akses melihat troubleshooting tiket ini",
        });
      }
    }

    // TEKNISI hanya boleh melihat troubleshooting tiket yang ditugaskan
    else if (req.user.role === "teknisi") {
      if (tiket.teknisi !== req.user.id) {
        return res.status(403).json({
          message: "Tiket ini bukan ditugaskan kepada Anda",
        });
      }
    }

    // Role tidak dikenal
    else {
      return res.status(403).json({
        message: "Role tidak memiliki akses melihat troubleshooting",
      });
    }

    const { rows } = await db.query(
      `SELECT
        id,
        id_tiket,
        lampiran,
        tindakan,
        hasil
       FROM troubleshooting
       WHERE id_tiket = $1
       ORDER BY id ASC`,
      [req.params.id_tiket]
    );

    res.json({
      message: "Data troubleshooting berhasil diambil",
      data: rows,
    });
  } catch (error) {
    console.error("Get troubleshooting error:", error);

    res.status(500).json({
      message: "Gagal mengambil data troubleshooting",
      error: error.message,
    });
  }
});

// ======================================================
// PATCH update data troubleshooting
//
// ADMIN   -> boleh update
// TEKNISI -> hanya troubleshooting pada tiket yang
//            ditugaskan kepadanya
// USER    -> tidak boleh
// ======================================================
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const { lampiran, tindakan, hasil } = req.body;

    // Minimal satu data harus dikirim
    if (
      lampiran === undefined &&
      tindakan === undefined &&
      hasil === undefined
    ) {
      return res.status(400).json({
        message: "Tidak ada data yang diperbarui",
      });
    }

    // Cari troubleshooting sekaligus tiketnya
    const troubleshooting = await db.query(
      `SELECT
        tr.id,
        tr.id_tiket,
        tr.lampiran,
        tr.tindakan,
        tr.hasil,
        t.akun,
        t.teknisi
       FROM troubleshooting tr
       JOIN tiket t
         ON t.id = tr.id_tiket
       WHERE tr.id = $1
       LIMIT 1`,
      [req.params.id]
    );

    if (!troubleshooting.rowCount) {
      return res.status(404).json({
        message: "Data troubleshooting tidak ditemukan",
      });
    }

    const data = troubleshooting.rows[0];

    // USER tidak boleh update
    if (req.user.role === "user") {
      return res.status(403).json({
        message: "Anda tidak memiliki akses untuk mengubah tindakan",
      });
    }

    // TEKNISI hanya boleh update tiket yang ditugaskan kepadanya
    if (req.user.role === "teknisi") {
      if (data.teknisi !== req.user.id) {
        return res.status(403).json({
          message: "Tiket ini bukan ditugaskan kepada Anda",
        });
      }
    }

    // Hanya ADMIN dan TEKNISI
    if (req.user.role !== "admin" && req.user.role !== "teknisi") {
      return res.status(403).json({
        message: "Role tidak memiliki akses untuk mengubah tindakan",
      });
    }

    // Nilai lama digunakan jika field tidak dikirim
    let updatedLampiran =
      lampiran !== undefined ? lampiran : data.lampiran;
    if (updatedLampiran === null || updatedLampiran === undefined) updatedLampiran = 0;

    const updatedTindakan =
      tindakan !== undefined ? tindakan.trim() : data.tindakan;

    const updatedHasil =
      hasil !== undefined ? hasil.trim() : data.hasil;

    // Tindakan dan hasil tidak boleh kosong
    if (!updatedTindakan || !updatedHasil) {
      return res.status(400).json({
        message: "Tindakan dan hasil tidak boleh kosong",
      });
    }

    const result = await db.query(
      `UPDATE troubleshooting
       SET
         lampiran = $1,
         tindakan = $2,
         hasil = $3
       WHERE id = $4
       RETURNING
         id,
         id_tiket,
         lampiran,
         tindakan,
         hasil`,
      [
        updatedLampiran,
        updatedTindakan,
        updatedHasil,
        req.params.id,
      ]
    );

    res.json({
      message: "Data troubleshooting berhasil diperbarui",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update troubleshooting error:", error);

    res.status(500).json({
      message: "Gagal memperbarui data troubleshooting",
      error: error.message,
    });
  }
});

module.exports = router;