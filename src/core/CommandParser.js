/**
 * CommandParser - Parse and execute slash commands from platform messages
 * 
 * Supported commands:
 * - /char                    - List available characters
 * - /char [name]             - Switch to character by name
 * - /session                 - Show current session info
 * - /session list            - List all user sessions
 * - /session new             - Create new session with current character
 * - /session switch [id]     - Switch to different session
 * - /help                    - Show available commands
 */

export class CommandParser {
    constructor(characterManager, sessionManager) {
        this.characterManager = characterManager;
        this.sessionManager = sessionManager;
        
        // Command registry
        this.commands = {
            'char': this.handleCharCommand.bind(this),
            'character': this.handleCharCommand.bind(this),
            'session': this.handleSessionCommand.bind(this),
            'help': this.handleHelpCommand.bind(this)
        };
    }
    
    /**
     * Check if a message is a command
     */
    isCommand(message) {
        return message.trim().startsWith('/');
    }
    
    /**
     * Parse and execute a command
     * @returns {Object} { isCommand, response, characterId, sessionId }
     */
    async parseCommand(message, context) {
        if (!this.isCommand(message)) {
            return { isCommand: false };
        }
        
        // Parse command and arguments
        const trimmed = message.trim().substring(1); // Remove leading /
        const parts = trimmed.split(/\s+/);
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        // Execute command
        const handler = this.commands[command];
        if (!handler) {
            return {
                isCommand: true,
                response: `❌ Unknown command: /${command}\n\nType /help to see available commands.`
            };
        }
        
        try {
            const result = await handler(args, context);
            return {
                isCommand: true,
                ...result
            };
        } catch (error) {
            return {
                isCommand: true,
                response: `❌ Error executing command: ${error.message}`
            };
        }
    }
    
    /**
     * Handle /char command
     */
    async handleCharCommand(args, context) {
        const { platform, userId } = context;
        
        // No arguments: list all characters
        if (args.length === 0) {
            const characters = await this.characterManager.getAvailableCharacters();
            const currentCharId = this.characterManager.getUserCharacterPreference(platform, userId);
            
            let response = '📋 Available Characters:\n\n';
            
            if (characters.length === 0) {
                response += '❌ No characters found in SillyTavern.\n\n';
                response += 'Please create characters in SillyTavern first.';
            } else {
                characters.forEach((char, index) => {
                    const current = char.id === currentCharId ? '✅ ' : '   ';
                    // Show both number and character name clearly
                    response += `${current}${index + 1}. ${char.name}\n`;
                    if (char.description) {
                        response += `      ${char.description.substring(0, 50)}${char.description.length > 50 ? '...' : ''}\n`;
                    }
                });
                
                response += '\n💡 How to use:\n';
                response += '• Type: /char [character name]\n';
                response += `• Example: /char ${characters[0].name}\n`;
                response += '\n📝 Tip: Character names are case-insensitive';
            }
            
            return { response };
        }
        
        // With argument: switch character
        const characterName = args.join(' ');
        const characters = await this.characterManager.getAvailableCharacters();
        
        // Find character by name (case-insensitive)
        const character = characters.find(c => 
            c.name.toLowerCase() === characterName.toLowerCase()
        );
        
        if (!character) {
            return {
                response: `❌ Character "${characterName}" not found.\n\nType /char to see available characters.`
            };
        }
        
        // Save user preference
        this.characterManager.setUserCharacterPreference(platform, userId, character.id);
        
        // Actually activate the character in SillyTavern
        try {
            await this.characterManager.activateCharacter(character.id);
        } catch (error) {
            console.error('[CommandParser] Failed to activate character:', error);
            return {
                response: `⚠️ Switched preference to ${character.name}, but failed to activate in SillyTavern.\n\nError: ${error.message}`
            };
        }
        
        // Create or get session for this character
        const sessionId = this.sessionManager.getOrCreateSession(
            platform, 
            userId, 
            character.id
        );
        
        // Send character's first message if available
        let response = `✅ Switched to character: ${character.name}\n\n`;
        if (character.firstMessage) {
            response += `${character.firstMessage}`;
        } else {
            response += `You can now chat with ${character.name}!`;
        }
        
        return {
            response,
            characterId: character.id,
            sessionId: sessionId,
            sendFirstMessage: true  // Flag to indicate this is an initial greeting
        };
    }
    
    /**
     * Handle /session command
     */
    async handleSessionCommand(args, context) {
        const { platform, userId } = context;
        const subcommand = args[0]?.toLowerCase();
        
        // No arguments: show current session info
        if (!subcommand) {
            const currentCharId = this.characterManager.getUserCharacterPreference(platform, userId);
            if (!currentCharId) {
                return {
                    response: '❌ No active session.\n\nUse /char to select a character first.'
                };
            }
            
            const sessions = this.sessionManager.getUserSessions(platform, userId, currentCharId);
            const activeSession = sessions.find(s => s.isActive);
            
            if (!activeSession) {
                return {
                    response: '❌ No active session found.'
                };
            }
            
            const character = await this.characterManager.getCharacterById(currentCharId);
            const messageCount = activeSession.messageHistory.length;
            const lastMessageTime = activeSession.lastMessageAt 
                ? new Date(activeSession.lastMessageAt).toLocaleString()
                : 'Never';
            
            let response = '📊 **Current Session Info:**\n\n';
            response += `👤 Character: **${character?.name || 'Unknown'}**\n`;
            response += `💬 Messages: ${messageCount}\n`;
            response += `🕐 Last message: ${lastMessageTime}\n`;
            response += `🆔 Session ID: ${activeSession.sessionId}\n\n`;
            response += '💡 Type `/session list` to see all your sessions.';
            
            return { response };
        }
        
        // Subcommand: list
        if (subcommand === 'list') {
            const currentCharId = this.characterManager.getUserCharacterPreference(platform, userId);
            if (!currentCharId) {
                return {
                    response: '❌ No character selected.\n\nUse /char to select a character first.'
                };
            }
            
            const sessions = this.sessionManager.getUserSessions(platform, userId, currentCharId);
            
            if (sessions.length === 0) {
                return {
                    response: '❌ No sessions found for current character.'
                };
            }
            
            const character = await this.characterManager.getCharacterById(currentCharId);
            let response = `📋 **Sessions with ${character?.name || 'Unknown'}:**\n\n`;
            
            sessions.forEach((session, index) => {
                const active = session.isActive ? '✅ ' : '';
                const messageCount = session.messageHistory.length;
                const lastMsg = session.lastMessageAt 
                    ? new Date(session.lastMessageAt).toLocaleString()
                    : 'Never';
                
                response += `${active}${index + 1}. Session ${session.sessionId.split('_').pop()}\n`;
                response += `   💬 ${messageCount} messages | 🕐 ${lastMsg}\n`;
            });
            
            response += '\n💡 Type `/session switch [number]` to switch session.';
            
            return { response };
        }
        
        // Subcommand: new
        if (subcommand === 'new') {
            const currentCharId = this.characterManager.getUserCharacterPreference(platform, userId);
            if (!currentCharId) {
                return {
                    response: '❌ No character selected.\n\nUse /char to select a character first.'
                };
            }
            
            const character = await this.characterManager.getCharacterById(currentCharId);
            const newSessionId = this.sessionManager.createNewSession(platform, userId, currentCharId);
            
            return {
                response: `✅ Created new session with **${character?.name || 'Unknown'}**\n\nSession ID: ${newSessionId}`,
                sessionId: newSessionId
            };
        }
        
        // Subcommand: switch
        if (subcommand === 'switch') {
            const sessionIndex = parseInt(args[1]) - 1; // 1-based to 0-based
            
            if (isNaN(sessionIndex) || sessionIndex < 0) {
                return {
                    response: '❌ Invalid session number.\n\nUsage: /session switch [number]'
                };
            }
            
            const currentCharId = this.characterManager.getUserCharacterPreference(platform, userId);
            if (!currentCharId) {
                return {
                    response: '❌ No character selected.\n\nUse /char to select a character first.'
                };
            }
            
            const sessions = this.sessionManager.getUserSessions(platform, userId, currentCharId);
            
            if (sessionIndex >= sessions.length) {
                return {
                    response: `❌ Session ${sessionIndex + 1} not found.\n\nType /session list to see available sessions.`
                };
            }
            
            const targetSession = sessions[sessionIndex];
            this.sessionManager.switchToSession(targetSession.sessionId);
            
            const messageCount = targetSession.messageHistory.length;
            
            return {
                response: `✅ Switched to session ${sessionIndex + 1}\n\n💬 ${messageCount} messages in history`,
                sessionId: targetSession.sessionId
            };
        }
        
        return {
            response: `❌ Unknown subcommand: ${subcommand}\n\nAvailable: list, new, switch`
        };
    }
    
    /**
     * Handle /help command
     */
    async handleHelpCommand(args, context) {
        let response = '📖 **ChatBridge Command Reference**\n\n';
        
        response += '**Character Management:**\n';
        response += '• `/char` - List all available characters\n';
        response += '• `/char [name]` - Switch to a character\n';
        response += '• Example: `/char Alice`\n\n';
        
        response += '**Session Management:**\n';
        response += '• `/session` - Show current session info\n';
        response += '• `/session list` - List all your sessions\n';
        response += '• `/session new` - Create a new session\n';
        response += '• `/session switch [n]` - Switch to session #n\n\n';
        
        response += '**Other:**\n';
        response += '• `/help` - Show this help message\n\n';
        
        response += '💡 **Tip:** Messages are automatically saved to your active session!';
        
        return { response };
    }
}
