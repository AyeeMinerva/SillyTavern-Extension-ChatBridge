/**
 * SessionManager - Manages character-user interaction sessions across multiple platforms
 * Enables users to continue conversations with the same character across different clients
 */

export class SessionManager {
    constructor() {
        // Map: sessionId -> SessionData
        this.sessions = new Map();
        // Map: platform:userId:characterId -> sessionId
        this.sessionIndex = new Map();
    }

    /**
     * Create a session key from platform, user ID, and character ID
     */
    _createSessionKey(platform, userId, characterId) {
        return `${platform}:${userId}:${characterId}`;
    }

    /**
     * Get or create a session for a user-character pair
     * @param {string} platform - Platform identifier (discord, telegram, wechat)
     * @param {string} userId - Platform-specific user ID
     * @param {string} characterId - SillyTavern character ID
     * @returns {string} sessionId
     */
    getOrCreateSession(platform, userId, characterId) {
        const sessionKey = this._createSessionKey(platform, userId, characterId);
        
        // Check if session already exists
        if (this.sessionIndex.has(sessionKey)) {
            const sessionId = this.sessionIndex.get(sessionKey);
            const session = this.sessions.get(sessionId);
            session.lastActivity = Date.now();
            return sessionId;
        }

        // Create new session
        const sessionId = this._generateSessionId();
        const session = {
            id: sessionId,
            platform,
            userId,
            characterId,
            messageHistory: [],
            metadata: {},
            createdAt: Date.now(),
            lastActivity: Date.now()
        };

        this.sessions.set(sessionId, session);
        this.sessionIndex.set(sessionKey, sessionId);

        return sessionId;
    }

    /**
     * Get session by ID
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    /**
     * Add message to session history
     */
    addMessage(sessionId, message) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        session.messageHistory.push({
            ...message,
            timestamp: Date.now()
        });
        session.lastActivity = Date.now();
    }

    /**
     * Get message history for a session
     */
    getMessageHistory(sessionId) {
        const session = this.sessions.get(sessionId);
        return session ? session.messageHistory : [];
    }

    /**
     * Update session metadata
     */
    updateMetadata(sessionId, metadata) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.metadata = { ...session.metadata, ...metadata };
        }
    }

    /**
     * Delete a session
     */
    deleteSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            const sessionKey = this._createSessionKey(
                session.platform,
                session.userId,
                session.characterId
            );
            this.sessionIndex.delete(sessionKey);
            this.sessions.delete(sessionId);
        }
    }

    /**
     * Clean up old inactive sessions (older than 24 hours)
     */
    cleanupInactiveSessions(maxAge = 24 * 60 * 60 * 1000) {
        const now = Date.now();
        const toDelete = [];

        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.lastActivity > maxAge) {
                toDelete.push(sessionId);
            }
        }

        toDelete.forEach(sessionId => this.deleteSession(sessionId));
        return toDelete.length;
    }

    /**
     * Get all active sessions
     */
    getActiveSessions() {
        return Array.from(this.sessions.values());
    }

    /**
     * Export session data for persistence
     */
    exportSessions() {
        return {
            sessions: Array.from(this.sessions.entries()),
            index: Array.from(this.sessionIndex.entries())
        };
    }

    /**
     * Import session data from persistence
     */
    importSessions(data) {
        if (data.sessions) {
            this.sessions = new Map(data.sessions);
        }
        if (data.index) {
            this.sessionIndex = new Map(data.index);
        }
    }

    /**
     * Generate a unique session ID
     */
    _generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
