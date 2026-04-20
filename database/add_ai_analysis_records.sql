-- =====================================================
-- AI分析记录表
-- 版本: v1.3.1
-- 日期: 2026-04-19
-- =====================================================

USE `family_expense`;

-- =====================================================
-- 1. 创建 ai_analysis_records 表
-- =====================================================

CREATE TABLE IF NOT EXISTS `ai_analysis_records` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `start_date` DATE NOT NULL COMMENT '分析开始日期',
  `end_date` DATE NOT NULL COMMENT '分析结束日期',
  `analysis_data` JSON NOT NULL COMMENT '分析结果数据(JSON格式)',
  `created_by` INT(11) NOT NULL COMMENT '创建者ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_date_range` (`start_date`, `end_date`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI分析记录表';
