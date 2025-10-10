# Multi-Platform Chat Bridge - Setup Guide

## Overview

The Multi-Platform Chat Bridge extension enables SillyTavern to connect with multiple chat platforms simultaneously (Discord, Telegram, WeChat). Users can interact with the same character across different platforms, and their conversation sessions are maintained seamlessly.

## Key Features

✅ **Multi-Platform Support**: Connect Discord, Telegram, and WeChat simultaneously  
✅ **Session Management**: Maintain continuous conversations across platforms  
✅ **Modular Architecture**: Easy to extend with new platforms  
✅ **User-Friendly UI**: Manage all platforms from a single interface  
✅ **Session Persistence**: Conversations are saved and restored automatically  

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       SillyTavern Extension                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Discord    │  │   Telegram   │  │    WeChat    │          │
│  │   Adapter    │  │   Adapter    │  │   Adapter    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
│                            │                                     │
│                   ┌────────▼─────────┐                           │
│                   │ Session Manager  │                           │
│                   └────────┬─────────┘                           │
│                            │                                     │
│                   ┌────────▼─────────┐                           │
│                   │  WebSocket Core  │                           │
│                   └────────┬─────────┘                           │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Bridge Server   │
                    │ (Python Backend) │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   LLM Services   │
                    └──────────────────┘
```

## Installation

### 1. Install the Extension

Copy the extension files to your SillyTavern extensions directory:

```bash
cd /path/to/SillyTavern/public/scripts/extensions/third-party/
git clone <your-repo> SillyTavern-Extension-ChatBridge
```

### 2. Install Python Dependencies

```bash
cd SillyTavern-Extension-ChatBridge
pip install aiohttp websockets
```

### 3. Configure Settings

Copy the settings template and configure your API keys:

```bash
cp settings.json.template settings.json
```

Edit `settings.json` with your LLM API configuration:

```json
{
    "websocket": {
        "host": "localhost",
        "port": 8001
    },
    "llm_api": {
        "base_url": "https://api.openai.com/v1",
        "api_keys": [
            "sk-your-api-key-here"
        ]
    },
    "st_api": {
        "host": "localhost",
        "port": 8002,
        "api_key": "st-internal-key"
    },
    "user_api": {
        "host": "localhost",
        "port": 8003,
        "api_key": "user-api-key"
    }
}
```

### 4. Start the Bridge Server

```bash
python ChatBridge_APIHijackForwarder.py
```

You should see:
```
INFO:__main__:WebSocket server running at ws://localhost:8001
INFO:__main__:ST API server running at http://localhost:8002
INFO:__main__:User API server running at http://localhost:8003
```

### 5. Enable the Extension in SillyTavern

1. Open SillyTavern
2. Go to **Extensions** → **Extension Settings**
3. Find "Multi-Platform Chat Bridge"
4. Click **Connect** to establish the WebSocket connection

## Platform Setup

### Discord Bot Setup

1. **Create Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application"
   - Give it a name (e.g., "SillyTavern Bot")

2. **Create Bot**
   - Go to the "Bot" tab
   - Click "Add Bot"
   - Under "Privileged Gateway Intents", enable:
     - Message Content Intent
     - Server Members Intent
     - Presence Intent

3. **Get Bot Token**
   - Click "Reset Token" and copy the token
   - **Keep this token secret!**

4. **Invite Bot to Server**
   - Go to "OAuth2" → "URL Generator"
   - Select scopes: `bot`
   - Select permissions: `Send Messages`, `Read Message History`
   - Copy the generated URL and open it to invite the bot

5. **Connect in Extension**
   - In SillyTavern extension, click "Add Platform"
   - Select "Discord"
   - Paste your bot token
   - Click "Connect"

### Telegram Bot Setup

1. **Create Bot with BotFather**
   - Open Telegram and search for [@BotFather](https://t.me/BotFather)
   - Send `/newbot` command
   - Follow the prompts to name your bot
   - Copy the bot token provided

2. **Configure Bot Settings** (Optional)
   - Set bot description: `/setdescription`
   - Set bot about text: `/setabouttext`
   - Set bot profile picture: `/setuserpic`

3. **Connect in Extension**
   - In SillyTavern extension, click "Add Platform"
   - Select "Telegram"
   - Paste your bot token
   - Click "Connect"

4. **Start Chatting**
   - Find your bot in Telegram
   - Send `/start` to begin
   - Start chatting with your character!

### WeChat Bot Setup

**Note**: WeChat bot setup is more complex and requires a verified WeChat Official Account.

1. **Create WeChat Official Account**
   - Go to [WeChat Official Account Platform](https://mp.weixin.qq.com/)
   - Register an account (requires Chinese business license)

2. **Get Credentials**
   - In your account dashboard, go to **Development** → **Basic Configuration**
   - Note your AppID, AppSecret, and Token

3. **Set Up Webhook Server**
   - WeChat requires a publicly accessible webhook URL
   - Configure your server to handle WeChat webhook verification
   - Use the `verifyWebhookSignature` method in WeChatAdapter

4. **Connect in Extension**
   - In SillyTavern extension, click "Add Platform"
   - Select "WeChat"
   - Enter AppID, AppSecret, and Token
   - Click "Connect"

## Usage

### Starting a Conversation

1. **From Discord**:
   - Send a message to your bot in any channel it has access to
   - The bot will respond with your character's personality

2. **From Telegram**:
   - Send a message to your bot
   - Responses will come from your configured character

3. **Cross-Platform Continuity**:
   - Start a conversation on Discord
   - Switch to Telegram with the same user
   - Your conversation continues seamlessly!

### Managing Sessions

The extension UI shows all active sessions:

- **Platform**: Which platform the user is on
- **Character**: Which character they're talking to
- **User ID**: Platform-specific user identifier
- **Message Count**: Number of messages in the session

Sessions are automatically cleaned up after 24 hours of inactivity.

### Monitoring

The Debug Log section shows:
- Connection status
- Incoming messages
- Platform events
- Errors and warnings

## Configuration Options

### Extension Settings

- **Server Address**: WebSocket server hostname (default: localhost)
- **Port**: WebSocket server port (default: 8001)
- **Auto-reconnect**: Automatically reconnect if connection is lost

### Platform-Specific Settings

Each platform adapter has its own configuration:

**Discord**:
- `botToken`: Your Discord bot token

**Telegram**:
- `botToken`: Your Telegram bot token

**WeChat**:
- `appId`: WeChat App ID
- `appSecret`: WeChat App Secret
- `token`: WeChat verification token

## Troubleshooting

### WebSocket Won't Connect

1. Check that the Python bridge server is running
2. Verify the correct port is configured
3. Check firewall settings
4. Look for errors in the debug log

### Platform Not Connecting

**Discord**:
- Verify bot token is correct
- Check bot permissions in server
- Ensure Message Content Intent is enabled

**Telegram**:
- Verify bot token is correct
- Check if bot is blocked
- Test bot with @BotFather

**WeChat**:
- Verify AppID and AppSecret
- Check webhook URL is accessible
- Ensure Official Account is verified

### Messages Not Sending

1. Check WebSocket connection status
2. Verify LLM API configuration in `settings.json`
3. Check API key limits/quotas
4. Look for errors in bridge server logs
5. Verify character is selected in SillyTavern

### Session Not Persisting

1. Check browser console for errors
2. Verify extension settings are being saved
3. Clear browser cache and restart
4. Check file permissions on settings file

## Advanced Usage

### Adding Custom Platforms

The architecture is designed for extensibility. To add a new platform:

1. **Create Adapter Class**:
   ```javascript
   import { PlatformAdapter } from '../core/PlatformAdapter.js';
   
   export class MyPlatformAdapter extends PlatformAdapter {
       // Implement required methods
       async connect() { /* ... */ }
       async disconnect() { /* ... */ }
       async sendMessage(userId, message) { /* ... */ }
       validateConfig() { /* ... */ }
   }
   ```

2. **Register Adapter**:
   ```javascript
   adapterRegistry.registerAdapterClass('myplatform', MyPlatformAdapter);
   ```

3. **Add UI Configuration**:
   - Add platform option to modal
   - Add configuration form
   - Handle connection logic

### Session Management API

Access session data programmatically:

```javascript
// Get all active sessions
const sessions = sessionManager.getActiveSessions();

// Get specific session
const session = sessionManager.getSession(sessionId);

// Add message to session
sessionManager.addMessage(sessionId, {
    role: 'user',
    content: 'Hello!'
});

// Clean up old sessions
sessionManager.cleanupInactiveSessions();
```

## Security Considerations

⚠️ **Important Security Notes**:

1. **Never commit tokens to version control**
2. **Keep settings.json private**
3. **Use environment variables for production**
4. **Regularly rotate API keys**
5. **Monitor for unauthorized access**
6. **Use HTTPS for production webhooks**

## Performance Tips

- **Rate Limiting**: Configure rate limits for each platform
- **Session Cleanup**: Adjust cleanup interval based on usage
- **Message History**: Limit message history length for performance
- **Connection Pooling**: Use connection pooling for high-traffic scenarios

## Support & Contribution

For issues, questions, or contributions:
- GitHub Issues: [Your Repo URL]
- Discord: [Your Server]
- Documentation: [Your Docs URL]

## License

This project is licensed under AGPL-3.0.
