# 数据库升级说明

## 版本历史

### v1.1.0 - 成员专属色功能（2026-04-13）

#### 新增功能
- 为成员添加专属颜色选择功能
- 成员头像显示专属色
- 记账页面成员选择框显示专属色
- 消费记录成员列显示专属色
- 统计分析成员占比使用专属色

#### 数据库变更
- 在 `members` 表添加 `color` 字段
- 为 `color` 字段添加索引以优化查询性能

## 升级脚本

### upgrade_v1.1.0.sql
**功能**：升级到 v1.1.0 版本

**执行方式**：
```bash
mysql -h <host> -P <port> -u <username> -p<password> <database> < upgrade_v1.1.0.sql
```

**示例**：
```bash
mysql -h localhost -P 3306 -u root -p123456 family_expense < upgrade_v1.1.0.sql
```

**升级内容**：
1. 添加 `color` 字段到 `members` 表（默认值：#4ECDC4）
2. 为现有成员设置默认颜色
3. 创建 `idx_members_color` 索引

### rollback_v1.1.0.sql
**功能**：回滚到 v1.1.0 之前版本

**执行方式**：
```bash
mysql -h <host> -P <port> -u <username> -p<password> <database> < rollback_v1.1.0.sql
```

**回滚内容**：
1. 删除 `idx_members_color` 索引
2. 删除 `color` 字段

## 云服务器部署步骤

### 1. 备份数据库（重要！）
```bash
# 备份数据库
mysqldump -h <host> -P <port> -u <username> -p<password> <database> > backup_$(date +%Y%m%d_%H%M%S).sql

# 示例
mysqldump -h localhost -P 3306 -u root -p123456 family_expense > backup_20260413_143000.sql
```

### 2. 上传升级脚本到服务器
```bash
# 使用 scp 上传脚本
scp upgrade_v1.1.0.sql user@server:/path/to/database/

# 或使用其他方式上传（如 FTP、SFTP 等）
```

### 3. SSH 连接到服务器
```bash
ssh user@server
```

### 4. 执行升级脚本
```bash
# 进入脚本所在目录
cd /path/to/database/

# 执行升级脚本
mysql -h localhost -P 3306 -u root -p123456 family_expense < upgrade_v1.1.0.sql
```

### 5. 验证升级结果
```bash
# 连接到数据库
mysql -h localhost -P 3306 -u root -p123456 family_expense

# 查看 members 表结构
DESCRIBE members;

# 查看现有成员数据
SELECT id, name, color FROM members;

# 退出数据库
exit;
```

### 6. 部署应用代码
```bash
# 拉取最新代码
git pull origin main

# 或上传新的代码文件

# 重启应用（根据你的部署方式）
# npm run dev
# 或 pm2 restart all
# 或其他重启命令
```

## 注意事项

⚠️ **重要提醒**：
1. 升级前务必备份数据库
2. 建议在测试环境先执行升级脚本，确认无误后再在生产环境执行
3. 升级脚本会检查字段和索引是否已存在，避免重复添加
4. 如果升级失败，可以使用 rollback 脚本回滚
5. 升级后建议验证应用功能是否正常

## 故障排查

### 问题1：Unknown column 'color' in 'field list'
**原因**：数据库尚未执行升级脚本
**解决**：执行 upgrade_v1.1.0.sql 脚本

### 问题2：Column 'color' already exists
**原因**：字段已存在，脚本会跳过添加
**解决**：这是正常的，脚本会自动检测并跳过已存在的字段

### 问题3：升级后应用报错
**原因**：应用代码版本与数据库版本不匹配
**解决**：
1. 确认已升级应用代码到最新版本
2. 重启应用服务
3. 检查应用日志

## 联系支持

如遇到问题，请提供以下信息：
1. 错误信息截图或日志
2. 数据库版本：`SELECT VERSION();`
3. members 表结构：`DESCRIBE members;`
4. 升级脚本执行结果

---

**更新日期**：2026-04-13
**版本**：v1.1.0