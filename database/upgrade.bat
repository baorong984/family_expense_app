@echo off
REM ============================================
REM 家庭记账系统数据库升级脚本
REM 版本: v1.1.0
REM 日期: 2026-04-13
REM ============================================

setlocal enabledelayedexpansion

REM 数据库配置（请根据实际情况修改）
set DB_HOST=localhost
set DB_PORT=3306
set DB_USER=root
set DB_PASSWORD=123456
set DB_NAME=family_expense

REM 脚本目录
set SCRIPT_DIR=%~dp0
set UPGRADE_SCRIPT=%SCRIPT_DIR%upgrade_v1.1.0.sql
set ROLLBACK_SCRIPT=%SCRIPT_DIR%rollback_v1.1.0.sql

REM 检查参数
if "%1"=="" goto upgrade
if "%1"=="upgrade" goto upgrade
if "%1"=="rollback" goto rollback
if "%1"=="backup" goto backup
if "%1"=="verify" goto verify
if "%1"=="help" goto help
goto invalid_command

:upgrade
echo [INFO] 开始数据库升级...
call :backup_database
call :execute_upgrade
call :verify_upgrade
echo [INFO] 升级完成！
goto end

:rollback
echo [WARN] 开始数据库回滚...
call :backup_database
call :execute_rollback
call :verify_upgrade
echo [WARN] 回滚完成！
goto end

:backup
echo [INFO] 开始备份数据库...
call :backup_database
echo [INFO] 备份完成！
goto end

:verify
echo [INFO] 验证数据库状态...
call :verify_upgrade
goto end

:help
echo 家庭记账系统数据库升级脚本 v1.1.0
echo.
echo 用法: %~nx0 [选项]
echo.
echo 选项:
echo   upgrade    执行升级（默认）
echo   rollback   执行回滚
echo   backup     仅备份数据库
echo   verify     验证数据库状态
echo   help       显示此帮助信息
echo.
echo 环境变量（在脚本中修改）:
echo   DB_HOST    数据库主机（默认: localhost）
echo   DB_PORT    数据库端口（默认: 3306）
echo   DB_USER    数据库用户（默认: root）
echo   DB_PASSWORD 数据库密码（默认: 123456）
echo   DB_NAME    数据库名称（默认: family_expense）
echo.
echo 示例:
echo   # 使用默认配置升级
echo   %~nx0 upgrade
echo.
echo   # 仅备份数据库
echo   %~nx0 backup
echo.
echo   # 回滚数据库
echo   %~nx0 rollback
goto end

:invalid_command
echo [ERROR] 未知命令: %1
echo 使用 %~nx0 help 查看帮助信息
exit /b 1

REM ==================== 函数定义 ====================

:backup_database
set BACKUP_FILE=backup_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%

echo [INFO] 正在备份数据库到 %BACKUP_FILE%...
mysqldump -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% > %BACKUP_FILE% 2>nul

if %errorlevel% equ 0 (
    echo [INFO] 数据库备份成功: %BACKUP_FILE%
    exit /b 0
) else (
    echo [ERROR] 数据库备份失败
    exit /b 1
)

:execute_upgrade
echo [INFO] 正在执行升级脚本...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < %UPGRADE_SCRIPT% 2>nul

if %errorlevel% equ 0 (
    echo [INFO] 数据库升级成功
    exit /b 0
) else (
    echo [ERROR] 数据库升级失败
    exit /b 1
)

:execute_rollback
echo [WARN] 正在执行回滚脚本...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < %ROLLBACK_SCRIPT% 2>nul

if %errorlevel% equ 0 (
    echo [INFO] 数据库回滚成功
    exit /b 0
) else (
    echo [ERROR] 数据库回滚失败
    exit /b 1
)

:verify_upgrade
echo [INFO] 正在验证升级结果...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% -e "DESCRIBE members;" 2>nul

if %errorlevel% equ 0 (
    echo [INFO] 验证完成，请检查上述输出确认 color 字段已添加
    exit /b 0
) else (
    echo [ERROR] 验证失败
    exit /b 1
)

:end
endlocal