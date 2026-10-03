-- ============================================================
-- SCRIPT OTOMATIS DATABASE MYSQL - E-SANGU SANTRI
-- ============================================================

CREATE DATABASE IF NOT EXISTS `esangu_santri` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `esangu_santri`;

-- 1. TABEL SANTRI
CREATE TABLE IF NOT EXISTS `santri` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `nis` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `class_name` VARCHAR(100) NOT NULL,
  `dorm` VARCHAR(100) DEFAULT '',
  `guardian_phone` VARCHAR(30) DEFAULT '',
  `status` VARCHAR(20) DEFAULT 'Aktif',
  `has_savings` TINYINT(1) DEFAULT 0,
  `savings_active` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. TABEL TRANSAKSI (MUTASI SETOR & TARIK)
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `santri_id` VARCHAR(100) NOT NULL,
  `santri_name` VARCHAR(255) DEFAULT '',
  `santri_class` VARCHAR(100) DEFAULT '',
  `date` VARCHAR(20) NOT NULL,
  `type` VARCHAR(20) NOT NULL,
  `account_type` VARCHAR(50) DEFAULT 'Tabungan',
  `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `admin_fee` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `net_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `note` TEXT,
  `cashier_name` VARCHAR(255) DEFAULT '',
  `signature_name` VARCHAR(255) DEFAULT '',
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `payment_method` VARCHAR(50) DEFAULT 'Tunai',
  `bank_name` VARCHAR(100) DEFAULT NULL,
  `account_info` VARCHAR(255) DEFAULT NULL,
  `transfer_receipt_url` LONGTEXT DEFAULT NULL,
  FOREIGN KEY (`santri_id`) REFERENCES `santri`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. TABEL PROFIL LEMBAGA
CREATE TABLE IF NOT EXISTS `institution` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `address` TEXT NOT NULL,
  `phone` VARCHAR(50) DEFAULT '',
  `email` VARCHAR(100) DEFAULT '',
  `website` VARCHAR(255) DEFAULT '',
  `logo_url` LONGTEXT DEFAULT NULL,
  `leader_name` VARCHAR(255) DEFAULT '',
  `leader_nip` VARCHAR(100) DEFAULT '',
  `treasurer_name` VARCHAR(255) DEFAULT '',
  `classes` JSON DEFAULT NULL,
  `dorms` JSON DEFAULT NULL,
  `wa_template_registration` TEXT,
  `wa_template_transaction` TEXT,
  `wa_template_account_data` TEXT,
  `wa_template_balance_summary` TEXT,
  `deposit_bank_name` VARCHAR(100) DEFAULT 'BANK BRI',
  `deposit_bank_account_number` VARCHAR(100) DEFAULT '632201038845535',
  `deposit_bank_account_holder` VARCHAR(255) DEFAULT 'Ust. Muhammad Afif Syaiful Muzakky',
  `deposit_bank_custom_text` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. TABEL ATURAN KEUNGAN
CREATE TABLE IF NOT EXISTS `financial` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `max_withdrawals_per_year` INT DEFAULT 3,
  `window_open` TINYINT(1) DEFAULT 0,
  `window_start_date` VARCHAR(20) DEFAULT '2026-12-15',
  `window_end_date` VARCHAR(20) DEFAULT '2026-12-30',
  `admin_fee_tabungan_enabled` TINYINT(1) DEFAULT 1,
  `admin_fee_tabungan_amount` DECIMAL(15,2) DEFAULT 5000.00,
  `savings_book_fee_amount` DECIMAL(15,2) DEFAULT 5000.00,
  `qr_balance_check_enabled` TINYINT(1) DEFAULT 1,
  `balance_check_method` VARCHAR(50) DEFAULT 'all',
  `allow_delete_with_balance` TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. TABEL PENGGUNA (USER AKUN ADMIN)
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. TABEL PENGAJUAN / PENDAFTARAN PORTAL
CREATE TABLE IF NOT EXISTS `registrations` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `type` VARCHAR(50) DEFAULT 'Buka Akun',
  `name` VARCHAR(255) NOT NULL,
  `class_name` VARCHAR(100) DEFAULT '',
  `dorm` VARCHAR(100) DEFAULT '',
  `guardian_phone` VARCHAR(50) DEFAULT '',
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `status` VARCHAR(20) DEFAULT 'Pending',
  `rejection_reason` TEXT,
  `note` TEXT,
  `santri_id` VARCHAR(100) DEFAULT NULL,
  `account_type` VARCHAR(50) DEFAULT 'Tabungan',
  `amount` DECIMAL(15,2) DEFAULT 0.00,
  `transfer_receipt_url` LONGTEXT DEFAULT NULL,
  `payment_method` VARCHAR(50) DEFAULT 'Transfer'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. TABEL LOG AKTIFITAS
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `user` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- INPUT DATA DEFAULT AWAL OTOMATIS (SEED DATA)
-- ============================================================

-- Input Akun User Default (Master, Admin, Bendahara)
INSERT IGNORE INTO `users` (`id`, `username`, `name`, `role`, `password`, `is_active`) VALUES
('u_master', 'master', 'Master', 'Master', 'master123', 1),
('u_afif', 'afif', 'Afif', 'Master', 'master123', 1),
('u_admin', 'admin', 'Admin Utama', 'Admin', 'admin123', 1),
('u_manajer', 'manajer', 'Manajer', 'Master', 'manajer123', 1),
('u_bendahara', 'bendahara', 'Bendahara Utama', 'Bendahara', 'bendahara123', 1);

-- Input Profil Lembaga Default
INSERT INTO `institution` 
(`id`, `name`, `address`, `phone`, `email`, `website`, `treasurer_name`, `classes`, `dorms`, `wa_template_registration`, `wa_template_transaction`, `wa_template_account_data`, `wa_template_balance_summary`) 
VALUES (
  1,
  'Pondok Pesantren Wahyu Hidayatul Islam',
  'KLOPOSAWIT - CANDIPURO - LUMAJANG',
  '0274-123456',
  'info@wahyuhidayatulislam.or.id',
  'www.wahyuhidayatulislam.or.id',
  'Ustadz H. Ahmad Junaedi, S.E.',
  '["1 TSANAWIYAH (PA)", "2 TSANAWIYAH (PA)", "3 TSANAWIYAH (PA)", "1 ALIYAH", "2 ALIYAH", "3 ALIYAH (A)", "3 ALIYAH (B)"]',
  '["Yunusiyah", "Ar Ridho 1", "Ar Ridho 2", "Ar Ridho 3", "Al Badriyah"]',
  '*E-SANGU SANTRI*\nSistem Tabungan Uang Santri\n{NAMA PONDOK}\n\n*DATA AKUN SANTRI*\n\n*NIS :* {NIS}\n*Nama :* {NAMA}\n*Kelas :* {KELAS}\n*Asrama :* {ASRAMA}\n*No Wali :* {NO_WALI}\n\nSimpan data diatas sebagai akses mengecek Saldo Keuangan santri di website {NAMA WEBSITE}',
  '*E-SANGU SANTRI*\nSistem Tabungan Uang Santri\n{NAMA PONDOK}\n\n*{BUKTI}*\n\n*NIS :* {NIS}\n*Nama :* {NAMA}\n*Kelas :* {KELAS}\n\n*ID Transaksi :* {ID_TRANSAKSI}\n*Tanggal & Waktu :* {TANGGAL & WAKTU}\n*Akun Dana* : {AKUN DANA}\n*Keterangan* : {KETERANGAN}\n\n*Nominal : {NOMINAL}*\n\nSimpan data diatas sebagai akses mengecek Saldo Keuangan santri di website {NAMA WEBSITE}\n______________________\n> Dibuat otomatis oleh Sistem E-Sangu Santri',
  '*E-SANGU SANTRI*\nSistem Tabungan Uang Santri\n{NAMA PONDOK}\n\n*DATA AKUN SANTRI*\n\n*NIS :* {NIS}\n*Nama :* {NAMA}\n*Kelas :* {KELAS}\n*Asrama :* {ASRAMA}\n*No Wali :* {NO_WALI}\n\nSimpan data diatas sebagai akses mengecek Saldo Keuangan santri di website {NAMA WEBSITE}',
  '*E-SANGU SANTRI*\nSistem Tabungan Uang Santri\n{NAMA PONDOK}\n\n*RINGKASAN INFORMASI SALDO*\n\n*NIS :* {NIS}\n*Nama :* {NAMA}\n*Kelas :* {KELAS}\n\n*Saldo Tabungan :* {Saldo Tabungan}\n*TOTAL SALDO* : {TOTAL SALDO}\n\nSimpan data diatas sebagai akses mengecek Saldo Keuangan santri di website {NAMA WEBSITE}\n______________________\n> Dibuat otomatis oleh Sistem E-Sangu Santri'
) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Input Aturan Keuangan Default
INSERT INTO `financial` 
(`id`, `max_withdrawals_per_year`, `window_open`, `window_start_date`, `window_end_date`, `admin_fee_tabungan_enabled`, `admin_fee_tabungan_amount`, `savings_book_fee_amount`, `qr_balance_check_enabled`, `balance_check_method`, `allow_delete_with_balance`) 
VALUES (
  1, 3, 0, '2026-12-15', '2026-12-30', 1, 5000.00, 5000.00, 1, 'all', 0
) ON DUPLICATE KEY UPDATE `id` = 1;
