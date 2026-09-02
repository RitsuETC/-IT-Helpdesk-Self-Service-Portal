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

// GET ringkasan statistik tiket sesuai role user
router.get("/stats", verifyToken, async (req, res) => {
  try {
    let whereClause = "";
    const params = [];

    if (req.user.role === "user") {
      whereClause = " WHERE t.akun = $1 ";
      params.push(req.user.id);
    }

    const { rows } = await db.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE t.status = 'NEW') AS new,
         COUNT(*) FILTER (WHERE t.status IN ('ASSIGNED', 'IN_PROGRESS', 'WAITING')) AS process,
         COUNT(*) FILTER (WHERE t.status IN ('RESOLVED', 'CLOSED')) AS resolved
       FROM tiket t
       ${whereClause}`,
      params
    );

    const data = rows[0] || { total: 0, new: 0, process: 0, resolved: 0 };

    res.json({
      data: {
        total: Number(data.total || 0),
        new: Number(data.new || 0),
        process: Number(data.process || 0),
        resolved: Number(data.resolved || 0),
      },
    });
  } catch (error) {
    console.error("Get ticket stats error:", error);
    res.status(500).json({
      message: "Gagal mengambil statistik tiket",
      error: error.message,
    });
  }
});

// GET detail satu tiket berdasarkan ID (BARU DITAMBAHKAN UNTUK MENGATASI 404)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    let query = `
      SELECT
        t.*,
        u.ruangan AS nama_ruangan,
        k.nama_kategori,
        pelapor.id AS pelapor_id,
        pelapor."Nama" AS pelapor_nama,
        pelapor.email AS pelapor_email,
        teknisi_user.id AS teknisi_id,
        teknisi_user."Nama" AS teknisi_nama,
        teknisi_user.email AS teknisi_email
      FROM tiket t
      JOIN unit u ON u.id = t.ruangan
      JOIN knowledge_kategori k ON k.id = t.categori
      LEFT JOIN login pelapor ON pelapor.id = t.akun
      LEFT JOIN login teknisi_user ON teknisi_user.id = t.teknisi AND teknisi_user.role = 'teknisi'
      WHERE t.id = $1
    `;

    const params = [req.params.id];

    if (req.user.role === "user") {
      query += ` AND t.akun = $2`;
      params.push(req.user.id);
    }

    const { rows } = await db.query(query, params);

    if (!rows.length) {
      return res.status(404).json({ message: "Tiket tidak ditemukan" });
    }

    res.json({
      message: "Detail tiket berhasil diambil",
      data: rows[0],
    });
  } catch (error) {
    console.error("Get ticket detail error:", error);
    res.status(500).json({
      message: "Gagal mengambil detail tiket",
      error: error.message,
    });
  }
});

// ADMIN/TEKNISI dapat mengubah prioritas tiket
router.patch(
  "/:id/priority",
  verifyToken,
  authorizeRole("admin", "teknisi"),
  async (req, res) => {
    try {
      const validPriorities = ["level_1", "level_2", "level_3"];
      const priority = String(req.body?.prioritas || "").toLowerCase();

      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ message: "Prioritas tiket tidak valid" });
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
        `UPDATE tiket
         SET prioritas = $1::public.priority_level_enum
         WHERE id = $2
         RETURNING id, prioritas`,
        [priority, req.params.id]
      );

      res.json({
        message: "Prioritas tiket berhasil diperbarui",
        data: rows[0],
      });
    } catch (error) {
      res.status(500).json({
        message: "Gagal memperbarui prioritas tiket",
        error: error.message,
      });
    }
  }
);

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
        (
          judul,
          categori,
          ruangan,
          prioritas,
          deskripsi,
          akun,
          created_at
        )
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING
        id,
        judul,
        categori AS kategori,
        ruangan,
        prioritas,
        deskripsi,
        akun,
        status,
        created_at,
        resolved_at,
        closed_at`,
      [
        judul.trim(),
        kategori,
        ruangan,
        prioritas,
        deskripsi.trim(),
        req.user.id,
      ]
    );

    try {
      const notifMsg = `Tiket baru: ${rows[0].judul}`;
      await db.query(
        `INSERT INTO notifications (user_id, tiket_id, message)
         SELECT id, $1, $2 FROM login WHERE role IN ('admin','teknisi')`,
        [rows[0].id, notifMsg]
      );
    } catch (notifErr) {
      console.error('Failed to insert notifications:', notifErr.message);
    }

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

// ADMIN dapat mengubah status semua tiket,
// TEKNISI hanya tiket yang ditugaskan kepadanya.
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

      console.log(`[PATCH /:id/status] user.id=${req.user?.id} role=${req.user?.role} requestedStatus=${status} ticketId=${req.params.id}`);

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Status tiket tidak valid",
        });
      }

      const ticket = await db.query(
        "SELECT id, teknisi FROM tiket WHERE id = $1 LIMIT 1",
        [req.params.id]
      );

      console.log("[PATCH /:id/status] ticket query result:", ticket.rows[0]);

      const providedTeknisi = req.body?.teknisi;

      if (status === "ASSIGNED" && (ticket.rows[0].teknisi === null || ticket.rows[0].teknisi === undefined) && !providedTeknisi) {
        return res.status(400).json({
          message: "Tidak dapat mengubah status menjadi ASSIGNED tanpa teknisi. Sertakan `teknisi` atau gunakan endpoint /:id/assign."
        });
      }

      let teknisiToSet = null;
      if (providedTeknisi) {
        const technician = await db.query(
          'SELECT id, "Nama" AS nama, email, role FROM login WHERE id = $1 AND role = $2 LIMIT 1',
          [providedTeknisi, 'teknisi']
        );

        if (!technician.rowCount) {
          return res.status(400).json({ message: 'Akun yang dipilih bukan teknisi' });
        }

        teknisiToSet = providedTeknisi;
      }

      if (!ticket.rowCount) {
        return res.status(404).json({
          message: "Tiket tidak ditemukan",
        });
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
        `UPDATE tiket
         SET
           teknisi = COALESCE($3, teknisi),
           status = $1::public.tiket_status_enum,
           resolved_at = CASE
             WHEN $1::public.tiket_status_enum = 'RESOLVED' AND resolved_at IS NULL
             THEN NOW()
             ELSE resolved_at
           END,
           closed_at = CASE
             WHEN $1::public.tiket_status_enum = 'CLOSED' AND closed_at IS NULL
             THEN NOW()
             ELSE closed_at
           END
         WHERE id = $2
         RETURNING
           id,
           teknisi,
           status,
           resolved_at,
           closed_at`,
        [status, req.params.id, teknisiToSet]
      );

        console.log(`[PATCH /:id/status] updated ticket ${req.params.id} -> ${status}`);

      res.json({
        message: "Status tiket berhasil diperbarui",
        data: rows[0],
      });
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
      const { teknisi, status: requestedStatus } = req.body;

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

      const allowedStatuses = [
        "NEW",
        "ASSIGNED",
        "IN_PROGRESS",
        "WAITING",
        "RESOLVED",
        "CLOSED",
      ];

      const status = String(requestedStatus || "ASSIGNED").toUpperCase();

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Status tidak valid" });
      }

      if (status === "ASSIGNED" && ticket.rows[0].status !== "NEW") {
        return res.status(400).json({
          message: `Tiket tidak dapat di-assign karena status saat ini ${ticket.rows[0].status}`,
        });
      }

      const { rows } = await db.query(
        `UPDATE tiket
         SET
           teknisi = $1,
           status = $2::public.tiket_status_enum,
           resolved_at = CASE
             WHEN $2::public.tiket_status_enum = 'RESOLVED' AND resolved_at IS NULL THEN NOW()
             ELSE resolved_at
           END,
           closed_at = CASE
             WHEN $2::public.tiket_status_enum = 'CLOSED' AND closed_at IS NULL THEN NOW()
             ELSE closed_at
           END
         WHERE id = $3
         RETURNING id, teknisi, status, resolved_at, closed_at`,
        [teknisi, status, req.params.id]
      );

      res.json({
        message: "Teknisi berhasil ditugaskan",
        data: {
          tiket_id: Number(req.params.id),
          teknisi: technician.rows[0],
          status: rows[0].status,
          resolved_at: rows[0].resolved_at,
          closed_at: rows[0].closed_at,
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
      console.log(`[PATCH /:id/start] user.id=${req.user?.id} role=${req.user?.role} ticketId=${req.params.id}`);
      const ticket = await db.query(
        "SELECT id, teknisi, status FROM tiket WHERE id = $1 LIMIT 1",
        [req.params.id]
      );

      console.log("[PATCH /:id/start] ticket query result:", ticket.rows[0]);

      if (!ticket.rowCount) {
        return res.status(404).json({
          message: "Tiket tidak ditemukan",
        });
      }

      if (Number(ticket.rows[0].teknisi) !== Number(req.user.id)) {
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
      console.log(`[PATCH /:id/resolve] user.id=${req.user?.id} role=${req.user?.role} ticketId=${req.params.id}`);
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

      console.log("[PATCH /:id/resolve] ticket query result:", ticket.rows[0]);

      if (!ticket.rowCount) {
        return res.status(404).json({
          message: "Tiket tidak ditemukan",
        });
      }

      if (Number(ticket.rows[0].teknisi) !== Number(req.user.id)) {
        return res.status(403).json({
          message: "Tiket ini bukan ditugaskan kepada Anda",
        });
      }

      if (ticket.rows[0].status !== "IN_PROGRESS") {
        return res.status(400).json({
          message: `Tiket tidak dapat diselesaikan karena status saat ini ${ticket.rows[0].status}`,
        });
      }

      const { rows } = await db.query(
        `UPDATE tiket
         SET
           solusi = $1,
           status = 'RESOLVED',
           resolved_at = NOW()
         WHERE id = $2
         RETURNING
           id,
           teknisi,
           solusi,
           status,
           resolved_at`,
        [solusi.trim(), req.params.id]
      );

      res.json({
        message: "Tiket berhasil diselesaikan",
        data: {
          tiket_id: Number(req.params.id),
          teknisi_id: req.user.id,
          solusi: rows[0].solusi,
          status: rows[0].status,
          resolved_at: rows[0].resolved_at,
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

    if (Number(ticket.rows[0].akun) !== Number(req.user.id)) {
      return res.status(403).json({
        message: "Anda tidak memiliki akses untuk menutup tiket ini",
      });
    }

    if (ticket.rows[0].status !== "RESOLVED") {
      return res.status(400).json({
        message: `Tiket tidak dapat ditutup karena status saat ini ${ticket.rows[0].status}`,
      });
    }

    const { rows } = await db.query(
      `UPDATE tiket
       SET
         status = 'CLOSED',
         closed_at = NOW()
       WHERE id = $1
       RETURNING
         id,
         akun,
         status,
         closed_at`,
      [req.params.id]
    );

    res.json({
      message: "Tiket berhasil ditutup",
      data: {
        tiket_id: Number(req.params.id),
        akun_id: req.user.id,
        status: rows[0].status,
        closed_at: rows[0].closed_at,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal menutup tiket",
      error: error.message,
    });
  }
});

router.get("/reports/finished-tickets", verifyToken, authorizeRole("admin", "teknisi"), async (req, res) => {
  try {
    const { status, category, date_from, date_to, search } = req.query;

    let query = `
      SELECT
        t.id,
        t.judul,
        t.prioritas,
        t.status,
        t.created_at,
        t.resolved_at,
        t.closed_at,
        k.nama_kategori,
        u.ruangan AS nama_ruangan,
        pelapor."Nama" AS pelapor_nama,
        teknisi_user."Nama" AS teknisi_nama,
        tr.tindakan,
        tr.hasil
      FROM tiket t
      JOIN unit u ON u.id = t.ruangan
      JOIN knowledge_kategori k ON k.id = t.categori
      LEFT JOIN login pelapor ON pelapor.id = t.akun
      LEFT JOIN login teknisi_user ON teknisi_user.id = t.teknisi AND teknisi_user.role = 'teknisi'
      LEFT JOIN LATERAL (
        SELECT tr.tindakan, tr.hasil
        FROM troubleshooting tr
        WHERE tr.id_tiket = t.id
        ORDER BY tr.id DESC
        LIMIT 1
      ) tr ON true
      WHERE t.status IN ('RESOLVED', 'CLOSED')
    `;

    const params = [];
    let paramIndex = 1;

    if (req.user.role === 'user') {
      query += ` AND t.akun = $${paramIndex}`;
      params.push(req.user.id);
      paramIndex++;
    }

    if (status && ['RESOLVED', 'CLOSED'].includes(status.toUpperCase())) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status.toUpperCase());
      paramIndex++;
    }

    if (category) {
      query += ` AND k.nama_kategori ILIKE $${paramIndex}`;
      params.push(`%${category}%`);
      paramIndex++;
    }

    if (date_from) {
      query += ` AND t.created_at >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    if (date_to) {
      query += ` AND t.created_at <= $${paramIndex}`;
      params.push(date_to + ' 23:59:59');
      paramIndex++;
    }

    if (search) {
      query += ` AND (t.judul ILIKE $${paramIndex} OR pelapor."Nama" ILIKE $${paramIndex} OR u.ruangan ILIKE $${paramIndex})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 3;
    }

    query += ` ORDER BY t.created_at DESC`;

    const { rows } = await db.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    console.error("Get report error:", error);
    res.status(500).json({ message: "Gagal mengambil data laporan", error: error.message });
  }
});

router.get("/reports/print", verifyToken, authorizeRole("admin", "teknisi"), async (req, res) => {
  try {
    const { status, category, date_from, date_to, search } = req.query;

    let query = `
      SELECT
        t.id,
        t.judul,
        t.prioritas,
        t.status,
        t.created_at,
        t.resolved_at,
        t.closed_at,
        k.nama_kategori,
        u.ruangan AS nama_ruangan,
        pelapor."Nama" AS pelapor_nama,
        teknisi_user."Nama" AS teknisi_nama,
        tr.tindakan,
        tr.hasil
      FROM tiket t
      JOIN unit u ON u.id = t.ruangan
      JOIN knowledge_kategori k ON k.id = t.categori
      LEFT JOIN login pelapor ON pelapor.id = t.akun
      LEFT JOIN login teknisi_user ON teknisi_user.id = t.teknisi AND teknisi_user.role = 'teknisi'
      LEFT JOIN LATERAL (
        SELECT tr.tindakan, tr.hasil
        FROM troubleshooting tr
        WHERE tr.id_tiket = t.id
        ORDER BY tr.id DESC
        LIMIT 1
      ) tr ON true
      WHERE t.status IN ('RESOLVED', 'CLOSED')
    `;

    const params = [];
    let paramIndex = 1;

    if (status && ['RESOLVED', 'CLOSED'].includes(status.toUpperCase())) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status.toUpperCase());
      paramIndex++;
    }

    if (category) {
      query += ` AND k.nama_kategori ILIKE $${paramIndex}`;
      params.push(`%${category}%`);
      paramIndex++;
    }

    if (date_from) {
      query += ` AND t.created_at >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    if (date_to) {
      query += ` AND t.created_at <= $${paramIndex}`;
      params.push(date_to + ' 23:59:59');
      paramIndex++;
    }

    if (search) {
      query += ` AND (t.judul ILIKE $${paramIndex} OR pelapor."Nama" ILIKE $${paramIndex} OR u.ruangan ILIKE $${paramIndex})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 3;
    }

    query += ` ORDER BY t.created_at DESC`;

    const { rows } = await db.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    console.error("Get print report error:", error);
    res.status(500).json({ message: "Gagal mengambil data laporan untuk print", error: error.message });
  }
});

module.exports = router;