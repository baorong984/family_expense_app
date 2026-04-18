-- =====================================================
-- 油费/充电费管理模块 - 数据库表结构添加脚本
-- 版本: v1.4.1 (兼容 MySQL 5.x/8.x)
-- 日期: 2026-04-18
-- =====================================================

USE `family_expense`;

-- =====================================================
-- 1. 创建车辆信息表 (vehicles)
-- =====================================================
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '车辆ID（主键）',
  `plate_number` VARCHAR(20) NOT NULL COMMENT '车牌号（唯一标识，如：京A12345）',
  `brand_model` VARCHAR(100) NOT NULL COMMENT '品牌型号（如：比亚迪秦PLUS、丰田凯美瑞）',
  `vehicle_type` ENUM('fuel', 'electric') NOT NULL COMMENT '车辆类型：fuel=燃油车, electric=纯电动',
  `initial_mileage` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '初始里程数（公里）',
  `current_mileage` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '当前里程数（公里），从记录端同步',
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
-- 2. 给已有表添加 current_mileage 字段（兼容旧版 MySQL）
-- =====================================================
SET @dbname = DATABASE();
SET @tablename = 'vehicles';
SET @columnname = 'current_mileage';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT ''当前里程数（公里），从记录端同步'' AFTER `initial_mileage`')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

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
-- 5. 同步现有车辆的当前里程数（从最新记录获取）
-- =====================================================
UPDATE vehicles v
LEFT JOIN (
  SELECT 
    vehicle_id,
    MAX(current_mileage) as max_mileage
  FROM vehicle_fuel_records
  GROUP BY vehicle_id
) latest ON v.id = latest.vehicle_id
SET v.current_mileage = COALESCE(latest.max_mileage, v.initial_mileage);

-- =====================================================
-- 6. 完成验证
-- =====================================================
SELECT '油费/充电费管理模块数据库表结构添加完成!' AS message;

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
