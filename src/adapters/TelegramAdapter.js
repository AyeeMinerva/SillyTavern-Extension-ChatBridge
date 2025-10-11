/**
 * TelegramAdapter - Platform adapter for Telegram bot integration
 * Uses long polling to receive messages from Telegram Bot API
 */

import { PlatformAdapter } from '../core/PlatformAdapter.js';

export class TelegramAdapter extends PlatformAdapter {
    constructor(config) {
        super(config);
        this.botToken = config.botToken;
        this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
        this.offset = 0;
        this.pollingInterval = null;
        this.pollingActive = false;
    }

    /**
     * Validate Telegram configuration
     */
    validateConfig() {
        if (!this.botToken) {
            throw new Error('Telegram bot token is required');
        }
    }

    /**
     * Connect to Telegram Bot API
     */
    async connect() {
        try {
            // Test the bot token by getting bot info
            const response = await fetch(`${this.apiUrl}/getMe`);
            const data = await response.json();

            if (!data.ok) {
                throw new Error(`Invalid Telegram bot token: ${data.description}`);
            }

            console.log('[Telegram] Bot connected:', data.result.username);
            
            // Start long polling
            this.pollingActive = true;
            this._startPolling();
            this._updateStatus(true);
        } catch (error) {
            console.error('[Telegram] Connection failed:', error);
            this._updateStatus(false);
            throw error;
        }
    }

    /**
     * Disconnect from Telegram
     */
    async disconnect() {
        this.pollingActive = false;
        if (this.pollingInterval) {
            clearTimeout(this.pollingInterval);
            this.pollingInterval = null;
        }
        this._updateStatus(false);
    }

    /**
     * Send a message to Telegram chat
     */
    async sendMessage(chatId, message, options = {}) {
        try {
            // Remove Markdown formatting from message to avoid parse errors
            const plainMessage = message
                .replace(/\*\*/g, '')  // Remove ** for bold
                .replace(/\*/g, '')    // Remove * for italic
                .replace(/`/g, '')     // Remove ` for code
                .replace(/_/g, '');    // Remove _ for underline
            
            const response = await fetch(`${this.apiUrl}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: plainMessage,  // Use plain text without formatting
                    // Don't set parse_mode to avoid parsing errors
                    ...options
                })
            });

            const data = await response.json();
            
            if (!data.ok) {
                throw new Error(`Failed to send Telegram message: ${data.description}`);
            }

            return data.result;
        } catch (error) {
            console.error('[Telegram] Failed to send message:', error);
            throw error;
        }
    }

    /**
     * Start long polling for updates
     */
    async _startPolling() {
        if (!this.pollingActive) return;

        try {
            const response = await fetch(`${this.apiUrl}/getUpdates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    offset: this.offset,
                    timeout: 30, // Long polling timeout
                    allowed_updates: ['message']
                })
            });

            const data = await response.json();

            if (data.ok && data.result.length > 0) {
                for (const update of data.result) {
                    await this._handleUpdate(update);
                    this.offset = update.update_id + 1;
                }
            }
        } catch (error) {
            console.error('[Telegram] Polling error:', error);
        }

        // Continue polling
        if (this.pollingActive) {
            this.pollingInterval = setTimeout(() => this._startPolling(), 100);
        }
    }

    /**
     * Handle Telegram update
     */
    async _handleUpdate(update) {
        if (update.message && update.message.text) {
            const message = update.message;
            
            await this._handleIncomingMessage({
                userId: message.from.id.toString(),
                content: message.text,
                chatId: message.chat.id,
                messageId: message.message_id,
                username: message.from.username || message.from.first_name,
                metadata: {
                    chatId: message.chat.id,
                    chatType: message.chat.type,
                    messageId: message.message_id,
                    firstName: message.from.first_name,
                    lastName: message.from.last_name
                }
            });
        }
    }

    /**
     * Normalize Telegram message to standard format
     */
    normalizeMessage(platformMessage) {
        return {
            role: 'user',
            content: platformMessage.content,
            userId: platformMessage.userId,
            platform: this.platform,
            timestamp: Date.now(),
            metadata: {
                ...platformMessage.metadata,
                username: platformMessage.username
            }
        };
    }
}
