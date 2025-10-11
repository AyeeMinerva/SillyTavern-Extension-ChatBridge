import { extension_settings, getContext } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
import { chat } from "../../../../script.js";
import { SessionManager } from "./src/core/SessionManager.js";
import { PlatformAdapterRegistry } from "./src/core/PlatformAdapter.js";
import { DiscordAdapter } from "./src/adapters/DiscordAdapter.js";
import { TelegramAdapter } from "./src/adapters/TelegramAdapter.js";
import { WeChatAdapter } from "./src/adapters/WeChatAdapter.js";

const extensionName = "SillyTavern-Extension-ChatBridge";

const defaultSettings = {
    wsPort: 8001,
    wsUrl: "localhost",
    autoConnect: false,
    platforms: [], // Array of platform configurations
    sessions: null // Session persistence data
};

// Initialize extension settings
if (!extension_settings[extensionName]) {
    extension_settings[extensionName] = {};
}
Object.assign(extension_settings[extensionName], defaultSettings, extension_settings[extensionName]);

// Core state
let ws;
let sessionManager;
let adapterRegistry;
let currentPlatforms = new Map(); // platformId -> adapter instance
let activeBridgeRequest = null; // Track active request from forwarder

/**
 * Debug logging utility
 */
function updateDebugLog(message) {
    const debugLog = $('#debug_log');
    if (debugLog.length === 0) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const currentContent = debugLog.val();
    const newLine = `[${timestamp}] ${message}\n`;
    debugLog.val(currentContent + newLine);
    debugLog.scrollTop(debugLog[0].scrollHeight);
    console.log(`[${extensionName}] ${message}`);
}

/**
 * Update WebSocket connection status
 */
function updateWSStatus(connected) {
    const status = $('#ws_status');
    if (connected) {
        status.text('Connected').css('color', '#28a745');
    } else {
        status.text('Disconnected').css('color', '#dc3545');
    }
}

/**
 * Convert OpenAI message format to SillyTavern format
 */
function convertOpenAIToSTMessage(msg) {
    const isUser = msg.role === 'user';
    const currentTime = new Date().toLocaleString();

    return {
        name: isUser ? 'user' : 'Assistant',
        is_user: isUser,
        is_system: false,
        send_date: currentTime,
        mes: msg.content,
        extra: {
            isSmallSys: false,
            token_count: 0,
            reasoning: ''
        }
    };
}

/**
 * Setup WebSocket connection to bridge server
 */
function setupWebSocket() {
    const wsUrl = $('#ws_url').val();
    const wsPort = $('#ws_port').val();
    updateDebugLog(`Attempting to connect to WebSocket: ws://${wsUrl}:${wsPort}`);

    ws = new WebSocket(`ws://${wsUrl}:${wsPort}`);

    ws.onopen = () => {
        updateWSStatus(true);
        updateConnectionButtons(true);
        updateDebugLog('WebSocket connection established');
    };

    ws.onmessage = async (event) => {
        try {
            const data = JSON.parse(event.data);
            updateDebugLog(`Received message: ${JSON.stringify(data).substring(0, 100)}...`);

            if (data.type === 'user_request') {
                await handleUserRequest(data);
            } else if (data.type === 'platform_message') {
                await handlePlatformMessage(data);
            }
        } catch (error) {
            updateDebugLog(`Error processing message: ${error.message}`);
            console.error(error);
        }
    };

    ws.onclose = () => {
        updateWSStatus(false);
        updateConnectionButtons(false);
        updateDebugLog('WebSocket connection closed');
        
        if (extension_settings[extensionName].autoConnect) {
            startAutoConnect();
        }
    };

    ws.onerror = (error) => {
        updateWSStatus(false);
        updateDebugLog(`WebSocket error: ${error}`);
    };
}

/**
 * Handle incoming user request from external platform
 */
async function handleUserRequest(data) {
    try {
        updateDebugLog('Processing user request from platform');
        
        if (data.content?.messages) {
            // Store the request ID so we can respond later
            activeBridgeRequest = {
                id: data.id,
                content: data.content
            };
            
            const context = getContext();
            const newChat = data.content.messages
                .filter(msg => msg.role === 'user' || msg.role === 'assistant')
                .map(msg => convertOpenAIToSTMessage(msg));

            // Replace current chat with platform messages
            chat.splice(0, chat.length, ...newChat);
            context.clearChat();
            context.printMessages();
            context.eventSource.emit(context.eventTypes.CHAT_CHANGED, context.getCurrentChatId());
            
            updateDebugLog(`Updated chat with ${context.chat.length} messages. Request ID: ${data.id}`);
            
            // Trigger message generation
            $('#send_but').click();
        }
    } catch (error) {
        updateDebugLog(`Error handling user request: ${error.message}`);
        console.error(error);
    }
}

/**
 * Handle incoming message from a platform adapter
 */
async function handlePlatformMessage(data) {
    try {
        const { platform, userId, content, metadata } = data;
        const context = getContext();
        
        updateDebugLog(`Platform message from ${platform} user ${userId}: ${content.substring(0, 50)}...`);

        // Get or create session
        const characterId = context.characterId || 'default';
        const sessionId = sessionManager.getOrCreateSession(platform, userId, characterId);
        const session = sessionManager.getSession(sessionId);
        
        // Add user message to session
        sessionManager.addMessage(sessionId, {
            role: 'user',
            content: content
        });

        // Convert session history to OpenAI format and send to ST
        const messages = session.messageHistory;
        const openAIMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Send request through WebSocket
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'user_request',
                id: Date.now().toString(),
                sessionId: sessionId,
                content: {
                    messages: openAIMessages,
                    stream: false
                }
            }));
        }

        // Update sessions UI
        updateSessionsUI();
        
        // Save session data
        saveSessionData();
    } catch (error) {
        updateDebugLog(`Error handling platform message: ${error.message}`);
        console.error(error);
    }
}

/**
 * Observe new assistant messages and send them back to forwarder
 */
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

                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify(response));
                        updateDebugLog(`✓ Sent response for request ${activeBridgeRequest.id}`);
                    } else {
                        updateDebugLog(`✗ Cannot send response: WebSocket not connected`);
                    }

                    // Clear the active request
                    activeBridgeRequest = null;
                }
            }
        }
    });

    // Observe the chat container for new messages
    const chatElement = document.querySelector('#chat');
    if (chatElement) {
        observer.observe(chatElement, { childList: true, subtree: true });
        updateDebugLog('Message observer initialized');
    } else {
        updateDebugLog('Warning: Could not find chat element to observe');
    }
}

/**
 * Update connection control buttons
 */
function updateConnectionButtons(connected) {
    $('#ws_connect').prop('disabled', connected);
    $('#ws_disconnect').prop('disabled', !connected);
    $('#ws_url').prop('disabled', connected);
    $('#ws_port').prop('disabled', connected);
}

/**
 * Disconnect WebSocket
 */
function disconnectWebSocket() {
    if (ws) {
        ws.close();
    }
    updateWSStatus(false);
    updateConnectionButtons(false);
    updateDebugLog('Disconnected from WebSocket');
}

// Auto-reconnect functionality
let autoConnectTimer = null;

function startAutoConnect() {
    if (autoConnectTimer) {
        clearInterval(autoConnectTimer);
    }
    
    autoConnectTimer = setInterval(() => {
        if (!ws || ws.readyState === WebSocket.CLOSED) {
            updateDebugLog('Auto-reconnect attempt...');
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

/**
 * Platform Management Functions
 */

function showPlatformModal() {
    $('#platform_modal').fadeIn(200);
    resetModalState();
}

function hidePlatformModal() {
    $('#platform_modal').fadeOut(200);
    resetModalState();
}

function resetModalState() {
    $('#platform_selection').show();
    $('.platform-config').hide();
    $('.platform-option').removeClass('selected');
    $('#modal_connect').hide();
    $('#modal_back').hide();
    $('#modal_title').text('Add Platform');
    
    // Clear form fields
    $('#discord_token').val('');
    $('#telegram_token').val('');
    $('#wechat_appid').val('');
    $('#wechat_appsecret').val('');
    $('#wechat_token').val('');
}

let selectedPlatform = null;

function selectPlatform(platform) {
    selectedPlatform = platform;
    $('#platform_selection').hide();
    $(`#${platform}_config`).show();
    $('#modal_back').show();
    $('#modal_connect').show();
    $('#modal_title').text(`Connect ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
}

function goBackToSelection() {
    $('.platform-config').hide();
    $('#platform_selection').show();
    $('#modal_back').hide();
    $('#modal_connect').hide();
    $('#modal_title').text('Add Platform');
    selectedPlatform = null;
}

async function connectPlatform() {
    try {
        let config = {};
        
        switch (selectedPlatform) {
            case 'discord':
                config = {
                    platform: 'discord',
                    botToken: $('#discord_token').val().trim()
                };
                break;
            case 'telegram':
                config = {
                    platform: 'telegram',
                    botToken: $('#telegram_token').val().trim()
                };
                break;
            case 'wechat':
                config = {
                    platform: 'wechat',
                    appId: $('#wechat_appid').val().trim(),
                    appSecret: $('#wechat_appsecret').val().trim(),
                    token: $('#wechat_token').val().trim()
                };
                break;
        }

        if (!config.platform) {
            throw new Error('Invalid platform configuration');
        }

        updateDebugLog(`Connecting to ${config.platform}...`);

        // Create adapter
        const { id, adapter } = adapterRegistry.createAdapter(config.platform, config);
        
        // Set up message handler
        adapter.onMessage(async (userId, message, metadata) => {
            await handlePlatformMessage({
                platform: config.platform,
                userId,
                content: message,
                metadata
            });
        });

        // Set up status handler
        adapter.onStatusChange((isConnected) => {
            updatePlatformCard(id, isConnected);
        });

        // Connect adapter
        await adapter.connect();
        
        currentPlatforms.set(id, adapter);
        
        // Save platform configuration
        extension_settings[extensionName].platforms.push({
            id,
            ...config
        });
        saveSettingsDebounced();

        updateDebugLog(`Successfully connected to ${config.platform}`);
        updatePlatformsUI();
        hidePlatformModal();
        
    } catch (error) {
        updateDebugLog(`Failed to connect platform: ${error.message}`);
        alert(`Failed to connect: ${error.message}`);
    }
}

async function disconnectPlatform(platformId) {
    try {
        await adapterRegistry.removeAdapter(platformId);
        currentPlatforms.delete(platformId);
        
        // Remove from settings
        extension_settings[extensionName].platforms = 
            extension_settings[extensionName].platforms.filter(p => p.id !== platformId);
        saveSettingsDebounced();
        
        updateDebugLog(`Disconnected platform: ${platformId}`);
        updatePlatformsUI();
    } catch (error) {
        updateDebugLog(`Error disconnecting platform: ${error.message}`);
    }
}

function updatePlatformCard(platformId, isConnected) {
    const card = $(`.platform-card[data-platform-id="${platformId}"]`);
    if (card.length) {
        const status = card.find('.platform-card-status');
        if (isConnected) {
            status.removeClass('disconnected error').addClass('connected').text('Connected');
        } else {
            status.removeClass('connected error').addClass('disconnected').text('Disconnected');
        }
    }
}

function updatePlatformsUI() {
    const container = $('#platform_cards_container');
    const emptyState = $('#platforms_empty_state');
    
    container.empty();
    
    if (currentPlatforms.size === 0) {
        emptyState.show();
        return;
    }
    
    emptyState.hide();
    
    for (const [id, adapter] of currentPlatforms.entries()) {
        const status = adapter.getStatus();
        const platformName = status.platform.charAt(0).toUpperCase() + status.platform.slice(1);
        const statusClass = status.isConnected ? 'connected' : 'disconnected';
        const statusText = status.isConnected ? 'Connected' : 'Disconnected';
        
        const icon = status.platform === 'discord' ? '💬' : 
                     status.platform === 'telegram' ? '✈️' : '💬';
        
        const card = $(`
            <div class="platform-card" data-platform-id="${id}">
                <div class="platform-card-header">
                    <div class="platform-card-title">
                        <span>${icon}</span>
                        <span>${platformName}</span>
                    </div>
                    <div class="platform-card-status ${statusClass}">${statusText}</div>
                </div>
                <div class="platform-card-actions">
                    <button class="menu_button disconnect-platform" data-platform-id="${id}">
                        Disconnect
                    </button>
                </div>
            </div>
        `);
        
        container.append(card);
    }
    
    // Bind disconnect buttons
    $('.disconnect-platform').on('click', function() {
        const platformId = $(this).data('platform-id');
        if (confirm('Are you sure you want to disconnect this platform?')) {
            disconnectPlatform(platformId);
        }
    });
}

function updateSessionsUI() {
    const container = $('#active_sessions_list');
    const emptyState = $('#sessions_empty_state');
    
    const sessions = sessionManager.getActiveSessions();
    
    container.empty();
    
    if (sessions.length === 0) {
        emptyState.show();
        return;
    }
    
    emptyState.hide();
    
    for (const session of sessions) {
        const platformIcon = session.platform === 'discord' ? '💬' : 
                            session.platform === 'telegram' ? '✈️' : '💬';
        
        const item = $(`
            <div class="session-item">
                <div class="session-info">
                    <span class="session-platform">${platformIcon} ${session.platform}</span>
                    <span class="session-character">${session.characterId}</span>
                    <div class="session-user">User: ${session.userId}</div>
                    <div class="session-user">Messages: ${session.messageHistory.length}</div>
                </div>
            </div>
        `);
        
        container.append(item);
    }
}

function saveSessionData() {
    extension_settings[extensionName].sessions = sessionManager.exportSessions();
    saveSettingsDebounced();
}

function loadSessionData() {
    if (extension_settings[extensionName].sessions) {
        sessionManager.importSessions(extension_settings[extensionName].sessions);
        updateSessionsUI();
    }
}

/**
 * Initialize extension
 */
jQuery(async () => {
    // Initialize managers
    sessionManager = new SessionManager();
    adapterRegistry = new PlatformAdapterRegistry();
    
    // Register platform adapters
    adapterRegistry.registerAdapterClass('discord', DiscordAdapter);
    adapterRegistry.registerAdapterClass('telegram', TelegramAdapter);
    adapterRegistry.registerAdapterClass('wechat', WeChatAdapter);
    
    // Load UI template
    const template = await $.get(`/scripts/extensions/third-party/${extensionName}/index-multiplatform.html`);
    $('#extensions_settings').append(template);
    
    // Load saved settings
    $('#ws_url').val(extension_settings[extensionName].wsUrl || 'localhost');
    $('#ws_port').val(extension_settings[extensionName].wsPort || 8001);
    $('#ws_auto_connect').prop('checked', extension_settings[extensionName].autoConnect || false);
    
    // Load session data
    loadSessionData();
    
    // Bind WebSocket controls
    $('#ws_connect').on('click', setupWebSocket);
    $('#ws_disconnect').on('click', disconnectWebSocket);
    
    $('#ws_port').on('change', function() {
        extension_settings[extensionName].wsPort = $(this).val();
        saveSettingsDebounced();
    });
    
    $('#ws_url').on('change', function() {
        extension_settings[extensionName].wsUrl = $(this).val();
        saveSettingsDebounced();
    });
    
    $('#ws_auto_connect').on('change', function() {
        const isChecked = $(this).prop('checked');
        extension_settings[extensionName].autoConnect = isChecked;
        saveSettingsDebounced();
        
        if (isChecked) {
            updateDebugLog('Auto-reconnect enabled');
            startAutoConnect();
        } else {
            updateDebugLog('Auto-reconnect disabled');
            stopAutoConnect();
        }
    });
    
    // Bind platform management controls
    $('#add_platform_btn').on('click', showPlatformModal);
    $('#modal_cancel, .modal-close').on('click', hidePlatformModal);
    $('#modal_back').on('click', goBackToSelection);
    $('#modal_connect').on('click', connectPlatform);
    
    $('.platform-option').on('click', function() {
        const platform = $(this).data('platform');
        selectPlatform(platform);
    });
    
    $('#clear_debug_log').on('click', () => {
        $('#debug_log').val('');
    });
    
    // Close modal when clicking outside
    $('#platform_modal').on('click', function(e) {
        if (e.target === this) {
            hidePlatformModal();
        }
    });
    
    // Auto-connect if enabled
    if (extension_settings[extensionName].autoConnect) {
        setupWebSocket();
        startAutoConnect();
    }
    
    // Update UIs
    updatePlatformsUI();
    updateSessionsUI();
    
    // Initialize message observer to capture SillyTavern responses
    observeNewMessages();
    
    updateDebugLog('Multi-Platform Chat Bridge extension initialized');
    
    // Cleanup inactive sessions periodically (every hour)
    setInterval(() => {
        const cleaned = sessionManager.cleanupInactiveSessions();
        if (cleaned > 0) {
            updateDebugLog(`Cleaned up ${cleaned} inactive sessions`);
            updateSessionsUI();
            saveSessionData();
        }
    }, 60 * 60 * 1000);
});
