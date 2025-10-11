# Character & Session Management Guide

Learn how to use slash commands to manage characters and conversation sessions.

---

## Overview

ChatBridge allows you to:
- **Switch between characters** with `/char` command
- **Create multiple sessions** for different storylines
- **Resume conversations** from any session
- **Maintain separate preferences** per user

---

## Character Commands

### List All Characters

```
/char
```

**Output:**
```
📋 Available Characters:

✅ 1. Alice
      A helpful AI assistant who loves to help...
   2. Bob
      A friendly chatbot with a great sense...
   3. Charlie
      An expert programmer who can explain...

💡 How to use:
• Type: /char [character name]
• Example: /char Alice

📝 Tip: Character names are case-insensitive
```

**✅ Currently active character**
**Numbered list** for easy reference

---

### Switch to a Character

```
/char Alice
```

**First time switching:**
```
✅ Switched to character: Alice

Hi! I'm Alice. How can I help you today?
```

**Switching to same character again:**
```
✅ Already chatting with: Alice

💬 Current session: 15 messages
📝 Tip: Use /session new to start a fresh conversation
```

---

## Session Commands

### View Current Session

```
/session
```

**Output:**
```
📊 Current Session Info:

👤 Character: Alice
💬 Messages: 15
🕐 Last message: 2025-10-11 6:30 PM
🆔 Session ID: session_abc123...

💡 Type /session list to see all your sessions.
```

---

### List All Sessions

```
/session list
```

**Output:**
```
📋 Sessions with Alice:

✅ 1. Session abc123
      💬 15 messages | 🕐 2025-10-11 6:30 PM
   2. Session def456
      💬 8 messages | 🕐 2025-10-11 4:00 PM
   3. Session ghi789
      💬 3 messages | 🕐 2025-10-11 2:00 PM

💡 Type /session switch [number] to switch session.
```

**✅ Active session** is marked
**Sorted by most recent**

---

### Create New Session

```
/session new
```

**Output:**
```
✅ Created new session with Alice

Hi! I'm Alice. How can I help you today?
```

**What happens:**
- Previous session saved automatically
- New empty session created
- Character sends first message
- Ready for fresh conversation

**Use cases:**
- Start a new storyline
- Test different approaches
- Clean slate after long conversation

---

### Switch Between Sessions

```
/session switch 2
```

**Output:**
```
✅ Switched to session 2

💬 8 messages in history
```

**What happens:**
- Current session saved
- Loads selected session's history
- Continues where you left off

---

## Help Command

```
/help
```

**Output:**
```
📖 ChatBridge Command Reference

**Character Management:**
• /char - List all available characters
• /char [name] - Switch to a character
• Example: /char Alice

**Session Management:**
• /session - Show current session info
• /session list - List all your sessions
• /session new - Create a new session
• /session switch [n] - Switch to session #n

**Other:**
• /help - Show this help message

💡 Tip: Messages are automatically saved to your active session!
```

---

## Usage Scenarios

### Scenario 1: Exploring Characters

```
You: /char
Bot: (shows all characters)

You: /char Alice
Alice: Hi! I'm Alice...

You: Tell me about yourself
Alice: (Alice's response)

You: /char Bob
Bob: Hey! I'm Bob...

You: Tell me about yourself
Bob: (Bob's response, different from Alice)
```

---

### Scenario 2: Multiple Storylines

```
# Storyline 1: Adventure
You: /char Alice
Alice: Hi! Ready for adventure?
You: Let's explore the forest!
Alice: (adventure begins...)

# Start new storyline
You: /session new
Alice: Hi! How can I help you today?
You: Let's study programming
Alice: (educational conversation...)

# Return to adventure
You: /session list
Bot: (shows 2 sessions)
You: /session switch 1
Alice: (continues adventure where you left off)
```

---

### Scenario 3: Testing Character Settings

```
# Test current settings
You: /char Charlie
Charlie: (greeting with current settings)
You: How do you code?
Charlie: (response A)

# Try new approach
You: /session new
Charlie: (fresh greeting)
You: How do you code?
Charlie: (can compare responses)
```

---

### Scenario 4: Multi-Platform Continuity

```
# On Telegram
Telegram: /char Alice
Alice: Hi! I'm Alice...
Telegram: Tell me a story
Alice: Once upon a time...

# Later, on Discord (when available)
Discord: /session list
Bot: Shows your Telegram session with Alice
Discord: /session switch 1
Discord: Continue the story!
Alice: (remembers context, continues story)
```

---

## Tips & Best Practices

### Character Selection

✅ **DO:**
- Use `/char` first to see all options
- Try different characters for variety
- Read descriptions to find the right fit

❌ **DON'T:**
- Switch characters mid-conversation (unless intentional)
- Forget which character you're talking to

---

### Session Management

✅ **DO:**
- Create new sessions for new topics
- Use `/session list` to find old conversations
- Name your storylines mentally for easy recall

❌ **DON'T:**
- Create too many sessions (use switch instead)
- Forget to save important conversations (auto-saved!)

---

### Command Syntax

✅ **DO:**
- Use exact command names
- Character names are case-insensitive
- Use numbers for session switching

❌ **DON'T:**
- Add extra punctuation: `/char!` ❌
- Misspell commands: `/cahara` ❌
- Use wrong format: `/char select Alice` ❌

---

## Troubleshooting

### "Character not found"

**Problem**: Name doesn't match exactly

**Solution**:
```
# Wrong
You: /char alice smith

# Right
You: /char Alice Smith
# OR
You: /char alice smith  (case-insensitive)
```

**Tip**: Use `/char` to see exact names

---

### "No active session"

**Problem**: Haven't selected a character yet

**Solution**:
```
You: /char Alice  # Select character first
Alice: Hi!
You: /session     # Now this works
```

---

### Session shows 0 messages

**Problem**: Just created new session

**Solution**:
- This is normal for new sessions
- Send your first message to start

---

### Can't find old session

**Problem**: Sessions auto-cleaned after inactivity

**Solution**:
- Sessions older than 7 days may be archived
- Create new session: `/session new`

---

## Advanced Features

### Per-User Preferences

Each platform user has independent settings:

- **Telegram User A** → Prefers Alice
- **Discord User A** (same person) → Prefers Bob
- Both maintained separately

### Auto-Character Selection

If you send a message without selecting a character:
- System auto-selects first available character
- You can then switch with `/char [name]`

### Session Persistence

All sessions are saved automatically:
- Survives browser refreshes
- Survives SillyTavern restarts
- Survives forwarder restarts

---

## Next Steps

- **[Platform Setup](PLATFORM_SETUP.md)** - Add more platforms
- **[Quick Start](QUICK_START.md)** - Installation guide
- **[Main README](../README.md)** - Project overview
