import { extension_settings, getContext } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
import { chat } from "../../../../script.js";

const extensionName = "SillyTavern-Extension-ChatBridge";
const defaultSettings = {
    wsPort: 8001,
    autoConnect: false
};

if (!extension_settings[extensionName]) {
    extension_settings[extensionName] = {};
}

Object.assign(extension_settings[extensionName], defaultSettings);

let ws;
let activeBridgeRequest = null;

function updateDebugLog(message) {
    const debugLog = $('#debug_log');
    if (debugLog.length === 0) {
        console.warn('找不到调试日志元素');
        return;
    }
    const timestamp = new Date().toLocaleTimeString();
    const currentContent = debugLog.val();
    const newLine = `[${timestamp}] ${message}\n`;
    debugLog.val(currentContent + newLine);
    debugLog.scrollTop(debugLog[0].scrollHeight);
    // 同时在控制台输出，方便调试
    console.log(`[${extensionName}] ${message}`);
}

function updateWSStatus(connected) {
    const status = $('#ws_status');
    if (connected) {
        status.text('已连接').css('color', 'green');
    } else {
        status.text('未连接').css('color', 'red');
    }
}
function convertOpenAIToSTMessage(msg) {
    const isUser = msg.role === 'user';
    const currentTime = new Date().toLocaleString();

    return {
        name: isUser ? 'user' : 'Assistant', // 注意：用户名要小写
        is_user: isUser,
        is_system: false,
        send_date: currentTime,
        mes: msg.content,
        extra: {
            isSmallSys: false,
            token_count: 0,
            reasoning: ''
        },
        force_avatar: isUser ? "User Avatars/1739777502672-user.png" : null
    };
}

function setupWebSocket() {
    const wsUrl = $('#ws_url').val();
    const wsPort = $('#ws_port').val();
    updateDebugLog(`尝试连接WebSocket服务器: ws://${wsUrl}:${wsPort}`);

    ws = new WebSocket(`ws://${wsUrl}:${wsPort}`);

    ws.onopen = () => {
        updateWSStatus(true);
        updateConnectionButtons(true);
        updateDebugLog('WebSocket连接已建立');
        //sendChatHistory();
    };
    ws.onmessage = async (event) => {
        try {
            const data = JSON.parse(event.data);
            updateDebugLog(`收到消息: ${JSON.stringify(data)}`);
            if (data.type === 'user_request') {
                updateDebugLog('收到用户请求');
                if (data.content?.messages) {
                    activeBridgeRequest = {
                        id: data.id,
                        content: data.content
                    };
                    const context = getContext();
                    const newChat = data.content.messages
                        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
                        .map(msg => convertOpenAIToSTMessage(msg));
                    chat.splice(0, chat.length, ...newChat);
                    context.clearChat();
                    context.printMessages();
                    context.eventSource.emit(context.eventTypes.CHAT_CHANGED, context.getCurrentChatId());
                    updateDebugLog(`已更新聊天内容，共${context.chat.length}条消息`);
                    sendTextareaMessage();
                } else {
                    updateDebugLog('错误：消息格式不正确');
                }
            }
        } catch (error) {
            updateDebugLog(`处理消息时出错: ${error.message}`);
            console.error(error); // 输出完整错误信息
        }
    };
    ws.onclose = () => {
        updateWSStatus(false);
        updateConnectionButtons(false);
        updateDebugLog('WebSocket连接已关闭');
    };

    ws.onerror = (error) => {
        updateWSStatus(false);
        updateDebugLog(`WebSocket错误: ${error}`);
    };
}

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

    const chatElement = document.querySelector('#chat');
    if (chatElement) {
        observer.observe(chatElement, { childList: true, subtree: true });
        updateDebugLog('Message observer initialized');
    } else {
        updateDebugLog('Warning: Could not find #chat element to observe');
    }
}

function updateConnectionButtons(connected) {
    $('#ws_connect').prop('disabled', connected);
    $('#ws_disconnect').prop('disabled', !connected);
    $('#ws_url').prop('disabled', connected);
    $('#ws_port').prop('disabled', connected);
}

function disconnectWebSocket() {
    if (ws) {
        ws.close();
    }
    updateWSStatus(false);
    updateConnectionButtons(false);
    updateDebugLog('已断开WebSocket连接');
    // 如果启用了自动尝试连接，立即开始计时
    if (extension_settings[extensionName].autoConnect) {
        startAutoConnect();
    }
}

//自动尝试连接
let autoConnectTimer = null;
//自动尝试连接功能
function startAutoConnect() {
    if (autoConnectTimer) {
        clearInterval(autoConnectTimer);
    }
    
    autoConnectTimer = setInterval(() => {
        if (!ws || ws.readyState === WebSocket.CLOSED) {
            updateDebugLog('自动尝试连接尝试中...');
            setupWebSocket();
        }
    }, 5000);
}

function stopAutoConnect() {
    if (autoConnectTimer) {
        clearInterval(autoConnectTimer);
        autoConnectTimer = null;
    }
}



jQuery(async () => {

    // // 事件系统测试代码
    // const context = getContext();
    // updateDebugLog('=== 可用事件类型 ===');
    // for (const eventType in context.eventTypes) {
    //     updateDebugLog(`${eventType}: ${context.eventTypes[eventType]}`);
    // }

    const template = await $.get(`/scripts/extensions/third-party/${extensionName}/index.html`);
    $('#extensions_settings').append(template);

    $('#ws_connect').on('click', setupWebSocket);
    $('#ws_disconnect').on('click', disconnectWebSocket);
    $('#ws_port').val(extension_settings[extensionName].wsPort);

    $('#ws_port').on('change', function () {
        extension_settings[extensionName].wsPort = $(this).val();
        saveSettingsDebounced();
    });
    setupWebSocket();
    observeNewMessages();

    //自动尝试连接
    $('#ws_auto_connect').prop('checked', extension_settings[extensionName].autoConnect);
    // 添加自动尝试连接复选框的事件处理
    $('#ws_auto_connect').on('change', function() {
        const isChecked = $(this).prop('checked');
        extension_settings[extensionName].autoConnect = isChecked;
        saveSettingsDebounced();
        
        if (isChecked) {
            updateDebugLog('已启用自动尝试连接');
            startAutoConnect();
        } else {
            updateDebugLog('已禁用自动尝试连接');
            stopAutoConnect();
        }
    });
    
    // 如果启用了自动尝试连接，则启动定时器
    if (extension_settings[extensionName].autoConnect) {
        startAutoConnect();
    }

    updateDebugLog('扩展初始化完成');

    // 以下为测试代码
    // $('#show_chat').on('click', () => {
    //     const context = getContext();

    //     updateDebugLog('=== 当前聊天状态 ===');
    //     updateDebugLog('name1: ' + context.name1);
    //     updateDebugLog('name2: ' + context.name2);
    //     updateDebugLog('characterId: ' + context.characterId);
    //     updateDebugLog('当前聊天内容:');
    //     updateDebugLog(JSON.stringify(context.chat, null, 2));
    //     updateDebugLog('当前聊天元数据:');
    //     updateDebugLog(JSON.stringify(context.chatMetadata, null, 2));
    // });

    // $('#replace_chat').on('click', () => {
    //     const context = getContext();

    //     const nativeChat = [
    //         {
    //             "name": "user",
    //             "is_user": true,
    //             "is_system": false,
    //             "send_date": "February 26, 2025 2:09pm",
    //             "mes": "？",
    //             "extra": {
    //                 "isSmallSys": false,
    //                 "token_count": 2,
    //                 "reasoning": ""
    //             },
    //             "force_avatar": "User Avatars/1739777502672-user.png"
    //         },
    //         {
    //             "extra": {
    //                 "api": "custom",
    //                 "model": "gemini-2.0-flash-exp",
    //                 "reasoning": "",
    //                 "reasoning_duration": null,
    //                 "token_count": 64
    //             },
    //             "name": "测试",
    //             "is_user": false,
    //             "send_date": "February 26, 2025 2:09pm",
    //             "mes": "我不太确定你在问什么。你可以更详细地说明你的问题吗？",
    //             "title": "",
    //             "gen_started": "2025-02-26T06:09:43.173Z",
    //             "gen_finished": "2025-02-26T06:09:45.338Z",
    //             "swipe_id": 0,
    //             "swipes": ["我不太确定你在问什么。你可以更详细地说明你的问题吗？"],
    //             "swipe_info": [{
    //                 "send_date": "February 26, 2025 2:09pm",
    //                 "gen_started": "2025-02-26T06:09:43.173Z",
    //                 "gen_finished": "2025-02-26T06:09:45.338Z",
    //                 "extra": {
    //                     "api": "custom",
    //                     "model": "gemini-2.0-flash-exp",
    //                     "reasoning": "",
    //                     "reasoning_duration": null,
    //                     "token_count": 64
    //                 }
    //             }]
    //         }
    //     ];

    //     const nativeChat2 = [
    //         {
    //             "name": "user",
    //             "is_user": true,
    //             "is_system": false,
    //             "send_date": "February 28, 2025 12:43am",
    //             "mes": "?",
    //             "extra": {
    //                 "isSmallSys": false,
    //                 "token_count": 2,
    //                 "reasoning": ""
    //             },
    //             "force_avatar": "User Avatars/1739777502672-user.png"
    //         },
    //         {
    //             "extra": {
    //                 "api": "custom",
    //                 "model": "gemini-2.0-flash-exp",
    //                 "reasoning": "",
    //                 "reasoning_duration": null,
    //                 "token_count": 3
    //             },
    //             "name": "测试",
    //             "is_user": false,
    //             "send_date": "February 28, 2025 12:43am",
    //             "mes": "Hello!?",
    //             "title": "",
    //             "gen_started": "2025-02-27T16:43:43.214Z",
    //             "gen_finished": "2025-02-27T16:43:45.973Z",
    //             "swipe_id": 0,
    //             "swipes": [
    //                 "Hello!?"
    //             ],
    //             "swipe_info": [
    //                 {
    //                     "send_date": "February 28, 2025 12:43am",
    //                     "gen_started": "2025-02-27T16:43:43.214Z",
    //                     "gen_finished": "2025-02-27T16:43:45.973Z",
    //                     "extra": {
    //                         "api": "custom",
    //                         "model": "gemini-2.0-flash-exp",
    //                         "reasoning": "",
    //                         "reasoning_duration": null,
    //                         "token_count": 3
    //                     }
    //                 }
    //             ]
    //         }
    //     ];


    //     try {
    //         //必须先启用新对话
    //         //先清空再添加
    //         chat.splice(0, chat.length, ...nativeChat);
    //         //chat.splice(0, chat.length, ...nativeChat2);
    //         context.clearChat();
    //         context.printMessages();
    //         context.eventSource.emit(context.eventTypes.CHAT_CHANGED, context.getCurrentChatId());
            
    //     } catch (error) {
    //         updateDebugLog(`替换聊天时出错: ${error.message}`);
    //         console.error(error);
    //     }
    // });

    // updateDebugLog('测试功能已初始化');
});