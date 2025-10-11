# Quick Start Guide

Get ChatBridge running in 5 minutes!

## Prerequisites

- **SillyTavern**: Version 1.10.0+
- **Python**: 3.7+ OR **Conda/Miniconda** (recommended)

---

## Step 1: Install the Extension

```bash
cd [SillyTavern]/public/scripts/extensions/third-party/
git clone https://github.com/ldc861117/SillyTavern-Extension-ChatBridge.git
```

---

## Step 2: Set Up Python Environment

### Option A: Use Conda (Recommended)

```bash
# Install Conda if you don't have it
brew install miniconda  # macOS
# Or download from: https://docs.conda.io/en/latest/miniconda.html

# The startup script will automatically create the environment!
```

### Option B: Use System Python

If you prefer not to use Conda, ensure you have Python 3.7+ installed:
```bash
python3 --version
```

---

## Step 3: Start the Forwarder

```bash
cd SillyTavern-Extension-ChatBridge
./start_forwarder.sh     # macOS/Linux
# OR
start_forwarder.bat      # Windows
```

**First-time output** (with Conda):
```
🐍 检测到 Conda 环境
📦 创建新的 Conda 环境: chatbridge
✓ Conda 环境创建成功
✓ aiohttp
✓ requests
✓ websockets
✅ 环境检查完成，正在启动 Forwarder...
```

Leave this terminal open - the forwarder must run continuously.

---

## Step 4: Enable Extension in SillyTavern

1. Open SillyTavern in your browser
2. Go to **Extensions** → **Extension Settings**
3. Find "**Multi-Platform Chat Bridge**"
4. Click to enable it

You should see the extension panel appear.

---

## Step 5: Connect Your First Platform

### Using Telegram (Easiest)

1. **Get a Bot Token**:
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Send `/newbot`
   - Follow prompts to create your bot
   - Copy the token (looks like: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

2. **Connect in ChatBridge**:
   - In the extension panel, click **"Add Platform"**
   - Select **"Telegram"**
   - Paste your bot token
   - Click **"Connect"**

3. **Test It!**:
   - Send a message to your bot on Telegram
   - It should respond with a character reply!

---

## What's Next?

### Basic Usage

```
You: /char              # List available characters
Bot: Shows all characters

You: /char Alice        # Switch to Alice
Bot: ✅ Switched to character: Alice
     (Alice's greeting)

You: Hello!             # Chat normally
Alice: Hi! How can I help you?
```

### Advanced Features

- **Multiple Sessions**: `/session new` to start a fresh conversation
- **Session Management**: `/session list` to see all your chats
- **Help**: `/help` for all commands

---

## Troubleshooting

### Forwarder Won't Start

**Python environment error?**
```bash
# Install Conda and try again
brew install miniconda
./start_forwarder.sh
```

See [CONDA_SETUP.md](../CONDA_SETUP.md) for detailed troubleshooting.

### Extension Not Loading

1. **Check browser console**: Press F12 → Console tab
2. **Look for errors** in red
3. **Hard refresh**: Ctrl+Shift+R (Win) / Cmd+Shift+R (Mac)

### Platform Connection Failed

1. **Verify token**: Make sure you copied it correctly
2. **Check network**: Ensure you can reach Telegram servers
3. **Review logs**: Check the debug log in the extension panel

---

## Need Help?

- **Documentation**: [docs/PLATFORM_SETUP.md](PLATFORM_SETUP.md)
- **Issues**: [GitHub Issues](https://github.com/ldc861117/SillyTavern-Extension-ChatBridge/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ldc861117/SillyTavern-Extension-ChatBridge/discussions)

---

🎉 **Congratulations!** You're now ready to chat with your characters from anywhere!
