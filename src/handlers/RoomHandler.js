const RoomListHandler = require('./room/RoomListHandler');
const RoomCreationHandler = require('./room/RoomCreationHandler');
const RoomJoinHandler = require('./room/RoomJoinHandler');
const RoomRestartHandler = require('./room/RoomRestartHandler');

class RoomHandler {
    constructor(handlers) {
        this.handlers = handlers;
        this.roomListHandler = new RoomListHandler(handlers);
        this.roomCreationHandler = new RoomCreationHandler(handlers);
        this.roomJoinHandler = new RoomJoinHandler(handlers);
        this.roomRestartHandler = new RoomRestartHandler(handlers);
    }

    registerHandlers(socket) {
        this.roomListHandler.registerHandlers(socket);
        this.roomCreationHandler.registerHandlers(socket);
        this.roomJoinHandler.registerHandlers(socket);
        this.roomRestartHandler.registerHandlers(socket);
    }
}

module.exports = RoomHandler;
