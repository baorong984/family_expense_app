# 阿里云服务器操作指南

## 服务器基本信息

- **系统**: Ubuntu 22.04.5 LTS
- **内网IP**: 172.19.27.161
- **hostname**: iZuf6eqa1nd9zgmjibh2h6Z
- **SSH端口**: 22 (默认)
- **数据盘挂载点**: `/` (39.01GB)

---

## 一、系统维护

### 1. 系统更新
```bash
# 更新软件包列表
apt update

# 升级所有可更新的软件包
apt upgrade -y

# 检查可升级的包
apt list --upgradable

# 升级到最新 LTS 版本 (24.04)
do-release-upgrade
```

### 2. 系统监控
```bash
# 查看系统负载
uptime

# 查看内存使用
free -h

# 查看磁盘使用
df -h

# 查看进程
top
htop  # 需要安装

# 查看系统信息
uname -a
cat /proc/cpuinfo
```

### 3. 系统服务管理
```bash
# 查看服务状态
systemctl status <service_name>

# 启动服务
systemctl start <service_name>

# 停止服务
systemctl stop <service_name>

# 重启服务
systemctl restart <service_name>

# 开机自启
systemctl enable <service_name>

# 关闭开机自启
systemctl disable <service_name>
```

---

## 二、MySQL 数据库操作

### 1. 数据库连接
```bash
# 登录 MySQL
mysql -u root -p

# 指定数据库登录
mysql -u root -p family_expense
```

### 2. 数据库备份 (最重要)

```bash
# 创建备份目录
mkdir -p /backup

# 备份整个数据库 (包括结构和数据)
mysqldump -u root -p family_expense > /backup/family_expense_full_$(date +%Y%m%d).sql

# 仅备份数据结构 (不包含数据)
mysqldump -u root -p --no-data family_expense > /backup/family_expense_structure_$(date +%Y%m%d).sql

# 仅备份数据 (不包含创建表的语句) ⚠️ 注意: 需要先确保表结构存在
mysqldump -u root -p --no-create-info family_expense > /backup/family_expense_data_$(date +%Y%m%d).sql

# 备份多个数据库
mysqldump -u root -p --databases family_expense another_db > /backup/multi_db_$(date +%Y%m%d).sql

# 备份所有数据库
mysqldump -u root -p --all-databases > /backup/all_databases_$(date +%Y%m%d).sql

# 压缩备份 (节省空间)
mysqldump -u root -p family_expense | gzip > /backup/family_expense_$(date +%Y%m%d).sql.gz
```

### 3. 数据库恢复
```bash
# 恢复整个数据库
mysql -u root -p family_expense < /backup/family_expense_20250523.sql

# 从压缩文件恢复
gunzip < /backup/family_expense_20250523.sql.gz | mysql -u root -p family_expense

# 恢复所有数据库
mysql -u root -p < /backup/all_databases_20250523.sql
```

### 4. 数据库管理
```bash
# 查看所有数据库
mysql -u root -p -e "SHOW DATABASES;"

# 选择数据库
USE family_expense;

# 查看所有表
SHOW TABLES;

# 查看表结构
DESC table_name;
DESCRIBE table_name;

# 查看表数据量
SELECT COUNT(*) FROM table_name;

# 优化表
OPTIMIZE TABLE table_name;

# 修复表
REPAIR TABLE table_name;
```

### 5. 自动备份脚本示例
```bash
#!/bin/bash
# /scripts/mysql_backup.sh

BACKUP_DIR="/backup"
MYSQL_USER="root"
MYSQL_PASS="your_password"
DATABASE="family_expense"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 完整备份
mysqldump -u $MYSQL_USER -p$MYSQL_PASS $DATABASE | gzip > $BACKUP_DIR/${DATABASE}_full_$DATE.sql.gz

# 删除 7 天前的备份
find $BACKUP_DIR -name "${DATABASE}_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

---

## 三、Nginx/Web 服务

### 1. 基本操作
```bash
# 查看状态
systemctl status nginx

# 启动/停止/重启
systemctl start nginx
systemctl stop nginx
systemctl restart nginx

# 重载配置 (不中断服务)
systemctl reload nginx

# 测试配置
nginx -t

# 查看配置文件位置
nginx -V
```

### 2. 网站管理
```bash
# 查看网站配置
ls -la /etc/nginx/sites-enabled/
ls -la /etc/nginx/sites-available/

# 常用网站目录
/var/www/html          # 默认网站目录
/var/www/family        # 项目网站目录

# 启用网站
ln -s /etc/nginx/sites-available/your_site /etc/nginx/sites-enabled/

# 禁用网站
rm /etc/nginx/sites-enabled/your_site
```

### 3. SSL 证书 (Let's Encrypt)
```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx

# 申请证书
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 续期证书
certbot renew

# 测试续期
certbot renew --dry-run
```

---

## 四、防火墙配置 (UFW)

```bash
# 查看状态
ufw status

# 查看详细状态
ufw status verbose

# 允许端口
ufw allow 22      # SSH
ufw allow 80      # HTTP
ufw allow 443     # HTTPS
ufw allow 3306    # MySQL (谨慎开放)

# 允许特定 IP
ufw allow from 192.168.1.100

# 拒绝端口
ufw deny 3306

# 删除规则
ufw delete allow 3306

# 启用防火墙
ufw enable

# 禁用防火墙
ufw disable

# 重置防火墙
ufw reset
```

---

## 五、日志管理

### 1. 系统日志
```bash
# 查看系统日志
tail -f /var/log/syslog

# 查看认证日志
tail -f /var/log/auth.log

# 查看内核日志
dmesg
dmesg | tail -20

# 日志轮转配置
cat /etc/logrotate.conf
cat /etc/logrotate.d/nginx
```

### 2. Nginx 日志
```bash
# 查看访问日志
tail -f /var/log/nginx/access.log

# 查看错误日志
tail -f /var/log/nginx/error.log

# 分析访问统计
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10
```

### 3. MySQL 日志
```bash
# MySQL 日志位置
ls -la /var/log/mysql/

# 查看错误日志
tail -f /var/log/mysql/error.log

# 查看慢查询日志 (需要配置)
tail -f /var/log/mysql/mysql-slow.log
```

---

## 六、定时任务 (Cron)

### 1. 常用定时任务示例
```bash
# 编辑 crontab
crontab -e

# 查看 crontab
crontab -l

# 删除所有 crontab
crontab -r
```

### 2. Crontab 时间格式
```
┌───────────── 分钟 (0-59)
│ ┌───────────── 小时 (0-23)
│ │ ┌───────────── 日期 (1-31)
│ │ │ ┌───────────── 月份 (1-12)
│ │ │ │ ┌───────────── 星期 (0-7, 0和7是周日)
│ │ │ │ │
* * * * * command
```

### 3. 常用定时任务示例
```bash
# 每天凌晨 2 点执行 MySQL 备份
0 2 * * * mysqldump -u root -p'your_password' family_expense | gzip > /backup/family_expense_$(date +\%Y\%m\%d).sql.gz

# 每周日凌晨 3 点执行完整备份
0 3 * * 0 mysqldump -u root -p'your_password' family_expense > /backup/family_expense_full_$(date +\%Y\%m\%d).sql

# 每小时清理一次日志
0 * * * * find /var/log -name "*.log" -mtime +7 -delete

# 每天检查磁盘使用，超过 80% 发送警告
0 0 * * * df -h | awk '{if ($5 > 80) print $1 " " $5 " is full"}'
```

---

## 七、安全加固

### 1. SSH 安全
```bash
# 编辑 SSH 配置
vim /etc/ssh/sshd_config

# 建议修改的配置
Port 2222                    # 更改默认端口
PermitRootLogin no           # 禁止 root 登录
PasswordAuthentication no    # 禁用密码登录
PubkeyAuthentication yes      # 启用密钥登录
MaxAuthTries 3               # 最大尝试次数
```

### 2. Fail2ban (防暴力破解)
```bash
# 安装
apt install fail2ban

# 启动
systemctl start fail2ban
systemctl enable fail2ban

# 查看状态
fail2ban-client status

# 查看 SSH 防护状态
fail2ban-client status sshd
```

---

## 八、快速命令参考

```bash
# === 系统 ===
uptime                    # 系统运行时间
df -h                     # 磁盘使用
free -h                   # 内存使用
top                       # 进程监控

# === MySQL ===
mysqldump -u root -p family_expense > /backup/backup.sql   # 备份
mysql -u root -p family_expense < /backup/backup.sql        # 恢复

# === Nginx ===
systemctl restart nginx   # 重启
nginx -t                  # 测试配置

# === 服务 ===
systemctl status <name>   # 查看状态
systemctl restart <name>  # 重启服务

# === 日志 ===
tail -f /var/log/syslog   # 实时查看日志
journalctl -u <name>       # 查看服务日志
```

---

## 九、紧急情况处理

### 1. 服务无法启动
```bash
# 查看详细错误
systemctl status nginx
journalctl -xe

# 检查端口占用
netstat -tlnp | grep :80
lsof -i :80

# 检查配置文件语法
nginx -t
```

### 2. 磁盘空间不足
```bash
# 查找大文件
du -sh /* | sort -rh | head -10

# 查找大日志文件
find /var/log -type f -size +100M

# 清理 apt 缓存
apt clean
apt autoremove -y

# 清理旧内核 (谨慎)
dpkg --list | grep linux-image
apt remove linux-image-x.x.x.x-generic
```

### 3. MySQL 无法连接
```bash
# 检查 MySQL 状态
systemctl status mysql

# 检查 MySQL 端口
netstat -tlnp | grep 3306

# 检查错误日志
tail -f /var/log/mysql/error.log

# MySQL 安全模式修复
# 1. 停止 MySQL
systemctl stop mysql

# 2. 以安全模式启动
mysqld_safe --skip-grant-tables &

# 3. 重新设置密码
mysql -u root
# 在 MySQL 中执行:
# FLUSH PRIVILEGES;
# ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
```

---

## 十、环境变量和路径

```bash
# Node.js (如果有)
node -v
npm -v
which node

# Python (如果有)
python3 --version
pip3 --version
which python3

# Java (如果有)
java -version
which java

# Go (如果有)
go version
which go

# PHP (如果有)
php -v
which php
```

---

> 📝 **提示**: 
> - 建议定期执行备份任务
> - 修改配置前先备份原文件
> - 生产环境修改 SSH 端口后记得更新防火墙
> - 敏感操作请在低峰期进行

---

*最后更新: 2026-05-23*
