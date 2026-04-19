-- =====================================================
-- 为加油充电记录添加消费记录关联字段
-- 版本: v1.3.0
-- 日期: 2026-04-19
-- =====================================================

USE `family_expense`;

-- =====================================================
-- 1. 为 vehicle_fuel_records 表添加 expense_id 字段
-- =====================================================

-- 检查字段是否存在，不存在才添加
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns 
  WHERE table_schema = 'family_expense' AND table_name = 'vehicle_fuel_records' AND column_name = 'expense_id');

SET @sql_stmt = IF(@col_exists = 0,
  'ALTER TABLE `vehicle_fuel_records` ADD COLUMN `expense_id` INT(11) DEFAULT NULL COMMENT ''关联的消费记录ID'' AFTER `vehicle_id`',
  'SELECT ''expense_id 字段已存在'' AS message');
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加索引
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
  WHERE table_schema = 'family_expense' AND table_name = 'vehicle_fuel_records' AND index_name = 'idx_expense_id');
SET @sql_idx = IF(@idx_exists = 0,
  'ALTER TABLE `vehicle_fuel_records` ADD KEY `idx_expense_id` (`expense_id`)',
  'SELECT ''idx_expense_id 索引已存在'' AS message');
PREPARE stmt2 FROM @sql_idx;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 检查并添加外键
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.table_constraints 
  WHERE table_schema = 'family_expense' AND table_name = 'vehicle_fuel_records' AND constraint_name = 'fk_fuel_expense');
SET @sql_fk = IF(@fk_exists = 0,
  'ALTER TABLE `vehicle_fuel_records` ADD CONSTRAINT `fk_fuel_expense` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE SET NULL',
  'SELECT ''fk_fuel_expense 外键已存在'' AS message');
PREPARE stmt3 FROM @sql_fk;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- =====================================================
-- 2. 完成验证
-- =====================================================
SELECT '加油充电记录关联消费记录字段添加完成!' AS message;

-- 显示表结构
SELECT 
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM information_schema.columns 
WHERE table_schema = 'family_expense' 
  AND table_name = 'vehicle_fuel_records'
  AND COLUMN_NAME = 'expense_id';
