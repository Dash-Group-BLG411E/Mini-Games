class TournamentHandler {
    constructor(handlers) {
        this.handlers = handlers;
        this.tournaments = new Map(); // Map<tournamentId, Tournament>
        this.userToTournament = new Map(); // Map<username, tournamentId>
        this.matchIdToTournament = new Map(); // Map<matchId, tournamentId>
    }

    registerHandlers(socket) {
        socket.on('createTournament', (data, callback) => {
            const username = socket.user?.username;
            if (!username) {
                if (callback) callback({ success: false, error: 'Authentication failed' });
                return;
            }

            const { gameType, maxPlayers } = data;

            // Validate game type
            const validGameTypes = ['three-mens-morris', 'battleship', 'memory-match', 'mixed'];
            if (!validGameTypes.includes(gameType)) {
                if (callback) callback({ success: false, error: 'Invalid game type' });
                return;
            }

            // Validate player count
            if (maxPlayers !== 4 && maxPlayers !== 8) {
                if (callback) callback({ success: false, error: 'Player count must be 4 or 8' });
                return;
            }

            // Check if user is already in a tournament
            if (this.userToTournament.has(username)) {
                if (callback) callback({ success: false, error: 'You are already in a tournament' });
                return;
            }

            const Tournament = require('../../core/Tournament');
            const tournamentId = this.generateTournamentId();
            const tournament = new Tournament(tournamentId, gameType, maxPlayers, username);

            tournament.addPlayer(username, socket.id);
            this.tournaments.set(tournamentId, tournament);
            this.userToTournament.set(username, tournamentId);

            this.handlers.io.emit('tournamentListUpdate', this.getTournamentsList());

            if (callback) callback({ success: true, tournament: tournament.getTournamentInfo() });
        });

        socket.on('joinTournament', (data, callback) => {
            const username = socket.user?.username;
            if (!username) {
                if (callback) callback({ success: false, error: 'Authentication failed' });
                return;
            }

            const { tournamentId } = data;

            if (!this.tournaments.has(tournamentId)) {
                if (callback) callback({ success: false, error: 'Tournament not found' });
                return;
            }

            const tournament = this.tournaments.get(tournamentId);

            // Check if user is already in a tournament
            if (this.userToTournament.has(username)) {
                if (callback) callback({ success: false, error: 'You are already in a tournament' });
                return;
            }

            const result = tournament.addPlayer(username, socket.id);
            if (result.success) {
                this.userToTournament.set(username, tournamentId);
                // Update socket ID for player if already in tournament
                const player = tournament.players.find(p => p.username === username);
                if (player) {
                    player.socketId = socket.id;
                }

                // Auto-start tournament when full
                if (tournament.canStart()) {
                    const startResult = tournament.start();
                    if (startResult.success) {
                        // Create rooms for first round matches
                        this.createMatchRooms(tournament);
                        this.handlers.io.emit('tournamentStarted', tournament.getTournamentInfo());
                    }
                }

                this.handlers.io.emit('tournamentUpdate', tournament.getTournamentInfo());
                this.handlers.io.emit('tournamentListUpdate', this.getTournamentsList());

                if (callback) callback({ success: true, tournament: tournament.getTournamentInfo() });
            } else {
                if (callback) callback({ success: false, error: result.error });
            }
        });

        socket.on('leaveTournamentConfirmed', (data, callback) => {
            const username = socket.user?.username;
            if (!username) {
                if (callback) callback({ success: false, error: 'Authentication failed' });
                return;
            }

            const { tournamentId } = data;
            const result = this.handlePlayerLeaveConfirmed(tournamentId, username);
            if (callback) callback(result);
        });

        socket.on('leaveTournament', (data, callback) => {
            const username = socket.user?.username;
            if (!username) {
                if (callback) callback({ success: false, error: 'Authentication failed' });
                return;
            }

            const tournamentId = this.userToTournament.get(username);
            if (!tournamentId || !this.tournaments.has(tournamentId)) {
                if (callback) callback({ success: false, error: 'Not in a tournament' });
                return;
            }

            const tournament = this.tournaments.get(tournamentId);

            // Check if player is still active (hasn't lost)
            const isPlayerStillActive = this.isPlayerStillActive(tournament, username);

            if (tournament.status === 'waiting') {
                // Tournament hasn't started, allow leaving freely
                tournament.removePlayer(username);
                this.userToTournament.delete(username);

                if (tournament.players.length === 0) {
                    // Delete tournament if empty
                    this.tournaments.delete(tournamentId);
                    this.handlers.io.emit('tournamentListUpdate', this.getTournamentsList());
                } else {
                    this.handlers.io.emit('tournamentUpdate', tournament.getTournamentInfo());
                    this.handlers.io.emit('tournamentListUpdate', this.getTournamentsList());
                }

                if (callback) callback({ success: true });
                return;
            }

            // Tournament has started - check if player is still active
            if (!isPlayerStillActive) {
                // Player already lost, allow leaving freely
                tournament.removePlayer(username);
                this.userToTournament.delete(username);

                if (callback) callback({ success: true });
                return;
            }

            // Player is still active - need confirmation
            if (callback) callback({
                success: false,
                error: 'CONFIRM_REQUIRED',
                message: 'You are still in the tournament. Leaving will mark you as a loser and advance your opponent.'
            });
        });

        socket.on('getTournaments', (callback) => {
            if (callback) callback({ success: true, tournaments: this.getTournamentsList() });
        });

        socket.on('getTournament', (data, callback) => {
            const { tournamentId } = data;
            const tournament = this.getTournament(tournamentId);
            if (tournament) {
                if (callback) callback({ success: true, tournament: tournament.getTournamentInfo() });
            } else {
                if (callback) callback({ success: false, error: 'Tournament not found' });
            }
        });

        socket.on('startTournament', (data, callback) => {
            const username = socket.user?.username;
            if (!username) {
                if (callback) callback({ success: false, error: 'Authentication failed' });
                return;
            }

            const { tournamentId } = data;

            if (!this.tournaments.has(tournamentId)) {
                if (callback) callback({ success: false, error: 'Tournament not found' });
                return;
            }

            const tournament = this.tournaments.get(tournamentId);

            // Only creator can start
            if (tournament.creatorUsername !== username) {
                if (callback) callback({ success: false, error: 'Only creator can start tournament' });
                return;
            }

            // Auto-start tournament when full (4 or 8 players)
            const result = tournament.start();
            if (result.success) {
                // Create rooms for first round matches
                this.createMatchRooms(tournament);
                this.handlers.io.emit('tournamentStarted', tournament.getTournamentInfo());
                this.handlers.io.emit('tournamentListUpdate', this.getTournamentsList());

                if (callback) callback({ success: true, tournament: tournament.getTournamentInfo() });
            } else {
                if (callback) callback({ success: false, error: result.error });
            }
        });
    }

    generateTournamentId() {
        return Math.floor(100000 + Math.random() * 900000);
    }

    createMatchRooms(tournament) {
        const matches = tournament.getCurrentRoundMatches();

        console.log(`[TournamentHandler] createMatchRooms called for tournament ${tournament.tournamentId}, currentRound: ${tournament.currentRound}, matches count: ${matches.length}`);
        console.log(`[TournamentHandler] Tournament players:`, tournament.players.map(p => ({ username: p.username, socketId: p.socketId })));

        matches.forEach(match => {
            console.log(`[TournamentHandler] Processing match ${match.matchId}: player1=${match.player1}, player2=${match.player2}`);
            if (match.player1 && match.player2) {
                const matchState = tournament.getMatchState(match.matchId);
                const gameType = matchState ? matchState.currentGameType :
                    (tournament.gameType === 'mixed' ? 'three-mens-morris' : tournament.gameType);

                const roomId = this.handlers.generateRoomId();
                const roomName = tournament.gameType === 'mixed'
                    ? `Tournament Match - Round ${match.roundNumber} - Game ${gameType}`
                    : `Tournament Match - Round ${match.roundNumber}`;

                const GameRoom = require('../../core/GameRoom');
                const room = new GameRoom(roomId, roomName, gameType, true); // isTournamentRoom = true
                room.tournamentId = tournament.tournamentId;
                room.matchId = match.matchId;

                // Find player socket IDs - need to get current socket IDs from socket handlers
                const player1Data = tournament.players.find(p => p.username === match.player1);
                const player2Data = tournament.players.find(p => p.username === match.player2);

                // Get current socket IDs from connected sockets - ALWAYS look up fresh socket IDs
                let player1SocketId = null;
                let player2SocketId = null;

                // Find current socket IDs - ALWAYS look up fresh, don't rely on stored values
                if (!player1Data) {
                    console.log(`[TournamentHandler] WARNING: player1Data not found for ${match.player1} in tournament players`);
                } else {
                    // Try to find current socket ID - look through ALL sockets for this username
                    for (const [socketId, socket] of this.handlers.io.sockets.sockets) {
                        if (socket.user?.username === match.player1) {
                            player1SocketId = socketId;
                            player1Data.socketId = socketId; // Update stored socket ID
                            console.log(`[TournamentHandler] Found socket ID for player1 ${match.player1}: ${socketId}`);
                            break;
                        }
                    }
                    if (!player1SocketId) {
                        console.log(`[TournamentHandler] ERROR: Could not find ANY active socket for player1 ${match.player1}`);
                        // Try stored socket ID as last resort
                        if (player1Data.socketId) {
                            const testSocket = this.handlers.io.sockets.sockets.get(player1Data.socketId);
                            if (testSocket && testSocket.user?.username === match.player1) {
                                player1SocketId = player1Data.socketId;
                                console.log(`[TournamentHandler] Using stored socket ID for player1 ${match.player1}: ${player1Data.socketId}`);
                            } else {
                                console.log(`[TournamentHandler] Stored socket ID ${player1Data.socketId} for player1 ${match.player1} is invalid`);
                            }
                        }
                    }
                }
                if (!player2Data) {
                    console.log(`[TournamentHandler] WARNING: player2Data not found for ${match.player2} in tournament players`);
                } else {
                    // Try to find current socket ID - look through ALL sockets for this username
                    for (const [socketId, socket] of this.handlers.io.sockets.sockets) {
                        if (socket.user?.username === match.player2) {
                            player2SocketId = socketId;
                            player2Data.socketId = socketId; // Update stored socket ID
                            console.log(`[TournamentHandler] Found socket ID for player2 ${match.player2}: ${socketId}`);
                            break;
                        }
                    }
                    if (!player2SocketId) {
                        console.log(`[TournamentHandler] ERROR: Could not find ANY active socket for player2 ${match.player2}`);
                        // Try stored socket ID as last resort
                        if (player2Data.socketId) {
                            const testSocket = this.handlers.io.sockets.sockets.get(player2Data.socketId);
                            if (testSocket && testSocket.user?.username === match.player2) {
                                player2SocketId = player2Data.socketId;
                                console.log(`[TournamentHandler] Using stored socket ID for player2 ${match.player2}: ${player2Data.socketId}`);
                            } else {
                                console.log(`[TournamentHandler] Stored socket ID ${player2Data.socketId} for player2 ${match.player2} is invalid`);
                            }
                        }
                    }
                }

                if (player1Data && player2Data && player1SocketId && player2SocketId) {
                    console.log(`[TournamentHandler] Creating room ${roomId} for match ${match.matchId} with players ${player1Data.username} and ${player2Data.username}`);

                    // Clean up any old room associations FIRST
                    const oldRoom1 = this.handlers.socketToRoom.get(player1SocketId);
                    const oldRoom2 = this.handlers.socketToRoom.get(player2SocketId);

                    const socket1 = this.handlers.io.sockets.sockets.get(player1SocketId);
                    const socket2 = this.handlers.io.sockets.sockets.get(player2SocketId);

                    // Leave old rooms if any
                    if (oldRoom1 && socket1) {
                        console.log(`[TournamentHandler] Player1 ${player1Data.username} leaving old room ${oldRoom1}`);
                        socket1.leave(oldRoom1);
                        this.handlers.socketToRoom.delete(player1SocketId);
                    }
                    if (oldRoom2 && socket2) {
                        console.log(`[TournamentHandler] Player2 ${player2Data.username} leaving old room ${oldRoom2}`);
                        socket2.leave(oldRoom2);
                        this.handlers.socketToRoom.delete(player2SocketId);
                    }

                    // Add players to room
                    room.addPlayer(player1SocketId, player1Data.username);
                    room.addPlayer(player2SocketId, player2Data.username);

                    // Store room
                    this.handlers.rooms.set(roomId, room);
                    this.handlers.socketToRoom.set(player1SocketId, roomId);
                    this.handlers.socketToRoom.set(player2SocketId, roomId);

                    // Join socket rooms and notify players via roomCreated (includes tournament info)
                    if (socket1) {
                        socket1.join(roomId);
                        socket1.emit('roomCreated', {
                            roomId: roomId,
                            roomName: roomName,
                            player: room.players.find(p => p.username === player1Data.username),
                            gameType: gameType,
                            tournamentId: tournament.tournamentId,
                            matchId: match.matchId
                        });
                    }
                    if (socket2) {
                        socket2.join(roomId);
                        socket2.emit('roomCreated', {
                            roomId: roomId,
                            roomName: roomName,
                            player: room.players.find(p => p.username === player2Data.username),
                            gameType: gameType,
                            tournamentId: tournament.tournamentId,
                            matchId: match.matchId
                        });
                    }

                    // Update match
                    match.roomId = roomId;
                    match.status = 'in-progress';
                    tournament.setMatchRoomId(match.matchId, roomId);
                    this.matchIdToTournament.set(match.matchId, tournament.tournamentId);

                    // Also emit tournamentMatchStart for notifications
                    this.handlers.io.to(roomId).emit('tournamentMatchStart', {
                        matchId: match.matchId,
                        tournamentId: tournament.tournamentId,
                        roundNumber: match.roundNumber,
                        player1: match.player1,
                        player2: match.player2,
                        gameType: gameType,
                        roomId: roomId,
                        matchState: matchState
                    });

                    // Start game
                    this.handlers.io.to(roomId).emit('startGame', {
                        firstTurn: 'X',
                        players: room.players.map(p => ({ username: p.username, role: p.role })),
                        gameType: gameType
                    });

                    this.handlers.broadcastGameState(roomId);
                } else {
                    console.log(`[TournamentHandler] WARNING: Cannot create room for match ${match.matchId} - missing player data or socket IDs. player1Data=${!!player1Data}, player2Data=${!!player2Data}, player1SocketId=${!!player1SocketId}, player2SocketId=${!!player2SocketId}`);
                }
            } else {
                console.log(`[TournamentHandler] WARNING: Match ${match.matchId} is missing players: player1=${match.player1}, player2=${match.player2}`);
            }
        });
    }

    handleGameFinished(roomId, winnerUsername) {
        // Find tournament match by roomId
        let tournament = null;
        let match = null;

        for (const [tournamentId, t] of this.tournaments.entries()) {
            for (const round of t.bracket.rounds) {
                for (const m of round.matches) {
                    if (m.roomId === roomId) {
                        tournament = t;
                        match = m;
                        break;
                    }
                }
                if (match) break;
            }
            if (match) break;
        }

        if (!tournament || !match) {
            return; // Not a tournament match
        }

        // Record game result for stats (before tournament logic)
        const room = this.handlers.rooms.get(roomId);
        if (room && room.players && room.players.length >= 2) {
            const winnerPlayer = room.players.find(p => p.username === winnerUsername);
            const winnerRole = winnerPlayer?.role;
            if (winnerRole) {
                // Record game result for leaderboard/stats (same as regular games)
                this.handlers.scoreboard.recordGameResult(winnerRole, room.players, room.gameType, this.handlers.userRoles).catch(err => {
                    console.error('Error recording tournament game result:', err);
                });
            }
        }

        // Record game result (handles both single and mixed mode)
        const result = tournament.recordMatchGameResult(match.matchId, winnerUsername);

        if (!result.success) {
            console.error('Error recording match game result:', result.error);
            return;
        }

        if (result.nextGame) {
            // Next game in mixed mode
            const nextRoomId = this.handlers.generateRoomId();
            const nextRoomName = `Tournament Match - Round ${match.roundNumber} - Game ${result.gameType}`;

            const GameRoom = require('../../core/GameRoom');
            const nextRoom = new GameRoom(nextRoomId, nextRoomName, result.gameType, true); // isTournamentRoom = true
            nextRoom.tournamentId = tournament.tournamentId;
            nextRoom.matchId = match.matchId;

            // Find player socket IDs
            const player1Data = tournament.players.find(p => p.username === match.player1);
            const player2Data = tournament.players.find(p => p.username === match.player2);

            // Get current socket IDs from connected sockets - ALWAYS look up fresh socket IDs
            let player1SocketId = null;
            let player2SocketId = null;

            if (player1Data) {
                // Always look up fresh socket ID
                for (const [socketId, socket] of this.handlers.io.sockets.sockets) {
                    if (socket.user?.username === match.player1) {
                        player1SocketId = socketId;
                        player1Data.socketId = socketId;
                        console.log(`[TournamentHandler] Found socket ID for player1 ${match.player1} (next game): ${socketId}`);
                        break;
                    }
                }
                if (!player1SocketId && player1Data.socketId) {
                    // Try stored socket ID as last resort
                    const testSocket = this.handlers.io.sockets.sockets.get(player1Data.socketId);
                    if (testSocket && testSocket.user?.username === match.player1) {
                        player1SocketId = player1Data.socketId;
                        console.log(`[TournamentHandler] Using stored socket ID for player1 ${match.player1} (next game): ${player1Data.socketId}`);
                    }
                }
            }
            if (player2Data) {
                // Always look up fresh socket ID
                for (const [socketId, socket] of this.handlers.io.sockets.sockets) {
                    if (socket.user?.username === match.player2) {
                        player2SocketId = socketId;
                        player2Data.socketId = socketId;
                        console.log(`[TournamentHandler] Found socket ID for player2 ${match.player2} (next game): ${socketId}`);
                        break;
                    }
                }
                if (!player2SocketId && player2Data.socketId) {
                    // Try stored socket ID as last resort
                    const testSocket = this.handlers.io.sockets.sockets.get(player2Data.socketId);
                    if (testSocket && testSocket.user?.username === match.player2) {
                        player2SocketId = player2Data.socketId;
                        console.log(`[TournamentHandler] Using stored socket ID for player2 ${match.player2} (next game): ${player2Data.socketId}`);
                    }
                }
            }

            if (!player1SocketId || !player2SocketId) {
                console.log(`[TournamentHandler] ERROR: Missing socket IDs for next game. player1SocketId=${!!player1SocketId}, player2SocketId=${!!player2SocketId}`);
            }

            if (player1Data && player2Data && player1SocketId && player2SocketId) {
                // Remove old room mappings
                this.handlers.socketToRoom.delete(player1SocketId);
                this.handlers.socketToRoom.delete(player2SocketId);

                // Add players to new room
                nextRoom.addPlayer(player1SocketId, player1Data.username);
                nextRoom.addPlayer(player2SocketId, player2Data.username);

                this.handlers.rooms.set(nextRoomId, nextRoom);
                this.handlers.socketToRoom.set(player1SocketId, nextRoomId);
                this.handlers.socketToRoom.set(player2SocketId, nextRoomId);

                // Join socket rooms
                const socket1 = this.handlers.io.sockets.sockets.get(player1SocketId);
                const socket2 = this.handlers.io.sockets.sockets.get(player2SocketId);
                if (socket1) {
                    socket1.leave(match.roomId);
                    socket1.join(nextRoomId);
                    socket1.emit('roomCreated', {
                        roomId: nextRoomId,
                        roomName: nextRoomName,
                        player: nextRoom.players.find(p => p.username === player1Data.username),
                        gameType: result.gameType,
                        tournamentId: tournament.tournamentId,
                        matchId: match.matchId
                    });
                }
                if (socket2) {
                    socket2.leave(match.roomId);
                    socket2.join(nextRoomId);
                    socket2.emit('roomCreated', {
                        roomId: nextRoomId,
                        roomName: nextRoomName,
                        player: nextRoom.players.find(p => p.username === player2Data.username),
                        gameType: result.gameType,
                        tournamentId: tournament.tournamentId,
                        matchId: match.matchId
                    });
                }

                // Update match room ID
                match.roomId = nextRoomId;
                tournament.setMatchRoomId(match.matchId, nextRoomId);

                // Notify players
                this.handlers.io.to(nextRoomId).emit('tournamentMatchNextGame', {
                    matchId: match.matchId,
                    tournamentId: tournament.tournamentId,
                    gameType: result.gameType,
                    scores: result.scores,
                    roomId: nextRoomId
                });

                // Start game
                this.handlers.io.to(nextRoomId).emit('startGame', {
                    firstTurn: 'X',
                    players: nextRoom.players.map(p => ({ username: p.username, role: p.role })),
                    gameType: result.gameType
                });

                this.handlers.broadcastGameState(nextRoomId);
            }
            return;
        }

        // Match finished - close tournament room and redirect players
        const tournamentRoom = this.handlers.rooms.get(roomId);
        if (tournamentRoom && tournamentRoom.isTournamentRoom) {
            // Notify players to redirect to tournament detail page
            this.handlers.io.to(roomId).emit('tournamentMatchFinished', {
                tournamentId: tournament.tournamentId,
                matchId: match.matchId,
                winner: winnerUsername
            });

            // Close room after a short delay to allow redirect
            setTimeout(() => {
                if (this.handlers.rooms.has(roomId)) {
                    const roomToClose = this.handlers.rooms.get(roomId);
                    roomToClose.players.forEach(player => {
                        this.handlers.socketToRoom.delete(player.socketId);
                    });
                    this.handlers.rooms.delete(roomId);
                }
            }, 2000);
        }

        // Use result from recordMatchGameResult - DO NOT call finishMatch again!
        // recordMatchGameResult already calls finishMatch internally for non-mixed mode
        if (result.tournamentFinished) {
            // Tournament finished
            this.cleanupTournament(tournament.tournamentId);
            this.handlers.io.emit('tournamentFinished', {
                tournamentId: tournament.tournamentId,
                winner: result.winner,
                tournament: tournament.getTournamentInfo()
            });
        } else if (result.nextRound) {
            // Next round - create rooms for next round matches
            this.createMatchRooms(tournament);
            this.handlers.io.emit('tournamentRoundComplete', {
                tournamentId: tournament.tournamentId,
                roundNumber: tournament.currentRound,
                tournament: tournament.getTournamentInfo()
            });
        }

        this.handlers.io.emit('tournamentUpdate', tournament.getTournamentInfo());
        this.handlers.io.emit('tournamentListUpdate', this.getTournamentsList());
    }

    cleanupTournament(tournamentId) {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) return;

        // Notify all players that tournament was deleted
        tournament.players.forEach(player => {
            const playerSocket = this.handlers.io.sockets.sockets.get(player.socketId);
            if (playerSocket) {
                playerSocket.emit('tournamentDeleted', {
                    tournamentId: tournamentId,
                    message: 'The tournament has been deleted by the owner.'
                });
            }
            this.userToTournament.delete(player.username);
        });

        this.tournaments.delete(tournamentId);
    }

    /**
     * Check if a player is still active (hasn't lost) in the tournament
     */
    isPlayerStillActive(tournament, username) {
        if (!tournament || tournament.status === 'waiting') {
            return false; // Tournament hasn't started
        }

        // Check all rounds to see if player has lost
        for (const round of tournament.bracket.rounds) {
            for (const match of round.matches) {
                if (match.status === 'finished' && match.winner && match.winner !== username) {
                    // Check if this player was in this match and lost
                    if ((match.player1 === username || match.player2 === username)) {
                        return false; // Player lost in this match
                    }
                }
            }
        }

        // Check if player is in current round matches
        const currentRound = tournament.bracket.rounds[tournament.currentRound];
        if (currentRound) {
            for (const match of currentRound.matches) {
                if (match.player1 === username || match.player2 === username) {
                    if (match.status === 'finished' && match.winner !== username) {
                        return false; // Player lost
                    }
                    if (match.status === 'in-progress' || match.status === 'waiting') {
                        return true; // Player is still in an active match
                    }
                }
            }
        }

        // Check if player advanced to next round
        for (let i = 0; i < tournament.currentRound; i++) {
            const round = tournament.bracket.rounds[i];
            for (const match of round.matches) {
                if (match.winner === username) {
                    return true; // Player won and advanced
                }
            }
        }

        return false; // Player not found in any active match
    }

    /**
     * Handle player leaving tournament (confirmed)
     * Marks player as loser and advances opponent
     */
    handlePlayerLeaveConfirmed(tournamentId, username) {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) {
            return { success: false, error: 'Tournament not found' };
        }

        // Find the player's current match
        const currentRound = tournament.bracket.rounds[tournament.currentRound];
        if (!currentRound) {
            return { success: false, error: 'No active round' };
        }

        for (const match of currentRound.matches) {
            if ((match.player1 === username || match.player2 === username) &&
                (match.status === 'waiting' || match.status === 'in-progress')) {
                // Mark opponent as winner
                const opponent = match.player1 === username ? match.player2 : match.player1;
                if (opponent) {
                    // Finish the match with opponent as winner
                    const result = tournament.finishMatch(match.matchId, opponent);

                    // Remove leaving player from tournament
                    tournament.removePlayer(username);
                    this.userToTournament.delete(username);

                    // Close the room if it exists
                    if (match.roomId) {
                        const room = this.handlers.rooms.get(match.roomId);
                        if (room) {
                            // Notify players in room
                            this.handlers.io.to(match.roomId).emit('tournamentPlayerLeft', {
                                tournamentId: tournamentId,
                                matchId: match.matchId,
                                leavingPlayer: username,
                                winner: opponent
                            });

                            // Close room
                            this.handlers.rooms.delete(match.roomId);
                            // Remove socket mappings
                            room.players.forEach(player => {
                                this.handlers.socketToRoom.delete(player.socketId);
                            });
                        }
                    }

                    // Handle tournament progression
                    if (result.nextRound) {
                        this.createMatchRooms(tournament);
                        this.handlers.io.emit('tournamentRoundComplete', {
                            tournamentId: tournament.tournamentId,
                            roundNumber: tournament.currentRound,
                            tournament: tournament.getTournamentInfo()
                        });
                    } else if (result.tournamentFinished) {
                        this.handlers.io.emit('tournamentFinished', {
                            tournamentId: tournament.tournamentId,
                            winner: result.winner,
                            tournament: tournament.getTournamentInfo()
                        });
                        this.cleanupTournament(tournamentId);
                    }

                    this.handlers.io.emit('tournamentUpdate', tournament.getTournamentInfo());
                    this.handlers.io.emit('tournamentListUpdate', this.getTournamentsList());

                    return { success: true, opponent: opponent };
                }
            }
        }

        // If no active match found, just remove player
        tournament.removePlayer(username);
        this.userToTournament.delete(username);
        this.handlers.io.emit('tournamentUpdate', tournament.getTournamentInfo());
        this.handlers.io.emit('tournamentListUpdate', this.getTournamentsList());

        return { success: true };
    }

    getTournamentsList() {
        return Array.from(this.tournaments.values())
            .map(t => t.getTournamentInfo())
            .filter(t => t.status !== 'finished');
    }

    getTournament(tournamentId) {
        return this.tournaments.get(tournamentId);
    }
}

module.exports = TournamentHandler;
