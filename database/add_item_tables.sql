-- =====================================================
-- 物品资产管理模块 - 数据库迁移脚本
-- 版本: v1.3
-- 日期: 2026-04-20
-- =====================================================

USE `family_expense`;

-- =====================================================
-- 1. 物品分类表 (item_categories)
-- =====================================================
CREATE TABLE IF NOT EXISTS `item_categories` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
  `icon` VARCHAR(50) DEFAULT NULL COMMENT '图标名称',
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
-- 4. 预设物品分类数据
-- =====================================================

-- 一级分类
INSERT INTO `item_categories` (`name`, `icon`, `parent_id`, `sort_order`) VALUES
('电子产品', 'Monitor', NULL, 1),
('家电', 'House', NULL, 2),
('服饰', 'Shirt', NULL, 3),
('书籍', 'Notebook', NULL, 4),
('收藏品', 'Trophy', NULL, 5),
('运动户外', 'Basketball', NULL, 6),
('乐器', 'Headset', NULL, 7),
('家具', 'Grid', NULL, 8),
('珠宝首饰', 'Star', NULL, 9),
('其他', 'More', NULL, 99);

-- 电子产品子分类
INSERT INTO `item_categories` (`name`, `icon`, `parent_id`, `sort_order`) VALUES
('手机', 'Iphone', 1, 1),
('电脑', 'Monitor', 1, 2),
('平板', 'Grid', 1, 3),
('相机', 'Camera', 1, 4),
('耳机', 'Headset', 1, 5),
('手表', 'Clock', 1, 6),
('游戏机', 'Gamepad', 1, 7),
('键盘鼠标', 'Keyboard', 1, 8),
('显示器', 'Monitor', 1, 9);

-- 家电子分类
INSERT INTO `item_categories` (`name`, `icon`, `parent_id`, `sort_order`) VALUES
('冰箱', 'House', 2, 1),
('洗衣机', 'House', 2, 2),
('空调', 'House', 2, 3),
('电视', 'Monitor', 2, 4),
('微波炉', 'House', 2, 5),
('烤箱', 'House', 2, 6),
('吸尘器', 'House', 2, 7),
('空气净化器', 'House', 2, 8);

-- 服饰子分类
INSERT INTO `item_categories` (`name`, `icon`, `parent_id`, `sort_order`) VALUES
('外套', 'Shirt', 3, 1),
('鞋靴', 'Shirt', 3, 2),
('包包', 'Shirt', 3, 3),
('配饰', 'Shirt', 3, 4),
('眼镜', 'View', 3, 5);

-- 运动户外子分类
INSERT INTO `item_categories` (`name`, `icon`, `parent_id`, `sort_order`) VALUES
('健身器材', 'Basketball', 6, 1),
('户外装备', 'Basketball', 6, 2),
('运动鞋服', 'Basketball', 6, 3),
('自行车', 'Bicycle', 6, 4);

-- 乐器子分类
INSERT INTO `item_categories` (`name`, `icon`, `parent_id`, `sort_order`) VALUES
('吉他', 'Headset', 7, 1),
('钢琴', 'Headset', 7, 2),
('其他乐器', 'Headset', 7, 3);

-- 家具子分类
INSERT INTO `item_categories` (`name`, `icon`, `parent_id`, `sort_order`) VALUES
('沙发', 'Grid', 8, 1),
('床', 'Grid', 8, 2),
('桌椅', 'Grid', 8, 3),
('柜子', 'Grid', 8, 4);

-- =====================================================
-- 完成
-- =====================================================
SELECT '物品资产管理模块数据库迁移完成' AS message;
