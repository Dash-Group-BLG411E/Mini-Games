class TournamentListHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }

    registerHandlers(socket) {
        socket.on('getTournaments', () => {
            const tournamentsList = Array.from(this.handlers.tournaments.values())
                .map(tournament => tournament.getTournamentInfo());
            
            socket.emit('tournamentsList', tournamentsList);
        });
    }
}

module.exports = TournamentListHandler;

