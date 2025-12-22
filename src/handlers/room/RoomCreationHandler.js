class RoomCreationHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }

    registerHandlers(socket) {
        socket.on('createRoom', (data) => {
            const username = socket.user?.username;
            if (!username) {
                socket.emit('error', 'Authentication failed');
                return;
            }

            const GameRoom = require('../../core/GameRoom');
            const roomId = data.roomId || this.handlers.generateRoomId();
            const roomName = data.roomName || `Room ${roomId}`;
            const gameType = data.gameType || 'three-mens-morris';

            if (this.handlers.rooms.has(roomId)) {
                socket.emit('error', 'Room already exists');
                return;
            }

            const room = new GameRoom(roomId, roomName, gameType);
            const result = room.addPlayer(socket.id, username);

            if (result.success) {
                this.handlers.rooms.set(roomId, room);
                this.handlers.socketToRoom.set(socket.id, roomId);
                socket.join(roomId);
                this.handlers.broadcastGameState(roomId);
                socket.emit('roomCreated', { roomId, roomName: room.roomName, player: result.player, gameType: room.gameType });
                this.handlers.broadcastRoomsList();
            } else {
                socket.emit('error', result.error);
            }
        });
    }
}

module.exports = RoomCreationHandler;
