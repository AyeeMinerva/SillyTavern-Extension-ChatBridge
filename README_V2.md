# SillyTavern Extension - Multi-Platform Chat Bridge v2.0

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)](https://github.com/ldc861117/SillyTavern-Extension-ChatBridge)

[English](#english) | [中文](#中文)

---

## English

### Overview

The **Multi-Platform Chat Bridge** is a next-generation SillyTavern extension that enables seamless integration with multiple chat platforms simultaneously. Users can interact with their favorite characters through Discord, Telegram, WeChat, or any combination thereof, with conversations maintained across all platforms.

### 🚀 What's New in v2.0

- ✨ **Multi-Platform Support**: Connect Discord, Telegram, and WeChat simultaneously
- 🔄 **Cross-Platform Sessions**: Continue conversations across different platforms seamlessly
- 🎨 **Modern UI**: Beautiful card-based interface for managing platforms
- 🏗️ **Modular Architecture**: Easily extensible adapter system for adding new platforms
- 💾 **Session Persistence**: Conversations are automatically saved and restored
- 🔐 **Secure**: Platform credentials stored safely in extension settings

### Key Features

| Feature | Description |
|---------|-------------|
| **Multi-Platform** | Simultaneously support Discord, Telegram, and WeChat |
| **Session Management** | Bind user-character interactions across platforms |
| **Cross-Platform Continuity** | Users can switch platforms and continue their conversation |
| **Modular Design** | Easy to add new platform adapters |
| **Real-time Sync** | Messages are processed in real-time through WebSocket |
| **Automatic Cleanup** | Old inactive sessions are cleaned up automatically |

### Architecture

```
User (Discord/Telegram/WeChat)
        ↓
Platform Adapter (JavaScript)
        ↓
Session Manager
        ↓
WebSocket Core
        ↓
Bridge Server (Python)
        ↓
LLM API
```

### Quick Start

1. **Install Extension**
   ```bash
   cd /path/to/SillyTavern/public/scripts/extensions/third-party/
   git clone https://github.com/ldc861117/SillyTavern-Extension-ChatBridge
   ```

2. **Install Dependencies**
   ```bash
   pip install aiohttp websockets
   ```

3. **Configure Settings**
   ```bash
   cp settings.json.template settings.json
   # Edit settings.json with your API keys
   ```

4. **Start Bridge Server**
   ```bash
   python ChatBridge_APIHijackForwarder.py
   ```

5. **Connect Platforms**
   - Open SillyTavern
   - Go to Extensions → Chat Bridge
   - Click "Add Platform" and configure your bots

### Platform Setup Guides

- **Discord**: [Discord Setup Guide](MULTIPLATFORM_GUIDE.md#discord-bot-setup)
- **Telegram**: [Telegram Setup Guide](MULTIPLATFORM_GUIDE.md#telegram-bot-setup)
- **WeChat**: [WeChat Setup Guide](MULTIPLATFORM_GUIDE.md#wechat-bot-setup)

### Documentation

- [Complete Setup Guide](MULTIPLATFORM_GUIDE.md)
- [Architecture Overview](MULTIPLATFORM_GUIDE.md#architecture)
- [Troubleshooting](MULTIPLATFORM_GUIDE.md#troubleshooting)
- [Advanced Usage](MULTIPLATFORM_GUIDE.md#advanced-usage)

### Use Cases

1. **Personal Assistant Bot**: Deploy your character as a personal assistant across all your messaging platforms
2. **Community Engagement**: Let community members interact with your character on their preferred platform
3. **Multi-User Scenarios**: Different users can have independent conversations with the same character
4. **Cross-Platform Testing**: Test character responses across different platform contexts

### Technical Highlights

- **Session Management**: Smart session binding based on platform + userId + characterId
- **Message Normalization**: Unified message format across all platforms
- **Adapter Pattern**: Clean interface for implementing new platform adapters
- **Event-Driven**: Asynchronous message handling with WebSocket communication
- **Persistent Storage**: Sessions are saved to extension settings automatically

### Supported Platforms

| Platform | Status | Features |
|----------|--------|----------|
| Discord | ✅ Ready | Gateway API, Real-time messages |
| Telegram | ✅ Ready | Long polling, Rich formatting |
| WeChat | ✅ Ready | Webhook-based, Official Account API |
| Slack | 🔜 Coming Soon | - |
| WhatsApp | 🔜 Coming Soon | - |

### Contributing

We welcome contributions! To add a new platform:

1. Create a new adapter class extending `PlatformAdapter`
2. Implement required methods: `connect()`, `disconnect()`, `sendMessage()`
3. Register your adapter in the registry
4. Add UI configuration in the modal
5. Submit a pull request

See [MULTIPLATFORM_GUIDE.md#adding-custom-platforms](MULTIPLATFORM_GUIDE.md#adding-custom-platforms) for details.

### Requirements

- SillyTavern (latest version)
- Python 3.7+
- Node.js (for SillyTavern)
- Platform-specific bot credentials

### License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See [LICENSE](LICENSE) for details.

### Support

- **Issues**: [GitHub Issues](https://github.com/ldc861117/SillyTavern-Extension-ChatBridge/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ldc861117/SillyTavern-Extension-ChatBridge/discussions)
- **Documentation**: [Full Guide](MULTIPLATFORM_GUIDE.md)

---

## 中文

### 概述

**多平台聊天桥接器**是新一代 SillyTavern 扩展，可同时无缝集成多个聊天平台。用户可以通过 Discord、Telegram、WeChat 或其任意组合与他们喜爱的角色互动，对话在所有平台间保持连续。

### 🚀 v2.0 新功能

- ✨ **多平台支持**: 同时连接 Discord、Telegram 和 WeChat
- 🔄 **跨平台会话**: 在不同平台间无缝继续对话
- 🎨 **现代化 UI**: 精美的卡片式界面管理平台
- 🏗️ **模块化架构**: 易于扩展的适配器系统，可添加新平台
- 💾 **会话持久化**: 对话自动保存和恢复
- 🔐 **安全性**: 平台凭证安全存储在扩展设置中

### 主要特性

| 功能 | 说明 |
|------|------|
| **多平台支持** | 同时支持 Discord、Telegram 和 WeChat |
| **会话管理** | 跨平台绑定用户-角色交互 |
| **跨平台连续性** | 用户可以切换平台并继续对话 |
| **模块化设计** | 易于添加新的平台适配器 |
| **实时同步** | 通过 WebSocket 实时处理消息 |
| **自动清理** | 自动清理旧的非活动会话 |

### 架构

```
用户 (Discord/Telegram/WeChat)
        ↓
平台适配器 (JavaScript)
        ↓
会话管理器
        ↓
WebSocket 核心
        ↓
桥接服务器 (Python)
        ↓
LLM API
```

### 快速开始

1. **安装扩展**
   ```bash
   cd /path/to/SillyTavern/public/scripts/extensions/third-party/
   git clone https://github.com/ldc861117/SillyTavern-Extension-ChatBridge
   ```

2. **安装依赖**
   ```bash
   pip install aiohttp websockets
   ```

3. **配置设置**
   ```bash
   cp settings.json.template settings.json
   # 编辑 settings.json 填入你的 API 密钥
   ```

4. **启动桥接服务器**
   ```bash
   python ChatBridge_APIHijackForwarder.py
   ```

5. **连接平台**
   - 打开 SillyTavern
   - 进入 扩展 → Chat Bridge
   - 点击 "Add Platform" 配置你的机器人

### 平台设置指南

- **Discord**: [Discord 设置指南](MULTIPLATFORM_GUIDE.md#discord-bot-setup)
- **Telegram**: [Telegram 设置指南](MULTIPLATFORM_GUIDE.md#telegram-bot-setup)
- **WeChat**: [WeChat 设置指南](MULTIPLATFORM_GUIDE.md#wechat-bot-setup)

### 文档

- [完整设置指南](MULTIPLATFORM_GUIDE.md)
- [架构概述](MULTIPLATFORM_GUIDE.md#architecture)
- [故障排除](MULTIPLATFORM_GUIDE.md#troubleshooting)
- [高级用法](MULTIPLATFORM_GUIDE.md#advanced-usage)

### 使用场景

1. **个人助理机器人**: 在所有消息平台部署你的角色作为个人助理
2. **社区互动**: 让社区成员在他们偏好的平台上与你的角色互动
3. **多用户场景**: 不同用户可以与同一角色进行独立对话
4. **跨平台测试**: 在不同平台环境中测试角色响应

### 技术亮点

- **会话管理**: 基于平台 + 用户ID + 角色ID 的智能会话绑定
- **消息标准化**: 所有平台统一的消息格式
- **适配器模式**: 清晰的接口用于实现新的平台适配器
- **事件驱动**: 通过 WebSocket 通信的异步消息处理
- **持久化存储**: 会话自动保存到扩展设置

### 支持的平台

| 平台 | 状态 | 功能 |
|------|------|------|
| Discord | ✅ 就绪 | Gateway API, 实时消息 |
| Telegram | ✅ 就绪 | 长轮询, 富文本格式 |
| WeChat | ✅ 就绪 | Webhook 模式, 公众号 API |
| Slack | 🔜 即将推出 | - |
| WhatsApp | 🔜 即将推出 | - |

### 贡献

欢迎贡献！添加新平台的步骤：

1. 创建继承 `PlatformAdapter` 的新适配器类
2. 实现必需方法：`connect()`, `disconnect()`, `sendMessage()`
3. 在注册表中注册你的适配器
4. 在模态框中添加 UI 配置
5. 提交 Pull Request

详见 [MULTIPLATFORM_GUIDE.md#adding-custom-platforms](MULTIPLATFORM_GUIDE.md#adding-custom-platforms)。

### 系统要求

- SillyTavern (最新版本)
- Python 3.7+
- Node.js (用于 SillyTavern)
- 特定平台的机器人凭证

### 许可证

本项目采用 GNU Affero 通用公共许可证 v3.0 (AGPL-3.0)。详见 [LICENSE](LICENSE)。

### 支持

- **问题反馈**: [GitHub Issues](https://github.com/ldc861117/SillyTavern-Extension-ChatBridge/issues)
- **讨论区**: [GitHub Discussions](https://github.com/ldc861117/SillyTavern-Extension-ChatBridge/discussions)
- **文档**: [完整指南](MULTIPLATFORM_GUIDE.md)
