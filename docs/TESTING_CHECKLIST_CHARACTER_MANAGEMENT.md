# Testing Checklist: Character & Session Management

## ✅ Pre-Testing Setup

- [ ] SillyTavern has at least 2 characters created
- [ ] Telegram bot token configured
- [ ] Extension loaded and visible in SillyTavern
- [ ] Forwarder is running (if testing User API)

---

## 🧪 Test Scenarios

### Scenario 1: First-Time User (No Preference)

**Steps:**
1. Send message from Telegram: "Hello!"
2. Check debug log

**Expected:**
```
[HH:MM:SS] Platform message from telegram user XXX: Hello!...
[HH:MM:SS] Using character: [CharacterName] ([ID]) for telegram user XXX
[HH:MM:SS] Updated chat with 1 messages for session session_XXX
[HH:MM:SS] Triggered response generation for telegram user XXX
[HH:MM:SS] ✓ Sent response to telegram user XXX
```

- [ ] Auto-selected first/current character
- [ ] User received response from that character
- [ ] Preference saved

---

### Scenario 2: List Available Characters

**Steps:**
1. Send from Telegram: `/char`

**Expected Response:**
```
📋 **Available Characters:**

✅ 1. **Alice**
   A helpful AI assistant...
2. **Bob**
   A friendly chatbot...

💡 **Usage:**
• Type `/char [name]` to switch character
• Example: `/char Alice`
```

- [ ] All characters listed
- [ ] Current character marked with ✅
- [ ] Help text displayed

---

### Scenario 3: Switch Character

**Steps:**
1. Send: `/char Bob`

**Expected Response:**
```
✅ Switched to character: **Bob**

You can now chat with Bob!
```

2. Send: "Hi Bob!"
3. Check response comes from Bob's personality

- [ ] Character switched
- [ ] New session created with Bob
- [ ] Preference saved
- [ ] Response matches Bob's character

---

### Scenario 4: Invalid Character Name

**Steps:**
1. Send: `/char NonExistent`

**Expected Response:**
```
❌ Character "NonExistent" not found.

Type /char to see available characters.
```

- [ ] Error message displayed
- [ ] No crash
- [ ] Current character unchanged

---

### Scenario 5: Session Info

**Steps:**
1. Chat with character for a few messages
2. Send: `/session`

**Expected Response:**
```
📊 **Current Session Info:**

👤 Character: **Alice**
💬 Messages: 5
🕐 Last message: [timestamp]
🆔 Session ID: session_XXX

💡 Type `/session list` to see all your sessions.
```

- [ ] Correct character shown
- [ ] Message count accurate
- [ ] Session ID displayed

---

### Scenario 6: Create New Session

**Steps:**
1. User has 10 messages with Alice
2. Send: `/session new`
3. Send: "Hi Alice, fresh start!"

**Expected:**
- [ ] New session created
- [ ] Message history cleared (fresh start)
- [ ] Response doesn't reference previous conversation
- [ ] Old session still accessible via `/session list`

---

### Scenario 7: List Sessions

**Steps:**
1. Create 2 sessions with same character
2. Send: `/session list`

**Expected Response:**
```
📋 **Sessions with Alice:**

✅ 1. Session ...456 (active)
   💬 2 messages | 🕐 Just now
2. Session ...123
   💬 10 messages | 🕐 5 minutes ago

💡 Type `/session switch [number]` to switch session.
```

- [ ] All sessions listed
- [ ] Active session marked
- [ ] Message counts correct
- [ ] Timestamps accurate

---

### Scenario 8: Switch Session

**Steps:**
1. Have 2 sessions (session 1 with 10 msgs, session 2 with 2 msgs)
2. Currently on session 2
3. Send: `/session switch 1`
4. Send: "Remember our previous conversation?"

**Expected:**
- [ ] Switched back to session 1
- [ ] 10-message history restored
- [ ] AI response references previous context
- [ ] Debug log shows correct session ID

---

### Scenario 9: Help Command

**Steps:**
1. Send: `/help`

**Expected Response:**
```
📖 **ChatBridge Command Reference**

**Character Management:**
• `/char` - List all available characters
• `/char [name]` - Switch to a character
• Example: `/char Alice`

**Session Management:**
• `/session` - Show current session info
• `/session list` - List all your sessions
• `/session new` - Create a new session
• `/session switch [n]` - Switch to session #n

**Other:**
• `/help` - Show this help message

💡 **Tip:** Messages are automatically saved to your active session!
```

- [ ] All commands documented
- [ ] Examples provided
- [ ] Help text clear and formatted

---

### Scenario 10: No Characters Available

**Steps:**
1. Delete all characters from SillyTavern
2. Send message from Telegram: "Hello"

**Expected Response:**
```
❌ No characters available in SillyTavern.

Please create characters in SillyTavern first, then type /char to see them.
```

- [ ] Error message sent
- [ ] No crash
- [ ] Debug log shows error

---

### Scenario 11: Preference Persistence

**Steps:**
1. Switch to character "Bob" via `/char Bob`
2. Refresh SillyTavern page
3. Telegram bot auto-reconnects
4. Send new message: "Hello again"

**Expected:**
- [ ] User preference persisted (still talking to Bob)
- [ ] Session with Bob restored
- [ ] Response comes from Bob
- [ ] No need to re-select character

---

### Scenario 12: Invalid Command

**Steps:**
1. Send: `/unknown`

**Expected Response:**
```
❌ Unknown command: /unknown

Type /help to see available commands.
```

- [ ] Error message displayed
- [ ] Help suggestion given
- [ ] No crash

---

### Scenario 13: Multi-User Isolation

**Steps:**
1. User A (Telegram 111) talks to Alice
2. User B (Telegram 222) talks to Bob
3. User A sends: "What did I just say?" (should only see User A's history)

**Expected:**
- [ ] User A sees only their conversation with Alice
- [ ] User B sees only their conversation with Bob
- [ ] Sessions completely isolated
- [ ] No cross-user data leakage

---

### Scenario 14: Cross-Character Sessions

**Steps:**
1. Talk to Alice (10 messages)
2. Switch to Bob via `/char Bob`
3. Talk to Bob (5 messages)
4. Switch back to Alice via `/char Alice`
5. Send: "Do you remember what we discussed?"

**Expected:**
- [ ] Alice's 10-message history restored
- [ ] AI references previous Alice conversation
- [ ] Bob's session separate and preserved

---

## 🐛 Edge Cases

### Edge Case 1: Character Deleted After Selection
**Test:** User selected character, then character deleted from ST
**Expected:** Graceful error, suggest /char to pick another

### Edge Case 2: Very Long Command
**Test:** `/char ThisIsAVeryLongCharacterNameThatDoesNotExist`
**Expected:** "Character not found" error, no crash

### Edge Case 3: Session Limit
**Test:** Create 100 sessions with same character
**Expected:** All work correctly, old sessions auto-cleanup after 24h

### Edge Case 4: Rapid Commands
**Test:** Send 10 commands in quick succession
**Expected:** All process correctly, responses in order

### Edge Case 5: Command with Extra Spaces
**Test:** `/char    Alice` (multiple spaces)
**Expected:** Still works, spaces trimmed

---

## 📊 Debug Log Validation

For each test, verify debug log shows:
- [ ] Command detection (if command)
- [ ] Character selection/auto-selection
- [ ] Session ID being used
- [ ] Message counts
- [ ] Response sending confirmation

---

## ✅ Success Criteria

- [ ] All 14 scenarios pass
- [ ] All 5 edge cases handled
- [ ] No console errors
- [ ] No crashes or hangs
- [ ] Preferences persist across restarts
- [ ] Debug log clear and informative
- [ ] Response times acceptable (<2s for commands)
- [ ] Memory usage stable (no leaks)

---

## 🔍 Post-Testing Review

**Issues Found:**
- [ ] None (ready for production)
- [ ] Minor issues (list below)
- [ ] Major issues (fix before merge)

**Notes:**

