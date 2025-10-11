# Platform Integration Testing Guide

## Overview
This guide helps you test the complete flow from platform messages (Telegram, Discord, WeChat) through SillyTavern and back to the platform user.

---

## What Was Fixed

### ✅ Problem 1: Platform Messages Not Triggering Responses
**Before**: Telegram messages were received but never triggered AI responses
**After**: Messages now properly update ST chat and trigger AI generation

### ✅ Problem 2: Responses Not Sent Back to Platforms
**Before**: AI generated responses but they stayed in ST, never reached Telegram users
**After**: Responses are automatically sent back to the platform via adapters

### ✅ Problem 3: Platforms Don't Persist
**Before**: Had to manually reconnect Telegram every restart
**After**: Telegram tokens saved, auto-reconnect on startup

---

## Complete Message Flow

```
┌──────────────┐
│ Telegram User│
│ sends "hello"│
└──────┬───────┘
       │ 1. Message via Telegram Bot API
       ↓
┌──────────────────┐
│ Telegram Adapter │ (in extension)
└──────┬───────────┘
       │ 2. handlePlatformMessage()
       ↓
┌──────────────────┐
│ Session Manager  │ Add to session history
└──────┬───────────┘
       │ 3. Convert to ST format
       ↓
┌──────────────────┐
│ Update ST Chat   │ chat.splice(), printMessages()
└──────┬───────────┘
       │ 4. $('#send_but').click()
       ↓
┌──────────────────┐
│ SillyTavern Core │ Send to LLM API
└──────┬───────────┘
       │ 5. API returns response
       ↓
┌──────────────────┐
│ ST adds message  │ To DOM (#chat)
│ to chat display  │
└──────┬───────────┘
       │ 6. MutationObserver detects
       ↓
┌──────────────────┐
│ observeNew       │ Check isPlatformMessage
│ Messages()       │
└──────┬───────────┘
       │ 7. adapter.sendMessage()
       ↓
┌──────────────────┐
│ Telegram Adapter │ Send via Bot API
└──────┬───────────┘
       │ 8. Telegram delivers
       ↓
┌──────────────────┐
│ Telegram User    │
│ receives reply   │
└──────────────────┘
```

---

## Testing Steps

### Prerequisites
1. **SillyTavern running** with extension installed
2. **Extension loaded** (`feature/multiplatform-v2` branch)
3. **Telegram Bot Token** ready (get from @BotFather)

### Step 1: Connect Telegram

1. Open SillyTavern
2. Go to Extensions → Multi-Platform Chat Bridge
3. Click **"Add Platform"**
4. Select **Telegram**
5. Enter your bot token
6. Click **"Connect"**

**Expected Debug Log**:
```
[HH:MM:SS] Connecting to telegram...
[HH:MM:SS] Successfully connected to telegram
[HH:MM:SS] ✓ Successfully reconnected to telegram
```

**UI Should Show**:
- Platform card with Telegram icon (✈️)
- Status: "Connected" (green)

### Step 2: Verify Persistence

1. Close SillyTavern
2. Reopen SillyTavern
3. Go to Extensions → Multi-Platform Chat Bridge

**Expected Debug Log**:
```
[HH:MM:SS] Restoring 1 saved platform(s)...
[HH:MM:SS] Reconnecting to telegram...
[HH:MM:SS] ✓ Successfully reconnected to telegram
```

**Result**: Telegram should auto-reconnect without manual intervention

### Step 3: Test Message Flow

1. Open Telegram app
2. Find your bot
3. Send message: **"hello"**

**Expected Debug Log** (in SillyTavern):
```
[HH:MM:SS] Platform message from telegram user 123456789: hello
[HH:MM:SS] Updated chat with 1 messages for session telegram_123456789_default
[HH:MM:SS] Triggered response generation for telegram user 123456789
```

**SillyTavern UI**:
- Chat window should show your message
- AI should start generating response

### Step 4: Verify Response Delivery

Wait for AI to finish generating response.

**Expected Debug Log**:
```
[HH:MM:SS] ✓ Sent response to telegram user 123456789
```

**Telegram App**:
- You should receive the bot's reply

### Step 5: Test Conversation Context

1. Send another message: **"what did I say?"**
2. Bot should remember you said "hello"

**Why This Works**:
- Session Manager maintains conversation history
- Each message includes full context
- Session persists across messages

---

## What to Look For in Debug Log

### ✅ Good Signs
```
[HH:MM:SS] Platform message from telegram user XXXXX: [message]
[HH:MM:SS] Updated chat with N messages for session [sessionId]
[HH:MM:SS] Triggered response generation for telegram user XXXXX
[HH:MM:SS] Message observer initialized
[HH:MM:SS] ✓ Sent response to telegram user XXXXX
```

### ❌ Bad Signs and Solutions

**Problem**: `Warning: Could not find #chat element to observe`
**Solution**: Refresh SillyTavern page, ensure ST is fully loaded

**Problem**: `✗ Cannot send response: WebSocket not connected`
**Solution**: This is for forwarder, doesn't affect platform messages (ignore for Telegram)

**Problem**: `✗ Failed to send response to platform: [error]`
**Possible Causes**:
- Invalid bot token
- Bot blocked by user
- Telegram API rate limit
**Solution**: Check token, verify bot not blocked

**Problem**: No "Triggered response generation" message
**Possible Causes**:
- `handlePlatformMessage()` not being called
- Session manager error
**Solution**: Check that adapter is connected, restart extension

---

## Testing Checklist

### Basic Functionality
- [ ] Connect Telegram successfully
- [ ] Status shows "Connected"
- [ ] Send message from Telegram
- [ ] Message appears in ST chat
- [ ] AI generates response
- [ ] Response delivered to Telegram
- [ ] Session persists (check Active Sessions UI)

### Persistence
- [ ] Close and reopen ST
- [ ] Telegram auto-reconnects
- [ ] Send message works without manual reconnect
- [ ] Previous session history preserved

### Multi-Message Conversation
- [ ] Send message 1
- [ ] Receive response 1
- [ ] Send message 2
- [ ] Bot remembers message 1
- [ ] Context maintained across messages

### Edge Cases
- [ ] Disconnect and reconnect manually
- [ ] Send message while ST is generating
- [ ] Send very long message
- [ ] Send rapid multiple messages

---

## Debug Console Commands

### Check if Observer is Working
Open browser console (F12) and run:
```javascript
console.log(document.querySelector('#chat'));
// Should return: <div id="chat">...</div>
```

### Monitor DOM Changes
```javascript
const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
        console.log('Mutation detected:', m.target.id, 'Nodes added:', m.addedNodes.length);
    });
});
observer.observe(document.querySelector('#chat'), { childList: true, subtree: true });
```

### Check Active Platforms
```javascript
// In ST extension's scope
console.log(currentPlatforms);
// Should show Map with your connected platforms
```

### Check Session State
```javascript
console.log(sessionManager.getActiveSessions());
// Should show array of active sessions
```

---

## Common Issues

### Issue 1: "Platform message received but no response"

**Symptoms**: Debug log shows message received but no "Triggered response generation"

**Diagnosis**:
```
✓ Platform message from telegram user XXXXX: hello
✗ [No "Updated chat" message]
✗ [No "Triggered response generation" message]
```

**Solution**:
1. Check that `handlePlatformMessage()` is not throwing errors
2. Verify `chat` variable is accessible
3. Ensure SillyTavern context is valid
4. Check console for JavaScript errors

### Issue 2: "Response generated but not sent to platform"

**Symptoms**: AI responds in ST but Telegram user doesn't receive it

**Diagnosis**:
```
✓ Triggered response generation for telegram user XXXXX
✓ [AI response visible in ST]
✗ [No "Sent response to telegram" message]
```

**Solution**:
1. Check `observeNewMessages()` is initialized
2. Verify `activeBridgeRequest` is set correctly
3. Check that `currentPlatforms.get()` returns adapter
4. Verify adapter's `sendMessage()` method exists

### Issue 3: "Platform doesn't auto-reconnect"

**Symptoms**: After restart, have to manually reconnect

**Diagnosis**:
```
✗ [No "Restoring saved platforms" message on startup]
```

**Solution**:
1. Check `extension_settings[extensionName].platforms` is populated
2. Verify `restoreSavedPlatforms()` is called in jQuery init
3. Check for errors in `restoreSavedPlatforms()` execution
4. Ensure settings were saved (call `saveSettingsDebounced()`)

---

## Performance Expectations

### Response Time
- **Message received to ST chat update**: < 100ms
- **ST chat update to AI generation start**: < 500ms
- **AI generation time**: Varies by model (2-10 seconds typical)
- **Response delivery to Telegram**: < 500ms after generation

### Total Flow
- **End-to-end (user sends → user receives)**: 3-15 seconds
  - Most time spent on LLM API call
  - Extension overhead: < 1 second

---

## Code Changes Summary

### Modified Functions

#### `handlePlatformMessage()`
**Before**: Sent to WebSocket (wrong approach)
**After**: 
- Directly updates ST chat
- Triggers response generation
- Sets `activeBridgeRequest` with platform info

#### `observeNewMessages()`
**Before**: Only handled forwarder responses
**After**:
- Checks `isPlatformMessage` flag
- Routes to platform adapter if platform message
- Routes to forwarder if API request

#### New: `restoreSavedPlatforms()`
**Purpose**: Auto-reconnect platforms on startup
**What it does**:
- Reads `extension_settings[extensionName].platforms`
- Creates adapters for each saved platform
- Reconnects with saved tokens
- Restores message handlers

---

## Success Criteria

✅ **All of these should work**:
1. Send Telegram message → Bot replies
2. Multi-turn conversation with context
3. Close/reopen ST → Still connected
4. No manual reconnection needed
5. Debug log shows complete flow
6. Sessions UI updates with messages
7. Multiple Telegram users work independently

---

## Need Help?

### Check Debug Log
Most issues show up in the debug log with ✗ or error messages.

### Check Browser Console
JavaScript errors appear in browser dev tools console (F12).

### Verify Adapter Status
Platform card should show "Connected" (green). If disconnected/red, check token and network.

### Test with cURL First
Before testing Telegram, verify User API works:
```bash
curl -X POST http://localhost:8003/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

If cURL works but Telegram doesn't, issue is in platform adapter logic.
If cURL also fails, issue is in forwarder or ST core.

---

**Version**: 1.0  
**Last Updated**: 2025-10-11  
**Branch**: feature/multiplatform-v2  
**Commit**: 1489799
