const jwt = require("jsonwebtoken");
const db = require("../db");
const crypto = require("crypto");

async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Token tidak ditemukan",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    return next();
  } catch (error) {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.split(' ')[1];
      const tokenPreview = token ? token.slice(0, 8) : null;
      const tokenHash = token ? crypto.createHash('sha256').update(token).digest('hex') : null;
      const decoded = token ? jwt.decode(token) : null;
      const userId = decoded && decoded.id ? decoded.id : null;
      const ip = req.ip || (req.headers['x-forwarded-for'] || '').split(',')[0];
      const ua = req.headers['user-agent'] || null;
      await db.query('INSERT INTO invalid_tokens (token_hash, token_preview, user_id, reason, ip, user_agent) VALUES ($1, $2, $3, $4, $5, $6)', [tokenHash, tokenPreview, userId, error.message, ip, ua]);
    } catch (logErr) {
      // ignore logging errors
    }

    return res.status(401).json({
      message: "Token tidak valid atau sudah kedaluwarsa",
    });
  }
}

module.exports = verifyToken;