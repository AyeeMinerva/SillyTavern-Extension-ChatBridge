# 快速启动指南

## 🚀 一键启动 Forwarder

为了方便测试，我们提供了多种启动方式：

---

## 方法 1：启动脚本（推荐）⭐

### Linux / macOS
```bash
# 1. 赋予执行权限（首次使用）
chmod +x start_forwarder.sh

# 2. 运行脚本
./start_forwarder.sh
```

或者直接：
```bash
bash start_forwarder.sh
```

### macOS 双击启动
```bash
# 1. 赋予执行权限（首次使用）
chmod +x start_forwarder.command

# 2. 双击 start_forwarder.command 文件
```

### Windows
```batch
# 双击运行
start_forwarder.bat
```

或在命令提示符中：
```batch
start_forwarder.bat
```

---

## 方法 2：创建命令别名

### Linux / macOS

在 `~/.bashrc` 或 `~/.zshrc` 中添加：

```bash
# ChatBridge 别名
alias chatbridge-start='cd /path/to/SillyTavern-Extension-ChatBridge && python3 ChatBridge_APIHijackForwarder.py'
alias chatbridge-stop='pkill -f ChatBridge_APIHijackForwarder'
alias chatbridge-status='pgrep -fl ChatBridge_APIHijackForwarder'
```

使用方法：
```bash
chatbridge-start    # 启动
chatbridge-stop     # 停止
chatbridge-status   # 检查状态
```

### Windows PowerShell

在 PowerShell 配置文件中添加：

```powershell
# 查看配置文件位置
$PROFILE

# 编辑配置文件
notepad $PROFILE

# 添加以下函数
function Start-ChatBridge {
    cd "C:\path\to\SillyTavern-Extension-ChatBridge"
    python ChatBridge_APIHijackForwarder.py
}

function Stop-ChatBridge {
    Get-Process -Name python | Where-Object {$_.Path -like "*ChatBridge*"} | Stop-Process
}
```

使用方法：
```powershell
Start-ChatBridge
Stop-ChatBridge
```

---

## 方法 3：后台运行（Linux/macOS）

### 使用 nohup
```bash
cd /path/to/SillyTavern-Extension-ChatBridge
nohup python3 ChatBridge_APIHijackForwarder.py > forwarder.log 2>&1 &
```

查看日志：
```bash
tail -f forwarder.log
```

停止：
```bash
pkill -f ChatBridge_APIHijackForwarder
```

### 使用 screen
```bash
# 启动新 screen 会话
screen -S chatbridge

# 在 screen 中运行
cd /path/to/SillyTavern-Extension-ChatBridge
python3 ChatBridge_APIHijackForwarder.py

# 分离会话（Ctrl+A, D）
# 重新连接：screen -r chatbridge
# 停止：screen -X -S chatbridge quit
```

### 使用 systemd（系统服务）

创建服务文件 `/etc/systemd/system/chatbridge.service`：

```ini
[Unit]
Description=ChatBridge Forwarder Service
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/SillyTavern-Extension-ChatBridge
ExecStart=/usr/bin/python3 ChatBridge_APIHijackForwarder.py
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

管理服务：
```bash
# 启用服务
sudo systemctl enable chatbridge

# 启动服务
sudo systemctl start chatbridge

# 查看状态
sudo systemctl status chatbridge

# 查看日志
sudo journalctl -u chatbridge -f

# 停止服务
sudo systemctl stop chatbridge
```

---

## 方法 4：Windows 任务计划程序

1. 打开"任务计划程序"（Task Scheduler）
2. 创建基本任务
3. 触发器：选择"当用户登录时"
4. 操作：启动程序
   - 程序：`python.exe` 的完整路径
   - 参数：`ChatBridge_APIHijackForwarder.py`
   - 起始于：脚本所在目录
5. 完成

---

## 方法 5：PM2（Node.js 进程管理器）

如果已安装 Node.js：

```bash
# 安装 PM2
npm install -g pm2

# 启动 forwarder
pm2 start ChatBridge_APIHijackForwarder.py --interpreter python3 --name chatbridge

# 查看状态
pm2 status

# 查看日志
pm2 logs chatbridge

# 停止
pm2 stop chatbridge

# 重启
pm2 restart chatbridge

# 开机自启
pm2 startup
pm2 save
```

---

## 启动脚本功能说明

我们提供的启动脚本 (`start_forwarder.sh`/`.bat`) 自动执行以下检查：

### ✅ 自动检查项目

1. **Python 版本检测**
   - 自动查找 `python3` 或 `python`
   - 显示 Python 版本

2. **依赖包检查**
   - 检查 `aiohttp` 和 `requests`
   - 自动安装缺失的包

3. **配置文件检查**
   - 检查 `settings.json` 是否存在
   - 提示使用模板配置

4. **端口占用检查**（仅 Linux/macOS）
   - 检查 8001 和 8003 端口
   - 显示占用进程信息

5. **彩色输出**
   - 清晰的状态提示
   - 错误高亮显示

### 📋 输出示例

```
╔════════════════════════════════════════════╗
║   ChatBridge Forwarder 启动脚本          ║
╚════════════════════════════════════════════╝

📋 检查环境...
   Python: Python 3.10.12

📦 检查依赖包...
   ✓ aiohttp
   ✓ requests

🔌 检查端口...
   ✓ 端口 8001 可用
   ✓ 端口 8003 可用

✅ 环境检查完成，正在启动 Forwarder...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 提示：
   - WebSocket 桥接端口: 8001
   - 用户 API 端口: 8003
   - 按 Ctrl+C 停止服务

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INFO: Starting ChatBridge Forwarder...
...
```

---

## UI 状态检测

虽然 UI 无法启动进程，但我们可以添加状态检测：

### 在扩展中检测 Forwarder 状态

扩展会自动检测 WebSocket 连接状态：
- 🟢 **已连接**：Forwarder 正在运行
- 🔴 **未连接**：Forwarder 未运行或端口不匹配

### 连接失败提示

如果无法连接，扩展会显示：
```
❌ 无法连接到 WebSocket (ws://localhost:8001)

请确保：
1. Forwarder 正在运行
2. 端口配置正确
3. 防火墙允许连接

快速启动：
  Linux/Mac: ./start_forwarder.sh
  Windows: start_forwarder.bat
```

---

## 故障排查

### 问题 1：端口被占用

**错误信息**：
```
✗ 端口 8001 已被占用
```

**解决方法**：

Linux/macOS:
```bash
# 查看占用进程
lsof -i :8001

# 杀死进程
kill -9 <PID>
```

Windows:
```batch
# 查看占用进程
netstat -ano | findstr :8001

# 杀死进程
taskkill /PID <PID> /F
```

### 问题 2：Python 包缺失

**错误信息**：
```
ModuleNotFoundError: No module named 'aiohttp'
```

**解决方法**：
```bash
pip install aiohttp requests
```

或使用启动脚本，它会自动安装。

### 问题 3：权限问题（Linux/macOS）

**错误信息**：
```
Permission denied
```

**解决方法**：
```bash
chmod +x start_forwarder.sh
```

---

## 推荐配置

### 开发/测试环境
使用启动脚本：
```bash
./start_forwarder.sh  # 方便查看实时日志
```

### 生产环境
使用后台服务：
```bash
# systemd (Linux)
sudo systemctl start chatbridge

# screen (Linux/macOS)
screen -dmS chatbridge python3 ChatBridge_APIHijackForwarder.py
```

---

## 文件清单

| 文件 | 平台 | 用途 |
|------|------|------|
| `start_forwarder.sh` | Linux/macOS | 终端启动脚本 |
| `start_forwarder.bat` | Windows | 命令提示符脚本 |
| `start_forwarder.command` | macOS | 双击启动脚本 |
| `ChatBridge_APIHijackForwarder.py` | 全部 | 主程序 |
| `settings.json` | 全部 | 配置文件 |

---

## 下一步

1. **首次使用**：
   ```bash
   chmod +x start_forwarder.sh  # Linux/macOS
   ./start_forwarder.sh
   ```

2. **配置别名**（可选）：
   编辑 `~/.bashrc` 添加快捷命令

3. **设置自启动**（可选）：
   使用 systemd 或任务计划程序

4. **测试连接**：
   打开 SillyTavern，检查扩展连接状态

---

**提示**：推荐使用启动脚本，它会自动处理所有环境检查和依赖安装！
