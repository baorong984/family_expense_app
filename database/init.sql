-- =====================================================
-- 家庭消费记账系统 - 数据库初始化脚本（完整统一版）
-- 数据库: MySQL 8.0+
-- 字符集: utf8mb4 / 排序规则: utf8mb4_unicode_ci
--
-- 包含所有迁移后的最终表结构：
--   users, members, categories, expenses, budgets,
--   gifts, gift_reminders, vehicles, vehicle_fuel_records,
--   ai_analysis_records
-- =====================================================

CREATE DATABASE IF NOT EXISTS `family_expense`
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `family_expense`;

-- =====================================================
-- 清理旧表（按外键依赖逆序）
-- =====================================================
DROP TABLE IF EXISTS `ai_analysis_records`;
DROP TABLE IF EXISTS `gift_reminders`;
DROP TABLE IF EXISTS `gifts`;
DROP TABLE IF EXISTS `vehicle_fuel_records`;
DROP TABLE IF EXISTS `vehicles`;
DROP TABLE IF EXISTS `budgets`;
DROP TABLE IF EXISTS `expenses`;
DROP TABLE IF EXISTS `members`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

-- =====================================================
-- 1. 用户表 (users)
-- =====================================================
CREATE TABLE `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '用户ID（主键）',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名（唯一）',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（bcrypt加密）',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `is_admin` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否管理员（0=否，1=是）',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态（0=禁用，1=启用）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- =====================================================
-- 2. 成员表 (members)
-- =====================================================
CREATE TABLE `members` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '成员ID（主键）',
  `name` VARCHAR(50) NOT NULL COMMENT '成员姓名',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `password` VARCHAR(255) DEFAULT NULL COMMENT '登录密码（bcrypt加密）',
  `color` VARCHAR(7) NOT NULL DEFAULT '#4ECDC4' COMMENT '成员专属色',
  `created_by` INT(11) NOT NULL COMMENT '创建者（关联users.id）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_members_color` (`color`),
  CONSTRAINT `fk_member_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成员表';

-- =====================================================
-- 3. 分类表 (categories)
-- =====================================================
CREATE TABLE `categories` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '分类ID（主键）',
  `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
  `parent_id` INT(11) DEFAULT NULL COMMENT '父分类ID（NULL为大类）',
  `is_system` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否系统预设（0=否，1=是）',
  `sort_order` INT(11) NOT NULL DEFAULT 0 COMMENT '排序顺序',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_is_system` (`is_system`),
  CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- =====================================================
-- 4. 消费记录表 (expenses)
-- =====================================================
CREATE TABLE `expenses` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '消费ID（主键）',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '消费金额',
  `expense_date` DATE NOT NULL COMMENT '消费日期',
  `expense_time` TIME DEFAULT NULL COMMENT '消费时间',
  `category_id` INT(11) NOT NULL COMMENT '分类ID（关联categories.id）',
  `member_id` INT(11) DEFAULT NULL COMMENT '成员ID（关联members.id）',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '消费描述',
  `remarks` VARCHAR(200) DEFAULT NULL COMMENT '备注',
  `is_gift` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否为人情记录（0=否，1=是）',
  `gift_id` INT(11) DEFAULT NULL COMMENT '关联的人情记录ID',
  `created_by` INT(11) NOT NULL COMMENT '创建者（关联users.id）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_expense_date` (`expense_date`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_member_id` (`member_id`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_expense_date_category` (`expense_date`, `category_id`),
  KEY `idx_is_gift` (`is_gift`),
  KEY `idx_gift_id` (`gift_id`),
  CONSTRAINT `fk_expense_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_expense_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_expense_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消费记录表';

-- =====================================================
-- 5. 人情记录表 (gifts)
-- =====================================================
CREATE TABLE `gifts` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '人情记录ID（主键）',
  `expense_id` INT(11) DEFAULT NULL COMMENT '关联的消费记录ID（出礼记录）',
  `gift_type` ENUM('outgoing', 'incoming') NOT NULL COMMENT '类型：outgoing=出礼，incoming=收礼',
  `payment_type` ENUM('cash', 'item') NOT NULL COMMENT '支付类型：cash=现金，item=实物',
  `amount` DECIMAL(10,2) DEFAULT NULL COMMENT '金额（现金类型必填）',
  `item_name` VARCHAR(200) DEFAULT NULL COMMENT '实物名称（实物类型必填）',
  `item_value` DECIMAL(10,2) DEFAULT NULL COMMENT '实物价值（可选）',
  `related_person` VARCHAR(100) NOT NULL COMMENT '关联人姓名',
  `occasion` VARCHAR(50) NOT NULL COMMENT '事由（婚礼、生日、丧礼、满月、乔迁等）',
  `expense_date` DATE NOT NULL COMMENT '人情日期',
  `expense_time` TIME DEFAULT NULL COMMENT '人情时间',
  `remarks` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `is_returned` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已回礼（出礼记录专用）',
  `return_gift_id` INT(11) DEFAULT NULL COMMENT '关联的回礼记录ID',
  `created_by` INT(11) NOT NULL COMMENT '创建者',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_expense_id` (`expense_id`),
  KEY `idx_gift_type` (`gift_type`),
  KEY `idx_expense_date` (`expense_date`),
  KEY `idx_related_person` (`related_person`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_gift_expense` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_gift_return` FOREIGN KEY (`return_gift_id`) REFERENCES `gifts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_gift_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='人情记录表';

-- =====================================================
-- 6. expenses -> gifts 外键（后建，避免循环依赖）
-- =====================================================
ALTER TABLE `expenses`
  ADD CONSTRAINT `fk_expense_gift` FOREIGN KEY (`gift_id`) REFERENCES `gifts` (`id`) ON DELETE SET NULL;

-- =====================================================
-- 7. 人情提醒表 (gift_reminders)
-- =====================================================
CREATE TABLE `gift_reminders` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '提醒ID（主键）',
  `reminder_type` ENUM('return_gift', 'occasion') NOT NULL COMMENT '提醒类型：return_gift=回礼提醒，occasion=事由提醒',
  `gift_id` INT(11) DEFAULT NULL COMMENT '关联的人情记录ID（回礼提醒）',
  `reminder_date` DATE NOT NULL COMMENT '提醒日期',
  `reminder_message` VARCHAR(500) NOT NULL COMMENT '提醒内容',
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已完成',
  `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
  `created_by` INT(11) NOT NULL COMMENT '创建者',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_reminder_type` (`reminder_type`),
  KEY `idx_reminder_date` (`reminder_date`),
  KEY `idx_gift_id` (`gift_id`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_reminder_gift` FOREIGN KEY (`gift_id`) REFERENCES `gifts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reminder_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='人情提醒表';

-- =====================================================
-- 8. 预算表 (budgets)
-- =====================================================
CREATE TABLE `budgets` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '预算ID（主键）',
  `year` INT(4) NOT NULL COMMENT '年份',
  `month` INT(2) NOT NULL COMMENT '月份（1-12）',
  `total_amount` DECIMAL(10,2) NOT NULL COMMENT '总预算金额',
  `category_id` INT(11) DEFAULT NULL COMMENT '分类ID（NULL为总预算）',
  `created_by` INT(11) NOT NULL COMMENT '创建者（关联users.id）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_year_month_category` (`year`, `month`, `category_id`, `created_by`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_budget_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_budget_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预算表';

-- =====================================================
-- 9. 车辆信息表 (vehicles)
-- =====================================================
CREATE TABLE `vehicles` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '车辆ID（主键）',
  `plate_number` VARCHAR(20) NOT NULL COMMENT '车牌号（唯一标识）',
  `brand_model` VARCHAR(100) NOT NULL COMMENT '品牌型号（如：比亚迪秦PLUS）',
  `vehicle_type` ENUM('fuel', 'electric') NOT NULL COMMENT '车辆类型：fuel=燃油车，electric=纯电动',
  `base_mileage` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '基准里程（公里），可手动调整',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用（0=停用，1=启用）',
  `created_by` INT(11) NOT NULL COMMENT '创建者用户ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_plate_number` (`plate_number`),
  KEY `idx_vehicle_type` (`vehicle_type`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_vehicle_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='车辆信息表';

-- =====================================================
-- 10. 加油/充电记录表 (vehicle_fuel_records)
-- =====================================================
CREATE TABLE `vehicle_fuel_records` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '记录ID（主键）',
  `vehicle_id` INT(11) NOT NULL COMMENT '关联的车辆ID',
  `expense_id` INT(11) DEFAULT NULL COMMENT '关联的消费记录ID',
  `record_type` ENUM('fuel', 'charge') NOT NULL COMMENT '记录类型：fuel=加油，charge=充电',
  `record_date` DATE NOT NULL COMMENT '记录日期',
  `record_time` TIME DEFAULT NULL COMMENT '记录时间（可选，精确到小时）',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '金额（元）',
  `current_mileage` DECIMAL(10,2) NOT NULL COMMENT '当前里程数（公里）',
  `last_mileage` DECIMAL(10,2) DEFAULT NULL COMMENT '上次里程数（自动计算或手动输入）',
  `mileage_diff` DECIMAL(10,2) DEFAULT NULL COMMENT '本次行驶里程 = 当前里程 - 上次里程（公里）',
  `cost_per_km` DECIMAL(10,4) DEFAULT NULL COMMENT '每公里成本 = 金额 ÷ 本次行驶里程（元/公里）',
  `remarks` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_by` INT(11) NOT NULL COMMENT '创建者用户ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_vehicle_id` (`vehicle_id`),
  KEY `idx_expense_id` (`expense_id`),
  KEY `idx_record_type` (`record_type`),
  KEY `idx_record_date` (`record_date`),
  KEY `idx_record_time` (`record_time`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_fuel_record_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fuel_expense` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_fuel_record_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='加油/充电记录表';

-- =====================================================
-- 11. AI分析记录表 (ai_analysis_records)
-- =====================================================
CREATE TABLE `ai_analysis_records` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `start_date` DATE NOT NULL COMMENT '分析开始日期',
  `end_date` DATE NOT NULL COMMENT '分析结束日期',
  `analysis_data` JSON NOT NULL COMMENT '分析结果数据(JSON格式)',
  `created_by` INT(11) NOT NULL COMMENT '创建者ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_date_range` (`start_date`, `end_date`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI分析记录表';

-- =====================================================
-- 12. 插入系统预设分类数据
-- =====================================================

-- 一级大类
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('餐饮', NULL, 1, 1),
('交通', NULL, 1, 2),
('购物', NULL, 1, 3),
('娱乐', NULL, 1, 4),
('医疗', NULL, 1, 5),
('教育', NULL, 1, 6),
('居住', NULL, 1, 7),
('人情', NULL, 1, 8),
('其他', NULL, 1, 9),
('出礼', NULL, 1, 10),
('收礼', NULL, 1, 11);

-- 出礼子分类
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`)
SELECT '婚礼', id, 1, 1 FROM categories WHERE name = '出礼' AND parent_id IS NULL;
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`)
SELECT '生日', id, 1, 2 FROM categories WHERE name = '出礼' AND parent_id IS NULL;
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`)
SELECT '丧礼', id, 1, 3 FROM categories WHERE name = '出礼' AND parent_id IS NULL;
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`)
SELECT '满月', id, 1, 4 FROM categories WHERE name = '出礼' AND parent_id IS NULL;
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`)
SELECT '乔迁', id, 1, 5 FROM categories WHERE name = '出礼' AND parent_id IS NULL;
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`)
SELECT '其他出礼', id, 1, 6 FROM categories WHERE name = '出礼' AND parent_id IS NULL;

-- 收礼子分类
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`)
SELECT '婚礼', id, 1, 1 FROM categories WHERE name = '收礼' AND parent_id IS NULL;
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`)
SELECT '生日', id, 1, 2 FROM categories WHERE name = '收礼' AND parent_id IS NULL;
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`)
SELECT '丧礼', id, 1, 3 FROM categories WHERE name = '收礼' AND parent_id IS NULL;
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`)
SELECT '满月', id, 1, 4 FROM categories WHERE name = '收礼' AND parent_id IS NULL;
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`)
SELECT '乔迁', id, 1, 5 FROM categories WHERE name = '收礼' AND parent_id IS NULL;
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`)
SELECT '其他收礼', id, 1, 6 FROM categories WHERE name = '收礼' AND parent_id IS NULL;

-- =====================================================
-- 13. 创建默认管理员账户
--     用户名: admin / 密码: admin123
--     请首次登录后立即修改密码
-- =====================================================
INSERT INTO `users` (`username`, `password`, `email`, `is_admin`, `status`) VALUES
('admin', '$2a$10$rqIngrCE/1gsGAyvg7LLZuHej4UI3QmCvngaijluxg2iRi0FPNoWO', 'admin@example.com', 1, 1);

-- =====================================================
-- 完成验证
-- =====================================================
SELECT '数据库初始化完成!' AS message;

SELECT '表清单' AS info;
SELECT table_name, table_comment
FROM information_schema.tables
WHERE table_schema = 'family_expense'
ORDER BY table_name;

SELECT '分类统计' AS info;
SELECT
  CASE WHEN parent_id IS NULL THEN '一级分类' ELSE '子分类' END AS level_name,
  COUNT(*) AS count
FROM categories
GROUP BY CASE WHEN parent_id IS NULL THEN '一级分类' ELSE '子分类' END;

SELECT COUNT(*) AS user_count FROM users;