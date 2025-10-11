# 使用 Conda 运行 ChatBridge Forwarder

## 🎯 为什么使用 Conda？

在 macOS 上，使用 Homebrew 安装的 Python 3.13+ 有 [PEP 668](https://peps.python.org/pep-0668/) 保护，不允许直接安装全局包。这会导致：

```
error: externally-managed-environment
```

**Conda/Miniconda** 提供了完美的解决方案：独立的 Python 环境，不会影响系统 Python。

---

## 🚀 快速开始（推荐）

### 方案 A：自动使用 Conda（最简单）

启动脚本已经**自动支持 Conda**！只需：

```bash
./start_forwarder.sh
```

脚本会：
1. ✅ 自动检测 Conda
2. ✅ 创建独立环境 `chatbridge`（如果不存在）
3. ✅ 激活环境
4. ✅ 安装依赖
5. ✅ 启动 Forwarder

**首次运行输出：**
```
╔════════════════════════════════════════════╗
║   ChatBridge Forwarder 启动脚本          ║
╚════════════════════════════════════════════╝

🐍 检测到 Conda 环境
📦 创建新的 Conda 环境: chatbridge
✓ Conda 环境创建成功
📋 检查环境...
   Python: Python 3.10.x
📦 检查依赖包...
   ✓ aiohttp
   ✓ requests
✅ 环境检查完成，正在启动 Forwarder...
```

---

## 📦 手动安装 Conda（如果没有）

### macOS (推荐使用 Homebrew)

```bash
brew install miniconda
```

### 其他方法

访问 [Miniconda 官网](https://docs.conda.io/en/latest/miniconda.html) 下载安装器。

---

## 🔧 手动管理 Conda 环境（可选）

如果您想手动控制环境：

### 创建环境

```bash
conda create -n chatbridge python=3.10 -y
```

### 激活环境

```bash
conda activate chatbridge
```

### 安装依赖

```bash
pip install aiohttp requests
```

### 运行 Forwarder

```bash
python ChatBridge_APIHijackForwarder.py
```

### 退出环境

```bash
conda deactivate
```

### 删除环境（如果需要重建）

```bash
conda env remove -n chatbridge
```

---

## 🐛 故障排除

### 问题 1：`conda: command not found`

**原因**：Conda 未初始化

**解决**：

```bash
# 找到 conda 安装位置
ls ~/miniconda3/etc/profile.d/conda.sh  # Homebrew
ls ~/anaconda3/etc/profile.d/conda.sh   # 官方安装器

# 添加到 shell 配置（二选一）
# zsh (macOS 默认)
echo 'source ~/miniconda3/etc/profile.d/conda.sh' >> ~/.zshrc
source ~/.zshrc

# bash
echo 'source ~/miniconda3/etc/profile.d/conda.sh' >> ~/.bashrc
source ~/.bashrc
```

### 问题 2：`externally-managed-environment` 错误仍然出现

**原因**：脚本没有正确激活 Conda 环境

**解决**：

```bash
# 手动激活环境后再运行
conda activate chatbridge
python ChatBridge_APIHijackForwarder.py
```

### 问题 3：Conda 环境创建很慢

**原因**：conda 默认源速度慢

**解决**（可选 - 使用国内镜像）：

```bash
# 添加清华镜像源
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/main/
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/free/
conda config --set show_channel_urls yes
```

---

## 📊 环境对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| **Conda** | ✅ 独立环境<br>✅ 不影响系统<br>✅ 易于管理<br>✅ 跨平台 | ⚠️ 需要额外安装 |
| 系统 Python + venv | ✅ 无需额外工具 | ❌ 需要手动创建 venv<br>❌ 可能与系统冲突 |
| pipx | ✅ 自动隔离 | ⚠️ 主要用于CLI工具<br>❌ 不适合长期运行的服务 |
| `--break-system-packages` | ✅ 快速 | ❌ 可能破坏系统<br>❌ 不推荐 |

---

## ✅ 推荐工作流

1. **安装 Conda**（一次性）
   ```bash
   brew install miniconda
   ```

2. **运行启动脚本**（每次使用）
   ```bash
   ./start_forwarder.sh
   ```

就这么简单！脚本会处理一切。

---

## 🎓 了解更多

- [Conda 官方文档](https://docs.conda.io/)
- [PEP 668 说明](https://peps.python.org/pep-0668/)
- [Miniconda 下载](https://docs.conda.io/en/latest/miniconda.html)

---

## 💬 需要帮助？

如果遇到问题：

1. 检查 Conda 是否安装：`conda --version`
2. 查看日志输出
3. 在 GitHub Issues 中报告问题
