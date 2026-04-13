-- 为 members 表添加 color 字段
-- 执行时间: 2026-04-13

-- 添加 color 字段，默认值为 '#4ECDC4'（薄荷绿）
ALTER TABLE members ADD COLUMN color VARCHAR(7) NOT NULL DEFAULT '#4ECDC4' COMMENT '成员专属色';

-- 为现有成员设置随机颜色（如果需要）
-- UPDATE members SET color = '#4ECDC4' WHERE color IS NULL;

-- 添加索引以优化查询性能
CREATE INDEX idx_members_color ON members(color);