class RoomJoinHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }

    registerHandlers(socket) {
        socket.on('joinRoom', (data, callback) => {
            const username = socket.user?.username;
            if (!username) {
                if (callback) callback('Authentication failed');
                return;
            }

            const { roomId, asSpectator = false } = data;

            if (!this.handlers.rooms.has(roomId)) {
                if (callback) callback('Room does not exist');
                return;
            }

            const room = this.handlers.rooms.get(roomId);
            
            if (room.gameState.gameStatus === 'finished') {
                if (callback) callback('This game has ended. The room is closed.');
                return;
            }
            
            const existingPlayer = room.players.find(p => p.socketId === socket.id);
            const existingSpectator = room.spectators.find(s => s.socketId === socket.id);
            
            if (existingPlayer || existingSpectator) {
                if (callback) callback('You are already in this room');
                return;
            }

            if (!asSpectator) {
                if (room.players.length >= 2) {
                    if (callback) callback('Room is full');
                    return;
                }
                if (room.gameState.gameStatus === 'finished') {
                    if (callback) callback('Game has finished');
                    return;
                }
                if (room.gameState.gameStatus === 'in-progress') {
                    if (callback) callback('Game has already started');
                    return;
                }
            }

            this.handlers.socketToRoom.set(socket.id, roomId);
            socket.join(roomId);

            if (asSpectator) {
                const result = room.addSpectator(socket.id, username);
                if (result.success) {
                    socket.emit('joinedAsSpectator', { room: room.getRoomInfo(), gameType: room.gameType });
                    this.handlers.broadcastGameState(roomId);
                    this.handlers.broadcastRoomsList();
                } else {
                    socket.leave(roomId);
                    this.handlers.socketToRoom.delete(socket.id);
                    if (callback) callback(result.error);
                    return;
                }
            } else {
                const result = room.addPlayer(socket.id, username);
                if (result.success) {
                    socket.emit('playersRole', { 
                        role: result.player.role,
                        roomName: room.roomName,
                        players: room.players.map(p => ({ username: p.username, role: p.role })),
                        gameType: room.gameType
                    });
                    
                    if (room.players.length === 2) {
                        room.gameState.gameStatus = 'in-progress';
                        if (room.gameType === 'three-mens-morris') {
                            room.gameState.currentPlayer = 'X';
                            if (!room.gameState.phase) {
                                room.gameState.phase = 'placement';
                            }
                        } else if (room.gameType === 'memory-match') {
                            room.initMemoryState();
                        } else if (room.gameType === 'battleship') {
                            room.initBattleshipState();
                            if (room.battleshipState) {
                                room.battleshipState.placementStartTime = Date.now();
                            }
                        }
                        this.handlers.io.to(roomId).emit('startGame', { 
                            firstTurn: 'X',
                            players: room.players.map(p => ({ username: p.username, role: p.role })),
                            gameType: room.gameType
                        });
                    }
                    
                    this.handlers.broadcastGameState(roomId);
                    this.handlers.broadcastRoomsList();
                } else {
                    socket.leave(roomId);
                    this.handlers.socketToRoom.delete(socket.id);
                    if (callback) callback(result.error);
                    return;
                }
            }

            if (callback) callback(null);
        });

        socket.on('leaveRoom', (data) => {
            const { roomId } = data;
            const username = socket.user?.username;

            if (!roomId || !this.handlers.rooms.has(roomId)) {
                return;
            }

            const room = this.handlers.rooms.get(roomId);
            
            // Check if this is a tournament room
            if (room.isTournamentRoom && room.tournamentId) {
                // For tournament rooms, redirect to tournament detail page
                this.handlers.io.to(roomId).emit('tournamentRoomLeft', {
                    tournamentId: room.tournamentId,
                    matchId: room.matchId,
                    leavingPlayer: username
                });
                
                // Close tournament room
                room.players.forEach(player => {
                    this.handlers.socketToRoom.delete(player.socketId);
                });
                this.handlers.rooms.delete(roomId);
                return;
            }
            
            const wasInProgress = room.gameState.gameStatus === 'in-progress';
            const isFinished = room.gameState.gameStatus === 'finished';
            const hadTwoPlayers = room.players.length === 2;
            const leavingPlayer = room.players.find(p => p.socketId === socket.id);

            // Remove from socketToRoom FIRST, before any broadcasts
            this.handlers.socketToRoom.delete(socket.id);

            if (isFinished && hadTwoPlayers && leavingPlayer) {
                const remainingPlayer = room.players.find(p => p.socketId !== socket.id);
                const rematchWasRequested = remainingPlayer && room.restartVotes.has(remainingPlayer.socketId);
                
                room.removePlayer(socket.id);
                socket.leave(roomId);
                
                this.handlers.broadcastGameState(roomId).catch(err => console.error('Error broadcasting game state:', err));
                
                if (rematchWasRequested && remainingPlayer) {
                    const remainingSocket = this.handlers.io.sockets.sockets.get(remainingPlayer.socketId);
                    if (remainingSocket) {
                        remainingSocket.emit('opponentLeftAfterGame', {
                            message: 'The other player left the room.',
                            username: username
                        });
                    }
                }
                
                if (room.isEmpty()) {
                    this.handlers.rooms.delete(roomId);
                }
                // Broadcast AFTER socketToRoom.delete
                this.handlers.broadcastRoomsList();
                return;
            }

            if (wasInProgress && hadTwoPlayers && leavingPlayer) {
                this.handlers.handlePlayerDisconnection(socket, roomId, room, username, 'opponent_left');
                // socketToRoom.delete already called above, broadcastRoomsList will be called by handlePlayerDisconnection or we need to ensure it's called
                return;
            }

            const hadOnlyOnePlayer = room.players.length === 1;
            const hasSpectators = room.spectators.length > 0;
            const result = room.removePlayer(socket.id);
            const wasCreator = result.type === 'player' && hadOnlyOnePlayer && hasSpectators;
            
            if (result.removed) {
                if (room.isEmpty()) {
                    this.handlers.rooms.delete(roomId);
                    // Broadcast AFTER socketToRoom.delete (already done above)
                    this.handlers.broadcastRoomsList();
                } else if (wasCreator) {
                    room.spectators.forEach(spectator => {
                        const spectatorSocket = this.handlers.io.sockets.sockets.get(spectator.socketId);
                        if (spectatorSocket) {
                            this.handlers.socketToRoom.delete(spectator.socketId);
                            spectatorSocket.leave(roomId);
                            room.removePlayer(spectator.socketId);
                            spectatorSocket.emit('gameFinished', {
                                roomId,
                                winner: 'Unknown',
                                reason: 'creator_left',
                                forceLeave: true
                            });
                        }
                    });
                    this.handlers.rooms.delete(roomId);
                    // Broadcast AFTER socketToRoom.delete (already done above)
                    this.handlers.broadcastRoomsList();
                } else {
                    if (room.players.length === 1 && wasInProgress) {
                        room.gameState.gameStatus = 'waiting';
                        room.resetGameState();
                    }
                    this.handlers.broadcastGameState(roomId);
                    // Broadcast AFTER socketToRoom.delete (already done above)
                    this.handlers.broadcastRoomsList();
                }
            } else {
                // Even if player wasn't removed from room, we still need to broadcast
                // because socketToRoom.delete was called above
                this.handlers.broadcastRoomsList();
            }

            socket.leave(roomId);
        });
    }
}

module.exports = RoomJoinHandler;
