/**
 * DiscordAdapter - Platform adapter for Discord bot integration
 * Handles Discord-specific message formatting and bot communication
 */

import { PlatformAdapter } from '../core/PlatformAdapter.js';

export class DiscordAdapter extends PlatformAdapter {
    constructor(config) {
        super(config);
        this.botToken = config.botToken;
        this.gatewayUrl = null;
        this.ws = null;
        this.sessionId = null;
        this.sequenceNumber = null;
        this.heartbeatInterval = null;
    }

    /**
     * Validate Discord configuration
     */
    validateConfig() {
        if (!this.botToken) {
            throw new Error('Discord bot token is required');
        }
    }

    /**
     * Connect to Discord via WebSocket Gateway
     */
    async connect() {
        try {
            // Get Gateway URL
            const gatewayResponse = await fetch('https://discord.com/api/v10/gateway/bot', {
                headers: {
                    'Authorization': `Bot ${this.botToken}`
                }
            });

            if (!gatewayResponse.ok) {
                throw new Error(`Failed to get Discord gateway: ${gatewayResponse.status}`);
            }

            const gatewayData = await gatewayResponse.json();
            this.gatewayUrl = gatewayData.url;

            // Connect to Gateway
            this.ws = new WebSocket(`${this.gatewayUrl}/?v=10&encoding=json`);

            return new Promise((resolve, reject) => {
                this.ws.onopen = () => {
                    console.log('[Discord] WebSocket connected');
                };

                this.ws.onmessage = async (event) => {
                    await this._handleGatewayMessage(JSON.parse(event.data));
                };

                this.ws.onerror = (error) => {
                    console.error('[Discord] WebSocket error:', error);
                    this._updateStatus(false);
                    reject(error);
                };

                this.ws.onclose = () => {
                    console.log('[Discord] WebSocket closed');
                    this._updateStatus(false);
                    this._stopHeartbeat();
                };

                // Wait for READY event
                const readyHandler = (data) => {
                    if (data.t === 'READY') {
                        this._updateStatus(true);
                        resolve();
                    }
                };
                
                const originalHandler = this._handleGatewayMessage.bind(this);
                this._handleGatewayMessage = async (data) => {
                    readyHandler(data);
                    await originalHandler(data);
                };
            });
        } catch (error) {
            console.error('[Discord] Connection failed:', error);
            this._updateStatus(false);
            throw error;
        }
    }

    /**
     * Disconnect from Discord
     */
    async disconnect() {
        this._stopHeartbeat();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this._updateStatus(false);
    }

    /**
     * Send a message to Discord channel/DM
     */
    async sendMessage(channelId, message, options = {}) {
        try {
            const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bot ${this.botToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: message,
                    ...options
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to send Discord message: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[Discord] Failed to send message:', error);
            throw error;
        }
    }

    /**
     * Handle Discord Gateway messages
     */
    async _handleGatewayMessage(data) {
        const { op, t, d, s } = data;

        // Update sequence number
        if (s) {
            this.sequenceNumber = s;
        }

        switch (op) {
            case 10: // Hello
                this._startHeartbeat(d.heartbeat_interval);
                await this._identify();
                break;

            case 0: // Dispatch
                await this._handleDispatchEvent(t, d);
                break;

            case 1: // Heartbeat Request
                this._sendHeartbeat();
                break;

            case 11: // Heartbeat ACK
                // Heartbeat acknowledged
                break;

            default:
                console.log('[Discord] Unknown opcode:', op);
        }
    }

    /**
     * Handle Discord dispatch events
     */
    async _handleDispatchEvent(eventType, data) {
        switch (eventType) {
            case 'READY':
                this.sessionId = data.session_id;
                console.log('[Discord] Bot ready:', data.user.username);
                break;

            case 'MESSAGE_CREATE':
                // Ignore bot's own messages
                if (data.author.bot) return;
                
                await this._handleIncomingMessage({
                    userId: data.author.id,
                    content: data.content,
                    channelId: data.channel_id,
                    messageId: data.id,
                    username: data.author.username,
                    metadata: {
                        channelId: data.channel_id,
                        guildId: data.guild_id,
                        messageId: data.id
                    }
                });
                break;

            default:
                // Ignore other events
                break;
        }
    }

    /**
     * Send identify payload to Discord
     */
    async _identify() {
        const identifyPayload = {
            op: 2,
            d: {
                token: this.botToken,
                intents: 513, // GUILDS + GUILD_MESSAGES
                properties: {
                    $os: 'linux',
                    $browser: 'sillytavern-chatbridge',
                    $device: 'sillytavern-chatbridge'
                }
            }
        };

        this.ws.send(JSON.stringify(identifyPayload));
    }

    /**
     * Start heartbeat interval
     */
    _startHeartbeat(interval) {
        this._stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            this._sendHeartbeat();
        }, interval);
    }

    /**
     * Stop heartbeat interval
     */
    _stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Send heartbeat to Discord
     */
    _sendHeartbeat() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                op: 1,
                d: this.sequenceNumber
            }));
        }
    }

    /**
     * Normalize Discord message to standard format
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
