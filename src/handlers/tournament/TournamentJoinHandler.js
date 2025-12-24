class TournamentJoinHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }

    registerHandlers(socket) {
        socket.on('joinTournament', (data, callback) => {
            const username = socket.user?.username;
            if (!username) {
                if (callback) callback('Authentication failed');
                return;
            }

            const { tournamentId } = data;
            if (!tournamentId) {
                if (callback) callback('Tournament ID is required');
                return;
            }

            // Convert to number if it's a string (for consistency)
            const id = typeof tournamentId === 'string' ? parseInt(tournamentId, 10) : tournamentId;
            if (isNaN(id)) {
                if (callback) callback('Invalid tournament ID');
                return;
            }

            const tournament = this.handlers.tournaments.get(id);
            if (!tournament) {
                // Try as string as well (in case it was stored as string)
                const tournamentStr = this.handlers.tournaments.get(tournamentId.toString());
                if (tournamentStr) {
                    // Use the string version
                    const result = tournamentStr.addPlayer(socket.id, username);
                    if (result.success) {
                        this.handlers.socketToTournament.set(socket.id, tournamentId.toString());
                        
                        socket.emit('tournamentJoined', {
                            tournamentId: tournamentId.toString(),
                            tournamentName: tournamentStr.tournamentName,
                            gameType: tournamentStr.gameType,
                            maxPlayers: tournamentStr.maxPlayers,
                            currentPlayers: tournamentStr.players.length,
                            player: result.player
                        });

                        tournamentStr.players.forEach(player => {
                            const playerSocket = this.handlers.getSocketByUsername(player.username);
                            if (playerSocket) {
                                this.handlers.io.to(playerSocket.id).emit('tournamentUpdate', {
                                    tournamentId: tournamentId.toString(),
                                    tournamentInfo: tournamentStr.getTournamentInfo()
                                });
                            }
                        });

                        this.handlers.broadcastTournamentsList();
                        if (callback) callback(null);
                    } else {
                        if (callback) callback(result.error);
                    }
                    return;
                }
                if (callback) callback('Tournament not found');
                return;
            }

            // Check if already in another tournament
            const existingTournamentId = this.handlers.socketToTournament.get(socket.id);
            if (existingTournamentId && existingTournamentId !== id) {
                if (callback) callback('You are already in another tournament');
                return;
            }

            const result = tournament.addPlayer(socket.id, username);
            if (result.success) {
                this.handlers.socketToTournament.set(socket.id, id);
                
                socket.emit('tournamentJoined', {
                    tournamentId: id,
                    tournamentName: tournament.tournamentName,
                    gameType: tournament.gameType,
                    maxPlayers: tournament.maxPlayers,
                    currentPlayers: tournament.players.length,
                    player: result.player
                });

                // Notify all players in tournament
                tournament.players.forEach(player => {
                    const playerSocket = this.handlers.getSocketByUsername(player.username);
                    if (playerSocket) {
                        this.handlers.io.to(playerSocket.id).emit('tournamentUpdate', {
                            tournamentId: id,
                            tournamentInfo: tournament.getTournamentInfo()
                        });
                    }
                });

                this.handlers.broadcastTournamentsList();
                if (callback) callback(null);
            } else {
                if (callback) callback(result.error);
            }
        });

        socket.on('leaveTournament', (data) => {
            const username = socket.user?.username;
            if (!username) {
                socket.emit('error', 'Authentication failed');
                return;
            }

            const tournamentId = this.handlers.socketToTournament.get(socket.id);
            if (!tournamentId) {
                return;
            }

            const tournament = this.handlers.tournaments.get(tournamentId);
            if (!tournament) {
                this.handlers.socketToTournament.delete(socket.id);
                return;
            }

            // Creator cannot leave if tournament has started AND they are still in an active match
            // If they've been eliminated (not in any active matches), they can leave
            if (tournament.creatorUsername === username && tournament.status !== 'waiting') {
                // Check if creator is still in an active match (hasn't been eliminated)
                const isInActiveMatch = tournament.matches.some(match => {
                    const isPlayer = match.room.players.some(p => p.username === username);
                    const isActive = match.status === 'waiting' || match.status === 'in-progress';
                    return isPlayer && isActive;
                });
                
                if (isInActiveMatch) {
                    socket.emit('error', 'Tournament creator cannot leave while still participating in the tournament');
                    return;
                }
                // If creator is not in any active matches (eliminated), allow them to leave
            }

            const result = tournament.removePlayer(socket.id);
            if (result.removed) {
                this.handlers.socketToTournament.delete(socket.id);

                // Delete tournament only if:
                // 1. Tournament is empty (no players left), OR
                // 2. Creator left BEFORE tournament started (status === 'waiting')
                // If creator leaves after being eliminated, tournament should continue
                const shouldDeleteTournament = tournament.isEmpty() || 
                    (tournament.creatorUsername === username && tournament.status === 'waiting');
                
                if (shouldDeleteTournament) {
                    this.handlers.tournaments.delete(tournamentId);
                } else {
                    // Notify remaining players
                    tournament.players.forEach(player => {
                        const playerSocket = this.handlers.getSocketByUsername(player.username);
                        if (playerSocket) {
                            this.handlers.io.to(playerSocket.id).emit('tournamentUpdate', {
                                tournamentId,
                                tournamentInfo: tournament.getTournamentInfo()
                            });
                        }
                    });
                }

                socket.emit('tournamentLeft', { tournamentId });
                this.handlers.broadcastTournamentsList();
            }
        });
    }
}

module.exports = TournamentJoinHandler;

