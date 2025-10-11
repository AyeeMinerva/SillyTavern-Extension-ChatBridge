# Character & Session Management Implementation Guide

## 📋 Overview

This document describes the implementation of character selection and multi-session support for ChatBridge, enabling users to:
- Choose which SillyTavern character they want to talk to
- Manage multiple conversation sessions with the same character
- Continue conversations across different platforms
- Use intuitive slash commands for control

---

## 🎯 User Requirements

### Original Problem
- All platform messages default to system/default character
- Users cannot choose which character to interact with
- No way to manage multiple conversations with same character
- Sessions don't persist meaningfully

### Solution
```
/char              → List available characters
/char Alice        → Switch to Alice
/session           → Show current session info  
/session list      → List all sessions with current character
/session new       → Start fresh conversation
/session switch 2  → Switch to session #2
```

---

## 🏗️ Architecture

### Component Hierarchy

```
index-multiplatform.js (Main Extension)
    ├── CharacterManager
    │   ├── Fetch characters from SillyTavern
    │   ├── Store user character preferences
    │   └── Auto-select logic
    │
    ├── SessionManager (Enhanced)
    │   ├── Multi-session support
    │   ├── Session switching
    │   └── Character-aware sessions
    │
    ├── CommandParser
    │   ├── Parse slash commands
    │   ├── Execute command handlers
    │   └── Return formatted responses
    │
    └── Platform Adapters
        ├── Intercept commands before processing
        ├── Send command responses directly
        └── Pass non-commands to normal flow
```

---

## 🔄 Message Flow

### Normal Message (No Command)

```
1. Telegram: "Hello!"
   ↓
2. Platform Adapter receives message
   ↓  
3. CommandParser.isCommand() → false
   ↓
4. Get/Auto-select character for user
   ↓
5. Get/Create session (platform + userId + characterId)
   ↓
6. Add message to session history
   ↓
7. Update ST chat with session history
   ↓
8. Trigger AI response
   ↓
9. Send response back to Telegram
```

### Command Message

```
1. Telegram: "/char Alice"
   ↓
2. Platform Adapter receives message
   ↓
3. CommandParser.isCommand() → true
   ↓
4. CommandParser.parseCommand()
   ├── command: "char"
   ├── args: ["Alice"]
   └── context: { platform: "telegram", userId: "123" }
   ↓
5. Execute handleCharCommand()
   ├── Find character "Alice"
   ├── Set user preference
   ├── Get/Create session
   └── Return response
   ↓
6. Send command response to Telegram
   "✅ Switched to character: Alice
    You can now chat with Alice!"
   ↓
7. STOP (don't trigger AI response)
```

---

## 📦 Data Models

### Character

```javascript
{
  id: "char_alice_001",           // Unique ID (avatar or name)
  name: "Alice",                  // Display name
  avatar: "alice.png",            // Avatar filename
  description: "A helpful AI...", // Short description
  personality: "...",             // Full personality
  scenario: "...",                // Scenario/context
  firstMessage: "Hello!"          // First message
}
```

### User Preference

```javascript
// Map index: "telegram_855870885"
// Map value: "char_alice_001"

userPreferences = Map {
  "telegram_855870885" => "char_alice_001",
  "discord_123456789"  => "char_bob_002"
}
```

### Session (Enhanced)

```javascript
{
  id: "session_1234_abc",
  platform: "telegram",
  userId: "855870885",
  characterId: "char_alice_001",  // ← NEW FIELD ADDITION
  messageHistory: [
    { role: "user", content: "Hi", timestamp: 1234 },
    { role: "assistant", content: "Hello!", timestamp: 1235 }
  ],
  metadata: {},
  createdAt: 1730000000,
  lastActivity: 1730001000
}
```

### Session Index

```javascript
// Map index: "telegram:855870885:char_alice_001"
// Map value: "session_1234_abc"

sessionIndex = Map {
  "telegram:855870885:char_alice_001" => "session_1234_abc",
  "telegram:855870885:char_bob_002"   => "session_5678_def"
}
```

---

## 🔧 Implementation Steps

### Step 1: ✅ Core Components (DONE)
- [x] Create CommandParser.js
- [x] Create CharacterManager.js
- [x] Enhance SessionManager.js

### Step 2: 🔄 Integration (IN PROGRESS)
- [ ] Import new modules into index-multiplatform.js
- [ ] Initialize CharacterManager and CommandParser
- [ ] Update handlePlatformMessage() to check commands
- [ ] Modify session creation to use selected character
- [ ] Save/load user preferences

### Step 3: Platform Adapters
- [ ] Update message handlers to pass commands to parser
- [ ] Implement command response sending
- [ ] Update TelegramAdapter
- [ ] Update DiscordAdapter (when implemented)

### Step 4: UI Updates
- [ ] Show current character in session list
- [ ] Add character info to debug log
- [ ] Display available slash commands in UI

### Step 5: Testing
- [ ] Test character listing
- [ ] Test character switching
- [ ] Test session creation/switching
- [ ] Test cross-platform session continuity
- [ ] Test command error handling

---

## 💻 Code Integration Examples

### In index-multiplatform.js

```javascript
// Imports
import { CharacterManager } from "./src/core/CharacterManager.js";
import { CommandParser } from "./src/core/CommandParser.js";

// Initialization
let characterManager;
let commandParser;

jQuery(async () => {
    characterManager = new CharacterManager();
    sessionManager = new SessionManager();
    commandParser = new CommandParser(characterManager, sessionManager);
    
    // Load preferences
    const prefs = extension_settings[extensionName].userCharacterPreferences || {};
    characterManager.loadPreferences(prefs);
    
    // ... rest of initialization
});

// In handlePlatformMessage()
async function handlePlatformMessage(data) {
    const { platformId, platform, userId, content, metadata } = data;
    
    // Check if message is a command
    const commandResult = await commandParser.parseCommand(content, {
        platform,
        userId
    });
    
    if (commandResult.isCommand) {
        // Send command response back to platform
        const adapter = currentPlatforms.get(platformId);
        if (adapter) {
            await adapter.sendMessage(userId, commandResult.response);
        }
        
        // If command changed character/session, update state
        if (commandResult.characterId || commandResult.sessionId) {
            // Handle character/session change
            updateDebugLog(`User ${userId} switched to character/session`);
        }
        
        return; // Don't process as normal message
    }
    
    // Normal message processing
    // Get or auto-select character for this user
    const character = await characterManager.getOrAutoSelectCharacter(platform, userId);
    
    if (!character) {
        // No characters available
        const adapter = currentPlatforms.get(platformId);
        await adapter.sendMessage(userId, 
            "❌ No characters available. Please create characters in SillyTavern first.");
        return;
    }
    
    // Get or create session with this character
    const sessionId = sessionManager.getOrCreateSession(
        platform,
        userId,
        character.id
    );
    
    // ... continue with normal message processing
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: First-time User
```
1. User sends message from Telegram
2. No character preference exists
3. System auto-selects first available character (or current ST character)
4. Creates session with that character
5. User receives response from that character
6. User can use /char to see options and switch
```

### Scenario 2: Character Switching
```
1. User: "/char"
   Response: List of characters (Alice ✅, Bob, Charlie)

2. User: "/char Bob"
   Response: "✅ Switched to character: Bob"

3. User: "Hi Bob!"
   Response: Bob's response (new session created automatically)
```

### Scenario 3: Multi-Session Management
```
1. User talking to Alice (session 1, 50 messages)

2. User: "/session new"
   Response: "✅ Created new session with Alice"

3. User: "Hi Alice, let's start fresh!"
   Response: Alice responds (new session 2, clean history)

4. User: "/session list"
   Response:
   "✅ 1. Session ...123 (active)
       💬 1 messages | 🕐 Just now
    2. Session ...456
       💬 50 messages | 🕐 2 hours ago"

5. User: "/session switch 2"
   Response: "✅ Switched to session 2"
   (Back to 50-message history)
```

### Scenario 4: Cross-Platform Continuity
```
1. Telegram user 855870885 talks to Alice (session A)
2. Same user logs into Discord
3. Needs manual account linking (future feature)
4. For now: Each platform has separate sessions
```

---

## 📊 State Management

### Extension Settings Structure

```javascript
extension_settings['SillyTavern-Extension-ChatBridge'] = {
    wsPort: 8001,
    wsUrl: "localhost",
    autoConnect: false,
    platforms: [...],
    sessions: {...},              // Existing
    userCharacterPreferences: {   // NEW
        "telegram_855870885": "char_alice_001",
        "discord_123456": "char_bob_002"
    }
}
```

### Saving Preferences

```javascript
// After character selection
characterManager.setUserCharacterPreference(platform, userId, characterId);

// In CharacterManager.savePreferences()
extension_settings[extensionName].userCharacterPreferences = 
    characterManager.exportPreferences();
saveSettingsDebounced();
```

---

## 🐛 Error Handling

### Character Not Found
```
User: "/char NonExistent"
Response: "❌ Character 'NonExistent' not found.
           Type /char to see available characters."
```

### No Characters Available
```
User: "Hello"
Response: "❌ No characters available. Please create characters 
           in SillyTavern first."
```

### Invalid Command
```
User: "/unknown"
Response: "❌ Unknown command: /unknown
           Type /help to see available commands."
```

### Session Not Found
```
User: "/session switch 99"
Response: "❌ Session 99 not found.
           Type /session list to see available sessions."
```

---

## 🚀 Future Enhancements

### Phase 2
- [ ] Cross-platform account linking
- [ ] Character-specific command shortcuts
- [ ] Session export/import
- [ ] Character recommendations based on conversation

### Phase 3
- [ ] Group chat support (multiple users, one character)
- [ ] Character groups (talk to multiple characters)
- [ ] Advanced session filtering
- [ ] Session analytics

---

## 📝 Documentation Updates Needed

- [ ] Update README.md with slash command reference
- [ ] Add SLASH_COMMANDS.md guide
- [ ] Update MULTIPLATFORM_GUIDE.md with character selection
- [ ] Add examples to PLATFORM_TESTING_GUIDE.md

---

## ✅ Success Criteria

- [x] Users can list available characters
- [x] Users can switch between characters
- [x] Sessions are character-specific
- [x] Commands return helpful responses
- [ ] Preferences persist across restarts
- [ ] Works on all platform adapters
- [ ] No regressions in existing functionality
- [ ] Comprehensive documentation

---

**Status**: Core components implemented ✅ | Integration in progress 🔄
