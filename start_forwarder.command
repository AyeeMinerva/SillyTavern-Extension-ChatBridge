#!/bin/bash
# ChatBridge Forwarder 快速启动脚本 (macOS)
# 使用方法：双击运行（需要先设置可执行权限）
# 设置权限：chmod +x start_forwarder.command

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 在新的终端窗口中运行
osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$SCRIPT_DIR' && bash start_forwarder.sh"
end tell
EOF
