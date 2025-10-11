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
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ChatBridge Forwarder 启动脚本          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""

# Conda 环境名称
CONDA_ENV_NAME="chatbridge"

# 检测 Conda 是否可用
if command -v conda &> /dev/null; then
    echo -e "${BLUE}🐍 检测到 Conda 环境${NC}"
    
    # 初始化 conda（如果需要）
    if [ -f "$HOME/miniconda3/etc/profile.d/conda.sh" ]; then
        source "$HOME/miniconda3/etc/profile.d/conda.sh"
    elif [ -f "$HOME/anaconda3/etc/profile.d/conda.sh" ]; then
        source "$HOME/anaconda3/etc/profile.d/conda.sh"
    elif [ -f "/opt/miniconda3/etc/profile.d/conda.sh" ]; then
        source "/opt/miniconda3/etc/profile.d/conda.sh"
    fi
    
    # 检查 chatbridge 环境是否存在
    if conda env list | grep -q "^$CONDA_ENV_NAME "; then
        echo -e "${GREEN}✓${NC} 使用现有 Conda 环境: $CONDA_ENV_NAME"
        conda activate "$CONDA_ENV_NAME"
    else
        echo -e "${YELLOW}📦 创建新的 Conda 环境: $CONDA_ENV_NAME${NC}"
        conda create -n "$CONDA_ENV_NAME" python=3.10 -y
        conda activate "$CONDA_ENV_NAME"
        echo -e "${GREEN}✓${NC} Conda 环境创建成功"
    fi
    
    PYTHON_CMD=python
    USE_CONDA=true
else
    echo -e "${YELLOW}⚠️  未检测到 Conda，使用系统 Python${NC}"
    USE_CONDA=false
    
    # 检查 Python 版本
    if command -v python3 &> /dev/null; then
        PYTHON_CMD=python3
    elif command -v python &> /dev/null; then
        PYTHON_CMD=python
    else
        echo -e "${RED}❌ 错误：未找到 Python${NC}"
        echo ""
        echo "建议安装 Miniconda："
        echo "  macOS: brew install miniconda"
        echo "  或访问: https://docs.conda.io/en/latest/miniconda.html"
        exit 1
    fi
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
    
    if [ "$USE_CONDA" = true ]; then
        # 在 Conda 环境中安装
        $PYTHON_CMD -m pip install "${MISSING_PACKAGES[@]}"
    else
        # 尝试使用 --user 标志（避免系统包冲突）
        $PYTHON_CMD -m pip install --user "${MISSING_PACKAGES[@]}" 2>&1 | grep -v "externally-managed-environment" || {
            echo ""
            echo -e "${RED}❌ 无法安装依赖包${NC}"
            echo ""
            echo "您的 Python 环境不允许直接安装包。"
            echo ""
            echo "推荐解决方案："
            echo "1. 安装 Miniconda (推荐)："
            echo "   brew install miniconda"
            echo "   然后重新运行此脚本"
            echo ""
            echo "2. 或者使用 pipx："
            echo "   brew install pipx"
            echo ""
            exit 1
        }
    fi
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
