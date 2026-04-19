-- =====================================================
-- 油费/充电费管理模块 - 数据库表结构
-- 版本: v2.0.0 (简化里程字段)
-- 日期: 2026-04-18
-- =====================================================

USE `family_expense`;

-- =====================================================
-- 1. 创建车辆信息表 (vehicles) - 简化版
-- =====================================================
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '车辆ID（主键）',
  `plate_number` VARCHAR(20) NOT NULL COMMENT '车牌号（唯一标识，如：京A12345）',
  `brand_model` VARCHAR(100) NOT NULL COMMENT '品牌型号（如：比亚迪秦PLUS、丰田凯美瑞）',
  `vehicle_type` ENUM('fuel', 'electric') NOT NULL COMMENT '车辆类型：fuel=燃油车, electric=纯电动',
  `base_mileage` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '基准里程（公里），可手动调整，记录录入后自动更新',
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
-- 2. 迁移旧数据：合并 initial_mileage + current_mileage -> base_mileage
-- =====================================================
SET @dbname = DATABASE();

-- 检查是否有旧的 initial_mileage 字段
SET @has_initial = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'vehicles' AND COLUMN_NAME = 'initial_mileage');

-- 检查是否已有 base_mileage 字段
SET @has_base = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'vehicles' AND COLUMN_NAME = 'base_mileage');

-- 如果有旧字段且没有新字段，进行迁移
SET @migration_sql = IF(
  @has_initial > 0 AND @has_base = 0,
  CONCAT(
    'ALTER TABLE `vehicles` ',
    'ADD COLUMN `base_mileage` DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER `vehicle_type`, ',
    'DROP COLUMN `initial_mileage`, ',
    'DROP COLUMN `current_mileage`;'
  ),
  'SELECT "无需迁移或已迁移" AS status'
);

PREPARE migrate FROM @migration_sql;
EXECUTE migrate;
DEALLOCATE PREPARE migrate;

-- 如果没有 base_mileage 字段，添加它
SET @add_sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'vehicles' AND COLUMN_NAME = 'base_mileage') = 0,
  'ALTER TABLE `vehicles` ADD COLUMN `base_mileage` DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER `vehicle_type`;',
  'SELECT "base_mileage 已存在" AS status'
);

PREPARE addColumn FROM @add_sql;
EXECUTE addColumn;
DEALLOCATE PREPARE addColumn;

-- 同步基准里程数据（取最大值）
UPDATE vehicles v
LEFT JOIN (
  SELECT 
    vehicle_id,
    GREATEST(
      COALESCE(v2.initial_mileage, 0),
      COALESCE(v2.current_mileage, 0),
      COALESCE(MAX(r.current_mileage), 0)
    ) as max_mileage
  FROM vehicle_fuel_records r
  RIGHT JOIN vehicles v2 ON r.vehicle_id = v2.id
  WHERE v2.id = v.id
  GROUP BY v2.id
) calc ON v.id = calc.vehicle_id
SET v.base_mileage = COALESCE(calc.max_mileage, 0)
WHERE v.base_mileage = 0 OR v.base_mileage IS NULL;

-- =====================================================
-- 3. 更新 vehicle_type 枚举值（移除 hybrid）
-- =====================================================
ALTER TABLE `vehicles`
MODIFY COLUMN `vehicle_type` ENUM('fuel', 'electric') NOT NULL COMMENT '车辆类型：fuel=燃油车, electric=纯电动';

-- =====================================================
-- 4. 创建加油/充电记录表 (vehicle_fuel_records)
-- =====================================================
CREATE TABLE IF NOT EXISTS `vehicle_fuel_records` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '记录ID（主键）',
  `vehicle_id` INT(11) NOT NULL COMMENT '关联的车辆ID',
  `record_type` ENUM('fuel', 'charge') NOT NULL COMMENT '记录类型：fuel=加油, charge=充电',
  `record_date` DATE NOT NULL COMMENT '记录日期',
  `record_time` TIME DEFAULT NULL COMMENT '记录时间（可选，精确到小时）',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '金额（元），如：350.00',
  `current_mileage` DECIMAL(10,2) NOT NULL COMMENT '当前里程数（公里），如：12580',
  `last_mileage` DECIMAL(10,2) DEFAULT NULL COMMENT '上次里程数（自动计算或手动输入）',
  `mileage_diff` DECIMAL(10,2) DEFAULT NULL COMMENT '本次行驶里程 = 当前里程 - 上次里程（公里）',
  `cost_per_km` DECIMAL(10,4) DEFAULT NULL COMMENT '每公里成本 = 金额 ÷ 本次行驶里程（元/公里）',
  `remarks` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_by` INT(11) NOT NULL COMMENT '创建者用户ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_vehicle_id` (`vehicle_id`),
  KEY `idx_record_type` (`record_type`),
  KEY `idx_record_date` (`record_date`),
  KEY `idx_record_time` (`record_time`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_fuel_record_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fuel_record_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='加油/充电记录表';

-- =====================================================
-- 5. 完成验证
-- =====================================================
SELECT '油费/充电费管理模块数据库更新完成!' AS message;

-- 显示表结构信息
SELECT 
  table_name,
  table_comment,
  create_time,
  engine,
  table_rows
FROM information_schema.tables 
WHERE table_schema = 'family_expense' 
AND table_name IN ('vehicles', 'vehicle_fuel_records')
ORDER BY table_name;

-- 显示vehicles表的字段信息
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  column_comment
FROM information_schema.columns 
WHERE table_schema = 'family_expense' AND table_name = 'vehicles'
ORDER BY ordinal_position;
