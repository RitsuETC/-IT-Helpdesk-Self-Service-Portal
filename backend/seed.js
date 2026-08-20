const bcrypt = require("bcryptjs");
const db = require("./db");

async function seed() {
  try {
    await db.query("INSERT INTO level (level) VALUES ('level_1'), ('level_2'), ('level_3') ON CONFLICT DO NOTHING");
    const users = [
      { nama: "admin", email: "admin@ithelpdesk.com", password: "admin123", role: "admin" },
      { nama: "teknisi", email: "teknisi@ithelpdesk.com", password: "teknisi123", role: "teknisi" },
      { nama: "user", email: "user@ithelpdesk.com", password: "user123", role: "user" },
    ];
    for (const user of users) {
      const existing = await db.query("SELECT id FROM login WHERE email = $1 LIMIT 1", [user.email]);
      if (!existing.rowCount) {
        const password = await bcrypt.hash(user.password, 10);
        await db.query('INSERT INTO login ("Nama", email, password, role) VALUES ($1, $2, $3, $4)', [user.nama, user.email, password, user.role]);
      }
    }
    console.log("Level prioritas dan akun awal berhasil dibuat.");
  } catch (error) {
    console.error("Gagal membuat data awal:", error.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

seed();
