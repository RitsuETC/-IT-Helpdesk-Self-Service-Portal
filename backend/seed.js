const bcrypt = require("bcryptjs");
const db = require("./db");

async function seedUsers() {
  try {
    const users = [
      {
        nama: "admin",
        email: "admin@ithelpdesk.com",
        password: "admin123",
        role: "admin",
      },
      {
        nama: "teknisi",
        email: "teknisi@ithelpdesk.com",
        password: "teknisi123",
        role: "teknisi",
      },
      {
        nama: "user",
        email: "user@ithelpdesk.com",
        password: "user123",
        role: "user",
      },
    ];

    //implementasi password hashing
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      await db.query(
        `INSERT INTO login (Nama, email, password, role)
         VALUES (?, ?, ?, ?)`,
        [
          user.nama,
          user.email,
          hashedPassword,
          user.role,
        ]
      );
    }

    console.log("Akun berhasil dibuat!");
    process.exit(0);

  } catch (error) {
    console.error("Gagal membuat akun:", error.message);
    process.exit(1);
  }
}

seedUsers();