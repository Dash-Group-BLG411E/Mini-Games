class LobbySocketHandler {
    constructor(app) {
        this.app = app;
    }

    registerHandlers(socket) {
        socket.on('lobbyUpdate', (data) => {
            this.handleLobbyUpdate(data);
        });

        socket.on('lobbyMessages', (messages) => {
            this.app.lobbyMessages = messages || [];
            if (this.app.chatRenderer && this.app.chatRenderer.renderLobbyMessages) {
                this.app.chatRenderer.renderLobbyMessages();
            }
        });

        socket.on('lobbyMessage', (message) => {
            this.app.lobbyMessages.push(message);
            if (this.app.lobbyMessages.length > 120) {
                this.app.lobbyMessages.shift();
            }
            if (this.app.chatRenderer && this.app.chatRenderer.renderLobbyMessages) {
                this.app.chatRenderer.renderLobbyMessages();
            }
        });

        socket.on('roomsList', (rooms) => {
            this.app.rooms = rooms;
            if (this.app.lobbyRenderer) {
                this.app.lobbyRenderer.updateRoomsList();
            }
            if (this.app.roomManager) {
                this.app.roomManager.updateRoomInfoBox();
            }
        });
    }

    handleLobbyUpdate(data) {
        this.app.rooms = data.rooms || [];
        if (data.users) {
            if (Array.isArray(data.users) && data.users.length > 0 && typeof data.users[0] === 'object') {
                this.app.lobbyUsers = data.users.map(u => u.username);
                this.app.userRolesMap.clear();
                this.app.userAvatarsMap.clear();
                this.app.userInGameMap.clear();
                data.users.forEach(u => {
                    if (u.username && u.role) {
                        this.app.userRolesMap.set(u.username, u.role);
                    }
                    if (u.username && u.avatar) {
                        this.app.userAvatarsMap.set(u.username, u.avatar);
                        // Also cache in avatar manager
                        if (this.app.avatarManager) {
                            this.app.avatarManager.playerAvatarsCache.set(u.username.toLowerCase(), u.avatar);
                        }
                    }
                    if (u.username && typeof u.isInGame !== 'undefined') {
                        this.app.userInGameMap.set(u.username, u.isInGame);
                    }
                });
            } else {
                this.app.lobbyUsers = data.users;
            }
        } else {
            this.app.lobbyUsers = [];
        }
        if (this.app.lobbyRenderer) {
            this.app.lobbyRenderer.updateLobbyUsers();
            this.app.lobbyRenderer.updateRoomsList();
        }
    }
}
