# Test Plan: ChatBridge Protocol Refactor

**Author**: @quality-catalyst
**Date**: 2025-10-11
**Objective**: To verify that the ChatBridge protocol refactor has successfully addressed the `TimeoutError` race condition and maintained core functionality.

## 1. Test Environment

*   **SillyTavern Instance**: Local instance with the ChatBridge extension enabled.
*   **Python Forwarder**: `ChatBridge_APIHijackForwarder.py` running locally.
*   **Testing Tool**: A script (e.g., Python `requests`) capable of sending concurrent requests to the user API endpoint (`http://127.0.0.1:5100/v1/chat/completions`).

## 2. Test Cases

### 2.1. TC-01: `request_id` Correlation and Response Integrity

*   **Objective**: Verify that each request is correctly correlated with its response using the `request_id`.
*   **Steps**:
    1.  Start the SillyTavern server and the Python forwarder.
    2.  Send a single, non-streaming request to the user API with a unique message (e.g., "Hello, this is test 1").
    3.  Monitor the `debug_log` in the SillyTavern UI and the console output of the Python forwarder.
    4.  Verify that the forwarder logs the creation of a `request_id`.
    5.  Verify that the `index.js` debug log shows the reception of the `user_request` with the same `request_id`.
    6.  Verify that after the LLM responds, the `index.js` debug log shows it is sending an `st_response` with the matching `request_id`.
    7.  Verify that the forwarder logs the resolution of the future for that `request_id`.
    8.  Verify that the final HTTP response received by the client contains the correct LLM-generated content for the initial request.
*   **Expected Result**: The `request_id` remains consistent across the entire workflow, and the response content matches the request.

### 2.2. TC-02: Elimination of `TimeoutError` (Race Condition Test)

*   **Objective**: Verify that the `TimeoutError` is no longer present when multiple requests are sent concurrently.
*   **Steps**:
    1.  Start the SillyTavern server and the Python forwarder.
    2.  Create a script to send at least three concurrent, non-streaming requests to the user API. Each request should have distinct content (e.g., "Test A", "Test B", "Test C").
    3.  Execute the script.
    4.  Simultaneously, manually send a message directly through the SillyTavern UI to simulate user interaction.
    5.  Monitor the Python forwarder's console output.
*   **Expected Result**:
    *   The forwarder should not log any `TimeoutError` exceptions.
    *   All three scripted requests should receive their correct, corresponding responses.
    *   The manually sent message should also receive its response in the UI without being hijacked.

### 2.3. TC-03: Basic Chat Functionality (Sanity Check)

*   **Objective**: Verify that the core chat functionality of the extension remains intact.
*   **Steps**:
    1.  Start the SillyTavern server and the Python forwarder.
    2.  Send a request to the user API.
    3.  Observe the SillyTavern UI.
*   **Expected Result**:
    *   The user's message from the API request appears correctly in the chat log.
    *   The assistant's response appears correctly in the chat log after it is generated.
    *   The chat history is correctly maintained.

### 2.4. TC-04: Streaming Response Test

*   **Objective**: Verify that streaming responses are handled correctly.
*   **Steps**:
    1.  Start the SillyTavern server and the Python forwarder.
    2.  Send a streaming request to the user API.
    3.  Monitor the response received by the client.
*   **Expected Result**: The client should receive a series of server-sent events, culminating in a `[DONE]` message, without any timeouts or errors.

## 3. Reporting

*   All test results will be documented.
*   Any failures will be reported as new issues, including detailed reproduction steps, logs, and a reference to the failed test case.
*   A final QA report will be created in `🧠 knowledge_base/agents/@quality-catalyst/qa_reports/` summarizing the findings.