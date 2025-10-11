# SillyTavern Extension - Multi-Platform Chat Bridge

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Version](https://img.shields.io/badge/version-2.1.0-green.svg)](https://github.com/ldc861117/SillyTavern-Extension-ChatBridge)

[English](#english) | [中文](#中文)

---

## English

### 🙏 Attribution

This project is forked from [AyeeMinerva/SillyTavern-Extension-ChatBridge](https://github.com/AyeeMinerva/SillyTavern-Extension-ChatBridge). 

**Special thanks to [@AyeeMinerva](https://github.com/AyeeMinerva)** for creating the original ChatBridge extension that laid the foundation for this project.

---

### 📖 Overview

**Multi-Platform Chat Bridge** is an advanced SillyTavern extension that enables seamless interaction with AI characters through multiple chat platforms simultaneously. Chat with your favorite characters via Telegram, Discord, WeChat, or any combination thereof - all conversations maintained across platforms with persistent session management.

---

### ✨ What's New in v2.1

#### 🎭 **Character & Session Management** (NEW!)
- **Character Selection**: Use `/char` command to switch between characters
- **Multi-Session Support**: Create multiple conversation sessions with `/session new`
- **Session Persistence**: All conversations are automatically saved and can be resumed
- **Per-User Preferences**: Each platform user has their own character selections

#### 🌐 **Multi-Platform Support**
- **Telegram**: Full bot integration with long polling
- **Discord**: Real-time message handling (coming soon)
- **WeChat**: Enterprise and personal account support (coming soon)

#### 🛠️ **Enhanced Developer Experience**
- **Conda Auto-Setup**: Automatic Python environment management
- **One-Click Start**: Smart startup scripts for all platforms
- **Auto-Reconnect**: Platforms automatically reconnect on disconnect

---

### 🚀 Quick Start

#### Prerequisites

- **SillyTavern**: Version 1.10.0 or higher
- **Python**: 3.7+ (or Conda/Miniconda for easy setup)

#### Installation

1. **Clone the extension**:
   ```bash
   cd [SillyTavern]/public/scripts/extensions/third-party/
   git clone https://github.com/ldc861117/SillyTavern-Extension-ChatBridge.git
   ```

2. **Install Conda** (Recommended - avoids Python dependency issues):
   ```bash
   # macOS
   brew install miniconda
   
   # Or download from: https://docs.conda.io/en/latest/miniconda.html
   ```

3. **Start the Forwarder**:
   ```bash
   cd SillyTavern-Extension-ChatBridge
   ./start_forwarder.sh     # macOS/Linux
   # or
   start_forwarder.bat      # Windows
   ```

   The script will:
   - ✅ Auto-detect Conda and create isolated environment
   - ✅ Install all dependencies automatically
   - ✅ Start the bridge server

4. **Enable Extension in SillyTavern**:
   - Open SillyTavern
   - Go to Extensions → Extension Settings
   - Find "Multi-Platform Chat Bridge"
   - Enable the extension

5. **Add Your First Platform**:
   - In the extension panel, click "Add Platform"
   - Select **Telegram**
   - Enter your bot token (get from [@BotFather](https://t.me/botfather))
   - Click "Connect"

🎉 **Done!** Send a message to your Telegram bot and start chatting!

---

### 📋 Key Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Character Management** | Switch between characters with `/char` command | ✅ Available |
| **Multi-Session Support** | Create and manage multiple conversation sessions | ✅ Available |
| **Session Persistence** | Conversations automatically saved and restored | ✅ Available |
| **Telegram Integration** | Full bot support with command interface | ✅ Available |
| **Cross-Platform Sessions** | Continue conversations across platforms | ✅ Available |
| **Discord Integration** | Real-time bot integration | 🔄 Coming Soon |
| **WeChat Integration** | Enterprise/Personal account support | 🔄 Coming Soon |
| **Conda Auto-Setup** | Automatic Python environment management | ✅ Available |

---

### 🎮 Usage Commands

#### Character Management
```
/char                  - List all available characters
/char [name]           - Switch to a character
Example: /char Alice
```

#### Session Management
```
/session               - Show current session info
/session list          - List all your sessions
/session new           - Create a new conversation
/session switch [n]    - Switch to session #n
```

#### Help
```
/help                  - Show all available commands
```

---

### 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│  User Platforms                                 │
│  (Telegram / Discord / WeChat)                  │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  Platform Adapters (JavaScript)                 │
│  - TelegramAdapter                              │
│  - DiscordAdapter                               │
│  - WeChatAdapter                                │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  Core System                                    │
│  - SessionManager     (Multi-session support)   │
│  - CharacterManager   (Character selection)     │
│  - CommandParser      (Slash commands)          │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  Bridge Server (Python)                         │
│  - WebSocket Server                             │
│  - API Hijack Forwarder                         │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  SillyTavern Core                               │
│  (AI Character Engine)                          │
└─────────────────────────────────────────────────┘
```

---

### 🔧 Advanced Configuration

See [CONDA_SETUP.md](CONDA_SETUP.md) for detailed Python environment setup.

---

### 📚 Documentation

- **[Quick Start Guide](docs/QUICK_START.md)** - Get started in 5 minutes
- **[Platform Setup](docs/PLATFORM_SETUP.md)** - Configure Telegram, Discord, WeChat
- **[Character Management](docs/CHARACTER_MANAGEMENT.md)** - Use slash commands and sessions
- **[Conda Setup](CONDA_SETUP.md)** - Python environment troubleshooting

---

### 🆚 Comparison with Original

| Feature | Original v1.0 | This Fork v2.1 |
|---------|---------------|----------------|
| Multiple Platforms | ❌ Single platform only | ✅ Multi-platform simultaneous |
| Character Selection | ❌ System default only | ✅ Per-user character selection |
| Session Management | ❌ Single session | ✅ Multiple sessions per user |
| Slash Commands | ❌ Not available | ✅ `/char`, `/session`, `/help` |
| Auto Environment Setup | ❌ Manual | ✅ Conda auto-detection |
| Platform Persistence | ❌ Manual reconnect | ✅ Auto-reconnect on startup |
| Cross-Platform Continuity | ❌ Not supported | ✅ Session binding across platforms |

---

### 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

### 📄 License

This project is licensed under the **AGPL-3.0 License** - see the [LICENSE](LICENSE) file for details.

---

### 🐛 Troubleshooting

#### Python Environment Issues

If you see `externally-managed-environment` error:
```bash
# Install Conda (recommended)
brew install miniconda

# Then re-run the startup script
./start_forwarder.sh
```

See [CONDA_SETUP.md](CONDA_SETUP.md) for detailed solutions.

#### Extension Not Loading

1. Check browser console (F12 → Console) for errors
2. Ensure SillyTavern is version 1.10.0+
3. Try hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

#### Platform Connection Failed

1. Verify bot token is correct
2. Check network connectivity
3. Review debug logs in extension panel

---

### 💬 Support

- **Issues**: [GitHub Issues](https://github.com/ldc861117/SillyTavern-Extension-ChatBridge/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ldc861117/SillyTavern-Extension-ChatBridge/discussions)

---

## 中文

### 🙏 致谢

本项目 fork 自 [AyeeMinerva/SillyTavern-Extension-ChatBridge](https://github.com/AyeeMinerva/SillyTavern-Extension-ChatBridge)。

**特别感谢 [@AyeeMinerva](https://github.com/AyeeMinerva)** 创建了原始的 ChatBridge 扩展，为本项目奠定了基础。

---

### 📖 项目简介

**多平台聊天桥接**是一个先进的 SillyTavern 扩展，支持通过多个聊天平台同时与 AI 角色互动。通过 Telegram、Discord、微信或任意组合与您喜欢的角色聊天 - 所有对话都跨平台维护，并支持持久化会话管理。

---

### ✨ v2.1 新功能

#### 🎭 **角色与会话管理**（全新！）
- **角色选择**：使用 `/char` 命令切换角色
- **多会话支持**：使用 `/session new` 创建多个对话会话
- **会话持久化**：所有对话自动保存，可随时恢复
- **用户偏好**：每个平台用户都有独立的角色选择

#### 🌐 **多平台支持**
- **Telegram**：完整的机器人集成，支持长轮询
- **Discord**：实时消息处理（即将推出）
- **微信**：企业号和个人号支持（即将推出）

#### 🛠️ **增强的开发体验**
- **Conda 自动配置**：自动管理 Python 环境
- **一键启动**：智能启动脚本，支持所有平台
- **自动重连**：平台断开后自动重新连接

---

### 🚀 快速开始

#### 前置要求

- **SillyTavern**：版本 1.10.0 或更高
- **Python**：3.7+（或使用 Conda/Miniconda 简化安装）

#### 安装步骤

1. **克隆扩展**：
   ```bash
   cd [SillyTavern]/public/scripts/extensions/third-party/
   git clone https://github.com/ldc861117/SillyTavern-Extension-ChatBridge.git
   ```

2. **安装 Conda**（推荐 - 避免 Python 依赖问题）：
   ```bash
   # macOS
   brew install miniconda
   
   # 或从官网下载：https://docs.conda.io/en/latest/miniconda.html
   ```

3. **启动转发器**：
   ```bash
   cd SillyTavern-Extension-ChatBridge
   ./start_forwarder.sh     # macOS/Linux
   # 或
   start_forwarder.bat      # Windows
   ```

   脚本会自动：
   - ✅ 检测 Conda 并创建隔离环境
   - ✅ 自动安装所有依赖
   - ✅ 启动桥接服务器

4. **在 SillyTavern 中启用扩展**：
   - 打开 SillyTavern
   - 前往"扩展"→"扩展设置"
   - 找到"Multi-Platform Chat Bridge"
   - 启用扩展

5. **添加您的第一个平台**：
   - 在扩展面板中，点击"添加平台"
   - 选择 **Telegram**
   - 输入您的机器人 Token（从 [@BotFather](https://t.me/botfather) 获取）
   - 点击"连接"

🎉 **完成！**给您的 Telegram 机器人发送消息，开始聊天！

---

### 📋 核心功能

| 功能 | 描述 | 状态 |
|------|------|------|
| **角色管理** | 使用 `/char` 命令切换角色 | ✅ 可用 |
| **多会话支持** | 创建和管理多个对话会话 | ✅ 可用 |
| **会话持久化** | 对话自动保存和恢复 | ✅ 可用 |
| **Telegram 集成** | 完整的机器人支持和命令界面 | ✅ 可用 |
| **跨平台会话** | 在不同平台间继续对话 | ✅ 可用 |
| **Discord 集成** | 实时机器人集成 | 🔄 即将推出 |
| **微信集成** | 企业号/个人号支持 | 🔄 即将推出 |
| **Conda 自动配置** | 自动 Python 环境管理 | ✅ 可用 |

---

### 🎮 使用命令

#### 角色管理
```
/char                  - 列出所有可用角色
/char [名称]           - 切换到指定角色
示例：/char Alice
```

#### 会话管理
```
/session               - 显示当前会话信息
/session list          - 列出所有会话
/session new           - 创建新对话
/session switch [编号] - 切换到指定会话
```

#### 帮助
```
/help                  - 显示所有可用命令
```

---

### 🆚 与原版对比

| 功能 | 原版 v1.0 | 本分支 v2.1 |
|------|-----------|-------------|
| 多平台支持 | ❌ 仅单平台 | ✅ 多平台同时运行 |
| 角色选择 | ❌ 仅系统默认 | ✅ 每个用户独立选择 |
| 会话管理 | ❌ 单会话 | ✅ 每用户多会话 |
| 斜杠命令 | ❌ 不支持 | ✅ `/char`, `/session`, `/help` |
| 自动环境配置 | ❌ 手动 | ✅ Conda 自动检测 |
| 平台持久化 | ❌ 手动重连 | ✅ 启动时自动重连 |
| 跨平台连续性 | ❌ 不支持 | ✅ 会话跨平台绑定 |

---

### 🔧 高级配置

详细的 Python 环境配置请参阅 [CONDA_SETUP.md](CONDA_SETUP.md)。

---

### 📚 文档

- **[快速开始指南](docs/QUICK_START.md)** - 5 分钟快速上手
- **[平台配置](docs/PLATFORM_SETUP.md)** - 配置 Telegram、Discord、微信
- **[角色管理](docs/CHARACTER_MANAGEMENT.md)** - 使用斜杠命令和会话
- **[Conda 配置](CONDA_SETUP.md)** - Python 环境故障排除

---

### 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

### 📄 许可证

本项目采用 **AGPL-3.0 许可证** - 详见 [LICENSE](LICENSE) 文件。

---

### 🐛 故障排除

#### Python 环境问题

如果看到 `externally-managed-environment` 错误：
```bash
# 安装 Conda（推荐）
brew install miniconda

# 然后重新运行启动脚本
./start_forwarder.sh
```

详细解决方案请参阅 [CONDA_SETUP.md](CONDA_SETUP.md)。

#### 扩展无法加载

1. 检查浏览器控制台（F12 → Console）的错误
2. 确保 SillyTavern 版本为 1.10.0+
3. 尝试硬刷新（Ctrl+Shift+R / Cmd+Shift+R）

#### 平台连接失败

1. 验证机器人 Token 是否正确
2. 检查网络连接
3. 查看扩展面板中的调试日志

---

### 💬 支持

- **问题反馈**：[GitHub Issues](https://github.com/ldc861117/SillyTavern-Extension-ChatBridge/issues)
- **讨论交流**：[GitHub Discussions](https://github.com/ldc861117/SillyTavern-Extension-ChatBridge/discussions)

---

### 🌟 Star History

如果这个项目对您有帮助，请给我们一个 Star ⭐️

---

**Made with ❤️ by the community**
