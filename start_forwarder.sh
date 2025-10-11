#!/bin/bash
# ChatBridge Forwarder 快速启动脚本
# 使用方法：./start_forwarder.sh 或双击运行

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ChatBridge Forwarder 启动脚本          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""

# 检查 Python 版本
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
else
    echo -e "${RED}❌ 错误：未找到 Python${NC}"
    echo "请先安装 Python 3.7 或更高版本"
    exit 1
fi

echo -e "${YELLOW}📋 检查环境...${NC}"
PYTHON_VERSION=$($PYTHON_CMD --version 2>&1)
echo "   Python: $PYTHON_VERSION"

# 检查必需的 Python 包
echo -e "${YELLOW}📦 检查依赖包...${NC}"
REQUIRED_PACKAGES=("aiohttp" "requests")
MISSING_PACKAGES=()

for package in "${REQUIRED_PACKAGES[@]}"; do
    if ! $PYTHON_CMD -c "import $package" &> /dev/null; then
        MISSING_PACKAGES+=("$package")
        echo -e "   ${RED}✗${NC} $package (未安装)"
    else
        echo -e "   ${GREEN}✓${NC} $package"
    fi
done

if [ ${#MISSING_PACKAGES[@]} -ne 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  缺少依赖包，正在安装...${NC}"
    $PYTHON_CMD -m pip install "${MISSING_PACKAGES[@]}"
    echo ""
fi

# 检查配置文件
if [ ! -f "settings.json" ]; then
    echo -e "${YELLOW}⚠️  未找到 settings.json，将使用默认配置${NC}"
    echo "   建议复制 settings.json.template 并修改配置"
    echo ""
fi

# 检查端口占用
echo -e "${YELLOW}🔌 检查端口...${NC}"
BRIDGE_PORT=8001
API_PORT=8003

if lsof -Pi :$BRIDGE_PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "   ${RED}✗${NC} 端口 $BRIDGE_PORT 已被占用"
    echo "   使用以下命令查看占用进程："
    echo "   lsof -i :$BRIDGE_PORT"
    exit 1
else
    echo -e "   ${GREEN}✓${NC} 端口 $BRIDGE_PORT 可用"
fi

if lsof -Pi :$API_PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "   ${RED}✗${NC} 端口 $API_PORT 已被占用"
    echo "   使用以下命令查看占用进程："
    echo "   lsof -i :$API_PORT"
    exit 1
else
    echo -e "   ${GREEN}✓${NC} 端口 $API_PORT 可用"
fi

echo ""
echo -e "${GREEN}✅ 环境检查完成，正在启动 Forwarder...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}💡 提示：${NC}"
echo "   - WebSocket 桥接端口: $BRIDGE_PORT"
echo "   - 用户 API 端口: $API_PORT"
echo "   - 按 Ctrl+C 停止服务"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 启动 forwarder
$PYTHON_CMD ChatBridge_APIHijackForwarder.py

# 捕获退出信号
EXIT_CODE=$?
echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ Forwarder 正常退出${NC}"
else
    echo -e "${RED}✗ Forwarder 异常退出 (代码: $EXIT_CODE)${NC}"
fi
