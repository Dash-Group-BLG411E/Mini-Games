

class ChatHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }

    async checkUserMuted(username) {
        const User = require('../models/User');
        try {
            const user = await User.findOne({ username: username.toLowerCase() });
            if (!user) return { isMuted: false };

            if (user.isMuted) {
                // Check if mute has expired
                if (user.muteExpiresAt && new Date() > user.muteExpiresAt) {
                    // Mute expired, clear it
                    user.isMuted = false;
                    user.muteExpiresAt = null;
                    user.muteReason = null;
                    await user.save();
                    return { isMuted: false };
                }
                return {
                    isMuted: true,
                    expiresAt: user.muteExpiresAt,
                    reason: user.muteReason
                };
            }
            return { isMuted: false };
        } catch (error) {
            console.error('Error checking mute status:', error);
            return { isMuted: false };
        }
    }

    registerHandlers(socket) {
        socket.on('lobbyChatMessage', async ({ message }) => {
            const username = socket.user?.username;
            if (!username || !message || !message.trim()) return;

            // Check if user is muted
            const muteStatus = await this.checkUserMuted(username);
            if (muteStatus.isMuted) {
                const remaining = muteStatus.expiresAt
                    ? Math.ceil((new Date(muteStatus.expiresAt) - new Date()) / 60000)
                    : 'indefinite';
                socket.emit('chatError', {
                    error: `You are muted. ${remaining === 'indefinite' ? 'This is permanent.' : `Time remaining: ${remaining} minutes.`}`
                });
                return;
            }

            const chatMessage = {
                username,
                message: message.trim(),
                timestamp: Date.now()
            };
            this.handlers.lobbyMessages.push(chatMessage);
            if (this.handlers.lobbyMessages.length > this.handlers.maxLobbyMessages) {
                this.handlers.lobbyMessages.shift();
            }
            this.handlers.io.emit('lobbyMessage', chatMessage);
        });

        socket.on('roomChatMessage', async ({ roomId, message }) => {
            const username = socket.user?.username;
            if (!username || !message || !roomId) return;

            // Check if user is muted
            const muteStatus = await this.checkUserMuted(username);
            if (muteStatus.isMuted) {
                const remaining = muteStatus.expiresAt
                    ? Math.ceil((new Date(muteStatus.expiresAt) - new Date()) / 60000)
                    : 'indefinite';
                socket.emit('chatError', {
                    error: `You are muted. ${remaining === 'indefinite' ? 'This is permanent.' : `Time remaining: ${remaining} minutes.`}`
                });
                return;
            }

            const chatMessage = {
                roomId,
                username,
                message: message.trim(),
                timestamp: Date.now()
            };
            this.handlers.io.to(roomId).emit('roomMessage', chatMessage);
        });
    }
}

module.exports = ChatHandler;
