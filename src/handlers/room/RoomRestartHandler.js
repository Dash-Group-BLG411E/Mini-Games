class RoomRestartHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }

    registerHandlers(socket) {
        socket.on('restartRequest', (roomId) => {
            const room = this.handlers.rooms.get(roomId);
            if (!room) return;

            const username = socket.user?.username;
            const requestingPlayer = room.players.find(p => p.socketId === socket.id);
            
            if (!requestingPlayer) return;
            
            if (room.gameState.gameStatus === 'finished') {
                const result = room.requestRestart(socket.id);
                
                if (result.success) {
                    if (result.restart) {
                        const GameRoom = require('../../core/GameRoom');
                        const newRoomId = this.handlers.generateRematchRoomId();
                        let newRoomName;
                        const defaultRoomNamePattern = /^Room \d+$/;
                        if (room.roomName && !defaultRoomNamePattern.test(room.roomName)) {
                            newRoomName = room.roomName;
                        } else {
                            newRoomName = `Room ${newRoomId}`;
                        }
                        const newRoom = new GameRoom(newRoomId, newRoomName, room.gameType);
                        
                        const player1 = room.players[0];
                        const player2 = room.players[1];
                        
                        const player1Result = newRoom.addPlayer(player1.socketId, player1.username);
                        const player2Result = newRoom.addPlayer(player2.socketId, player2.username);
                        
                        this.handlers.socketToRoom.delete(player1.socketId);
                        this.handlers.socketToRoom.delete(player2.socketId);
                        
                        this.handlers.socketToRoom.set(player1.socketId, newRoomId);
                        this.handlers.socketToRoom.set(player2.socketId, newRoomId);
                        
                        const player1Socket = this.handlers.io.sockets.sockets.get(player1.socketId);
                        const player2Socket = this.handlers.io.sockets.sockets.get(player2.socketId);
                        
                        if (player1Socket) {
                            player1Socket.leave(roomId);
                            player1Socket.join(newRoomId);
                        }
                        if (player2Socket) {
                            player2Socket.leave(roomId);
                            player2Socket.join(newRoomId);
                        }
                        
                        this.handlers.rooms.delete(roomId);
                        
                        this.handlers.rooms.set(newRoomId, newRoom);
                        
                        newRoom.gameState.gameStatus = 'in-progress';
                        if (newRoom.gameType === 'three-mens-morris') {
                            newRoom.gameState.currentPlayer = 'X';
                            if (!newRoom.gameState.phase) {
                                newRoom.gameState.phase = 'placement';
                            }
                        } else if (newRoom.gameType === 'memory-match') {
                            newRoom.initMemoryState();
                        } else if (newRoom.gameType === 'battleship') {
                            newRoom.initBattleshipState();
                        }
                        
                        if (player1Socket) {
                            player1Socket.emit('rematchAccepted', {
                                roomId: newRoomId,
                                roomName: newRoom.roomName,
                                player: player1Result.player,
                                gameType: newRoom.gameType
                            });
                            player1Socket.emit('playersRole', {
                                role: player1Result.player.role,
                                roomName: newRoom.roomName,
                                players: newRoom.players.map(p => ({ username: p.username, role: p.role })),
                                gameType: newRoom.gameType
                            });
                        }
                        if (player2Socket) {
                            player2Socket.emit('rematchAccepted', {
                                roomId: newRoomId,
                                roomName: newRoom.roomName,
                                player: player2Result.player,
                                gameType: newRoom.gameType
                            });
                            player2Socket.emit('playersRole', {
                                role: player2Result.player.role,
                                roomName: newRoom.roomName,
                                players: newRoom.players.map(p => ({ username: p.username, role: p.role })),
                                gameType: newRoom.gameType
                            });
                        }
                        
                        this.handlers.io.to(newRoomId).emit('startGame', {
                            firstTurn: 'X',
                            players: newRoom.players.map(p => ({ username: p.username, role: p.role })),
                            gameType: newRoom.gameType
                        });
                        
                        this.handlers.broadcastGameState(newRoomId);
                        this.handlers.broadcastRoomsList();
                    } else {
                        const otherPlayer = room.players.find(p => p.socketId !== socket.id);
                        if (otherPlayer) {
                            const otherSocket = this.handlers.io.sockets.sockets.get(otherPlayer.socketId);
                            if (otherSocket) {
                                otherSocket.emit('rematchRequested', { 
                                    from: username,
                                    waitingForYou: true
                                });
                            }
                        }
                        socket.emit('rematchRequested', { 
                            from: username,
                            waitingForYou: false,
                            waitingForOpponent: true
                        });
                    }
                }
            } else {
                const result = room.requestRestart(socket.id);
                
                if (result.success) {
                    if (result.restart) {
                        this.handlers.io.to(roomId).emit('gameRestarted', { 
                            firstTurn: result.firstTurn 
                        });
                        this.handlers.broadcastGameState(roomId);
                        this.handlers.broadcastRoomsList();
                    } else {
                        const otherPlayer = room.players.find(p => p.socketId !== socket.id);
                        if (otherPlayer) {
                            const otherSocket = this.handlers.io.sockets.sockets.get(otherPlayer.socketId);
                            if (otherSocket) {
                                otherSocket.emit('rematchRequested', { 
                                    from: username,
                                    waitingForYou: true
                                });
                            }
                        }
                        socket.emit('rematchRequested', { 
                            from: username,
                            waitingForYou: false,
                            waitingForOpponent: true
                        });
                    }
                }
            }
        });
    }
}

module.exports = RoomRestartHandler;
