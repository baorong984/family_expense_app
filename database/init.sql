-- =====================================================
-- 家庭消费记账系统 - 数据库初始化脚本
-- 数据库: MySQL 8.0+
-- 字符集: utf8mb4
-- 排序规则: utf8mb4_unicode_ci
-- =====================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `family_expense`
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `family_expense`;

-- =====================================================
-- 1. 用户表 (users)
-- =====================================================
DROP TABLE IF EXISTS `budgets`;
DROP TABLE IF EXISTS `expenses`;
DROP TABLE IF EXISTS `members`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '用户ID（主键）',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名（唯一）',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（bcrypt加密）',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `is_admin` TINYINT(1) NOT NULL DEFAULT '0' COMMENT '是否管理员（0=否，1=是）',
  `status` TINYINT(1) NOT NULL DEFAULT '1' COMMENT '状态（0=禁用，1=启用）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- =====================================================
-- 2. 成员表 (members)
-- =====================================================
CREATE TABLE `members` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '成员ID（主键）',
  `name` VARCHAR(50) NOT NULL COMMENT '成员姓名',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `password` VARCHAR(255) DEFAULT NULL COMMENT '登录密码（bcrypt加密）',
  `created_by` INT(11) NOT NULL COMMENT '创建者（关联users.id）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_member_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成员表';

-- =====================================================
-- 3. 分类表 (categories)
-- =====================================================
CREATE TABLE `categories` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '分类ID（主键）',
  `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
  `parent_id` INT(11) DEFAULT NULL COMMENT '父分类ID（NULL为大类）',
  `is_system` TINYINT(1) NOT NULL DEFAULT '0' COMMENT '是否系统预设（0=否，1=是）',
  `sort_order` INT(11) NOT NULL DEFAULT '0' COMMENT '排序顺序',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_is_system` (`is_system`),
  CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- =====================================================
-- 4. 消费记录表 (expenses)
-- =====================================================
CREATE TABLE `expenses` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '消费ID（主键）',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '消费金额',
  `expense_date` DATE NOT NULL COMMENT '消费日期',
  `expense_time` TIME DEFAULT NULL COMMENT '消费时间',
  `category_id` INT(11) NOT NULL COMMENT '分类ID（关联categories.id）',
  `member_id` INT(11) DEFAULT NULL COMMENT '成员ID（关联members.id）',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '消费描述',
  `remarks` VARCHAR(200) DEFAULT NULL COMMENT '备注',
  `created_by` INT(11) NOT NULL COMMENT '创建者（关联users.id）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_expense_date` (`expense_date`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_member_id` (`member_id`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_expense_date_category` (`expense_date`, `category_id`),
  CONSTRAINT `fk_expense_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_expense_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_expense_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消费记录表';

-- =====================================================
-- 5. 预算表 (budgets)
-- =====================================================
CREATE TABLE `budgets` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '预算ID（主键）',
  `year` INT(4) NOT NULL COMMENT '年份',
  `month` INT(2) NOT NULL COMMENT '月份（1-12）',
  `total_amount` DECIMAL(10,2) NOT NULL COMMENT '总预算金额',
  `category_id` INT(11) DEFAULT NULL COMMENT '分类ID（NULL为总预算）',
  `created_by` INT(11) NOT NULL COMMENT '创建者（关联users.id）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_year_month_category` (`year`, `month`, `category_id`, `created_by`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_budget_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_budget_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预算表';

-- =====================================================
-- 6. 插入系统预设分类数据（一级大类）
-- 参考：国家统计局居民消费支出分类 + 日常记账习惯
-- =====================================================

INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('餐饮', NULL, 1, 1),
('交通', NULL, 1, 2),
('购物', NULL, 1, 3),
('娱乐', NULL, 1, 4),
('医疗', NULL, 1, 5),
('教育', NULL, 1, 6),
('居住', NULL, 1, 7),
('人情', NULL, 1, 8),
('其他', NULL, 1, 9);

-- =====================================================
-- 7. 创建默认管理员账户
-- 用户名: admin
-- 密码: admin123
-- 注意: 请在首次登录后立即修改密码
-- =====================================================
INSERT INTO `users` (`username`, `password`, `email`, `is_admin`, `status`) VALUES
('admin', '$2a$10$rqIngrCE/1gsGAyvg7LLZuHej4UI3QmCvngaijluxg2iRi0FPNoWO', 'admin@example.com', 1, 1);

-- =====================================================
-- 8. 创建示例成员数据（可选）
-- =====================================================
-- INSERT INTO `members` (`name`, `avatar`, `created_by`) VALUES
-- ('张三', NULL, 1),
-- ('李四', NULL, 1);

-- =====================================================
-- 完成
-- =====================================================
SELECT '数据库初始化完成!' AS message;
SELECT COUNT(*) AS category_count FROM categories;
SELECT COUNT(*) AS user_count FROM users;
