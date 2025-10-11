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
    
    /**
     * Get all sessions for a specific user and character
     * @param {string} platform - Platform identifier
     * @param {string} userId - Platform-specific user ID
     * @param {string} characterId - Character ID
     * @returns {Array} Array of session objects
     */
    getUserSessions(platform, userId, characterId) {
        const sessions = [];
        const sessionKey = this._createSessionKey(platform, userId, characterId);
        
        for (const [sid, session] of this.sessions.entries()) {
            if (session.platform === platform && 
                session.userId === userId && 
                session.characterId === characterId) {
                sessions.push({
                    ...session,
                    sessionId: sid,
                    isActive: this.sessionIndex.get(sessionKey) === sid
                });
            }
        }
        
        // Sort by last activity (most recent first)
        sessions.sort((a, b) => b.lastActivity - a.lastActivity);
        
        return sessions;
    }
    
    /**
     * Create a new session for a user-character pair
     * (Even if one already exists, useful for starting fresh conversations)
     * @returns {string} New session ID
     */
    createNewSession(platform, userId, characterId) {
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
        
        // Update index to point to this new session
        const sessionKey = this._createSessionKey(platform, userId, characterId);
        this.sessionIndex.set(sessionKey, sessionId);
        
        return sessionId;
    }
    
    /**
     * Switch to a different session
     * @param {string} sessionId - Target session ID
     */
    switchToSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        
        // Update index to point to this session
        const sessionKey = this._createSessionKey(
            session.platform,
            session.userId,
            session.characterId
        );
        this.sessionIndex.set(sessionKey, sessionId);
        
        // Update last activity
        session.lastActivity = Date.now();
    }
    
    /**
     * Get the most recent session for a user across all characters
     * @param {string} platform - Platform identifier
     * @param {string} userId - Platform-specific user ID
     * @returns {Object|null} Most recent session or null
     */
    getMostRecentUserSession(platform, userId) {
        let mostRecent = null;
        let latestActivity = 0;
        
        for (const session of this.sessions.values()) {
            if (session.platform === platform && 
                session.userId === userId &&
                session.lastActivity > latestActivity) {
                mostRecent = session;
                latestActivity = session.lastActivity;
            }
        }
        
        return mostRecent;
    }
    
    /**
     * Get all sessions for a user across all characters
     * @param {string} platform - Platform identifier
     * @param {string} userId - Platform-specific user ID
     * @returns {Array} Array of session objects grouped by character
     */
    getAllUserSessions(platform, userId) {
        const sessions = [];
        
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.platform === platform && session.userId === userId) {
                sessions.push({
                    ...session,
                    sessionId
                });
            }
        }
        
        // Sort by last activity (most recent first)
        sessions.sort((a, b) => b.lastActivity - a.lastActivity);
        
        return sessions;
    }
    
    /**
     * Check if a user has any sessions with a specific character
     * @returns {boolean}
     */
    hasUserCharacterSession(platform, userId, characterId) {
        const sessionKey = this._createSessionKey(platform, userId, characterId);
        return this.sessionIndex.has(sessionKey);
    }
}
