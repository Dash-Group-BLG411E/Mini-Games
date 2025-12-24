class TournamentCreationHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }

    registerHandlers(socket) {
        socket.on('createTournament', (data) => {
            const username = socket.user?.username;
            if (!username) {
                socket.emit('error', 'Authentication failed');
                return;
            }

            const Tournament = require('../../core/Tournament');
            const { tournamentName, gameType, maxPlayers } = data;

            // Validate maxPlayers
            if (![4, 8, 16].includes(maxPlayers)) {
                socket.emit('error', 'Tournament must have 4, 8, or 16 players.');
                return;
            }

            // Validate gameType
            const validGameTypes = ['three-mens-morris', 'battleship', 'memory-match'];
            if (!validGameTypes.includes(gameType)) {
                socket.emit('error', 'Invalid game type.');
                return;
            }

            const tournamentId = this.handlers.generateTournamentId();
            const tournament = new Tournament(
                tournamentId,
                tournamentName || `Tournament ${tournamentId}`,
                gameType,
                maxPlayers,
                username
            );

            // Add creator as first player
            const result = tournament.addPlayer(socket.id, username);
            if (!result.success) {
                socket.emit('error', result.error);
                return;
            }

            this.handlers.tournaments.set(tournamentId, tournament);
            this.handlers.socketToTournament.set(socket.id, tournamentId);

            socket.emit('tournamentCreated', {
                tournamentId,
                tournamentName: tournament.tournamentName,
                gameType: tournament.gameType,
                maxPlayers: tournament.maxPlayers,
                currentPlayers: tournament.players.length,
                player: result.player
            });

            this.handlers.broadcastTournamentsList();
        });
    }
}

module.exports = TournamentCreationHandler;

