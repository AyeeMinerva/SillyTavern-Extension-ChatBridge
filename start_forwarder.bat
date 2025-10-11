@echo off
REM ChatBridge Forwarder 快速启动脚本 (Windows)
REM 使用方法：双击运行或在命令提示符中执行

title ChatBridge Forwarder

echo ╔════════════════════════════════════════════╗
echo ║   ChatBridge Forwarder 启动脚本          ║
echo ╚════════════════════════════════════════════╝
echo.

REM 切换到脚本所在目录
cd /d "%~dp0"

REM 检查 Python 是否安装
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    where python3 >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ 错误：未找到 Python
        echo 请先安装 Python 3.7 或更高版本
        echo 下载地址：https://www.python.org/downloads/
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=python3
    )
) else (
    set PYTHON_CMD=python
)

echo 📋 检查环境...
%PYTHON_CMD% --version
echo.

REM 检查必需的包
echo 📦 检查依赖包...
%PYTHON_CMD% -c "import aiohttp" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo    ✗ aiohttp (未安装)
    echo.
    echo ⚠️  正在安装缺失的依赖包...
    %PYTHON_CMD% -m pip install aiohttp requests
    echo.
) else (
    echo    ✓ aiohttp
)

%PYTHON_CMD% -c "import requests" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo    ✗ requests (未安装)
    echo.
    echo ⚠️  正在安装缺失的依赖包...
    %PYTHON_CMD% -m pip install aiohttp requests
    echo.
) else (
    echo    ✓ requests
)

REM 检查配置文件
if not exist "settings.json" (
    echo.
    echo ⚠️  未找到 settings.json，将使用默认配置
    echo    建议复制 settings.json.template 并修改配置
    echo.
)

echo.
echo ✅ 环境检查完成，正在启动 Forwarder...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 💡 提示：
echo    - WebSocket 桥接端口: 8001
echo    - 用户 API 端口: 8003
echo    - 按 Ctrl+C 停止服务
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM 启动 forwarder
%PYTHON_CMD% ChatBridge_APIHijackForwarder.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Forwarder 正常退出
) else (
    echo.
    echo ✗ Forwarder 异常退出 (代码: %ERRORLEVEL%)
)

pause
