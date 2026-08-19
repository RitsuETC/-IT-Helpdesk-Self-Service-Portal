const express = require("express");
const cors = require("cors");
const db = require("./db");

require("dotenv").config();

const authRoutes = require("./routes/auth");
const ticketRoutes = require("./routes/ticket");
const knowledgeRoutes = require("./routes/knowledge");
const troubleshootingRoutes = require("./routes/troubleshooting");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/troubleshooting", troubleshootingRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "IT Helpdesk API berjalan",
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS test");

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});