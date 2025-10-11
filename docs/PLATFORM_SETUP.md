# Platform Setup Guide

Detailed configuration for each supported platform.

---

## Telegram Bot Setup

### Step 1: Create Bot with BotFather

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Follow the prompts:
   ```
   BotFather: Alright, a new bot. How are we going to call it? 
              Please choose a name for your bot.
   
   You: My ST Character Bot
   
   BotFather: Good. Now let's choose a username for your bot. 
              It must end in `bot`.
   
   You: my_st_character_bot
   
   BotFather: Done! Congratulations on your new bot. 
              You will find it at t.me/my_st_character_bot
              
              Use this token to access the HTTP API:
              123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

4. **Copy the token** (keep it secret!)

### Step 2: Connect in ChatBridge

1. In SillyTavern, open the ChatBridge extension panel
2. Click **"Add Platform"**
3. Select **"Telegram"**
4. Paste your bot token
5. Click **"Connect"**

### Step 3: Test Connection

Send a message to your bot:
```
You: /char
Bot: 📋 Available Characters:
     ✅ 1. Alice
        ...
```

### Optional: Customize Your Bot

With BotFather, you can:
- `/setdescription` - Set bot description
- `/setabouttext` - Set "About" text
- `/setuserpic` - Upload bot avatar
- `/setcommands` - Set command menu

**Suggested commands:**
```
char - Switch between characters
session - Manage conversation sessions
help - Show available commands
```

---

## Discord Bot Setup (Coming Soon)

Discord integration is planned for a future release.

**Planned Features:**
- Discord bot with slash commands
- Server-wide or DM conversations
- Role-based character access

---

## WeChat Integration (Coming Soon)

WeChat support is in development.

**Planned Options:**
- **Personal Account**: Use your own WeChat
- **Enterprise Account**: WeChat Work integration

---

## Multi-Platform Usage

### Cross-Platform Sessions

You can switch between platforms and continue the same conversation:

1. **Start on Telegram**:
   ```
   Telegram: /char Alice
   Alice: Hi! I'm Alice...
   
   Telegram: Tell me about yourself
   Alice: Well, I'm an AI assistant...
   ```

2. **Continue on Discord** (when available):
   ```
   Discord: /session list
   Bot: Shows your Telegram session
   
   Discord: /session switch 1
   Bot: Switched to session with Alice
   
   Discord: What were we talking about?
   Alice: We were discussing... (remembers context)
   ```

### Per-Platform Character Selection

Each platform can have different character preferences:

- **Telegram User A** → Talks to Alice
- **Discord User A** (same person) → Talks to Bob
- **WeChat User A** (same person) → Talks to Charlie

All maintained separately with independent sessions.

---

## Platform-Specific Features

### Telegram
- ✅ Long polling (no webhook needed)
- ✅ Slash commands
- ✅ Plain text messages
- ✅ Auto-reconnect

### Discord (Planned)
- 🔄 Slash commands
- 🔄 Embed-rich messages
- 🔄 Server channels and DMs
- 🔄 Role permissions

### WeChat (Planned)
- 🔄 Text messages
- 🔄 Personal and Work accounts
- 🔄 Group chat support

---

## Troubleshooting

### Telegram: "Unauthorized" Error

**Problem**: Bot token is invalid or revoked

**Solution**:
1. Check token is copied correctly (no extra spaces)
2. Verify bot still exists with @BotFather
3. Regenerate token if needed: `/token` to BotFather

### Platform Won't Connect

**Problem**: Network or firewall blocking connection

**Solution**:
1. Check firewall settings
2. Verify internet connection
3. Try connecting to the platform directly (e.g., telegram.org)
4. Review debug logs in extension panel

### Messages Not Reaching SillyTavern

**Problem**: Forwarder not running or disconnected

**Solution**:
1. Check forwarder terminal - should show activity
2. Restart forwarder: `./start_forwarder.sh`
3. Verify WebSocket connection in extension (should show "Connected")

---

## Best Practices

### Security

- **Never share bot tokens publicly**
- Keep tokens in a secure location
- Regenerate tokens if compromised
- Use different bots for testing vs production

### Performance

- Keep forwarder running continuously
- Use Conda environment for stability
- Monitor debug logs for issues

### Organization

- Name bots descriptively (e.g., "Alice_Bot", "Bob_Bot")
- Use different bots for different character groups
- Document your setup for easy recovery

---

## Next Steps

- **[Character Management](CHARACTER_MANAGEMENT.md)** - Learn slash commands
- **[Back to Quick Start](QUICK_START.md)** - Installation guide
- **[Main README](../README.md)** - Project overview
