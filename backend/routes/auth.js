const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validasi input
    if (!username || !password) {
      return res.status(400).json({
        message: "Username dan password wajib diisi",
      });
    }

    // Cari user berdasarkan username
    const [rows] = await db.query(
      "SELECT id, Nama, email, password, role FROM login WHERE Nama = ? LIMIT 1",
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Username atau password salah",
      });
    }

    const user = rows[0];

    // Cek password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Username atau password salah",
      });
    }

    // Buat token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.Nama,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
      }
    );

    res.json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        username: user.Nama,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
});

module.exports = router;