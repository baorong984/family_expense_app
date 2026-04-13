-- ============================================
-- 家庭记账系统数据库回滚脚本
-- 版本: v1.1.0
-- 日期: 2026-04-13
-- 说明: 回滚成员专属色功能
-- ============================================

-- ============================================
-- 1. 删除索引（如果存在）
-- ============================================

-- 检查索引是否存在
SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'members'
    AND INDEX_NAME = 'idx_members_color'
);

-- 如果索引存在，则删除
SET @sql = IF(@index_exists > 0,
    'DROP INDEX idx_members_color ON members',
    'SELECT ''Index idx_members_color does not exist'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. 删除 color 字段（如果存在）
-- ============================================

-- 检查字段是否存在
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'members'
    AND COLUMN_NAME = 'color'
);

-- 如果字段存在，则删除
SET @sql = IF(@column_exists > 0,
    'ALTER TABLE members DROP COLUMN color',
    'SELECT ''Column color does not exist'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 3. 验证回滚结果
-- ============================================

SELECT '=== 回滚完成 ===' AS status;
SELECT 'members 表结构' AS info;
DESCRIBE members;

SELECT '=== v1.1.0 回滚成功 ===' AS status;