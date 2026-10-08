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
const inventoryRoutes = require("./routes/inventory");
const auditRoutes = require("./routes/audit");

const app = express();

const configuredOrigins = [process.env.FRONTEND_URL, process.env.CORS_ORIGINS]
  .filter(Boolean)
  .flatMap((value) => value.split(','))
  .map((value) => {
    try {
      return new URL(value.trim()).origin;
    } catch {
      console.error('Origin frontend tidak valid di konfigurasi CORS:', value.trim());
      return null;
    }
  })
  .filter(Boolean);

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  ...configuredOrigins,
]);

function isLocalOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    if (['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0'].includes(hostname) || hostname.endsWith('.localhost') || hostname.endsWith('.local')) return true;
    const octets = hostname.split('.').map(Number);
    if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
    return octets[0] === 10 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168);
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
   
      if (!origin) {
        return callback(null, true);
      }

   
      if (allowedOrigins.has(origin) || isLocalOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin tidak diizinkan oleh CORS"));
    },

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],

    credentials: true,
  })
);
app.use(express.json());



app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/troubleshooting", troubleshootingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/audit-logs", auditRoutes);



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
    console.error("Database error:", error);

    res.status(500).json({
      message: "Database gagal terhubung",
      error: error.message,
    });
  }
});


app.use((err, req, res, next) => {
  console.error("Server error:", err);

  if (err.message === "Origin tidak diizinkan oleh CORS") {
    return res.status(403).json({
      message: "Origin tidak diizinkan oleh CORS",
    });
  }

  res.status(500).json({
    message: "Terjadi kesalahan pada server",
    error: err.message,
  });
});



if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log(`Server LAN: http://192.168.100.13:${PORT}`);
  });
}

module.exports = app;
