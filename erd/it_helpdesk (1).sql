-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Aug 15, 2026 at 12:56 PM
-- Server version: 12.3.2-MariaDB
-- PHP Version: 8.5.7

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
-- Table structure for table `asset`
--

CREATE TABLE `asset` (
  `id_asset` int(11) NOT NULL,
  `asset_code` varchar(255) NOT NULL,
  `id_ruangan` int(11) NOT NULL,
  `status` enum('repair','broken') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `knowledge_article`
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

-- --------------------------------------------------------

--
-- Table structure for table `knowledge_kategori`
--

CREATE TABLE `knowledge_kategori` (
  `id` int(11) NOT NULL,
  `nama_kategori` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `level`
--

CREATE TABLE `level` (
  `level` enum('level_1','level_2','level_3') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login`
--

CREATE TABLE `login` (
  `id` int(11) NOT NULL,
  `Nama` varchar(100) DEFAULT NULL,
  `email` varchar(200) DEFAULT NULL,
  `password` varchar(200) DEFAULT NULL,
  `role` enum('user','admin','teknisi') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tiket`
--

CREATE TABLE `tiket` (
  `id` int(11) NOT NULL,
  `judul` varchar(255) NOT NULL,
  `categori` int(11) NOT NULL,
  `ruangan` int(11) NOT NULL,
  `prioritas` enum('level_1','level_2','level_3') NOT NULL,
  `deskripsi` text NOT NULL,
  `akun` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `troubleshooting`
--

CREATE TABLE `troubleshooting` (
  `id` int(11) NOT NULL,
  `id_tiket` int(11) NOT NULL,
  `lampiran` int(11) NOT NULL,
  `tindakan` text NOT NULL,
  `hasil` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `unit`
--

CREATE TABLE `unit` (
  `id` int(11) NOT NULL,
  `ruangan` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `asset`
--
ALTER TABLE `asset`
  ADD PRIMARY KEY (`id_asset`),
  ADD UNIQUE KEY `asset_code` (`asset_code`),
  ADD KEY `id_ruangan` (`id_ruangan`);

--
-- Indexes for table `knowledge_article`
--
ALTER TABLE `knowledge_article`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_categori` (`id_categori`),
  ADD KEY `level` (`level`);

--
-- Indexes for table `knowledge_kategori`
--
ALTER TABLE `knowledge_kategori`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `level`
--
ALTER TABLE `level`
  ADD PRIMARY KEY (`level`);

--
-- Indexes for table `login`
--
ALTER TABLE `login`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tiket`
--
ALTER TABLE `tiket`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categori` (`categori`),
  ADD KEY `ruangan` (`ruangan`),
  ADD KEY `prioritas` (`prioritas`),
  ADD KEY `akun` (`akun`);

--
-- Indexes for table `troubleshooting`
--
ALTER TABLE `troubleshooting`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_tiket` (`id_tiket`);

--
-- Indexes for table `unit`
--
ALTER TABLE `unit`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `asset`
--
ALTER TABLE `asset`
  MODIFY `id_asset` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `knowledge_article`
--
ALTER TABLE `knowledge_article`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `knowledge_kategori`
--
ALTER TABLE `knowledge_kategori`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `login`
--
ALTER TABLE `login`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tiket`
--
ALTER TABLE `tiket`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `troubleshooting`
--
ALTER TABLE `troubleshooting`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `unit`
--
ALTER TABLE `unit`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `asset`
--
ALTER TABLE `asset`
  ADD CONSTRAINT `1` FOREIGN KEY (`id_ruangan`) REFERENCES `unit` (`id`);

--
-- Constraints for table `knowledge_article`
--
ALTER TABLE `knowledge_article`
  ADD CONSTRAINT `1` FOREIGN KEY (`id_categori`) REFERENCES `knowledge_kategori` (`id`);

--
-- Constraints for table `tiket`
--
ALTER TABLE `tiket`
  ADD CONSTRAINT `1` FOREIGN KEY (`categori`) REFERENCES `knowledge_kategori` (`id`),
  ADD CONSTRAINT `2` FOREIGN KEY (`ruangan`) REFERENCES `unit` (`id`),
  ADD CONSTRAINT `3` FOREIGN KEY (`prioritas`) REFERENCES `level` (`level`),
  ADD CONSTRAINT `4` FOREIGN KEY (`akun`) REFERENCES `login` (`id`);

--
-- Constraints for table `troubleshooting`
--
ALTER TABLE `troubleshooting`
  ADD CONSTRAINT `1` FOREIGN KEY (`id_tiket`) REFERENCES `tiket` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
