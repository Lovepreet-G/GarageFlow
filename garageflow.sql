-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 27, 2026 at 02:39 AM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `garageflow`
--

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `customer_name` varchar(150) NOT NULL,
  `customer_address` text DEFAULT NULL,
  `customer_phone` varchar(20) NOT NULL,
  `customer_email` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `shop_id`, `customer_name`, `customer_address`, `customer_phone`, `customer_email`, `created_at`) VALUES
(1, 6, 'Lovepreet singh', '48 Elrose rd ', '6473249662', 'gillpreetsingh35@gmail.com', '2026-01-19 18:45:37'),
(2, 6, 'Ritesh', '123 address ', '1234567890', 'ritesh@gmail.com', '2026-01-19 21:59:22'),
(3, 6, 'Taran', '123 add', '123456790', 'taran@gmail.com', '2026-01-20 15:33:56'),
(5, 6, 'Gaganpreet', NULL, '12345678900', NULL, '2026-01-20 20:00:32'),
(11, 11, 'Lovepreet', NULL, '6473249662', NULL, '2026-01-20 22:32:08');

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` int(11) NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `odometer_reading` int(11) DEFAULT NULL,
  `subtotal_amount` decimal(10,2) NOT NULL,
  `hst_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `pst_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('Draft','Approved','Paid','Overdue') DEFAULT 'Draft',
  `warranty_statement` varchar(255) DEFAULT '90 days or 5,000 km',
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `invoice_number`, `shop_id`, `customer_id`, `vehicle_id`, `invoice_date`, `due_date`, `odometer_reading`, `subtotal_amount`, `hst_amount`, `pst_amount`, `tax_amount`, `total_amount`, `status`, `warranty_statement`, `note`, `created_at`) VALUES
(1, '1234', 6, 1, 1, '2026-01-29', NULL, 293345, '100.00', '0.00', '0.00', '12.00', '112.00', 'Approved', '90 days or 5,000 km', NULL, '2026-01-19 18:48:17'),
(2, 'INV-1768859576963', 6, 1, 1, '2026-01-19', NULL, 2345054, '50.00', '0.00', '0.00', '6.50', '56.50', 'Approved', '90 days or 5,000 km', NULL, '2026-01-19 21:52:56'),
(3, 'INV-1768860058084', 6, 2, 2, '2026-01-19', NULL, 112345, '50.00', '0.00', '0.00', '6.50', '56.50', 'Paid', '90 days or 5,000 km', NULL, '2026-01-19 22:00:58'),
(4, 'INV-00001', 6, 1, 1, '2026-01-19', '2026-01-23', NULL, '50.00', '0.00', '0.00', '6.00', '56.00', 'Paid', '90 days or 5,000 km', NULL, '2026-01-19 22:30:19'),
(5, 'INV-00002', 6, 3, 3, '2026-01-20', '2026-01-21', 21000, '100.00', '7.00', '5.00', '12.00', '112.00', 'Paid', '90 days or 5,000 km', 'Pst Number : 1244', '2026-01-20 16:54:24'),
(8, 'INV-00002', 11, 11, 8, '2026-01-20', NULL, NULL, '200.00', '14.00', '10.00', '24.00', '224.00', 'Paid', '90 days or 5,000 km', NULL, '2026-01-20 22:32:08'),
(9, 'INV-00003', 6, 1, 9, '2026-01-21', NULL, NULL, '200.00', '14.00', '10.00', '24.00', '224.00', 'Paid', '90 days or 5,000 km', NULL, '2026-01-21 03:16:23'),
(10, 'INV-00004', 6, 1, 9, '2026-01-26', NULL, NULL, '1000.00', '70.00', '0.00', '70.00', '1070.00', 'Paid', '90 days or 5,000 km', NULL, '2026-01-26 01:36:32'),
(11, 'INV-00005', 6, 1, 9, '2026-01-16', NULL, NULL, '200.00', '14.00', '0.00', '14.00', '214.00', 'Overdue', '90 days or 5,000 km', NULL, '2026-01-26 04:24:45'),
(12, 'INV-00006', 6, 1, 1, '2026-01-26', '2026-01-31', 250550, '303.00', '21.21', '15.15', '36.36', '339.36', 'Approved', '90 days or 5,000 km', 'Pst number : 1232e3fedf', '2026-01-26 21:42:21'),
(13, 'INV-00007', 6, 1, 9, '2026-01-26', NULL, NULL, '34.00', '2.38', '0.00', '2.38', '36.38', 'Approved', '90 days or 5,000 km', NULL, '2026-01-26 22:10:48');

-- --------------------------------------------------------

--
-- Table structure for table `invoice_items`
--

CREATE TABLE `invoice_items` (
  `id` int(11) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `item_description` varchar(255) NOT NULL,
  `type` enum('Part','Labor') NOT NULL,
  `condition` enum('New','Used','Reconditioned') DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `invoice_items`
--

INSERT INTO `invoice_items` (`id`, `invoice_id`, `item_description`, `type`, `condition`, `quantity`, `unit_price`, `total_price`) VALUES
(1, 1, 'Oil Change', 'Part', 'New', 1, '50.00', '50.00'),
(2, 2, 'Oil Change', 'Labor', NULL, 1, '50.00', '50.00'),
(3, 3, 'Oil Change', 'Part', 'New', 1, '50.00', '50.00'),
(4, 4, 'oil', 'Labor', NULL, 1, '50.00', '50.00'),
(5, 5, 'oil change', 'Part', 'New', 1, '100.00', '100.00'),
(7, 8, 'Tire change', 'Part', 'New', 1, '200.00', '200.00'),
(8, 9, 'Service', 'Labor', NULL, 1, '200.00', '200.00'),
(9, 10, 'Engine swap', 'Part', 'Used', 1000, '1.00', '1000.00'),
(10, 11, 'oil change', 'Labor', NULL, 1, '200.00', '200.00'),
(11, 12, 'Oil', 'Labor', NULL, 1, '23.00', '23.00'),
(12, 12, 'fgfg', 'Labor', NULL, 1, '32.00', '32.00'),
(13, 12, 'dfg', 'Labor', NULL, 1, '23.00', '23.00'),
(14, 12, 'fgfg', 'Labor', NULL, 1, '23.00', '23.00'),
(15, 12, 'fgf', 'Labor', NULL, 1, '21.00', '21.00'),
(16, 12, 'fhgh', 'Labor', NULL, 1, '23.00', '23.00'),
(17, 12, 'fgfg', 'Labor', NULL, 1, '34.00', '34.00'),
(18, 12, 'fg', 'Labor', NULL, 1, '23.00', '23.00'),
(19, 12, 'fg', 'Labor', NULL, 1, '33.00', '33.00'),
(20, 12, 'fgfg', 'Labor', NULL, 1, '12.00', '12.00'),
(21, 12, 'fgf', 'Labor', NULL, 1, '23.00', '23.00'),
(22, 12, 'rgf', 'Labor', NULL, 1, '21.00', '21.00'),
(23, 12, 'fgfg', 'Labor', NULL, 1, '12.00', '12.00'),
(24, 13, 'gfgh', 'Labor', NULL, 1, '34.00', '34.00');

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `password_resets`
--

INSERT INTO `password_resets` (`id`, `shop_id`, `token_hash`, `expires_at`, `used_at`, `created_at`) VALUES
(1, 11, '39ec71cbc1ba415bfdc189d6eabf2d9a40bf52308538987133f0ddb244eca32f', '2026-01-25 16:16:18', '2026-01-25 15:48:30', '2026-01-25 20:46:18'),
(2, 11, 'a0133cd82e14aafdab1035d09febe9f5131f56cde76b016667734f258e65b46b', '2026-01-25 17:00:41', '2026-01-25 16:31:14', '2026-01-25 21:30:41'),
(3, 11, 'caea70ca83ecd18e0cd794ed177bb2d84fcdd48ed4452fe032111533e27c29d1', '2026-01-25 17:18:47', NULL, '2026-01-25 21:48:47'),
(4, 11, 'c5a9acb16fafeff724bfea266876b6cefafabda84f4083cca7ad9a6f71d36c85', '2026-01-25 17:20:39', NULL, '2026-01-25 21:50:39'),
(5, 11, '11497fc233c1d7425d18b3496bd9d25f897aa85d9d990526ca42b558023db00e', '2026-01-25 17:23:52', NULL, '2026-01-25 21:53:52'),
(6, 11, 'd9809511ca8e5768afd64bcca1a7db98634c899da3896bed1f527dfb171aba8e', '2026-01-25 17:26:43', NULL, '2026-01-25 21:56:43'),
(7, 11, 'e03a000e4a51a3f20549f8f918892a838bbda4c101332fc0bef1753cb4ae27c1', '2026-01-25 17:48:12', '2026-01-25 17:24:47', '2026-01-25 22:18:12'),
(8, 11, 'c1b2ac5454ddf39a67f536086f72f4a03493f73673ae80d2f8711e50c92e6f30', '2026-01-25 17:49:48', NULL, '2026-01-25 22:19:48'),
(9, 11, '51eae70ea1e851cf844291d3b6f2eeed2e286b4ce04f5b01321ac2249ac09555', '2026-01-25 18:13:05', NULL, '2026-01-25 22:43:05'),
(10, 11, '2ceab030b7d594a78006a6e22e62f12a15aa501d6e6e1f0aed6ce2d763f645fb', '2026-01-25 18:13:22', NULL, '2026-01-25 22:43:22'),
(11, 11, '04a26a431beccb4f2d067ce354edacc03a48b7a888a497e7c5b6c10e12abb0a0', '2026-01-25 18:13:27', NULL, '2026-01-25 22:43:27'),
(12, 11, '077ae4b1b3074d0db35bec186d4580fdddd64f3fafa44e1456b16b95dea9f3c4', '2026-01-25 18:13:33', NULL, '2026-01-25 22:43:33'),
(13, 11, 'a3735925701999bacbaf5382f798f6bc075f57c2e1e0be573b7459ec98deb0a0', '2026-01-25 18:13:37', NULL, '2026-01-25 22:43:37'),
(14, 11, '74e9e8fd9b57764e5fae308f592f43cf101cdb85c7e9b9b78b19cede3f344b7d', '2026-01-25 18:13:40', NULL, '2026-01-25 22:43:40'),
(15, 11, '79344fb59bea345ac4d1d0247088adacabb5e212370e089d35918594eb8edf49', '2026-01-25 18:13:42', NULL, '2026-01-25 22:43:42'),
(16, 11, 'd3b5e1539cb06d3ebc0a9713d00c30725a9c6be9b1159ee0b92bafe91d8fbc19', '2026-01-25 18:13:54', NULL, '2026-01-25 22:43:54'),
(17, 11, '50888f60c9f5c7cef07950e9126e2dfde15fc8a22d76eae48ef9e61b7b792e4c', '2026-01-25 18:13:56', NULL, '2026-01-25 22:43:56'),
(18, 11, 'a27ac2cf0b58c7ac5cc6c7711c11ed45b58878d8ae836363290a0d317714ba14', '2026-01-25 18:13:59', NULL, '2026-01-25 22:43:59'),
(19, 11, '86fd083f66bd9dd79ea9addaba4c5adfbd358b507b526f95e7c3d240fa906898', '2026-01-25 18:14:03', NULL, '2026-01-25 22:44:03'),
(20, 11, 'a3d7b511832d284740a184215fb4aa665242f136c0cdccfe2879d0395a8e85dd', '2026-01-25 18:14:05', NULL, '2026-01-25 22:44:05'),
(21, 11, 'b8533b3406d86ee84544932ef099365c410bfa2c710b7f967df028e88983784a', '2026-01-25 18:14:39', NULL, '2026-01-25 22:44:39'),
(22, 11, '68ec69d19318e699c3ca7ad3968b5720f770069019e1b0f26c28ab2fd34e9dad', '2026-01-25 18:14:41', NULL, '2026-01-25 22:44:41'),
(23, 11, '6aeccabdf142130691578e82ccd8ed432d5b5eb919b8770a35fc76c5217a9c98', '2026-01-25 18:19:20', NULL, '2026-01-25 22:49:20'),
(24, 11, '7a4a39d52a7273083e71af41b3f5aaa3adc50a2375cf9fa6cb3d2fbeddfa702f', '2026-01-25 18:19:23', NULL, '2026-01-25 22:49:23'),
(25, 11, 'db88c089f5249567fde444bdb4c1ffda33ea6ce0ced94f5a8b299ed7309bf8bd', '2026-01-25 18:19:25', NULL, '2026-01-25 22:49:25'),
(26, 11, '71fdd4bec0b3930fc4ac6658574825d740479e8f5b614c3af088ffd0221d2ac2', '2026-01-25 18:19:28', NULL, '2026-01-25 22:49:28'),
(27, 11, 'd4659a0bf9b0bc82549461de97c8acf490c1991a5736a5620b9e630cf505fdd1', '2026-01-25 18:19:30', NULL, '2026-01-25 22:49:30'),
(28, 11, '6e20cb7f073d154be0c67a13c1ae975ec7daeb72d634a7b1a17c8ccd36fb8c34', '2026-01-25 23:56:45', '2026-01-25 23:28:04', '2026-01-26 04:26:45'),
(29, 12, 'b8867f05962177cc369cf749c3467a4b1baa979bc5005af061b0d825f34ac13f', '2026-01-26 00:25:09', NULL, '2026-01-26 04:55:09'),
(30, 11, '7bf050227a48751f666993040fbc0ce176da38af24ecc063d03071db27c6768c', '2026-01-26 17:47:05', NULL, '2026-01-26 22:17:05'),
(31, 11, '1d6f175f7cf8a5b218a9252c250e6b11166bd650843417c603fbb72035300ed7', '2026-01-26 17:49:36', NULL, '2026-01-26 22:19:36'),
(32, 11, '6d87314912276692e71f277c374a377d2c6ea27b6ae91cef499ab4aa423d5a1d', '2026-01-26 17:50:36', NULL, '2026-01-26 22:20:36');

-- --------------------------------------------------------

--
-- Table structure for table `shops`
--

CREATE TABLE `shops` (
  `id` int(11) NOT NULL,
  `shop_name` varchar(150) NOT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `shop_address` text NOT NULL,
  `shop_phone` varchar(20) DEFAULT NULL,
  `shop_email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `tax_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `next_invoice_no` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shops`
--

INSERT INTO `shops` (`id`, `shop_name`, `logo_url`, `shop_address`, `shop_phone`, `shop_email`, `password_hash`, `tax_id`, `created_at`, `next_invoice_no`) VALUES
(6, 'Eagle Eye Auto', '/uploads/logos/shop_6.png', '#103 13483 78 Ave, Surrey, BC V3W 0AB, Canada', '123456789', 'gill@gmail.com', '$2b$10$kW76PLUjeeQA6baZ.g96OelaCbjNQxLb4a6MTvTcai9pxu4gSf4H6', '123', '2026-01-14 04:25:16', 8),
(11, 'Lover', '/uploads/logos/shop_11.png', 'dfg', '1234567980', 'gillpreetsingh35@gmail.com', '$2b$10$O5sV1/tvykOmjA6NPnsgGekg/dUnrzEpZEd0LjsWQe2jhmsTKjP86', NULL, '2026-01-20 22:16:56', 3),
(12, 'Ritesh\'s Garage', '/uploads/logos/shop_12.png', 'Pune , Maharastra', '1234565409', 'riteshrai0801@gmail.com', '$2b$10$hTxIB.Kr1ic8EF66J4gFPe7Nx.gYL6SJPrPLn.pcUyM2S/2DQa28O', '1234567890', '2026-01-26 04:54:58', 1);

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `vehicle_vin` varchar(50) NOT NULL,
  `make` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `license_plate` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`id`, `shop_id`, `customer_id`, `vehicle_vin`, `make`, `model`, `year`, `license_plate`, `created_at`) VALUES
(1, 6, 1, '123455678890', 'Honda', 'Civic', 2008, 'DBWN139', '2026-01-19 18:46:34'),
(2, 6, 2, '123', 'BMW', '330i', 2020, 'DBWN139', '2026-01-19 22:00:10'),
(3, 6, 3, '1234567890', 'Bmw', 'M5', 2020, 'Dbwn 140', '2026-01-20 15:34:32'),
(4, 6, 5, '123456567', NULL, NULL, NULL, NULL, '2026-01-20 20:01:04'),
(8, 11, 11, '123456578', 'Honda', 'Civic', 2008, 'DBWN139', '2026-01-20 22:32:08'),
(9, 6, 1, '122454576778', 'Honda', 'Civic', 2026, NULL, '2026-01-21 03:12:07');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_shop_phone` (`shop_id`,`customer_phone`),
  ADD KEY `idx_customer_shop` (`shop_id`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_shop_invoice_number` (`shop_id`,`invoice_number`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `vehicle_id` (`vehicle_id`);

--
-- Indexes for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `invoice_id` (`invoice_id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_token_hash` (`token_hash`),
  ADD KEY `shop_id` (`shop_id`);

--
-- Indexes for table `shops`
--
ALTER TABLE `shops`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`shop_email`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_shop_vin` (`shop_id`,`vehicle_vin`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `vin` (`vehicle_vin`),
  ADD KEY `idx_vehicle_shop` (`shop_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `invoice_items`
--
ALTER TABLE `invoice_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `shops`
--
ALTER TABLE `shops`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `fk_customers_shop` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`);

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`),
  ADD CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`);

--
-- Constraints for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`);

--
-- Constraints for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `fk_password_resets_shop` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`);

--
-- Constraints for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `fk_vehicles_shop` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`),
  ADD CONSTRAINT `vehicles_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
