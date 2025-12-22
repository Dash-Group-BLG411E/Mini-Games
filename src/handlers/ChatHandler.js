

class ChatHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }

    

    registerHandlers(socket) {
        socket.on('lobbyChatMessage', ({ message }) => {
            const username = socket.user?.username;
            if (!username || !message || !message.trim()) return;
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

        socket.on('roomChatMessage', ({ roomId, message }) => {
            const username = socket.user?.username;
            if (!username || !message || !roomId) return;
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
