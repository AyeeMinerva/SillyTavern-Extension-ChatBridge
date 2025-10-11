# Technical Specification: ChatBridge Protocol Refactor

**Author**: @technical-architect
**Date**: 2025-10-11
**Status**: Draft

## 1. Introduction

This document outlines the technical specification for refactoring the communication protocol between the SillyTavern ChatBridge extension and the Python forwarder. The current implementation suffers from a race condition leading to `TimeoutError` exceptions, caused by an unreliable "UI-click-and-hijack" mechanism that decouples requests from responses.

The proposed solution is to implement a robust, closed-loop communication protocol that directly invokes SillyTavern's internal functions and uses a `request_id` to guarantee request-response correlation.

## 2. Root Cause Analysis

The `TimeoutError` is caused by the following sequence of events:

1.  **`ChatBridge_APIHijackForwarder.py`** receives a user request and creates a `future` object, storing it in the `self.response_futures` dictionary with a unique `request_id`.
2.  It sends a `user_request` to the `index.js` extension via WebSocket.
3.  **`index.js`** receives the request, updates the chat UI, and then programmatically clicks the send button (`$('#send_but').click()`).
4.  This click triggers a message generation process within SillyTavern, which is asynchronous.
5.  The Python forwarder, listening for a response from the LLM, hijacks the *next* available completion, regardless of which request initiated it.
6.  If another request (e.g., from the user directly in the UI) is processed first, the forwarder hijacks the wrong response. The original `future` object never receives a result and eventually times out.

The core flaw is the complete decoupling of the request and the response. The `request_id` is generated but never used to link the final LLM output back to the initial request.

## 3. New Protocol Flow

The new protocol will establish a reliable, closed-loop communication channel:

```sequence
participant User as External Application
participant Forwarder as ChatBridge_APIHijackForwarder.py
participant Extension as index.js
participant SillyTavern as SillyTavern Core

User->>Forwarder: 1. /v1/chat/completions (request_id created)
Forwarder->>Extension: 2. WS Message (type: 'user_request', id: request_id, content: ...)
Extension->>SillyTavern: 3. Call sendTextareaMessage()
note right of SillyTavern: Generates response asynchronously
SillyTavern-->>Extension: 4. Emits 'message_received' event
Extension->>Forwarder: 5. WS Message (type: 'st_response', id: request_id, content: ...)
Forwarder->>User: 6. Resolves future and returns response
```

## 4. Implementation Details

### 4.1. `index.js` Modifications

#### 4.1.1. Handle `user_request` and Invoke `sendTextareaMessage`

The `ws.onmessage` handler must be modified to store the `request_id` and call `sendTextareaMessage()` directly instead of simulating a click.

**Pseudocode:**

```javascript
// Top-level variable to store the current request context
let activeBridgeRequest = null;

ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'user_request') {
        // Store the request ID and content
        activeBridgeRequest = {
            id: data.id,
            content: data.content
        };

        // Update chat content as before
        // ... (splice chat, printMessages, etc.)

        // Directly call the message sending function
        sendTextareaMessage(); 
    }
};
```

#### 4.1.2. Listen for Response and Send to Forwarder

We need to listen for the event that signifies a new message has been generated and received from the LLM. This is likely a global event. We will listen for new messages, and if it corresponds to our active request, send the response back.

A new function will be added to observe mutations on the chat log. When a new message from the assistant appears, and we have an active request, we will capture that message and send it back.

**Pseudocode:**

```javascript
function observeNewMessages() {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                const lastMessage = chat[chat.length - 1];
                
                // Check if there's an active request and the last message is from the assistant
                if (activeBridgeRequest && lastMessage && !lastMessage.is_user) {
                    const responseContent = lastMessage.mes;

                    const response = {
                        type: 'st_response',
                        id: activeBridgeRequest.id,
                        content: {
                            // Construct a response that matches what the Python forwarder expects
                            choices: [{
                                message: {
                                    role: 'assistant',
                                    content: responseContent
                                }
                            }]
                        }
                    };

                    ws.send(JSON.stringify(response));
                    updateDebugLog(`Sent response for request ${activeBridgeRequest.id}`);

                    // Clear the active request
                    activeBridgeRequest = null;
                }
            }
        }
    });

    const chatElement = document.getElementById('chat'); // Or the correct selector for the chat container
    if (chatElement) {
        observer.observe(chatElement, { childList: true });
    }
}

// Call this function during initialization
jQuery(async () => {
    // ... existing initialization
    observeNewMessages();
});
```

### 4.2. `ChatBridge_APIHijackForwarder.py` Modifications

#### 4.2.1. Correlate Responses using `request_id`

The forwarder will no longer hijack the *next* completion. Instead, it will wait for a `st_response` message with the matching `request_id`.

**Pseudocode:**

```python
# In ChatBridgeForwarder class

async def handle_websocket(self, websocket):
    self.ws_clients.add(websocket)
    try:
        async for message in websocket:
            data = json.loads(message)
            logger.info(f"Received WebSocket message: {data}")
            
            if data.get('type') == 'st_response':
                request_id = data.get('id')
                if request_id in self.response_futures:
                    future = self.response_futures[request_id]
                    if not future.done():
                        future.set_result(data.get('content'))
                        logger.info(f"Resolved future for request_id: {request_id}")
    finally:
        self.ws_clients.remove(websocket)

async def handle_user_api(self, request: web.Request) -> web.Response:
    # ... (existing code for creating request_id and future)
    
    # The rest of the logic remains the same, as it now correctly
    # waits on the future that will be resolved by handle_websocket.
    # The timeout mechanism will now work as intended.
```

#### 4.2.2. Remove Hijacking Logic

The `handle_chat_completions` function, which currently contains the logic to hijack responses intended for SillyTavern, must be simplified. It should now only act as a simple proxy if needed, but its primary role in the hijack scheme is removed. For now, we will leave it as a simple pass-through proxy.

## 5. Implementation Plan for @technical-maestro

1.  **Modify `index.js`**:
    *   **Task 1.1**: Introduce a global variable `activeBridgeRequest` initialized to `null`.
    *   **Task 1.2**: In the `ws.onmessage` handler for `user_request`, store the `data.id` and `data.content` in `activeBridgeRequest`.
    *   **Task 1.3**: Replace the `$('#send_but').click();` call with a direct call to `sendTextareaMessage();`.
    *   **Task 1.4**: Implement the `observeNewMessages` function as described above, using a `MutationObserver` on the chat container.
    *   **Task 1.5**: Inside the observer callback, check for `activeBridgeRequest` and if the new message is from the assistant. If so, construct the `st_response` object and send it over the WebSocket. Set `activeBridgeRequest` back to `null`.
    *   **Task 1.6**: Call `observeNewMessages()` once during the extension's initialization.

2.  **Modify `ChatBridge_APIHijackForwarder.py`**:
    *   **Task 2.1**: In `handle_websocket`, add the logic to process incoming `st_response` messages.
    *   **Task 2.2**: Use the `id` from the `st_response` message to look up the correct `future` in `self.response_futures`.
    *   **Task 2.3**: Resolve the future with `future.set_result(data.get('content'))`.
    *   **Task 2.4**: Remove the complex hijacking logic from `handle_chat_completions`. It should no longer interact with `self.response_futures`. It can be simplified to a basic proxy or even disabled for this flow.
