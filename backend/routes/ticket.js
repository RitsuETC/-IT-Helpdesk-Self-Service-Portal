const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");
const authorizeRole = require("../middleware/roleMiddleware");
const { logAudit } = require('../utils/audit');

const router = express.Router();

async function canAccessTicket(ticketId, user) {
  const result = await db.query('SELECT id, akun FROM tiket WHERE id = $1', [ticketId]);
  if (!result.rowCount) return null;
  if (user.role === 'user' && Number(result.rows[0].akun) !== Number(user.id)) return false;
  return result.rows[0];
}

router.get('/:id/comments', verifyToken, async (req, res) => {
  try {
    const access = await canAccessTicket(req.params.id, req.user);
    if (access === false) return res.status(403).json({ message: 'Anda tidak memiliki akses ke tiket ini' });
    if (!access) return res.status(404).json({ message: 'Tiket tidak ditemukan' });
    const { rows } = await db.query(`SELECT c.id, c.message, c.created_at, l."Nama" AS author_name, l.role AS author_role FROM ticket_comments c LEFT JOIN login l ON l.id = c.user_id WHERE c.ticket_id = $1 ORDER BY c.created_at ASC`, [req.params.id]);
    res.json({ data: rows });
  } catch (error) { res.status(500).json({ message: 'Gagal mengambil komentar tiket', error: error.message }); }
});

router.post('/:id/comments', verifyToken, async (req, res) => {
  try {
    const access = await canAccessTicket(req.params.id, req.user);
    if (access === false) return res.status(403).json({ message: 'Anda tidak memiliki akses ke tiket ini' });
    if (!access) return res.status(404).json({ message: 'Tiket tidak ditemukan' });
    const message = String(req.body?.message || '').trim();
    if (!message) return res.status(400).json({ message: 'Komentar wajib diisi' });
    const { rows } = await db.query('INSERT INTO ticket_comments (ticket_id, user_id, message) VALUES ($1, $2, $3) RETURNING id, message, created_at', [req.params.id, req.user.id, message]);
    await logAudit(db, req, { action: 'CREATE_TICKET_COMMENT', detail: `Menambahkan komentar pada tiket HD-${req.params.id}`, entityType: 'ticket', entityId: req.params.id });
    res.status(201).json({ data: rows[0] });
  } catch (error) { res.status(500).json({ message: 'Gagal menambahkan komentar', error: error.message }); }
});

router.get('/:id/timeline', verifyToken, async (req, res) => {
  try {
    const access = await canAccessTicket(req.params.id, req.user);
    if (access === false) return res.status(403).json({ message: 'Anda tidak memiliki akses ke tiket ini' });
    if (!access) return res.status(404).json({ message: 'Tiket tidak ditemukan' });
    const { rows } = await db.query(`SELECT actor_name, action, detail, created_at FROM audit_log WHERE entity_type = 'ticket' AND entity_id = $1 ORDER BY created_at ASC`, [String(req.params.id)]);
    res.json({ data: rows });
  } catch (error) { res.status(500).json({ message: 'Gagal mengambil timeline tiket', error: error.message }); }
});

router.get('/:id/rating', verifyToken, async (req, res) => {
  try { const access = await canAccessTicket(req.params.id, req.user); if (access === false) return res.status(403).json({ message: 'Anda tidak memiliki akses ke tiket ini' }); if (!access) return res.status(404).json({ message: 'Tiket tidak ditemukan' }); const { rows } = await db.query('SELECT rating, comment, created_at FROM ticket_ratings WHERE ticket_id = $1', [req.params.id]); res.json({ data: rows[0] || null }); } catch (error) { res.status(500).json({ message: 'Gagal mengambil rating', error: error.message }); }
});

router.post('/:id/rating', verifyToken, async (req, res) => {
  try {
    const ticket = await db.query('SELECT akun, status FROM tiket WHERE id = $1', [req.params.id]);
    if (!ticket.rowCount) return res.status(404).json({ message: 'Tiket tidak ditemukan' });
    if (Number(ticket.rows[0].akun) !== Number(req.user.id)) return res.status(403).json({ message: 'Hanya pelapor yang dapat memberi rating' });
    if (!['RESOLVED', 'CLOSED'].includes(ticket.rows[0].status)) return res.status(400).json({ message: 'Rating tersedia setelah tiket selesai' });
    const rating = Number(req.body?.rating); const comment = String(req.body?.comment || '').trim() || null;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating harus antara 1 sampai 5' });
    const { rows } = await db.query(`INSERT INTO ticket_ratings (ticket_id, user_id, rating, comment) VALUES ($1,$2,$3,$4) ON CONFLICT (ticket_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = NOW() RETURNING rating, comment, updated_at`, [req.params.id, req.user.id, rating, comment]);
    await logAudit(db, req, { action: 'RATE_TICKET_SERVICE', detail: `Memberikan rating ${rating}/5 untuk tiket HD-${req.params.id}`, entityType: 'ticket', entityId: req.params.id });
    res.json({ data: rows[0] });
  } catch (error) { res.status(500).json({ message: 'Gagal menyimpan rating', error: error.message }); }
});

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
    const [categories, rooms, priorities, technicians] = await Promise.all([
      db.query(
        "SELECT id, nama_kategori FROM knowledge_kategori ORDER BY nama_kategori"
      ),
      db.query(
        "SELECT id, ruangan FROM unit ORDER BY ruangan"
      ),
      db.query(
        "SELECT level FROM level ORDER BY level"
      ),
      db.query(
        'SELECT id, "Nama" AS nama, email FROM login WHERE role = $1 ORDER BY "Nama"',
        ['teknisi']
      ),
    ]);

    res.json({
      data: {
        categories: categories.rows,
        rooms: rooms.rows,
        priorities: priorities.rows,
        technicians: technicians.rows,
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
    } else if (!["admin", "teknisi"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Role tidak memiliki akses untuk melihat statistik tiket",
      });
    }

    const { rows } = await db.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE t.status::text = 'NEW') AS new,
         COUNT(*) FILTER (WHERE t.status::text IN ('ASSIGNED', 'IN_PROGRESS', 'WAITING')) AS process,
         COUNT(*) FILTER (WHERE t.status::text IN ('RESOLVED', 'CLOSED')) AS resolved
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

// GET detail satu tiket berdasarkan ID
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

router.delete("/:id", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    const usage = await db.query(
      "SELECT count(*) AS total FROM sparepart_transaction WHERE id_tiket = $1",
      [req.params.id]
    );

    if (Number(usage.rows[0].total)) {
      return res.status(409).json({
        message: "Tiket masih digunakan pada transaksi sparepart dan tidak dapat dihapus",
      });
    }

    const result = await db.query("DELETE FROM tiket WHERE id = $1 RETURNING id, judul", [req.params.id]);
    if (!result.rowCount) {
      return res.status(404).json({ message: "Tiket tidak ditemukan" });
    }

    await logAudit(db, req, { action: 'DELETE_TICKET', detail: `Menghapus tiket HD-${result.rows[0].id}: ${result.rows[0].judul}`, entityType: 'ticket', entityId: result.rows[0].id });
    res.json({ message: "Tiket berhasil dihapus" });
  } catch (error) {
    console.error("Delete ticket error:", error);
    res.status(409).json({
      message: "Tiket tidak dapat dihapus karena masih memiliki data terkait",
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
      const raw = (req.body?.prioritas ?? req.body?.priority ?? "").toString();

      const mapping = {
        low: "level_3",
        medium: "level_2",
        high: "level_1",
        critical: "level_1",
        level_1: "level_1",
        level_2: "level_2",
        level_3: "level_3",
      };

      const priorityKey = mapping[raw.toLowerCase()];

      if (!priorityKey) {
        return res.status(400).json({ message: "Prioritas tiket tidak valid" });
      }

      const ticket = await db.query(
        "SELECT id, teknisi, prioritas FROM tiket WHERE id = $1 LIMIT 1",
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
        [priorityKey, req.params.id]
      );

      await logAudit(db, req, { action: 'UPDATE_PRIORITY_TICKET', detail: `Mengubah prioritas tiket HD-${req.params.id} dari ${ticket.rows[0].prioritas} menjadi ${rows[0].prioritas}`, entityType: 'ticket', entityId: req.params.id, metadata: { before: ticket.rows[0].prioritas, after: rows[0].prioritas } });

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
      lokasi,
      prioritas,
      deskripsi,
    } = req.body;

    const room = ruangan ?? lokasi;

    if (
      !judul?.trim() ||
      !kategori ||
      !room ||
      !deskripsi?.trim()
    ) {
      return res.status(400).json({
        message: "Semua data tiket wajib diisi (kecuali prioritas)",
      });
    }

    const rawPriority = (prioritas ?? req.body?.priority ?? "").toString();
    const prMap = {
      low: "level_3",
      medium: "level_2",
      high: "level_1",
      critical: "level_1",
      level_1: "level_1",
      level_2: "level_2",
      level_3: "level_3",
    };
    const ticketPriority = prMap[rawPriority.toLowerCase()] || prMap['medium'];

    let kategoriId = kategori;
    if (typeof kategoriId === 'string' && isNaN(Number(kategoriId))) {
      const catRes = await db.query(
        `SELECT id FROM knowledge_kategori WHERE nama_kategori ILIKE $1 LIMIT 1`,
        [kategoriId]
      );
      if (!catRes.rowCount) {
        return res.status(400).json({ message: 'Kategori tidak ditemukan' });
      }
      kategoriId = catRes.rows[0].id;
    }

    let roomId = room;
    if (typeof roomId === 'string' && isNaN(Number(roomId))) {
      const roomRes = await db.query(
        `SELECT id FROM unit WHERE ruangan ILIKE $1 LIMIT 1`,
        [roomId]
      );
      if (!roomRes.rowCount) {
        return res.status(400).json({ message: 'Lokasi/ruangan tidak ditemukan' });
      }
      roomId = roomRes.rows[0].id;
    }

    // Choose the technician with the smallest active-ticket workload. Ties use
    // the lowest ID so assignment stays deterministic.
    const technicianResult = await db.query(`
      SELECT l.id, l."Nama" AS nama, COUNT(t.id) AS active_ticket_count
      FROM login l
      LEFT JOIN tiket t ON t.teknisi = l.id
        AND t.status NOT IN ('RESOLVED', 'CLOSED')
      WHERE l.role = 'teknisi'
      GROUP BY l.id, l."Nama"
      ORDER BY COUNT(t.id) ASC, l.id ASC
      LIMIT 1
    `);
    const assignedTechnician = technicianResult.rows[0] || null;

    const { rows } = await db.query(
      `INSERT INTO tiket
        (
          judul,
          categori,
          ruangan,
          prioritas,
          deskripsi,
          akun,
          teknisi,
          status,
          created_at
        )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::public.tiket_status_enum, NOW())
       RETURNING
        id,
        judul,
        categori AS kategori,
        ruangan,
        prioritas,
        deskripsi,
        akun,
        teknisi,
        status,
        created_at,
        resolved_at,
        closed_at`,
      [
        judul.trim(),
        kategoriId,
        roomId,
        ticketPriority,
        deskripsi.trim(),
        req.user.id,
        assignedTechnician?.id || null,
        assignedTechnician ? 'ASSIGNED' : 'NEW',
      ]
    );

    try {
      const notifMsg = assignedTechnician
        ? `Tiket baru HD-${rows[0].id} otomatis ditugaskan kepada Anda: ${rows[0].judul}`
        : `Tiket baru: ${rows[0].judul}`;
      await db.query(
        `INSERT INTO notifications (user_id, tiket_id, message)
         SELECT id, $1, $2 FROM login WHERE role = 'admin' OR id = $3`,
        [rows[0].id, notifMsg, assignedTechnician?.id || -1]
      );
    } catch (notifErr) {
      console.error('Failed to insert notifications:', notifErr.message);
    }

    await logAudit(db, req, { action: 'CREATE_TICKET', detail: `Membuat tiket HD-${rows[0].id}: ${rows[0].judul}`, entityType: 'ticket', entityId: rows[0].id, metadata: { auto_assigned_to: assignedTechnician?.id || null } });
    if (assignedTechnician) {
      await db.query(
        `INSERT INTO audit_log (actor_id, actor_name, action, detail, entity_type, entity_id, metadata)
         VALUES (NULL, 'Sistem', 'AUTO_ASSIGN_TICKET', $1, 'ticket', $2, $3::jsonb)`,
        [`Menugaskan tiket HD-${rows[0].id} kepada ${assignedTechnician.nama} karena memiliki beban tiket aktif paling sedikit`, String(rows[0].id), JSON.stringify({ technician_id: assignedTechnician.id, active_ticket_count: Number(assignedTechnician.active_ticket_count) })]
      );
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

// ADMIN/TEKNISI dapat mengubah status tiket
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
        return res.status(400).json({
          message: "Status tiket tidak valid",
        });
      }

      const ticket = await db.query(
        "SELECT id, teknisi, status FROM tiket WHERE id = $1 LIMIT 1",
        [req.params.id]
      );

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

      await logAudit(db, req, { action: 'UPDATE_STATUS_TICKET', detail: `Mengubah status tiket HD-${req.params.id} dari ${ticket.rows[0].status} menjadi ${rows[0].status}`, entityType: 'ticket', entityId: req.params.id, metadata: { before: ticket.rows[0].status, after: rows[0].status } });

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
        "SELECT id, status, teknisi FROM tiket WHERE id = $1 LIMIT 1",
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

      await logAudit(db, req, { action: 'ASSIGN_TICKET', detail: `Menugaskan ${technician.rows[0].nama} ke tiket HD-${req.params.id}`, entityType: 'ticket', entityId: req.params.id, metadata: { teknisi_id: teknisi, before_status: ticket.rows[0].status, after_status: rows[0].status } });

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
      const ticket = await db.query(
        "SELECT id, teknisi, status FROM tiket WHERE id = $1 LIMIT 1",
        [req.params.id]
      );

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

      await db.query(
        "UPDATE tiket SET status = 'IN_PROGRESS' WHERE id = $1",
        [req.params.id]
      );

      await logAudit(db, req, { action: 'UPDATE_STATUS_TICKET', detail: `Memulai pengerjaan tiket HD-${req.params.id} (status ${ticket.rows[0].status} menjadi IN_PROGRESS)`, entityType: 'ticket', entityId: req.params.id, metadata: { before: ticket.rows[0].status, after: 'IN_PROGRESS' } });

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

// ADMIN & TEKNISI dapat menyelesaikan tiket
router.patch(
  "/:id/resolve",
  verifyToken,
  authorizeRole("admin", "teknisi"),
  async (req, res) => {
    try {
      const { solusi, tindakan, hasil_akhir } = req.body;

      if ((!solusi || !String(solusi).trim()) && (!tindakan || !String(tindakan).trim() || !hasil_akhir || !String(hasil_akhir).trim())) {
        return res.status(400).json({
          message: "Solusi atau (tindakan dan hasil_akhir) wajib diisi",
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

      const isAdmin = req.user.role === 'admin';
      const isAssignedTech = Number(ticket.rows[0].teknisi) === Number(req.user.id);

      if (!isAdmin && !isAssignedTech) {
        return res.status(403).json({
          message: "Tiket ini bukan ditugaskan kepada Anda",
        });
      }

      if (ticket.rows[0].status === "CLOSED") {
        return res.status(400).json({
          message: "Tiket yang sudah CLOSED tidak dapat diselesaikan kembali",
        });
      }

      let finalSolusi = solusi && String(solusi).trim() ? String(solusi).trim() : null;
      if (!finalSolusi && tindakan && hasil_akhir) {
        try {
          const existing = await db.query(
            `SELECT id FROM troubleshooting WHERE id_tiket = $1 ORDER BY id ASC`,
            [req.params.id]
          );

          if (existing.rowCount > 1) {
            const keepId = existing.rows[0].id;
            await db.query(`DELETE FROM troubleshooting WHERE id_tiket = $1 AND id <> $2`, [req.params.id, keepId]);
            existing.rows.splice(1);
          }

          if (existing.rowCount === 1) {
            const id = existing.rows[0].id;
            await db.query(
              `UPDATE troubleshooting SET lampiran = $1, tindakan = $2, hasil = $3 WHERE id = $4`,
              [0, String(tindakan).trim(), String(hasil_akhir).trim(), id]
            );
          } else {
            await db.query(
              `INSERT INTO troubleshooting (id_tiket, lampiran, tindakan, hasil) VALUES ($1, $2, $3, $4)`,
              [req.params.id, 0, String(tindakan).trim(), String(hasil_akhir).trim()]
            );
          }
        } catch (e) {
          console.error('Failed to upsert troubleshooting during resolve:', e.message);
        }
        finalSolusi = String(hasil_akhir).trim();
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
        [finalSolusi, req.params.id]
      );

      await logAudit(db, req, { action: 'RESOLVE_TICKET', detail: `Menyelesaikan tiket HD-${req.params.id}`, entityType: 'ticket', entityId: req.params.id, metadata: { before: ticket.rows[0].status, after: rows[0].status } });

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

    await logAudit(db, req, { action: 'CLOSE_TICKET', detail: `Menutup tiket HD-${req.params.id}`, entityType: 'ticket', entityId: req.params.id, metadata: { before: ticket.rows[0].status, after: rows[0].status } });

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

module.exports = router;
