/**
 * WeChatAdapter - Platform adapter for WeChat bot integration
 * Uses webhook-based approach for receiving messages
 * Note: WeChat requires a verified webhook server
 */

import { PlatformAdapter } from '../core/PlatformAdapter.js';

export class WeChatAdapter extends PlatformAdapter {
    constructor(config) {
        super(config);
        this.appId = config.appId;
        this.appSecret = config.appSecret;
        this.token = config.token;
        this.webhookUrl = config.webhookUrl;
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    /**
     * Validate WeChat configuration
     */
    validateConfig() {
        if (!this.appId || !this.appSecret || !this.token) {
            throw new Error('WeChat appId, appSecret, and token are required');
        }
    }

    /**
     * Connect to WeChat API
     */
    async connect() {
        try {
            // Get access token
            await this._refreshAccessToken();
            
            console.log('[WeChat] Bot connected with appId:', this.appId);
            this._updateStatus(true);

            // Set up token refresh interval (every 2 hours)
            this.tokenRefreshInterval = setInterval(() => {
                this._refreshAccessToken();
            }, 2 * 60 * 60 * 1000);

        } catch (error) {
            console.error('[WeChat] Connection failed:', error);
            this._updateStatus(false);
            throw error;
        }
    }

    /**
     * Disconnect from WeChat
     */
    async disconnect() {
        if (this.tokenRefreshInterval) {
            clearInterval(this.tokenRefreshInterval);
            this.tokenRefreshInterval = null;
        }
        this.accessToken = null;
        this._updateStatus(false);
    }

    /**
     * Send a message to WeChat user
     */
    async sendMessage(openId, message, options = {}) {
        try {
            if (!this.accessToken) {
                await this._refreshAccessToken();
            }

            const messageData = {
                touser: openId,
                msgtype: options.msgType || 'text',
                text: {
                    content: message
                }
            };

            const response = await fetch(
                `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${this.accessToken}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(messageData)
                }
            );

            const data = await response.json();

            if (data.errcode !== 0) {
                throw new Error(`Failed to send WeChat message: ${data.errmsg}`);
            }

            return data;
        } catch (error) {
            console.error('[WeChat] Failed to send message:', error);
            throw error;
        }
    }

    /**
     * Refresh WeChat access token
     */
    async _refreshAccessToken() {
        try {
            const response = await fetch(
                `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`
            );

            const data = await response.json();

            if (data.access_token) {
                this.accessToken = data.access_token;
                this.tokenExpiry = Date.now() + (data.expires_in * 1000);
                console.log('[WeChat] Access token refreshed');
            } else {
                throw new Error(`Failed to get access token: ${data.errmsg}`);
            }
        } catch (error) {
            console.error('[WeChat] Token refresh failed:', error);
            throw error;
        }
    }

    /**
     * Handle incoming webhook message from WeChat
     * This should be called by your webhook server
     */
    async handleWebhookMessage(messageData) {
        // WeChat message format
        const { FromUserName, Content, MsgType, CreateTime } = messageData;

        if (MsgType === 'text') {
            await this._handleIncomingMessage({
                userId: FromUserName,
                content: Content,
                messageId: messageData.MsgId,
                metadata: {
                    msgType: MsgType,
                    createTime: CreateTime,
                    toUserName: messageData.ToUserName
                }
            });
        }
    }

    /**
     * Verify WeChat webhook signature
     * Should be used when setting up webhook
     */
    verifyWebhookSignature(signature, timestamp, nonce) {
        const crypto = require('crypto');
        const tmpArr = [this.token, timestamp, nonce].sort();
        const tmpStr = tmpArr.join('');
        const hash = crypto.createHash('sha1').update(tmpStr).digest('hex');
        return hash === signature;
    }

    /**
     * Normalize WeChat message to standard format
     */
    normalizeMessage(platformMessage) {
        return {
            role: 'user',
            content: platformMessage.content,
            userId: platformMessage.userId,
            platform: this.platform,
            timestamp: Date.now(),
            metadata: platformMessage.metadata || {}
        };
    }
}
