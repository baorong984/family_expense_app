-- =====================================================
-- 数据库迁移脚本：为members表添加password字段
-- 执行时间：2026-04-10
-- =====================================================

USE `family_expense`;

-- 检查password字段是否已存在
SELECT COUNT(*) INTO @column_exists
FROM information_schema.columns
WHERE table_schema = 'family_expense'
AND table_name = 'members'
AND column_name = 'password';

-- 如果字段不存在，则添加
SET @sql = IF(@column_exists = 0,
  'ALTER TABLE `members` ADD COLUMN `password` VARCHAR(255) DEFAULT NULL COMMENT ''登录密码（bcrypt加密）'' AFTER `avatar`',
  'SELECT ''password字段已存在，跳过添加'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '数据库迁移完成！members表已添加password字段' AS message;