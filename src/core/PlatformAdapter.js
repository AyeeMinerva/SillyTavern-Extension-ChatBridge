/**
 * PlatformAdapter - Base class for all platform-specific adapters
 * Defines the interface that all platform adapters must implement
 */

export class PlatformAdapter {
    constructor(config) {
        this.config = config;
        this.platform = config.platform;
        this.isConnected = false;
        this.messageQueue = [];
    }

    /**
     * Initialize and connect to the platform
     * Must be implemented by subclasses
     */
    async connect() {
        throw new Error('connect() must be implemented by subclass');
    }

    /**
     * Disconnect from the platform
     * Must be implemented by subclasses
     */
    async disconnect() {
        throw new Error('disconnect() must be implemented by subclass');
    }

    /**
     * Send a message to the platform
     * @param {string} userId - Platform-specific user ID
     * @param {string} message - Message content
     * @param {object} options - Additional platform-specific options
     */
    async sendMessage(userId, message, options = {}) {
        throw new Error('sendMessage() must be implemented by subclass');
    }

    /**
     * Register a message handler
     * @param {function} handler - Handler function(userId, message, metadata)
     */
    onMessage(handler) {
        this.messageHandler = handler;
    }

    /**
     * Register a connection status handler
     * @param {function} handler - Handler function(isConnected)
     */
    onStatusChange(handler) {
        this.statusHandler = handler;
    }

    /**
     * Validate configuration
     * Must be implemented by subclasses
     */
    validateConfig() {
        throw new Error('validateConfig() must be implemented by subclass');
    }

    /**
     * Get platform display name
     */
    getPlatformName() {
        return this.platform;
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            platform: this.platform,
            isConnected: this.isConnected,
            config: this.config
        };
    }

    /**
     * Convert platform-specific message to standardized format
     * @param {object} platformMessage - Platform-specific message object
     * @returns {object} Standardized message object
     */
    normalizeMessage(platformMessage) {
        return {
            role: 'user',
            content: platformMessage.content || platformMessage.text || '',
            userId: platformMessage.userId,
            platform: this.platform,
            timestamp: Date.now(),
            metadata: platformMessage.metadata || {}
        };
    }

    /**
     * Convert standardized message to OpenAI format
     * @param {array} messages - Array of standardized messages
     * @returns {array} OpenAI-formatted messages
     */
    toOpenAIFormat(messages) {
        return messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }

    /**
     * Handle incoming message from platform
     */
    async _handleIncomingMessage(platformMessage) {
        if (!this.messageHandler) {
            this.messageQueue.push(platformMessage);
            return;
        }

        const normalizedMessage = this.normalizeMessage(platformMessage);
        await this.messageHandler(
            normalizedMessage.userId,
            normalizedMessage.content,
            normalizedMessage.metadata
        );
    }

    /**
     * Update connection status
     */
    _updateStatus(isConnected) {
        this.isConnected = isConnected;
        if (this.statusHandler) {
            this.statusHandler(isConnected);
        }
    }
}

/**
 * PlatformAdapterRegistry - Manages all platform adapters
 */
export class PlatformAdapterRegistry {
    constructor() {
        this.adapters = new Map();
        this.adapterClasses = new Map();
    }

    /**
     * Register a platform adapter class
     * @param {string} platform - Platform identifier
     * @param {class} adapterClass - PlatformAdapter subclass
     */
    registerAdapterClass(platform, adapterClass) {
        this.adapterClasses.set(platform, adapterClass);
    }

    /**
     * Create and register an adapter instance
     * @param {string} platform - Platform identifier
     * @param {object} config - Adapter configuration
     * @returns {PlatformAdapter} Adapter instance
     */
    createAdapter(platform, config) {
        const AdapterClass = this.adapterClasses.get(platform);
        if (!AdapterClass) {
            throw new Error(`No adapter class registered for platform: ${platform}`);
        }

        const adapterId = `${platform}_${Date.now()}`;
        const adapter = new AdapterClass({ ...config, platform });
        
        adapter.validateConfig();
        this.adapters.set(adapterId, adapter);
        
        return { id: adapterId, adapter };
    }

    /**
     * Get adapter by ID
     */
    getAdapter(adapterId) {
        return this.adapters.get(adapterId);
    }

    /**
     * Remove adapter
     */
    async removeAdapter(adapterId) {
        const adapter = this.adapters.get(adapterId);
        if (adapter) {
            await adapter.disconnect();
            this.adapters.delete(adapterId);
        }
    }

    /**
     * Get all adapters
     */
    getAllAdapters() {
        return Array.from(this.adapters.entries());
    }

    /**
     * Get supported platforms
     */
    getSupportedPlatforms() {
        return Array.from(this.adapterClasses.keys());
    }
}
