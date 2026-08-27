const express = require("express");
const cors = require("cors");
const db = require("./db");

require("dotenv").config();

const authRoutes = require("./routes/auth");
const ticketRoutes = require("./routes/ticket");
const knowledgeRoutes = require("./routes/knowledge");
const troubleshootingRoutes = require("./routes/troubleshooting");
const adminRoutes = require("./routes/admin");
const notificationsRoutes = require("./routes/notifications");

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any localhost origin during development (different Vite ports like 5173/5174)
    try {
      const url = new URL(origin);
      const host = url.hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return callback(null, true);
    } catch (e) {
      // ignore invalid origin parsing
    }
    return callback(new Error('Origin tidak diizinkan oleh CORS'));
  },
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/troubleshooting", troubleshootingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationsRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "IT Helpdesk API berjalan",
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT 1 AS test");

    res.json({
      message: "Database berhasil terhubung",
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Database gagal terhubung",
      error: error.message,
    });
  }
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
}

module.exports = app;
