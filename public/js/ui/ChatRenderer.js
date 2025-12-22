

class ChatRenderer {
    constructor(app) {
        this.app = app;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.lobbyChatList = document.getElementById('lobby-chat-list');
        this.roomChatList = document.getElementById('room-chat-list');
        this.lobbyChatForm = document.getElementById('lobby-chat-form');
        this.lobbyChatInput = document.getElementById('lobby-chat-input');
        this.roomChatForm = document.getElementById('room-chat-form');
        this.roomChatInput = document.getElementById('room-chat-input');
        
        if (this.lobbyChatForm && this.lobbyChatInput) {
            this.lobbyChatForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const message = this.lobbyChatInput.value.trim();
                if (!message) return;
                
                if (this.app.socket && this.app.socket.connected) {
                    this.sendLobbyChat(message);
                    this.lobbyChatInput.value = '';
                } else {
                    console.warn('Socket not connected, initializing...');
                    if (this.app.initializeSocket) {
                        this.app.initializeSocket();
                        setTimeout(() => {
                            if (this.app.socket && this.app.socket.connected) {
                                this.sendLobbyChat(message);
                                this.lobbyChatInput.value = '';
                            }
                        }, 1000);
                    }
                }
            });
        }

        if (this.roomChatForm && this.roomChatInput) {
            this.roomChatForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const message = this.roomChatInput.value.trim();
                if (!message) return;
                
                if (this.app.socket && this.app.socket.connected && this.app.currentRoom) {
                    this.sendRoomChat(message);
                    this.roomChatInput.value = '';
                } else {
                    console.warn('Socket not connected or no room');
                    if (this.app.initializeSocket) {
                        this.app.initializeSocket();
                        setTimeout(() => {
                            if (this.app.socket && this.app.socket.connected && this.app.currentRoom) {
                                this.sendRoomChat(message);
                                this.roomChatInput.value = '';
                            }
                        }, 1000);
                    }
                }
            });
        }
    }

    

    renderLobbyMessages() {
        if (!this.lobbyChatList) return;
        this.lobbyChatList.innerHTML = '';
        this.app.lobbyMessages.forEach(({ username, message, timestamp }) => {
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message';
            messageElement.innerHTML = `<strong>${username}</strong><span>${this.formatTimestamp(timestamp)}</span><p>${message}</p>`;
            this.lobbyChatList.appendChild(messageElement);
        });
        this.lobbyChatList.scrollTop = this.lobbyChatList.scrollHeight;
    }

    

    renderRoomMessages() {
        if (!this.roomChatList) return;
        this.roomChatList.innerHTML = '';
        this.app.roomMessages.forEach(({ username, message, timestamp }) => {
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message';
            messageElement.innerHTML = `<strong>${username}</strong><span>${this.formatTimestamp(timestamp)}</span><p>${message}</p>`;
            this.roomChatList.appendChild(messageElement);
        });
        this.roomChatList.scrollTop = this.roomChatList.scrollHeight;
    }

    

    sendLobbyChat(message) {
        if (!message) return;
        if (!this.app.socket || !this.app.socket.connected) {
            console.warn('Socket not connected, cannot send lobby chat');
            if (this.app.initializeSocket) {
                this.app.initializeSocket();
            }
            return;
        }
        this.app.socket.emit('lobbyChatMessage', { message });
    }

    

    sendRoomChat(message) {
        if (!message || !this.app.currentRoom) return;
        if (!this.app.socket || !this.app.socket.connected) {
            console.warn('Socket not connected, cannot send room chat');
            if (this.app.initializeSocket) {
                this.app.initializeSocket();
            }
            return;
        }
        this.app.socket.emit('roomChatMessage', { roomId: this.app.currentRoom, message });
    }

    

    formatTimestamp(value) {
        const date = new Date(value || Date.now());
        return date.toLocaleTimeString();
    }
}
