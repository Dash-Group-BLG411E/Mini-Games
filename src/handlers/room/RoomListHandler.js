class RoomListHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }

    registerHandlers(socket) {
        socket.on('getRooms', () => {
            const roomsList = Array.from(this.handlers.rooms.values())
                .map(room => room.getRoomInfo())
                .filter(room => room.gameStatus !== 'finished');
            socket.emit('roomsList', roomsList);
        });
    }
}

module.exports = RoomListHandler;
