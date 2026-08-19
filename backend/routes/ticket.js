const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");
const authorizeRole = require("../middleware/roleMiddleware");

const router = express.Router();

// GET tiket milik user yang sedang login
router.get("/", verifyToken, async (req, res) => {
  try {
    const akun = req.user.id;

    const [rows] = await db.query(
      `SELECT * FROM tiket WHERE akun = ? ORDER BY id DESC`,
      [akun]
    );

    res.status(200).json({
      message: "Data tiket berhasil diambil",
      data: rows,
    });
  } catch (error) {
    console.error("Get ticket error:", error);

    res.status(500).json({
      message: "Gagal mengambil data tiket",
      error: error.message,
    });
  }
});

// POST tiket
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      judul,
      categori,
      ruangan,
      prioritas,
      deskripsi,
    } = req.body;

    // Validasi input
    if (
      !judul ||
      !categori ||
      !ruangan ||
      !prioritas ||
      !deskripsi
    ) {
      return res.status(400).json({
        message: "Semua data tiket wajib diisi",
      });
    }

    // Akun diambil dari JWT
    const akun = req.user.id;

    const [result] = await db.query(
      `INSERT INTO tiket 
      (judul, categori, ruangan, prioritas, deskripsi, akun)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        judul,
        categori,
        ruangan,
        prioritas,
        deskripsi,
        akun,
      ]
    );

    res.status(201).json({
      message: "Tiket berhasil dibuat",
      ticket: {
        id: result.insertId,
        judul,
        categori,
        ruangan,
        prioritas,
        deskripsi,
        akun,
      },
    });
  } catch (error) {
    console.error("Create ticket error:", error);

    res.status(500).json({
      message: "Gagal membuat tiket",
      error: error.message,
    });
  }
});

// ADMIN: assign teknisi ke tiket
router.patch(
  "/:id/assign",
  verifyToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const ticketId = req.params.id;
      const { teknisi } = req.body;

      // Validasi ID teknisi
      if (!teknisi) {
        return res.status(400).json({
          message: "ID teknisi wajib diisi",
        });
      }

      // Pastikan akun yang dipilih benar-benar teknisi
      const [teknisiRows] = await db.query(
        `SELECT id, Nama, email, role
         FROM login
         WHERE id = ? AND role = 'teknisi'
         LIMIT 1`,
        [teknisi]
      );

      if (teknisiRows.length === 0) {
        return res.status(400).json({
          message: "Akun yang dipilih bukan teknisi",
        });
      }

      // Cari tiket
      const [ticketRows] = await db.query(
        `SELECT id, status
         FROM tiket
         WHERE id = ?
         LIMIT 1`,
        [ticketId]
      );

      if (ticketRows.length === 0) {
        return res.status(404).json({
          message: "Tiket tidak ditemukan",
        });
      }

      const ticket = ticketRows[0];

      // Assignment hanya boleh dilakukan pada tiket NEW
      if (ticket.status !== "NEW") {
        return res.status(400).json({
          message: `Tiket tidak dapat di-assign karena status saat ini ${ticket.status}`,
        });
      }

      // Simpan teknisi dan ubah status
      await db.query(
        `UPDATE tiket
         SET teknisi = ?, status = 'ASSIGNED'
         WHERE id = ?`,
        [teknisi, ticketId]
      );

      res.status(200).json({
        message: "Teknisi berhasil ditugaskan",
        data: {
          tiket_id: ticketId,
          teknisi: teknisiRows[0],
          status: "ASSIGNED",
        },
      });
    } catch (error) {
      console.error("Assign teknisi error:", error);

      res.status(500).json({
        message: "Gagal menugaskan teknisi",
        error: error.message,
      });
    }
  }
);

// TEKNISI: mulai mengerjakan tiket
router.patch(
  "/:id/start",
  verifyToken,
  authorizeRole("teknisi"),
  async (req, res) => {
    try {
      const ticketId = req.params.id;
      const teknisiId = req.user.id;

      // Cari tiket
      const [ticketRows] = await db.query(
        `SELECT id, teknisi, status
         FROM tiket
         WHERE id = ?
         LIMIT 1`,
        [ticketId]
      );

      if (ticketRows.length === 0) {
        return res.status(404).json({
          message: "Tiket tidak ditemukan",
        });
      }

      const ticket = ticketRows[0];

      // Pastikan tiket ditugaskan kepada teknisi yang sedang login
      if (ticket.teknisi !== teknisiId) {
        return res.status(403).json({
          message: "Tiket ini bukan ditugaskan kepada Anda",
        });
      }

      // Tiket harus berstatus ASSIGNED
      if (ticket.status !== "ASSIGNED") {
        return res.status(400).json({
          message: `Tiket tidak dapat dimulai karena status saat ini ${ticket.status}`,
        });
      }

      // Ubah status menjadi IN_PROGRESS
      await db.query(
        `UPDATE tiket
         SET status = 'IN_PROGRESS'
         WHERE id = ?`,
        [ticketId]
      );

      res.status(200).json({
        message: "Tiket berhasil dimulai",
        data: {
          tiket_id: ticketId,
          teknisi_id: teknisiId,
          status: "IN_PROGRESS",
        },
      });
    } catch (error) {
      console.error("Start ticket error:", error);

      res.status(500).json({
        message: "Gagal memulai tiket",
        error: error.message,
      });
    }
  }
);

// TEKNISI: menyelesaikan tiket
router.patch(
  "/:id/resolve",
  verifyToken,
  authorizeRole("teknisi"),
  async (req, res) => {
    try {
      const ticketId = req.params.id;
      const teknisiId = req.user.id;
      const { solusi } = req.body;

      // Validasi solusi
      if (!solusi || solusi.trim() === "") {
        return res.status(400).json({
          message: "Solusi wajib diisi",
        });
      }

      // Cari tiket
      const [ticketRows] = await db.query(
        `SELECT id, teknisi, status
         FROM tiket
         WHERE id = ?
         LIMIT 1`,
        [ticketId]
      );

      if (ticketRows.length === 0) {
        return res.status(404).json({
          message: "Tiket tidak ditemukan",
        });
      }

      const ticket = ticketRows[0];

      // Pastikan tiket ditugaskan kepada teknisi yang sedang login
      if (ticket.teknisi !== teknisiId) {
        return res.status(403).json({
          message: "Tiket ini bukan ditugaskan kepada Anda",
        });
      }

      // Tiket harus berstatus IN_PROGRESS
      if (ticket.status !== "IN_PROGRESS") {
        return res.status(400).json({
          message: `Tiket tidak dapat diselesaikan karena status saat ini ${ticket.status}`,
        });
      }

      // Simpan solusi dan ubah status menjadi RESOLVED
      await db.query(
        `UPDATE tiket
         SET solusi = ?, status = 'RESOLVED'
         WHERE id = ?`,
        [solusi.trim(), ticketId]
      );

      res.status(200).json({
        message: "Tiket berhasil diselesaikan",
        data: {
          tiket_id: ticketId,
          teknisi_id: teknisiId,
          solusi: solusi.trim(),
          status: "RESOLVED",
        },
      });
    } catch (error) {
      console.error("Resolve ticket error:", error);

      res.status(500).json({
        message: "Gagal menyelesaikan tiket",
        error: error.message,
      });
    }
  }
);

// USER: menutup tiket setelah masalah dinyatakan selesai
router.patch(
  "/:id/close",
  verifyToken,
  async (req, res) => {
    try {
      const ticketId = req.params.id;
      const akunId = req.user.id;

      // Cari tiket
      const [ticketRows] = await db.query(
        `SELECT id, akun, status
         FROM tiket
         WHERE id = ?
         LIMIT 1`,
        [ticketId]
      );

      if (ticketRows.length === 0) {
        return res.status(404).json({
          message: "Tiket tidak ditemukan",
        });
      }

      const ticket = ticketRows[0];

      // Pastikan tiket milik user yang sedang login
      if (ticket.akun !== akunId) {
        return res.status(403).json({
          message: "Anda tidak memiliki akses untuk menutup tiket ini",
        });
      }

      // Tiket harus berstatus RESOLVED
      if (ticket.status !== "RESOLVED") {
        return res.status(400).json({
          message: `Tiket tidak dapat ditutup karena status saat ini ${ticket.status}`,
        });
      }

      // Ubah status menjadi CLOSED
      await db.query(
        `UPDATE tiket
         SET status = 'CLOSED'
         WHERE id = ?`,
        [ticketId]
      );

      res.status(200).json({
        message: "Tiket berhasil ditutup",
        data: {
          tiket_id: ticketId,
          akun_id: akunId,
          status: "CLOSED",
        },
      });
    } catch (error) {
      console.error("Close ticket error:", error);

      res.status(500).json({
        message: "Gagal menutup tiket",
        error: error.message,
      });
    }
  }
);

module.exports = router;