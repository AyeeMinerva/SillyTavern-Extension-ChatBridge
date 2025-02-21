# SillyTavern ChatBridge 插件

## 简介 (Introduction)

本插件提供了一个基于 SillyTavern UI Extension 和 WebSocket 的双向通信桥接解决方案，使外部应用程序能够与 SillyTavern 进行实时交互。它包含一个完整的 SillyTavern UI 扩展插件和配套的 Python 示例实现。

由于 SillyTavern 现有的 UI 扩展和服务器插件架构限制（详见 <https://github.com/SillyTavern/SillyTavern/discussions/3518> ），难以直接将其核心功能暴露为标准 API。本项目通过创新性地采用反向 WebSocket 通信模式，实现了一种优雅的解决方案：以 UI 扩展作为 WebSocket 客户端，外部服务（如 Python）作为服务器，从而实现对 SillyTavern 内部事件和接口的完整访问能力。

This plugin provides a WebSocket-based bidirectional communication bridge solution as a SillyTavern UI Extension, enabling external applications to interact with SillyTavern in real-time. It includes a complete SillyTavern UI extension plugin and accompanying Python implementation example.

Due to architectural limitations in SillyTavern's existing UI extensions and server plugins (see <https://github.com/SillyTavern/SillyTavern/discussions/3518> ), directly exposing core functionalities as standard APIs is challenging. This project innovatively adopts a reverse WebSocket communication pattern: utilizing the UI extension as a WebSocket client and external services (like Python) as the server, achieving complete access to SillyTavern's internal events and interfaces.

本项目为将 SillyTavern 作为中间层服务提供了全新思路，开发者可以构建独立的前端应用，同时完整复用 SillyTavern 的对话管理、角色系统等核心功能，实现更灵活的定制化应用场景。

This project presents a novel approach to utilizing SillyTavern as a middleware service, allowing developers to build independent front-end applications while fully leveraging SillyTavern's core features such as conversation management and character systems, enabling more flexible customized application scenarios.

## 主要功能 (Main Features)

1. **实时双向通信 (Real-time Bidirectional Communication):**
    * 通过 WebSocket 实现与外部服务的实时双向通信
    * Support multiple client connections simultaneously 
    * 自动重连机制
    * Automatic reconnection mechanism

2. **事件监听与触发 (Event Listening and Triggering):**
    * 监听 SillyTavern 的所有关键事件（如消息发送、接收、编辑等）
    * Monitor all key events in SillyTavern (e.g., message sending, receiving, editing)
    * 支持实时获取消息生成状态
    * Support real-time message generation status updates
    * 可以远程触发 SillyTavern 的内部功能
    * Ability to remotely trigger SillyTavern's internal functions

3. **聊天记录同步 (Chat History Synchronization):**
    * 实时同步完整的对话历史
    * Real-time synchronization of complete conversation history
    * 支持流式传输AI回复内容
    * Support streaming AI response content
    * 保持多端聊天记录一致性
    * Maintain chat history consistency across multiple endpoints

4. **远程控制功能 (Remote Control Features):**
    * 支持远程发送消息
    * Support remote message sending
    * 支持获取当前对话上下文
    * Access current conversation context
    * 可以触发等效的聊天按钮功能
    * Trigger equivalent chat button functions

## 使用方法 (Usage)

1. **安装 (Installation):**
    * 将插件代码复制到 SillyTavern 的 `public/scripts/extensions/third-party/ChatBridge` 目录下
    * Copy the plugin code to the SillyTavern `public/scripts/extensions/third-party/ChatBridge` directory
    * 确保文件结构完整 (Ensure complete file structure)：
        - index.js (插件主文件 / Main plugin file)
        - index.html (设置界面 / Settings interface)
        - ChatBridgePythonUI.py (Python示例实现 / Python example implementation)
        - manifest.json (插件配置文件 / Plugin configuration file)
        - style.css (样式表 / Stylesheet)

2. **配置插件 (Configure Plugin):**
    * 在 SillyTavern 的扩展设置中找到 ChatBridge 插件
    * Find ChatBridge plugin in SillyTavern's extension settings
    * 设置 WebSocket 服务器地址（默认为 localhost）
    * Set WebSocket server address (default is localhost)
    * 设置端口号（默认为 8001）
    * Set port number (default is 8001)

3. **启动服务器 (Start Server):**
    * 运行提供的 Python 示例程序 (Run the provided Python example program)：
    ```bash
    python ChatBridgePythonUI.py
    ```
    * 示例程序提供了一个带GUI的测试客户端，包含 (The example program provides a GUI test client that includes)：
        - 服务器控制面板 (Server control panel)
        - 消息发送界面 (Message sending interface)
        - 聊天记录实时显示 (Real-time chat history display)
        - 详细的日志输出 (Detailed log output)

4. **建立连接 (Establish Connection):**
    * 在插件设置界面点击"连接"按钮
    * Click the "Connect" button in the plugin settings interface
    * 确认连接状态指示器变为绿色
    * Confirm that the connection status indicator turns green
    * 查看调试日志确认连接成功
    * Check debug logs to confirm successful connection

5. **开发集成 (Development Integration):**
    * 若需要更多UI元素访问，请自行修改index.js并监听新事件
    * To access more UI elements, modify index.js and listen for new events
    * 参考 Python 示例代码开发自己的客户端
    * Refer to the Python example code to develop your own client
    * WebSocket 消息格式 (Message format)：
    ```javascript
    {
        type: "message_type",  // 消息类型 (Message type)
        content: data          // 消息内容 (Message content)
    }
    ```
    * 支持的消息类型 (Supported message types)：
        - chat_history: 聊天历史 (Chat history)
        - stream_update: 流式更新 (Stream update)
        - send_message: 发送消息 (Send message)

## 注意事项 (Notes)

* 确保 WebSocket 服务器和客户端的端口配置一致
* Ensure WebSocket server and client port configurations match
* 建议在本地开发环境中测试连接
* Recommend testing connections in local development environment
* 如果遇到连接问题，请检查防火墙设置
* Check firewall settings if connection issues occur
* 使用流式传输功能时，注意处理断线重连情况
* Handle disconnection and reconnection scenarios when using streaming features

## 错误排查 (Troubleshooting)

* 如果无法连接，请检查 (If unable to connect, check)：
    1. 服务器是否正常运行 (Server running status)
    2. 端口是否被占用 (Port availability)
    3. 防火墙是否允许连接 (Firewall permissions)
* 如果消息发送失败，请检查 (If message sending fails, check)：
    1. WebSocket 连接状态 (WebSocket connection status)
    2. 消息格式是否正确 (Message format correctness)
    3. SillyTavern 是否处于可接收消息的状态 (SillyTavern's message receiving status)

## 许可证 (License)

本插件使用 AGPL 许可证。

This plugin is licensed under the AGPL License.
