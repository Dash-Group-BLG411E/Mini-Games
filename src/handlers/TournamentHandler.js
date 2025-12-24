const TournamentCreationHandler = require('./tournament/TournamentCreationHandler');
const TournamentJoinHandler = require('./tournament/TournamentJoinHandler');
const TournamentListHandler = require('./tournament/TournamentListHandler');
const TournamentStartHandler = require('./tournament/TournamentStartHandler');

class TournamentHandler {
    constructor(handlers) {
        this.handlers = handlers;
        this.creationHandler = new TournamentCreationHandler(handlers);
        this.joinHandler = new TournamentJoinHandler(handlers);
        this.listHandler = new TournamentListHandler(handlers);
        this.startHandler = new TournamentStartHandler(handlers);
    }

    registerHandlers(socket) {
        this.creationHandler.registerHandlers(socket);
        this.joinHandler.registerHandlers(socket);
        this.listHandler.registerHandlers(socket);
        this.startHandler.registerHandlers(socket);
    }
}

module.exports = TournamentHandler;

