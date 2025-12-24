class TournamentMatchHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }

    createNextRoundMatches(tournament) {
        if (tournament.currentRound > tournament.bracket.rounds.length) {
            return; // Tournament finished
        }

        const nextRound = tournament.bracket.rounds[tournament.currentRound - 1];
        
        // Create matches for next round
        nextRound.matches.forEach((bracketMatch, index) => {
            // Only create match if both players are set
            if (bracketMatch.player1 && bracketMatch.player2) {
                const room = tournament.createMatchForBracketMatch(bracketMatch, index);
                this.handlers.rooms.set(room.roomId, room);

                // Join players to their match rooms
                const player1 = tournament.players.find(p => p.username === bracketMatch.player1);
                const player2 = tournament.players.find(p => p.username === bracketMatch.player2);
                
                if (player1) {
                    const player1Socket = this.handlers.getSocketByUsername(player1.username);
                    if (player1Socket) {
                        player1Socket.join(room.roomId);
                        this.handlers.socketToRoom.set(player1Socket.id, room.roomId);
                    }
                }
                if (player2) {
                    const player2Socket = this.handlers.getSocketByUsername(player2.username);
                    if (player2Socket) {
                        player2Socket.join(room.roomId);
                        this.handlers.socketToRoom.set(player2Socket.id, room.roomId);
                    }
                }

                // If both players are in the room, start the game
                if (room.players.length === 2 && room.gameState.gameStatus === 'in-progress') {
                    this.handlers.io.to(room.roomId).emit('startGame', {
                        firstTurn: room.gameType === 'three-mens-morris' ? room.gameState.currentPlayer : 'X',
                        players: room.players.map(p => ({ username: p.username, role: p.role })),
                        gameType: room.gameType
                    });
                }

                // Emit roomCreated for each player
                const player1Socket = bracketMatch.player1 ? this.handlers.getSocketByUsername(bracketMatch.player1) : null;
                const player2Socket = bracketMatch.player2 ? this.handlers.getSocketByUsername(bracketMatch.player2) : null;
                
                if (player1Socket) {
                    const player1 = room.players.find(p => p.socketId === player1Socket.id);
                    player1Socket.emit('roomCreated', {
                        roomId: room.roomId,
                        roomName: room.roomName,
                        player: player1 ? { role: player1.role } : null,
                        gameType: room.gameType
                    });
                    player1Socket.emit('playersRole', {
                        role: player1 ? player1.role : 'X',
                        roomName: room.roomName,
                        players: room.players.map(p => ({ username: p.username, role: p.role })),
                        gameType: room.gameType
                    });
                    player1Socket.emit('tournamentMatchStarted', {
                        tournamentId: tournament.tournamentId,
                        matchId: room.roomId,
                        opponent: bracketMatch.player2,
                        round: tournament.currentRound
                    });
                }
                if (player2Socket) {
                    const player2 = room.players.find(p => p.socketId === player2Socket.id);
                    player2Socket.emit('roomCreated', {
                        roomId: room.roomId,
                        roomName: room.roomName,
                        player: player2 ? { role: player2.role } : null,
                        gameType: room.gameType
                    });
                    player2Socket.emit('playersRole', {
                        role: player2 ? player2.role : 'O',
                        roomName: room.roomName,
                        players: room.players.map(p => ({ username: p.username, role: p.role })),
                        gameType: room.gameType
                    });
                    player2Socket.emit('tournamentMatchStarted', {
                        tournamentId: tournament.tournamentId,
                        matchId: room.roomId,
                        opponent: bracketMatch.player1,
                        round: tournament.currentRound
                    });
                }

                // Broadcast game state
                this.handlers.broadcastGameState(room.roomId);
            }
        });
        
        // Broadcast rooms list so new tournament matches appear in lobby
        this.handlers.broadcastRoomsList();
    }

    notifyMatchFinished(tournament, match, winnerUsername, loserUsername) {
        // Check if tournament is finished - if so, don't send match finished events
        // (tournamentFinished event will be sent separately)
        if (tournament.status === 'finished') {
            return;
        }

        // Get all active matches in the tournament for spectating
        const activeMatches = tournament.matches
            .filter(m => m.status === 'waiting' || m.status === 'in-progress')
            .map(m => ({
                matchId: m.matchId,
                roomName: m.room.roomName,
                players: m.room.players.map(p => p.username),
                round: m.roundNumber
            }));

        // Notify winner - winners don't get options, they just wait for next match
        const winnerSocket = this.handlers.getSocketByUsername(winnerUsername);
        if (winnerSocket) {
            const isAdvancing = tournament.currentRound <= tournament.bracket.rounds.length;
            // Only notify if advancing (not tournament finished)
            if (isAdvancing) {
                winnerSocket.emit('tournamentMatchWon', {
                    tournamentId: tournament.tournamentId,
                    matchId: match.matchId,
                    message: 'You won! Waiting for your next match...',
                    tournamentInfo: tournament.getTournamentInfo()
                });
            }
        }

        // Notify loser - losers get options to watch or leave
        const loserSocket = this.handlers.getSocketByUsername(loserUsername);
        if (loserSocket) {
            loserSocket.emit('tournamentMatchFinished', {
                tournamentId: tournament.tournamentId,
                matchId: match.matchId,
                won: false,
                isAdvancing: false,
                activeMatches: activeMatches,
                tournamentInfo: tournament.getTournamentInfo()
            });
        }
    }
}

module.exports = TournamentMatchHandler;

