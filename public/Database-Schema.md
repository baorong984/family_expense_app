# 数据库表结构设计

## 数据库信息

- 数据库类型：MySQL
- 数据库名称：family_expense
- 字符集：utf8mb4
- 排序规则：utf8mb4_unicode_ci

## 表结构

### 1. users - 用户表

存储系统用户信息，用于登录认证。

| 字段名 | 类型 | 长度 | 允许NULL | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | INT | 11 | NO | AUTO_INCREMENT | 用户ID（主键） |
| username | VARCHAR | 50 | NO | - | 用户名（唯一） |
| password | VARCHAR | 255 | NO | - | 密码（bcrypt加密） |
| email | VARCHAR | 100 | YES | NULL | 邮箱 |
| is_admin | TINYINT | 1 | NO | 0 | 是否管理员（0=否，1=是） |
| status | TINYINT | 1 | NO | 1 | 状态（0=禁用，1=启用） |
| created_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | - | NO | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引**：
- PRIMARY KEY: `id`
- UNIQUE KEY: `username`
- INDEX: `email`
- INDEX: `status`

**SQL建表语句**：
```sql
CREATE TABLE `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `is_admin` TINYINT(1) NOT NULL DEFAULT '0',
  `status` TINYINT(1) NOT NULL DEFAULT '1',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 2. members - 成员表

存储家庭成员信息。

| 字段名 | 类型 | 长度 | 允许NULL | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | INT | 11 | NO | AUTO_INCREMENT | 成员ID（主键） |
| name | VARCHAR | 50 | NO | - | 成员姓名 |
| avatar | VARCHAR | 255 | YES | NULL | 头像URL |
| created_by | INT | 11 | NO | - | 创建者（关联users.id） |
| created_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | - | NO | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引**：
- PRIMARY KEY: `id`
- INDEX: `created_by`

**SQL建表语句**：
```sql
CREATE TABLE `members` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `avatar` VARCHAR(255) DEFAULT NULL,
  `created_by` INT(11) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_member_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 3. categories - 分类表

存储消费分类信息（包括系统预设和用户自定义）。

| 字段名 | 类型 | 长度 | 允许NULL | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | INT | 11 | NO | AUTO_INCREMENT | 分类ID（主键） |
| name | VARCHAR | 50 | NO | - | 分类名称 |
| parent_id | INT | 11 | YES | NULL | 父分类ID（NULL为大类） |
| is_system | TINYINT | 1 | NO | 0 | 是否系统预设（0=否，1=是） |
| sort_order | INT | 11 | NO | 0 | 排序顺序 |
| created_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | - | NO | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引**：
- PRIMARY KEY: `id`
- INDEX: `parent_id`
- INDEX: `is_system`

**SQL建表语句**：
```sql
CREATE TABLE `categories` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `parent_id` INT(11) DEFAULT NULL,
  `is_system` TINYINT(1) NOT NULL DEFAULT '0',
  `sort_order` INT(11) NOT NULL DEFAULT '0',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_is_system` (`is_system`),
  CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**系统预设分类数据**：
```sql
-- 大类
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('餐饮', NULL, 1, 1),
('交通', NULL, 1, 2),
('购物', NULL, 1, 3),
('娱乐', NULL, 1, 4),
('医疗', NULL, 1, 5),
('教育', NULL, 1, 6),
('居住', NULL, 1, 7),
('其他', NULL, 1, 8);

-- 子分类（餐饮）
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('火锅', 1, 1, 1),
('烧烤', 1, 1, 2),
('外卖', 1, 1, 3),
('正餐', 1, 1, 4),
('零食', 1, 1, 5),
('饮料', 1, 1, 6),
('其他餐饮', 1, 1, 7);

-- 子分类（交通）
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('打车', 2, 1, 1),
('地铁', 2, 1, 2),
('公交', 2, 1, 3),
('加油', 2, 1, 4),
('停车', 2, 1, 5),
('其他交通', 2, 1, 6);

-- 子分类（购物）
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('超市', 3, 1, 1),
('网购', 3, 1, 2),
('服装', 3, 1, 3),
('电子产品', 3, 1, 4),
('家居用品', 3, 1, 5),
('其他购物', 3, 1, 6);

-- 子分类（娱乐）
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('电影', 4, 1, 1),
('KTV', 4, 1, 2),
('游戏', 4, 1, 3),
('旅游', 4, 1, 4),
('其他娱乐', 4, 1, 5);

-- 子分类（医疗）
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('看病', 5, 1, 1),
('买药', 5, 1, 2),
('体检', 5, 1, 3),
('其他医疗', 5, 1, 4);

-- 子分类（教育）
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('培训', 6, 1, 1),
('书籍', 6, 1, 2),
('课程', 6, 1, 3),
('其他教育', 6, 1, 4);

-- 子分类（居住）
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('房租', 7, 1, 1),
('水电', 7, 1, 2),
('物业', 7, 1, 3),
('其他居住', 7, 1, 4);

-- 子分类（其他）
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('其他消费', 8, 1, 1);
```

---

### 4. expenses - 消费记录表

存储用户的消费记录。

| 字段名 | 类型 | 长度 | 允许NULL | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | INT | 11 | NO | AUTO_INCREMENT | 消费ID（主键） |
| amount | DECIMAL | 10,2 | NO | - | 消费金额 |
| expense_date | DATE | - | NO | - | 消费日期 |
| expense_time | TIME | - | YES | NULL | 消费时间 |
| category_id | INT | 11 | NO | - | 分类ID（关联categories.id） |
| member_id | INT | 11 | YES | NULL | 成员ID（关联members.id） |
| description | VARCHAR | 500 | YES | NULL | 消费描述 |
| remarks | VARCHAR | 200 | YES | NULL | 备注 |
| created_by | INT | 11 | NO | - | 创建者（关联users.id） |
| created_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | - | NO | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引**：
- PRIMARY KEY: `id`
- INDEX: `expense_date`
- INDEX: `category_id`
- INDEX: `member_id`
- INDEX: `created_by`
- INDEX: `expense_date_category` (expense_date, category_id)

**SQL建表语句**：
```sql
CREATE TABLE `expenses` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `amount` DECIMAL(10,2) NOT NULL,
  `expense_date` DATE NOT NULL,
  `expense_time` TIME DEFAULT NULL,
  `category_id` INT(11) NOT NULL,
  `member_id` INT(11) DEFAULT NULL,
  `description` VARCHAR(500) DEFAULT NULL,
  `remarks` VARCHAR(200) DEFAULT NULL,
  `created_by` INT(11) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expense_date` (`expense_date`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_member_id` (`member_id`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_expense_date_category` (`expense_date`, `category_id`),
  CONSTRAINT `fk_expense_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_expense_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_expense_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 5. budgets - 预算表

存储用户的预算设置。

| 字段名 | 类型 | 长度 | 允许NULL | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | INT | 11 | NO | AUTO_INCREMENT | 预算ID（主键） |
| year | INT | 4 | NO | - | 年份 |
| month | INT | 2 | NO | - | 月份（1-12） |
| total_amount | DECIMAL | 10,2 | NO | - | 总预算金额 |
| category_id | INT | 11 | YES | NULL | 分类ID（NULL为总预算） |
| created_by | INT | 11 | NO | - | 创建者（关联users.id） |
| created_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | - | NO | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引**：
- PRIMARY KEY: `id`
- UNIQUE KEY: `uk_year_month_category` (`year`, `month`, `category_id`, `created_by`)
- INDEX: `category_id`
- INDEX: `created_by`

**SQL建表语句**：
```sql
CREATE TABLE `budgets` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `year` INT(4) NOT NULL,
  `month` INT(2) NOT NULL,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `category_id` INT(11) DEFAULT NULL,
  `created_by` INT(11) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_year_month_category` (`year`, `month`, `category_id`, `created_by`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_budget_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_budget_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## ER图关系说明

### 表关系图

```
users (用户表)
  ├─ 1:N → members (成员表) - 一个用户可以创建多个成员
  ├─ 1:N → expenses (消费记录表) - 一个用户可以创建多条消费记录
  └─ 1:N → budgets (预算表) - 一个用户可以设置多个预算

members (成员表)
  └─ 1:N → expenses (消费记录表) - 一个成员可以有多条消费记录

categories (分类表)
  ├─ 1:N → categories (分类表) - 自关联，实现分类层级
  └─ 1:N → expenses (消费记录表) - 一个分类可以有多条消费记录

expenses (消费记录表)
  ├─ N:1 → categories (分类表) - 多条消费记录属于一个分类
  ├─ N:1 → members (成员表) - 多条消费记录属于一个成员
  └─ N:1 → users (用户表) - 多条消费记录由一个用户创建

budgets (预算表)
  ├─ N:1 → categories (分类表) - 多个预算可以属于一个分类
  └─ N:1 → users (用户表) - 多个预算由一个用户创建
```

---

## 数据库初始化脚本

### 创建数据库
```sql
CREATE DATABASE IF NOT EXISTS `family_expense`
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `family_expense`;
```

### 创建所有表
```sql
-- 1. 创建用户表
CREATE TABLE `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `is_admin` TINYINT(1) NOT NULL DEFAULT '0',
  `status` TINYINT(1) NOT NULL DEFAULT '1',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 创建成员表
CREATE TABLE `members` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `avatar` VARCHAR(255) DEFAULT NULL,
  `created_by` INT(11) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_member_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 创建分类表
CREATE TABLE `categories` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `parent_id` INT(11) DEFAULT NULL,
  `is_system` TINYINT(1) NOT NULL DEFAULT '0',
  `sort_order` INT(11) NOT NULL DEFAULT '0',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_is_system` (`is_system`),
  CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 创建消费记录表
CREATE TABLE `expenses` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `amount` DECIMAL(10,2) NOT NULL,
  `expense_date` DATE NOT NULL,
  `expense_time` TIME DEFAULT NULL,
  `category_id` INT(11) NOT NULL,
  `member_id` INT(11) DEFAULT NULL,
  `description` VARCHAR(500) DEFAULT NULL,
  `remarks` VARCHAR(200) DEFAULT NULL,
  `created_by` INT(11) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expense_date` (`expense_date`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_member_id` (`member_id`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_expense_date_category` (`expense_date`, `category_id`),
  CONSTRAINT `fk_expense_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_expense_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_expense_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 创建预算表
CREATE TABLE `budgets` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `year` INT(4) NOT NULL,
  `month` INT(2) NOT NULL,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `category_id` INT(11) DEFAULT NULL,
  `created_by` INT(11) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_year_month_category` (`year`, `month`, `category_id`, `created_by`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_budget_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_budget_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 插入系统预设分类数据
-- 大类
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('餐饮', NULL, 1, 1),
('交通', NULL, 1, 2),
('购物', NULL, 1, 3),
('娱乐', NULL, 1, 4),
('医疗', NULL, 1, 5),
('教育', NULL, 1, 6),
('居住', NULL, 1, 7),
('其他', NULL, 1, 8);

-- 子分类（餐饮）
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('火锅', 1, 1, 1),
('烧烤', 1, 1, 2),
('外卖', 1, 1, 3),
('正餐', 1, 1, 4),
('零食', 1, 1, 5),
('饮料', 1, 1, 6),
('其他餐饮', 1, 1, 7);

-- 子分类（交通）
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('打车', 2, 1, 1),
('地铁', 2, 1, 2),
('公交', 2, 1, 3),
('加油', 2, 1, 4),
('停车', 2, 1, 5),
('其他交通', 2, 1, 6);

-- 子分类（购物）
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('超市', 3, 1, 1),
('网购', 3, 1, 2),
('服装', 3, 1, 3),
('电子产品', 3, 1, 4),
('家居用品', 3, 1, 5),
('其他购物', 3, 1, 6);

-- 子分类（娱乐）
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('电影', 4, 1, 1),
('KTV', 4, 1, 2),
('游戏', 4, 1, 3),
('旅游', 4, 1, 4),
('其他娱乐', 4, 1, 5);

-- 子分类（医疗）
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('看病', 5, 1, 1),
('买药', 5, 1, 2),
('体检', 5, 1, 3),
('其他医疗', 5, 1, 4);

-- 子分类（教育）
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('培训', 6, 1, 1),
('书籍', 6, 1, 2),
('课程', 6, 1, 3),
('其他教育', 6, 1, 4);

-- 子分类（居住）
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('房租', 7, 1, 1),
('水电', 7, 1, 2),
('物业', 7, 1, 3),
('其他居住', 7, 1, 4);

-- 子分类（其他）
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('其他消费', 8, 1, 1);

-- 7. 创建默认管理员账户（密码: admin123，需要使用bcrypt加密）
INSERT INTO `users` (`username`, `password`, `is_admin`, `status`) VALUES
('admin', '$2b$10$YourHashedPasswordHere', 1, 1);
```

---

## 注意事项

### 1. 密码加密
- 用户密码必须使用bcrypt加密存储
- 密码强度要求：最少8个字符，必须包含字母和数字

### 2. 数据备份
- 建议定期备份数据库
- 重要操作前先备份

### 3. 性能优化
- 已添加必要的索引
- 大数据量时考虑分区表（按年月分区）

### 4. 数据清理
- 建议定期清理历史数据
- 可以设置数据保留策略

### 5. 安全性
- 所有外键约束已设置
- 删除操作使用CASCADE或SET NULL
- 防止数据不一致