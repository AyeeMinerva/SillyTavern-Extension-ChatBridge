/**
 * CharacterManager - Manage SillyTavern characters and user preferences
 * 
 * Responsibilities:
 * - Fetch available characters from SillyTavern
 * - Store user character preferences (which character they're talking to)
 * - Provide character information
 */

import { getContext } from "../../../../../extensions.js";

export class CharacterManager {
    constructor() {
        // Store user character preferences
        // Format: { 'platform_userId': 'characterId' }
        this.userPreferences = new Map();
        
        // Cache of available characters
        this.charactersCache = null;
        this.cacheTimestamp = null;
        this.CACHE_DURATION = 60000; // 1 minute
    }
    
    /**
     * Get all available characters from SillyTavern
     */
    async getAvailableCharacters() {
        // Check cache
        if (this.charactersCache && this.cacheTimestamp) {
            const age = Date.now() - this.cacheTimestamp;
            if (age < this.CACHE_DURATION) {
                return this.charactersCache;
            }
        }
        
        try {
            const context = getContext();
            
            // SillyTavern stores characters in context.characters
            // Each character has: avatar, name, chat, create_date, etc.
            const characters = context.characters || [];
            
            // Transform to our format
            const transformed = characters.map(char => ({
                id: char.avatar || char.name, // Use avatar as unique ID
                name: char.name,
                avatar: char.avatar,
                description: char.description || '',
                createdAt: char.create_date,
                // Additional metadata
                personality: char.personality || '',
                scenario: char.scenario || '',
                firstMessage: char.first_mes || ''
            }));
            
            // Update cache
            this.charactersCache = transformed;
            this.cacheTimestamp = Date.now();
            
            return transformed;
        } catch (error) {
            console.error('[CharacterManager] Failed to fetch characters:', error);
            return [];
        }
    }
    
    /**
     * Get a specific character by ID
     */
    async getCharacterById(characterId) {
        const characters = await this.getAvailableCharacters();
        return characters.find(c => c.id === characterId);
    }
    
    /**
     * Get a character by name (case-insensitive)
     */
    async getCharacterByName(name) {
        const characters = await this.getAvailableCharacters();
        return characters.find(c => 
            c.name.toLowerCase() === name.toLowerCase()
        );
    }
    
    /**
     * Actually switch to a character in SillyTavern
     * This loads the character and starts a new chat session
     * @param {string} characterId - Character ID (avatar filename)
     * @returns {Promise<Object>} - Character info and chat details
     */
    async activateCharacter(characterId) {
        try {
            const context = getContext();
            const character = await this.getCharacterById(characterId);
            
            if (!character) {
                throw new Error(`Character ${characterId} not found`);
            }
            
            console.log(`[CharacterManager] Activating character: ${character.name}`);
            
            // Find character index in SillyTavern's character list
            const charIndex = context.characters.findIndex(c => 
                (c.avatar || c.name) === characterId
            );
            
            if (charIndex === -1) {
                throw new Error(`Character index not found for ${characterId}`);
            }
            
            // Method 1: Try SillyTavern's selectCharacterById function
            if (typeof window.selectCharacterById === 'function') {
                await window.selectCharacterById(String(charIndex));
                console.log(`[CharacterManager] Used selectCharacterById for ${character.name}`);
            } 
            // Method 2: Try setCharacterId global function
            else if (typeof window.setCharacterId === 'function') {
                await window.setCharacterId(charIndex);
                console.log(`[CharacterManager] Used setCharacterId for ${character.name}`);
            }
            // Method 3: Simulate clicking the character in the UI
            else {
                // Find the character's button/element in the UI and click it
                const charButtons = document.querySelectorAll('.character_select');
                if (charButtons && charButtons[charIndex]) {
                    charButtons[charIndex].click();
                    console.log(`[CharacterManager] Clicked character button for ${character.name}`);
                } else {
                    // Method 4: Direct context manipulation
                    context.characterId = charIndex;
                    context.name2 = character.name;
                    
                    // Trigger character change through jQuery event
                    const event = new CustomEvent('character_selected', { 
                        detail: { characterId: charIndex } 
                    });
                    window.dispatchEvent(event);
                    
                    console.log(`[CharacterManager] Manually set character ${character.name} via context`);
                }
            }
            
            return {
                character,
                chatId: context.getCurrentChatId(),
                success: true
            };
        } catch (error) {
            console.error('[CharacterManager] Failed to activate character:', error);
            throw error;
        }
    }
    
    /**
     * Get user's current character preference
     * @param {string} platform - Platform name (telegram, discord, etc.)
     * @param {string} userId - Platform-specific user ID
     * @returns {string|null} - Character ID or null
     */
    getUserCharacterPreference(platform, userId) {
        const key = `${platform}_${userId}`;
        return this.userPreferences.get(key) || null;
    }
    
    /**
     * Set user's character preference
     * @param {string} platform - Platform name
     * @param {string} userId - Platform-specific user ID
     * @param {string} characterId - Character ID to set
     */
    setUserCharacterPreference(platform, userId, characterId) {
        const key = `${platform}_${userId}`;
        this.userPreferences.set(key, characterId);
        
        // Persist to extension settings
        this.savePreferences();
    }
    
    /**
     * Get or auto-select a character for user
     * Priority:
     * 1. User's saved preference
     * 2. Most recently used character in SillyTavern
     * 3. First available character
     */
    async getOrAutoSelectCharacter(platform, userId) {
        // Check user preference
        let characterId = this.getUserCharacterPreference(platform, userId);
        if (characterId) {
            const character = await this.getCharacterById(characterId);
            if (character) {
                return character;
            }
        }
        
        // Get available characters
        const characters = await this.getAvailableCharacters();
        if (characters.length === 0) {
            return null;
        }
        
        // Try to get current character from SillyTavern context
        try {
            const context = getContext();
            const currentCharName = context.name2; // Current character name
            
            if (currentCharName) {
                const currentChar = characters.find(c => c.name === currentCharName);
                if (currentChar) {
                    // Auto-select this character for user
                    this.setUserCharacterPreference(platform, userId, currentChar.id);
                    return currentChar;
                }
            }
        } catch (error) {
            console.error('[CharacterManager] Error getting current character:', error);
        }
        
        // Fallback: use first character
        const firstChar = characters[0];
        this.setUserCharacterPreference(platform, userId, firstChar.id);
        return firstChar;
    }
    
    /**
     * Clear character cache (force refresh)
     */
    clearCache() {
        this.charactersCache = null;
        this.cacheTimestamp = null;
    }
    
    /**
     * Load user preferences from storage
     */
    loadPreferences(preferencesData) {
        if (!preferencesData) return;
        
        try {
            // preferencesData is an object: { 'platform_userId': 'characterId' }
            this.userPreferences = new Map(Object.entries(preferencesData));
        } catch (error) {
            console.error('[CharacterManager] Error loading preferences:', error);
        }
    }
    
    /**
     * Export user preferences for storage
     */
    exportPreferences() {
        return Object.fromEntries(this.userPreferences);
    }
    
    /**
     * Save preferences to extension settings
     * This should be called by the main extension
     */
    savePreferences() {
        // This will be implemented in the main extension
        // Just emit an event or return data for now
        return this.exportPreferences();
    }
    
    /**
     * Get statistics about user preferences
     */
    getStats() {
        const stats = {
            totalUsers: this.userPreferences.size,
            characterUsage: {}
        };
        
        for (const [user, charId] of this.userPreferences.entries()) {
            stats.characterUsage[charId] = (stats.characterUsage[charId] || 0) + 1;
        }
        
        return stats;
    }
}
