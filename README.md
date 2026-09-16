# IT Helpdesk & Self-Service Portal

Aplikasi web untuk layanan IT rumah sakit: pegawai dapat mencari solusi mandiri, membuat tiket ketika kendala belum selesai, dan tim IT dapat menangani tiket, inventaris, serta laporan operasional dari satu portal.

## Fitur utama

- Autentikasi dan hak akses `user`, `teknisi`, dan `admin`.
- Knowledge Base dengan kategori, tag, artikel, video, dan pencarian.
- Smart Knowledge Suggestion saat pengguna mengisi judul/deskripsi tiket.
- Ticketing dengan status `NEW → ASSIGNED → IN_PROGRESS → WAITING → RESOLVED → CLOSED`.
- Auto-assign tiket ke teknisi dengan jumlah tiket aktif paling sedikit.
- Canned responses untuk teknisi saat menyelesaikan tiket.
- Komentar dua arah, timeline aktivitas, dan rating layanan setelah tiket selesai.
- SLA countdown pada tiket aktif dan indikator mendekati/melewati tenggat.
- Dashboard, laporan tiket, grafik kategori/status, serta resolution rate.
- Inventaris: aset, sparepart, perpindahan aset, transaksi stok, maintenance, dan pengadaan.
- Form aset dinamis: spesifikasi teknis untuk Laptop, PC/Komputer, dan Server.
- Detail aset read-only dan audit trail aktivitas penting.
- Notifikasi internal untuk tiket baru dan perubahan tugas.

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| Frontend | React, Vite, Recharts |
| Backend | Node.js, Express |
| Database | PostgreSQL / Supabase |
| Autentikasi | JWT + bcryptjs |

## Struktur proyek

```text
frontend/              React + Vite
backend/               Express API dan migrasi Node.js
database/              SQL schema/dump referensi
supabase/              Konfigurasi dan schema Supabase
docs/                  PRD, prototype, diagram, dan wireframe
```

## Menjalankan secara lokal

### 1. Prasyarat

- Node.js 20+ dan npm
- Database PostgreSQL atau project Supabase

### 2. Konfigurasi backend

Salin `backend/.env.example` menjadi `backend/.env`, lalu isi nilai berikut:

```env
DATABASE_URL=postgresql://...
DATABASE_SSL=true
JWT_SECRET=isi-dengan-secret-panjang-dan-unik
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Kemudian jalankan:

```bash
cd backend
npm install
npm run dev
```

API akan tersedia di `http://localhost:5000`.

### 3. Konfigurasi frontend

Pada terminal lain:

```bash
cd frontend
npm install
npm run dev
```

Frontend default tersedia pada `http://localhost:5173` dan menggunakan API `http://localhost:5000/api`.

Untuk alamat API lain, buat `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Database dan migrasi

Siapkan schema dasar PostgreSQL/Supabase terlebih dahulu dari direktori `database/` atau konfigurasi `supabase/`. Setelah itu jalankan migrasi backend yang belum diterapkan:

```bash
cd backend
node migrations/001_add_ticket_timestamps.js
node migrations/002_add_knowledge_video_url.js
node migrations/003_log_invalid_tokens.js
node migrations/004_create_notifications.js
node migrations/005_add_knowledge_tags.js
node migrations/006_create_inventory_tables.js
npm run migrate:audit
npm run migrate:collaboration
```

`migrate:audit` membuat tabel `audit_log`. `migrate:collaboration` membuat tabel `ticket_comments` dan `ticket_ratings`.

## Matriks akses ringkas

| Kemampuan | User | Teknisi | Admin |
| --- | :---: | :---: | :---: |
| Membuat dan melihat tiket sendiri | ✓ | — | — |
| Melihat dan menangani tiket | — | ✓ | ✓ |
| Komentar tiket | ✓ | ✓ | ✓ |
| Rating layanan tiket sendiri | ✓ | — | — |
| Kelola Knowledge Base / user / kategori | — | — | ✓ |
| Kelola inventaris operasional | — | ✓ | ✓ |
| Melihat audit trail | — | — | ✓ |

## Aturan SLA

| Prioritas | Target |
| --- | --- |
| Critical | 2 jam |
| High / `level_1` | 4 jam |
| Medium / `level_2` | 12 jam |
| Low / `level_3` | 24 jam |

Badge SLA berwarna hijau saat aman, kuning saat mendekati tenggat, dan merah saat melewati tenggat.

## Endpoint penting

| Endpoint | Keterangan |
| --- | --- |
| `POST /api/auth/login` | Login dan mendapatkan JWT |
| `GET, POST /api/tickets` | Daftar dan pembuatan tiket |
| `GET, POST /api/tickets/:id/comments` | Komentar tiket |
| `GET /api/tickets/:id/timeline` | Timeline berbasis audit trail |
| `GET, POST /api/tickets/:id/rating` | Rating layanan |
| `GET /api/knowledge` | Artikel Knowledge Base |
| `GET /api/inventory/*` | Modul inventaris |
| `GET /api/audit-logs` | Audit trail, admin saja |

## Verifikasi build

```bash
cd frontend
npm run build
```

## Pengembangan lanjutan

- Upload lampiran berkas pada tiket dan dokumentasi teknisi.
- QR Code aset dan pembuatan tiket dari hasil scan.
- Nomor tiket format tanggal, misalnya `HD-20260916-0001`.
- Export laporan Excel/PDF.
- Statistik self-service, SLA compliance, dan evaluasi artikel Knowledge Base.
- Notifikasi Email/WhatsApp/Telegram.

## Catatan keamanan

Jangan commit file `backend/.env`, token JWT, password database, atau secret produksi ke repository.
