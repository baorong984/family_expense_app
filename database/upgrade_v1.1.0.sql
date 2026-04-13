-- ============================================
-- 家庭记账系统数据库升级脚本
-- 版本: v1.1.0
-- 日期: 2026-04-13
-- 说明: 添加成员专属色功能
-- ============================================

-- ============================================
-- 1. 检查并添加成员颜色字段
-- ============================================

-- 检查 color 字段是否已存在（避免重复添加）
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'members'
    AND COLUMN_NAME = 'color'
);

-- 如果字段不存在，则添加
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE members ADD COLUMN color VARCHAR(7) NOT NULL DEFAULT ''#4ECDC4'' COMMENT ''成员专属色''',
    'SELECT ''Column color already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. 为现有成员设置默认颜色（如果 color 为空）
-- ============================================

UPDATE members SET color = '#4ECDC4' WHERE color IS NULL OR color = '';

-- ============================================
-- 3. 添加索引以优化查询性能
-- ============================================

-- 检查索引是否已存在
SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'members'
    AND INDEX_NAME = 'idx_members_color'
);

-- 如果索引不存在，则添加
SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_members_color ON members(color)',
    'SELECT ''Index idx_members_color already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 4. 验证升级结果
-- ============================================

SELECT '=== 升级完成 ===' AS status;
SELECT 'members 表结构' AS info;
DESCRIBE members;

SELECT '现有成员数据' AS info;
SELECT id, name, color FROM members;

SELECT '=== v1.1.0 升级成功 ===' AS status;