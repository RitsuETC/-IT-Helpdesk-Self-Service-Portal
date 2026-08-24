const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");
const authorizeRole = require("../middleware/roleMiddleware");

const router = express.Router();

// GET tiket berdasarkan role
router.get("/", verifyToken, async (req, res) => {
  try {
    let query = `
      SELECT
        t.*,

        -- Data ruangan
        u.ruangan AS nama_ruangan,

        -- Data kategori
        k.nama_kategori,

        -- Data pelapor
        pelapor.id AS pelapor_id,
        pelapor."Nama" AS pelapor_nama,
        pelapor.email AS pelapor_email,

        -- Data teknisi
        teknisi_user.id AS teknisi_id,
        teknisi_user."Nama" AS teknisi_nama,
        teknisi_user.email AS teknisi_email

      FROM tiket t

      JOIN unit u
        ON u.id = t.ruangan

      JOIN knowledge_kategori k
        ON k.id = t.categori

      -- Pelapor
      LEFT JOIN login pelapor
        ON pelapor.id = t.akun

      -- Teknisi yang ditugaskan
      LEFT JOIN login teknisi_user
        ON teknisi_user.id = t.teknisi
        AND teknisi_user.role = 'teknisi'
    `;

    const params = [];

    // USER hanya melihat tiket miliknya sendiri
    if (req.user.role === "user") {
      query += ` WHERE t.akun = $1`;
      params.push(req.user.id);
    }

    // ADMIN dan TEKNISI dapat melihat seluruh tiket
    else if (
      req.user.role === "admin" ||
      req.user.role === "teknisi"
    ) {
      // Tidak menggunakan WHERE
    }

    // Role tidak dikenal
    else {
      return res.status(403).json({
        message: "Role tidak memiliki akses untuk melihat tiket",
      });
    }

    query += ` ORDER BY t.id DESC`;

    const { rows } = await db.query(query, params);

    res.json({
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

// GET pilihan kategori, ruangan, dan prioritas
router.get("/meta/options", verifyToken, async (_req, res) => {
  try {
    const [categories, rooms, priorities] = await Promise.all([
      db.query(
        "SELECT id, nama_kategori FROM knowledge_kategori ORDER BY nama_kategori"
      ),
      db.query(
        "SELECT id, ruangan FROM unit ORDER BY ruangan"
      ),
      db.query(
        "SELECT level FROM level ORDER BY level"
      ),
    ]);

    res.json({
      data: {
        categories: categories.rows,
        rooms: rooms.rows,
        priorities: priorities.rows,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil pilihan tiket",
      error: error.message,
    });
  }
});

// POST membuat tiket
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      judul,
      kategori,
      ruangan,
      prioritas,
      deskripsi,
    } = req.body;

    if (
      !judul?.trim() ||
      !kategori ||
      !ruangan ||
      !prioritas ||
      !deskripsi?.trim()
    ) {
      return res.status(400).json({
        message: "Semua data tiket wajib diisi",
      });
    }

    const { rows } = await db.query(
      `INSERT INTO tiket
        (judul, categori, ruangan, prioritas, deskripsi, akun)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
        id,
        judul,
        categori AS kategori,
        ruangan,
        prioritas,
        deskripsi,
        akun,
        status`,
      [
        judul.trim(),
        kategori,
        ruangan,
        prioritas,
        deskripsi.trim(),
        req.user.id,
      ]
    );

    res.status(201).json({
      message: "Tiket berhasil dibuat",
      ticket: rows[0],
    });
  } catch (error) {
    console.error("Create ticket error:", error);

    res.status(500).json({
      message: `Gagal membuat tiket: ${error.message}`,
      error: error.message,
    });
  }
});

// ADMIN dapat mengubah status semua tiket, TEKNISI hanya tiket yang ditugaskan kepadanya.
router.patch(
  "/:id/status",
  verifyToken,
  authorizeRole("admin", "teknisi"),
  async (req, res) => {
    try {
      const allowedStatuses = [
        "NEW",
        "ASSIGNED",
        "IN_PROGRESS",
        "WAITING",
        "RESOLVED",
        "CLOSED",
      ];
      const status = String(req.body.status || "").toUpperCase();

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Status tiket tidak valid" });
      }

      const ticket = await db.query(
        "SELECT id, teknisi FROM tiket WHERE id = $1 LIMIT 1",
        [req.params.id]
      );

      if (!ticket.rowCount) {
        return res.status(404).json({ message: "Tiket tidak ditemukan" });
      }

      if (
        req.user.role === "teknisi" &&
        Number(ticket.rows[0].teknisi) !== Number(req.user.id)
      ) {
        return res.status(403).json({
          message: "Tiket ini bukan ditugaskan kepada Anda",
        });
      }

      const { rows } = await db.query(
        "UPDATE tiket SET status = $1 WHERE id = $2 RETURNING id, status",
        [status, req.params.id]
      );

      res.json({ message: "Status tiket berhasil diperbarui", data: rows[0] });
    } catch (error) {
      res.status(500).json({
        message: "Gagal memperbarui status tiket",
        error: error.message,
      });
    }
  }
);

// ADMIN menugaskan teknisi
router.patch(
  "/:id/assign",
  verifyToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { teknisi } = req.body;

      if (!teknisi) {
        return res.status(400).json({
          message: "ID teknisi wajib diisi",
        });
      }

      const technician = await db.query(
        'SELECT id, "Nama" AS nama, email, role FROM login WHERE id = $1 AND role = $2 LIMIT 1',
        [teknisi, "teknisi"]
      );

      if (!technician.rowCount) {
        return res.status(400).json({
          message: "Akun yang dipilih bukan teknisi",
        });
      }

      const ticket = await db.query(
        "SELECT id, status FROM tiket WHERE id = $1 LIMIT 1",
        [req.params.id]
      );

      if (!ticket.rowCount) {
        return res.status(404).json({
          message: "Tiket tidak ditemukan",
        });
      }

      if (ticket.rows[0].status !== "NEW") {
        return res.status(400).json({
          message: `Tiket tidak dapat di-assign karena status saat ini ${ticket.rows[0].status}`,
        });
      }

      await db.query(
        "UPDATE tiket SET teknisi = $1, status = 'ASSIGNED' WHERE id = $2",
        [teknisi, req.params.id]
      );

      res.json({
        message: "Teknisi berhasil ditugaskan",
        data: {
          tiket_id: Number(req.params.id),
          teknisi: technician.rows[0],
          status: "ASSIGNED",
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Gagal menugaskan teknisi",
        error: error.message,
      });
    }
  }
);

// TEKNISI memulai tiket
router.patch(
  "/:id/start",
  verifyToken,
  authorizeRole("teknisi"),
  async (req, res) => {
    try {
      const ticket = await db.query(
        "SELECT id, teknisi, status FROM tiket WHERE id = $1 LIMIT 1",
        [req.params.id]
      );

      if (!ticket.rowCount) {
        return res.status(404).json({
          message: "Tiket tidak ditemukan",
        });
      }

      if (ticket.rows[0].teknisi !== req.user.id) {
        return res.status(403).json({
          message: "Tiket ini bukan ditugaskan kepada Anda",
        });
      }

      if (ticket.rows[0].status !== "ASSIGNED") {
        return res.status(400).json({
          message: `Tiket tidak dapat dimulai karena status saat ini ${ticket.rows[0].status}`,
        });
      }

      await db.query(
        "UPDATE tiket SET status = 'IN_PROGRESS' WHERE id = $1",
        [req.params.id]
      );

      res.json({
        message: "Tiket berhasil dimulai",
        data: {
          tiket_id: Number(req.params.id),
          teknisi_id: req.user.id,
          status: "IN_PROGRESS",
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Gagal memulai tiket",
        error: error.message,
      });
    }
  }
);

// TEKNISI menyelesaikan tiket
router.patch(
  "/:id/resolve",
  verifyToken,
  authorizeRole("teknisi"),
  async (req, res) => {
    try {
      const { solusi } = req.body;

      if (!solusi?.trim()) {
        return res.status(400).json({
          message: "Solusi wajib diisi",
        });
      }

      const ticket = await db.query(
        "SELECT id, teknisi, status FROM tiket WHERE id = $1 LIMIT 1",
        [req.params.id]
      );

      if (!ticket.rowCount) {
        return res.status(404).json({
          message: "Tiket tidak ditemukan",
        });
      }

      if (ticket.rows[0].teknisi !== req.user.id) {
        return res.status(403).json({
          message: "Tiket ini bukan ditugaskan kepada Anda",
        });
      }

      if (ticket.rows[0].status !== "IN_PROGRESS") {
        return res.status(400).json({
          message: `Tiket tidak dapat diselesaikan karena status saat ini ${ticket.rows[0].status}`,
        });
      }

      await db.query(
        "UPDATE tiket SET solusi = $1, status = 'RESOLVED' WHERE id = $2",
        [solusi.trim(), req.params.id]
      );

      res.json({
        message: "Tiket berhasil diselesaikan",
        data: {
          tiket_id: Number(req.params.id),
          teknisi_id: req.user.id,
          solusi: solusi.trim(),
          status: "RESOLVED",
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Gagal menyelesaikan tiket",
        error: error.message,
      });
    }
  }
);

// USER menutup tiket
router.patch("/:id/close", verifyToken, async (req, res) => {
  try {
    const ticket = await db.query(
      "SELECT id, akun, status FROM tiket WHERE id = $1 LIMIT 1",
      [req.params.id]
    );

    if (!ticket.rowCount) {
      return res.status(404).json({
        message: "Tiket tidak ditemukan",
      });
    }

    if (ticket.rows[0].akun !== req.user.id) {
      return res.status(403).json({
        message: "Anda tidak memiliki akses untuk menutup tiket ini",
      });
    }

    if (ticket.rows[0].status !== "RESOLVED") {
      return res.status(400).json({
        message: `Tiket tidak dapat ditutup karena status saat ini ${ticket.rows[0].status}`,
      });
    }

    await db.query(
      "UPDATE tiket SET status = 'CLOSED' WHERE id = $1",
      [req.params.id]
    );

    res.json({
      message: "Tiket berhasil ditutup",
      data: {
        tiket_id: Number(req.params.id),
        akun_id: req.user.id,
        status: "CLOSED",
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal menutup tiket",
      error: error.message,
    });
  }
});

module.exports = router;
