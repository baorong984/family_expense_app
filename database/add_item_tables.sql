-- =====================================================
-- 物品资产管理模块 - 数据库迁移脚本
-- 版本: v1.3
-- 日期: 2026-04-20
-- 更新: 2026-04-27 - 调整分类结构，使用emoji图标
-- =====================================================

USE `family_expense`;

-- =====================================================
-- 1. 物品分类表 (item_categories)
-- =====================================================
CREATE TABLE IF NOT EXISTS `item_categories` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
  `icon` VARCHAR(50) DEFAULT NULL COMMENT '图标(emoji)',
  `parent_id` INT(11) DEFAULT NULL COMMENT '父分类ID',
  `sort_order` INT(11) NOT NULL DEFAULT 0 COMMENT '排序顺序',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  CONSTRAINT `fk_item_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `item_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物品分类表';

-- =====================================================
-- 2. 物品表 (items)
-- =====================================================
CREATE TABLE IF NOT EXISTS `items` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '物品ID',
  `user_id` INT(11) NOT NULL COMMENT '用户ID',
  `name` VARCHAR(100) NOT NULL COMMENT '物品名称',
  `category_id` INT(11) DEFAULT NULL COMMENT '物品分类ID',
  `status` ENUM('wish', 'purchased', 'in_use', 'repair', 'idle', 'retired') NOT NULL DEFAULT 'purchased' COMMENT '物品状态',
  
  -- 购买信息
  `purchase_date` DATE DEFAULT NULL COMMENT '购买日期',
  `purchase_amount` DECIMAL(10, 2) DEFAULT NULL COMMENT '购买金额',
  `purchase_channel` VARCHAR(100) DEFAULT NULL COMMENT '购买渠道',
  
  -- 物品信息
  `brand` VARCHAR(50) DEFAULT NULL COMMENT '品牌',
  `model` VARCHAR(100) DEFAULT NULL COMMENT '型号',
  `serial_number` VARCHAR(100) DEFAULT NULL COMMENT '序列号',
  `warranty_end_date` DATE DEFAULT NULL COMMENT '保修截止日期',
  `expected_lifespan` INT(11) DEFAULT NULL COMMENT '预期使用寿命(月)',
  `storage_location` VARCHAR(100) DEFAULT NULL COMMENT '存放位置',
  
  -- 使用信息
  `start_use_date` DATE DEFAULT NULL COMMENT '开始使用日期',
  `end_use_date` DATE DEFAULT NULL COMMENT '退役日期',
  
  -- 退役信息
  `retire_reason` VARCHAR(255) DEFAULT NULL COMMENT '退役原因',
  `retire_type` ENUM('sold', 'gifted', 'discarded', 'lost') DEFAULT NULL COMMENT '退役方式',
  `retire_amount` DECIMAL(10, 2) DEFAULT NULL COMMENT '出售金额',
  
  -- 其他
  `images` JSON DEFAULT NULL COMMENT '图片URL数组',
  `tags` JSON DEFAULT NULL COMMENT '标签数组',
  `notes` TEXT DEFAULT NULL COMMENT '备注',
  
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_purchase_date` (`purchase_date`),
  CONSTRAINT `fk_item_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_item_category` FOREIGN KEY (`category_id`) REFERENCES `item_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物品表';

-- =====================================================
-- 3. 物品事件表 (item_events)
-- =====================================================
CREATE TABLE IF NOT EXISTS `item_events` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '事件ID',
  `item_id` INT(11) NOT NULL COMMENT '物品ID',
  `event_type` ENUM('purchase', 'start_use', 'repair', 'accessory', 'idle', 'retire', 'note') NOT NULL COMMENT '事件类型',
  `event_date` DATE NOT NULL COMMENT '事件日期',
  `title` VARCHAR(100) DEFAULT NULL COMMENT '事件标题',
  `description` TEXT DEFAULT NULL COMMENT '事件描述',
  `amount` DECIMAL(10, 2) DEFAULT NULL COMMENT '相关金额',
  `images` JSON DEFAULT NULL COMMENT '图片URL数组',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  PRIMARY KEY (`id`),
  KEY `idx_item_id` (`item_id`),
  KEY `idx_event_date` (`event_date`),
  CONSTRAINT `fk_item_event_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物品事件表';

-- =====================================================
-- 4. 预设物品分类数据（使用emoji图标）
-- =====================================================

-- 一级分类（3个）
INSERT INTO `item_categories` (`id`, `name`, `icon`, `parent_id`, `sort_order`) VALUES
(1, '电子产品', 0xF09F93B1, NULL, 1),  -- 📱
(2, '家电', 0xF09F8EA0, NULL, 2),      -- 🏠
(44, '机械大件', 0xF09F9A97, NULL, 3); -- 🚗

-- 电子产品子分类（9个）
INSERT INTO `item_categories` (`id`, `name`, `icon`, `parent_id`, `sort_order`) VALUES
(11, '手机', 0xF09F93B1, 1, 1),      -- 📱
(12, '电脑', 0xF09F92BB, 1, 2),      -- 💻
(13, '平板', 0xF09F93B2, 1, 3),      -- 📲
(14, '相机', 0xF09F93B7, 1, 4),      -- 📷
(15, '耳机', 0xF09F8EA7, 1, 5),      -- 🎧
(16, '手表', 0xE28C9A, 1, 6),        -- ⌚
(17, '游戏机', 0xF09F8EAE, 1, 7),    -- 🎮
(18, '键盘鼠标', 0xE28CA3, 1, 8),    -- ⌨️
(19, '显示器', 0xF09F96A5, 1, 9);    -- 🖥️

-- 家电子分类（8个）
INSERT INTO `item_categories` (`id`, `name`, `icon`, `parent_id`, `sort_order`) VALUES
(20, '冰箱', 0xE29D84, 2, 1),        -- ❄️
(21, '洗衣机', 0xF09FA7BA, 2, 2),    -- 🧺
(22, '空调', 0xF09F8CA1, 2, 3),      -- 🌡️
(23, '电视', 0xF09F93BA, 2, 4),      -- 📺
(24, '微波炉', 0xF09F8DB3, 2, 5),    -- 🍳
(25, '烤箱', 0xF09FA7A7, 2, 6),      -- 🥧
(26, '吸尘器', 0xF09FA7B9, 2, 7),    -- 🧹
(27, '空气净化器', 0xF09F8CAC, 2, 8); -- 🌬️

-- 机械大件子分类（5个）
INSERT INTO `item_categories` (`id`, `name`, `icon`, `parent_id`, `sort_order`) VALUES
(45, '汽车', 0xF09F9A97, 44, 1),     -- 🚗
(46, '电动车', 0xF09F9A93, 44, 2),   -- 🚓
(47, '自行车', 0xF09F9AB4, 44, 3),   -- 🚴
(48, '摩托车', 0xF09F8F8F, 44, 4),   -- 🏍️
(49, '三轮车', 0xF09F9B97, 44, 5);   -- 🛗

-- =====================================================
-- 5. 验证数据
-- =====================================================
SELECT '分类数据统计' as info;
SELECT 
    '一级分类' as type, COUNT(*) as count 
FROM item_categories 
WHERE parent_id IS NULL
UNION ALL
SELECT 
    '子分类' as type, COUNT(*) as count 
FROM item_categories 
WHERE parent_id IS NOT NULL;

-- =====================================================
-- 完成
-- =====================================================
SELECT '物品资产管理模块数据库迁移完成' AS message;
SELECT '包含3个一级分类和22个子分类，所有图标使用emoji' AS note;
