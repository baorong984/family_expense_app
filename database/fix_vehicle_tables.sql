-- =====================================================
-- 修复脚本：分步执行版本
-- 版本: v2.0.4
-- 日期: 2026-04-18
-- =====================================================

USE `family_expense`;

-- =====================================================
-- 步骤1：删除旧表并重新创建 vehicle_fuel_records
-- =====================================================

DROP TABLE IF EXISTS `vehicle_fuel_records`;

CREATE TABLE `vehicle_fuel_records` (
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
  KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='加油/充电记录表';

SELECT '✅ 步骤1完成：vehicle_fuel_records 表已创建' AS message;

-- =====================================================
-- 步骤2：删除旧字段（请根据实际情况执行）
-- =====================================================

-- 如果 initial_mileage 存在，执行此语句：
ALTER TABLE `vehicles` DROP COLUMN `initial_mileage`;

-- 如果 current_mileage 存在，执行此语句：
ALTER TABLE `vehicles` DROP COLUMN `current_mileage`;

-- =====================================================
-- 步骤3：验证结果
-- =====================================================

SELECT '========================================' AS '';
SELECT 'vehicle_fuel_records 表结构:' AS '';
DESCRIBE vehicle_fuel_records;

SELECT '========================================' AS '';
SELECT 'vehicles 表结构:' AS '';
DESCRIBE vehicles;
