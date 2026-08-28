-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 26 Agu 2026 pada 06.02
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `it_helpdesk`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `asset`
--

CREATE TABLE `asset` (
  `id_asset` int(11) NOT NULL,
  `asset_code` varchar(255) NOT NULL,
  `id_ruangan` int(11) NOT NULL,
  `status` enum('repair','broken') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `knowledge_article`
--

CREATE TABLE `knowledge_article` (
  `id` int(11) NOT NULL,
  `id_categori` int(11) NOT NULL,
  `judul` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `level` enum('Level_1','Level_2','Level_3') NOT NULL,
  `helpful` int(11) NOT NULL DEFAULT 0,
  `unhelpful` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `knowledge_article`
--

INSERT INTO `knowledge_article` (`id`, `id_categori`, `judul`, `content`, `level`, `helpful`, `unhelpful`) VALUES
(1, 1, 'Komputer tidak menyala', 'Periksa kabel power, konektor listrik, dan tombol power komputer.', 'Level_1', 0, 0),
(2, 2, 'Aplikasi tidak bisa dibuka', 'Coba tutup aplikasi, restart komputer, kemudian buka kembali aplikasi.', 'Level_1', 0, 0),
(3, 3, 'Tidak bisa terhubung ke jaringan', 'Periksa kabel LAN dan koneksi jaringan, kemudian lakukan pengecekan IP.', 'Level_1', 0, 0);

-- --------------------------------------------------------

--
-- Struktur dari tabel `knowledge_kategori`
--

CREATE TABLE `knowledge_kategori` (
  `id` int(11) NOT NULL,
  `nama_kategori` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `knowledge_kategori`
--

INSERT INTO `knowledge_kategori` (`id`, `nama_kategori`) VALUES
(1, 'Hardware'),
(2, 'Software'),
(3, 'Jaringan');

-- --------------------------------------------------------

--
-- Struktur dari tabel `level`
--

CREATE TABLE `level` (
  `level` enum('level_1','level_2','level_3') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `level`
--

INSERT INTO `level` (`level`) VALUES
('level_1'),
('level_2'),
('level_3');

-- --------------------------------------------------------

--
-- Struktur dari tabel `login`
--

CREATE TABLE `login` (
  `id` int(11) NOT NULL,
  `Nama` varchar(100) DEFAULT NULL,
  `email` varchar(200) DEFAULT NULL,
  `password` varchar(200) DEFAULT NULL,
  `role` enum('user','admin','teknisi') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `login`
--

INSERT INTO `login` (`id`, `Nama`, `email`, `password`, `role`) VALUES
(1, 'admin', 'admin@ithelpdesk.com', '$2b$10$AF3LRJ14m3K9.TPVXkXeIeTSD2o16V2LeYwSKxg/xU9pE7uWvGopK', 'admin'),
(2, 'teknisi', 'teknisi@ithelpdesk.com', '$2b$10$on1Nb0Eu0EdJVM8/yk4CbudL.c3L4ksoUyk2W9.u92BZw/IBlMMUe', 'teknisi'),
(3, 'user', 'user@ithelpdesk.com', '$2b$10$7EZqD10t5KygYzEkocoNQeILsHELEgx6KMeAurwps38KDEGJybIle', 'user');

-- --------------------------------------------------------

--
-- Struktur dari tabel `tiket`
--

CREATE TABLE `tiket` (
  `id` int(11) NOT NULL,
  `judul` varchar(255) NOT NULL,
  `categori` int(11) NOT NULL,
  `ruangan` int(11) NOT NULL,
  `prioritas` enum('level_1','level_2','level_3') NOT NULL,
  `deskripsi` text NOT NULL,
  `akun` int(11) NOT NULL,
  `status` enum('NEW','ASSIGNED','IN_PROGRESS','WAITING','RESOLVED','CLOSED') NOT NULL DEFAULT 'NEW',
  `teknisi` int(11) DEFAULT NULL,
  `solusi` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `tiket`
--

INSERT INTO `tiket` (`id`, `judul`, `categori`, `ruangan`, `prioritas`, `deskripsi`, `akun`, `status`, `teknisi`, `solusi`) VALUES
(1, 'Komputer Bermasalah', 1, 1, 'level_1', 'Komputer mengalami masalah dan perlu dilakukan pemeriksaan.', 3, 'CLOSED', 2, 'Masalah koneksi jaringan sudah diperbaiki.'),
(4, 'Testing Authorization Teknisi', 1, 1, 'level_2', 'Tiket khusus untuk pengujian authorization.', 3, 'RESOLVED', 2, 'Pengujian selesai dan masalah berhasil diperbaiki.'),
(5, 'apa aja', 1, 1, 'level_3', 'tes', 1, 'NEW', NULL, NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `troubleshooting`
--

CREATE TABLE `troubleshooting` (
  `id` int(11) NOT NULL,
  `id_tiket` int(11) NOT NULL,
  `lampiran` int(11) NOT NULL,
  `tindakan` text NOT NULL,
  `hasil` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `troubleshooting`
--

INSERT INTO `troubleshooting` (`id`, `id_tiket`, `lampiran`, `tindakan`, `hasil`) VALUES
(1, 1, 1, 'Memeriksa kabel power dan konektor listrik komputer', 'Kabel power terpasang dengan baik tetapi komputer masih belum menyala');

-- --------------------------------------------------------

--
-- Struktur dari tabel `unit`
--

CREATE TABLE `unit` (
  `id` int(11) NOT NULL,
  `ruangan` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `unit`
--

INSERT INTO `unit` (`id`, `ruangan`) VALUES
(1, 'Ruang IT'),
(2, 'Ruang Administrasi'),
(3, 'Ruang Keuangan');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `asset`
--
ALTER TABLE `asset`
  ADD PRIMARY KEY (`id_asset`),
  ADD UNIQUE KEY `asset_code` (`asset_code`),
  ADD KEY `id_ruangan` (`id_ruangan`);

--
-- Indeks untuk tabel `knowledge_article`
--
ALTER TABLE `knowledge_article`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_categori` (`id_categori`),
  ADD KEY `level` (`level`);

--
-- Indeks untuk tabel `knowledge_kategori`
--
ALTER TABLE `knowledge_kategori`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `level`
--
ALTER TABLE `level`
  ADD PRIMARY KEY (`level`);

--
-- Indeks untuk tabel `login`
--
ALTER TABLE `login`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `tiket`
--
ALTER TABLE `tiket`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categori` (`categori`),
  ADD KEY `ruangan` (`ruangan`),
  ADD KEY `prioritas` (`prioritas`),
  ADD KEY `akun` (`akun`),
  ADD KEY `teknisi` (`teknisi`);

--
-- Indeks untuk tabel `troubleshooting`
--
ALTER TABLE `troubleshooting`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_tiket` (`id_tiket`);

--
-- Indeks untuk tabel `unit`
--
ALTER TABLE `unit`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `asset`
--
ALTER TABLE `asset`
  MODIFY `id_asset` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `knowledge_article`
--
ALTER TABLE `knowledge_article`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `knowledge_kategori`
--
ALTER TABLE `knowledge_kategori`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `login`
--
ALTER TABLE `login`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `tiket`
--
ALTER TABLE `tiket`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT untuk tabel `troubleshooting`
--
ALTER TABLE `troubleshooting`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `unit`
--
ALTER TABLE `unit`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `asset`
--
ALTER TABLE `asset`
  ADD CONSTRAINT `fk_asset_id_ruangan` FOREIGN KEY (`id_ruangan`) REFERENCES `unit` (`id`);

--
-- Ketidakleluasaan untuk tabel `knowledge_article`
--
ALTER TABLE `knowledge_article`
  ADD CONSTRAINT `fk_knowledge_article_id_categori` FOREIGN KEY (`id_categori`) REFERENCES `knowledge_kategori` (`id`);

--
-- Ketidakleluasaan untuk tabel `tiket`
--
ALTER TABLE `tiket`
  ADD CONSTRAINT `fk_tiket_akun` FOREIGN KEY (`akun`) REFERENCES `login` (`id`),
  ADD CONSTRAINT `fk_tiket_categori` FOREIGN KEY (`categori`) REFERENCES `knowledge_kategori` (`id`),
  ADD CONSTRAINT `fk_tiket_prioritas` FOREIGN KEY (`prioritas`) REFERENCES `level` (`level`),
  ADD CONSTRAINT `fk_tiket_ruangan` FOREIGN KEY (`ruangan`) REFERENCES `unit` (`id`),
  ADD CONSTRAINT `fk_tiket_teknisi` FOREIGN KEY (`teknisi`) REFERENCES `login` (`id`);

--
-- Ketidakleluasaan untuk tabel `troubleshooting`
--
ALTER TABLE `troubleshooting`
  ADD CONSTRAINT `fk_troubleshooting_id_tiket` FOREIGN KEY (`id_tiket`) REFERENCES `tiket` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
