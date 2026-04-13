#!/bin/bash

# ============================================
# 家庭记账系统数据库升级脚本
# 版本: v1.1.0
# 日期: 2026-04-13
# ============================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 数据库配置（请根据实际情况修改）
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-123456}"
DB_NAME="${DB_NAME:-family_expense}"

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UPGRADE_SCRIPT="${SCRIPT_DIR}/upgrade_v1.1.0.sql"
ROLLBACK_SCRIPT="${SCRIPT_DIR}/rollback_v1.1.0.sql"

# 打印函数
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 MySQL 客户端
check_mysql_client() {
    if ! command -v mysql &> /dev/null; then
        print_error "MySQL 客户端未安装，请先安装 MySQL 客户端"
        exit 1
    fi
}

# 备份数据库
backup_database() {
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    print_info "正在备份数据库到 ${backup_file}..."

    if mysqldump -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" > "${backup_file}"; then
        print_info "数据库备份成功: ${backup_file}"
        return 0
    else
        print_error "数据库备份失败"
        exit 1
    fi
}

# 执行升级脚本
execute_upgrade() {
    print_info "正在执行升级脚本..."

    if mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" < "${UPGRADE_SCRIPT}"; then
        print_info "数据库升级成功"
        return 0
    else
        print_error "数据库升级失败"
        return 1
    fi
}

# 执行回滚脚本
execute_rollback() {
    print_warn "正在执行回滚脚本..."

    if mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" < "${ROLLBACK_SCRIPT}"; then
        print_info "数据库回滚成功"
        return 0
    else
        print_error "数据库回滚失败"
        return 1
    fi
}

# 验证升级结果
verify_upgrade() {
    print_info "正在验证升级结果..."

    mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -e "DESCRIBE members;" 2>/dev/null

    if [ $? -eq 0 ]; then
        print_info "验证完成，请检查上述输出确认 color 字段已添加"
    else
        print_error "验证失败"
        return 1
    fi
}

# 显示帮助信息
show_help() {
    echo "家庭记账系统数据库升级脚本 v1.1.0"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  upgrade    执行升级（默认）"
    echo "  rollback   执行回滚"
    echo "  backup     仅备份数据库"
    echo "  verify     验证数据库状态"
    echo "  help       显示此帮助信息"
    echo ""
    echo "环境变量:"
    echo "  DB_HOST    数据库主机（默认: localhost）"
    echo "  DB_PORT    数据库端口（默认: 3306）"
    echo "  DB_USER    数据库用户（默认: root）"
    echo "  DB_PASSWORD 数据库密码（默认: 123456）"
    echo "  DB_NAME    数据库名称（默认: family_expense）"
    echo ""
    echo "示例:"
    echo "  # 使用默认配置升级"
    echo "  $0 upgrade"
    echo ""
    echo "  # 使用自定义配置升级"
    echo "  DB_HOST=192.168.1.100 DB_PASSWORD=yourpassword $0 upgrade"
    echo ""
    echo "  # 仅备份数据库"
    echo "  $0 backup"
    echo ""
    echo "  # 回滚数据库"
    echo "  $0 rollback"
}

# 主函数
main() {
    local command="${1:-upgrade}"

    case "${command}" in
        upgrade)
            print_info "开始数据库升级..."
            check_mysql_client
            backup_database
            execute_upgrade
            verify_upgrade
            print_info "升级完成！"
            ;;
        rollback)
            print_warn "开始数据库回滚..."
            check_mysql_client
            backup_database
            execute_rollback
            verify_upgrade
            print_warn "回滚完成！"
            ;;
        backup)
            print_info "开始备份数据库..."
            check_mysql_client
            backup_database
            print_info "备份完成！"
            ;;
        verify)
            print_info "验证数据库状态..."
            check_mysql_client
            verify_upgrade
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "未知命令: ${command}"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"