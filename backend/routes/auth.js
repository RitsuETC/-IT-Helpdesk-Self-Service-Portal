const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Username dan password wajib diisi" });

    const { rows } = await db.query(
      'SELECT id, "Nama" AS nama, email, password, role FROM login WHERE "Nama" = $1 LIMIT 1',
      [username]
    );
    if (!rows.length) return res.status(401).json({ message: "Username atau password salah" });

    const user = rows[0];
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Username atau password salah" });
    }

    const token = jwt.sign({ id: user.id, username: user.nama, role: user.role }, process.env.JWT_SECRET, { expiresIn: "2h" });
    res.json({ message: "Login berhasil", token, user: { id: user.id, username: user.nama, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
});

module.exports = router;
