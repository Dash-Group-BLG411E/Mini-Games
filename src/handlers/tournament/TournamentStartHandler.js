class TournamentStartHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }

    registerHandlers(socket) {
        socket.on('startTournament', (data) => {
            const username = socket.user?.username;
            if (!username) {
                socket.emit('error', 'Authentication failed');
                return;
            }

            const { tournamentId } = data;
            if (!tournamentId) {
                socket.emit('error', 'Tournament ID is required');
                return;
            }

            // Convert to number if it's a string (for consistency)
            const id = typeof tournamentId === 'string' ? parseInt(tournamentId, 10) : tournamentId;
            if (isNaN(id)) {
                socket.emit('error', 'Invalid tournament ID');
                return;
            }

            // Try to find tournament by number ID first
            let tournament = this.handlers.tournaments.get(id);
            
            // If not found, try as string (in case it was stored as string)
            if (!tournament) {
                tournament = this.handlers.tournaments.get(tournamentId.toString());
            }
            
            // If still not found, try searching by tournamentId property (fallback)
            if (!tournament) {
                for (const [key, t] of this.handlers.tournaments.entries()) {
                    if (t.tournamentId === id || t.tournamentId === tournamentId || 
                        t.tournamentId.toString() === tournamentId.toString()) {
                        tournament = t;
                        break;
                    }
                }
            }
            
            if (!tournament) {
                console.error(`Tournament not found. ID: ${tournamentId} (type: ${typeof tournamentId}), converted: ${id}`);
                console.error(`Available tournaments:`, Array.from(this.handlers.tournaments.keys()).map(k => ({ key: k, id: this.handlers.tournaments.get(k)?.tournamentId })));
                socket.emit('error', `Tournament not found. ID: ${tournamentId}`);
                return;
            }

            // Only creator can start
            if (tournament.creatorUsername !== username) {
                socket.emit('error', 'Only the tournament creator can start the tournament');
                return;
            }

            const result = tournament.start();
            if (result.success) {
                // Create matches for first round
                const firstRound = tournament.bracket.rounds[0];
                firstRound.matches.forEach((bracketMatch, index) => {
                    const room = tournament.createMatchForBracketMatch(bracketMatch, index);
                    this.handlers.rooms.set(room.roomId, room);
                    
                    // Join players to their match rooms
                    if (bracketMatch.player1) {
                        const player1 = tournament.players.find(p => p.username === bracketMatch.player1);
                        if (player1) {
                            const player1Socket = this.handlers.getSocketByUsername(player1.username);
                            if (player1Socket) {
                                player1Socket.join(room.roomId);
                                this.handlers.socketToRoom.set(player1Socket.id, room.roomId);
                            }
                        }
                    }
                    if (bracketMatch.player2) {
                        const player2 = tournament.players.find(p => p.username === bracketMatch.player2);
                        if (player2) {
                            const player2Socket = this.handlers.getSocketByUsername(player2.username);
                            if (player2Socket) {
                                player2Socket.join(room.roomId);
                                this.handlers.socketToRoom.set(player2Socket.id, room.roomId);
                            }
                        }
                    }

                    // Notify players about their match and set up the room
                    const player1Socket = bracketMatch.player1 ? this.handlers.getSocketByUsername(bracketMatch.player1) : null;
                    const player2Socket = bracketMatch.player2 ? this.handlers.getSocketByUsername(bracketMatch.player2) : null;
                    
                    // If both players are in the room, start the game
                    if (room.players.length === 2 && room.gameState.gameStatus === 'in-progress') {
                        this.handlers.io.to(room.roomId).emit('startGame', {
                            firstTurn: room.gameType === 'three-mens-morris' ? room.gameState.currentPlayer : 'X',
                            players: room.players.map(p => ({ username: p.username, role: p.role })),
                            gameType: room.gameType
                        });
                    }
                    
                    // Emit roomCreated for each player so they navigate to the game
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
                            tournamentId: id,
                            matchId: room.roomId,
                            opponent: bracketMatch.player2,
                            round: 1
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
                            tournamentId: id,
                            matchId: room.roomId,
                            opponent: bracketMatch.player1,
                            round: 1
                        });
                    }
                    
                    // Broadcast game state to the room
                    this.handlers.broadcastGameState(room.roomId);
                });

                // Broadcast rooms list so tournament matches appear in lobby
                this.handlers.broadcastRoomsList();

                // Broadcast tournament update to all players
                tournament.players.forEach(player => {
                    const playerSocket = this.handlers.getSocketByUsername(player.username);
                    if (playerSocket) {
                        this.handlers.io.to(playerSocket.id).emit('tournamentStarted', {
                            tournamentId: id,
                            tournamentInfo: tournament.getTournamentInfo()
                        });
                    }
                });

                this.handlers.broadcastTournamentsList();
            } else {
                socket.emit('error', result.error);
            }
        });
    }
}

module.exports = TournamentStartHandler;

