-- =====================================================
-- 人情模块 - 数据库表结构添加脚本
-- 版本: v1.2.0
-- 日期: 2026-04-15
-- =====================================================

USE `family_expense`;

-- =====================================================
-- 1. 创建人情记录表 (gifts)
-- =====================================================
CREATE TABLE IF NOT EXISTS `gifts` (
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
-- 2. 创建人情提醒表 (gift_reminders)
-- =====================================================
CREATE TABLE IF NOT EXISTS `gift_reminders` (
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
-- 3. 添加人情分类数据（出礼和收礼作为独立父分类）
-- =====================================================

-- 清理可能存在的错误数据
DELETE FROM categories WHERE name IN ('出礼', '收礼');

-- 添加出礼父分类
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('出礼', NULL, 1, 10);

-- 添加收礼父分类
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('收礼', NULL, 1, 11);

-- 获取出礼父分类ID
SET @outgoing_category_id = (SELECT id FROM categories WHERE name = '出礼' LIMIT 1);

-- 为出礼添加子分类
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('婚礼', @outgoing_category_id, 1, 1),
('生日', @outgoing_category_id, 1, 2),
('丧礼', @outgoing_category_id, 1, 3),
('满月', @outgoing_category_id, 1, 4),
('乔迁', @outgoing_category_id, 1, 5),
('其他出礼', @outgoing_category_id, 1, 6);

-- 获取收礼父分类ID
SET @incoming_category_id = (SELECT id FROM categories WHERE name = '收礼' LIMIT 1);

-- 为收礼添加子分类
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('婚礼', @incoming_category_id, 1, 1),
('生日', @incoming_category_id, 1, 2),
('丧礼', @incoming_category_id, 1, 3),
('满月', @incoming_category_id, 1, 4),
('乔迁', @incoming_category_id, 1, 5),
('其他收礼', @incoming_category_id, 1, 6);

-- =====================================================
-- 4. 为expenses表添加字段（用于标记人情记录）
-- =====================================================
ALTER TABLE `expenses`
ADD COLUMN `is_gift` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否为人情记录（0=否，1=是）' AFTER `remarks`,
ADD COLUMN `gift_id` INT(11) DEFAULT NULL COMMENT '关联的人情记录ID' AFTER `is_gift`,
ADD KEY `idx_is_gift` (`is_gift`),
ADD KEY `idx_gift_id` (`gift_id`),
ADD CONSTRAINT `fk_expense_gift` FOREIGN KEY (`gift_id`) REFERENCES `gifts` (`id`) ON DELETE SET NULL;

-- =====================================================
-- 5. 完成验证
-- =====================================================
SELECT '人情模块数据库表结构添加完成!' AS message;

-- 显示分类结构
SELECT '=== 分类结构 ===' AS info;
SELECT 
  id, name, parent_id, is_system, sort_order,
  CASE 
    WHEN parent_id IS NULL THEN '父分类'
    ELSE CONCAT('子分类 (父ID: ', parent_id, ')')
  END AS level_info
FROM categories 
WHERE name IN ('出礼', '收礼', '婚礼', '生日', '丧礼', '满月', '乔迁', '其他出礼', '其他收礼')
ORDER BY 
  CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END,
  sort_order;

SELECT COUNT(*) AS gift_category_count FROM categories WHERE parent_id IN (SELECT id FROM categories WHERE name IN ('出礼', '收礼'));
SELECT COUNT(*) AS gift_table_exists FROM information_schema.tables WHERE table_schema = 'family_expense' AND table_name = 'gifts';
SELECT COUNT(*) AS reminder_table_exists FROM information_schema.tables WHERE table_schema = 'family_expense' AND table_name = 'gift_reminders';