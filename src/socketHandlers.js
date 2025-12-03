const GameRoom = require('./GameRoom');
const Scoreboard = require('./Scoreboard');

class SocketHandlers {
    constructor(io) {
        this.io = io;
        this.rooms = new Map();
        this.scoreboard = new Scoreboard();
        this.socketToRoom = new Map(); // Track which room a socket is in
        this.onlineUsers = new Map();
        this.lobbyMessages = [];
        this.maxLobbyMessages = 120;
    }

    handleConnection(socket) {
        console.log('New web socket connection!');

        // Note: cleanupSocket is intentionally not called here as the socket is brand new.
        // It's only used for cleaning up stale references in edge cases.
        this.registerOnlineUser(socket);

        socket.on('getRooms', () => {
            const roomsList = Array.from(this.rooms.values())
                .map(room => room.getRoomInfo())
                .filter(room => room.gameStatus !== 'finished');
            socket.emit('roomsList', roomsList);
        });

        socket.on('lobbyChatMessage', ({ message }) => {
            const username = socket.user?.username;
            if (!username || !message || !message.trim()) return;
            const chatMessage = {
                username,
                message: message.trim(),
                timestamp: Date.now()
            };
            this.lobbyMessages.push(chatMessage);
            if (this.lobbyMessages.length > this.maxLobbyMessages) {
                this.lobbyMessages.shift();
            }
            this.io.emit('lobbyMessage', chatMessage);
        });

        socket.on('roomChatMessage', ({ roomId, message }) => {
            const username = socket.user?.username;
            if (!username || !message || !roomId) return;
            const chatMessage = {
                roomId,
                username,
                message: message.trim(),
                timestamp: Date.now()
            };
            this.io.to(roomId).emit('roomMessage', chatMessage);
        });

        socket.on('memoryFlip', ({ roomId, cardId }) => {
            const room = this.rooms.get(roomId);
            if (!room || room.gameType !== 'memory-match') return;
            const result = room.flipMemoryCard(socket.id, cardId);
            this.broadcastGameState(roomId);
            this.io.to(roomId).emit('memoryResult', {
                roomId,
                result
            });
            if (result && result.winnerRole) {
                this.scoreboard.recordGameResult(result.winnerRole, room.players).catch(err => {
                    console.error('Error recording game result:', err);
                });
                // Check if game is finished (memory match game ends when winnerRole is set)
                if (room.gameState.gameStatus === 'finished') {
                    // Notify spectators to leave after 3 seconds
                    this.handleGameFinished(roomId, room);
                }
            }
            if (result && result.pendingCards) {
                setTimeout(() => {
                    room.hideMemoryCards(result.pendingCards);
                    this.broadcastGameState(roomId);
                }, 1200);
            }
        });

        socket.on('createRoom', (data) => {
            const username = socket.user?.username;
            if (!username) {
                socket.emit('error', 'Authentication failed');
                return;
            }

            const roomId = data.roomId || this.generateRoomId();
            const roomName = data.roomName || `Room ${roomId}`;
            const gameType = data.gameType || 'tic-tac-toe';

            if (this.rooms.has(roomId)) {
                socket.emit('error', 'Room already exists');
                return;
            }

            const room = new GameRoom(roomId, roomName, gameType);
            const result = room.addPlayer(socket.id, username);

            if (result.success) {
                this.rooms.set(roomId, room);
                this.socketToRoom.set(socket.id, roomId);
                socket.join(roomId);
                // Broadcast game state so memory board appears even with one player
                this.broadcastGameState(roomId);
                socket.emit('roomCreated', { roomId, roomName: room.roomName, player: result.player, gameType: room.gameType });
                this.broadcastRoomsList();
            } else {
                socket.emit('error', result.error);
            }
        });

        socket.on('joinRoom', (data, callback) => {
            const username = socket.user?.username;
            if (!username) {
                if (callback) callback('Authentication failed');
                return;
            }

            const { roomId, asSpectator = false } = data;

            if (!this.rooms.has(roomId)) {
                if (callback) callback('Room does not exist');
                return;
            }

            const room = this.rooms.get(roomId);
            
            console.log(`User ${username} trying to join room ${roomId} as ${asSpectator ? 'spectator' : 'player'}`);
            console.log(`Room has ${room.players.length} players and ${room.spectators.length} spectators`);
            console.log(`Game status: ${room.gameState.gameStatus}`);
            
            // Prevent joining finished games (both players and spectators)
            if (room.gameState.gameStatus === 'finished') {
                if (callback) callback('Game has finished');
                return;
            }
            
            // Check if user is already in this room
            const existingPlayer = room.players.find(p => p.socketId === socket.id);
            const existingSpectator = room.spectators.find(s => s.socketId === socket.id);
            
            if (existingPlayer || existingSpectator) {
                if (callback) callback('You are already in this room');
                return;
            }

            // Check room availability BEFORE joining
            if (!asSpectator) {
                if (room.players.length >= 2) {
                    if (callback) callback('Room is full');
                    return;
                }
                if (room.gameState.gameStatus === 'in-progress') {
                    if (callback) callback('Game has already started');
                    return;
                }
            }

            // Now join the room
            this.socketToRoom.set(socket.id, roomId);
            socket.join(roomId);

            if (asSpectator) {
                const result = room.addSpectator(socket.id, username);
                if (result.success) {
                    socket.emit('joinedAsSpectator', { room: room.getRoomInfo(), gameType: room.gameType });
                    this.broadcastGameState(roomId);
                    this.broadcastRoomsList();
                } else {
                    // This shouldn't happen since we checked above, but just in case
                    socket.leave(roomId);
                    this.socketToRoom.delete(socket.id);
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
                        room.gameState.currentPlayer = 'X';
                        this.io.to(roomId).emit('startGame', { 
                            firstTurn: 'X',
                            players: room.players.map(p => ({ username: p.username, role: p.role })),
                            gameType: room.gameType
                        });
                    }
                    
                    this.broadcastGameState(roomId);
                    this.broadcastRoomsList();
                } else {
                    // This shouldn't happen since we checked above, but just in case
                    socket.leave(roomId);
                    this.socketToRoom.delete(socket.id);
                    if (callback) callback(result.error);
                    return;
                }
            }

            if (callback) callback(null);
        });

        socket.on('makeMove', ({ roomId, cellId, move }) => {
            const room = this.rooms.get(roomId);
            if (!room || room.gameType !== 'tic-tac-toe') return;

            const result = room.makeMove(cellId, move, socket.id);
            
            if (result.success) {
                this.broadcastGameState(roomId);
                // Send round result if round ended but game continues
                if (result.roundOver && !result.gameOver) {
                    this.io.to(roomId).emit('tttRoundResult', {
                        roundWinner: result.roundWinner,
                        scores: result.scores
                    });
                }
                // Only record final game result (first to 3 wins), not individual rounds
                if (result.gameOver && result.gameWinner) {
                    this.scoreboard.recordGameResult(result.gameWinner, room.players).catch(err => {
                        console.error('Error recording game result:', err);
                    });
                    this.broadcastRoomsList();
                    // Notify spectators to leave after 3 seconds
                    this.handleGameFinished(roomId, room);
                }
            } else {
                socket.emit('moveError', result.error);
            }
        });

        socket.on('rpsChoice', ({ roomId, choice }) => {
            const room = this.rooms.get(roomId);
            if (!room || room.gameType !== 'rock-paper-scissors') return;
            const result = room.submitRpsChoice(socket.id, choice);
            if (result.error) {
                socket.emit('moveError', result.error);
                return;
            }
            if (result.waiting) {
                socket.emit('rpsStatus', { waiting: true });
                return;
            }
            this.io.to(roomId).emit('rpsResult', result);
            // Only record final game result, not individual rounds
            if (result.gameOver && result.gameWinner) {
                // Find winner role by matching username
                const winnerPlayer = room.players.find(p => p.username === result.gameWinner);
                if (winnerPlayer) {
                    this.scoreboard.recordGameResult(winnerPlayer.role, room.players).catch(err => {
                        console.error('Error recording game result:', err);
                    });
                }
                this.broadcastRoomsList();
                // Notify spectators to leave after 3 seconds
                this.handleGameFinished(roomId, room);
            }
            // Broadcast updated game state with scores
            this.broadcastGameState(roomId);
        });

        socket.on('restartRequest', (roomId) => {
            const room = this.rooms.get(roomId);
            if (!room) return;

            const result = room.requestRestart(socket.id);
            
            if (result.success && result.restart) {
                this.io.to(roomId).emit('restartGame', { 
                    firstTurn: result.firstTurn,
                    players: room.players.map(p => ({ username: p.username, role: p.role })),
                    gameType: room.gameType
                });
                this.broadcastGameState(roomId);
                this.broadcastRoomsList();
            }
        });

        socket.on('getScoreboard', async () => {
            try {
                const topPlayers = await this.scoreboard.getTopPlayers(20);
                socket.emit('scoreboardData', topPlayers);
            } catch (error) {
                console.error('Error getting scoreboard:', error);
                socket.emit('scoreboardData', []);
            }
        });

        socket.on('leaveRoom', (data) => {
            const { roomId } = data;
            const username = socket.user?.username;

            if (!roomId || !this.rooms.has(roomId)) {
                return;
            }

            const room = this.rooms.get(roomId);
            const wasInProgress = room.gameState.gameStatus === 'in-progress';
            const hadTwoPlayers = room.players.length === 2;
            const leavingPlayer = room.players.find(p => p.socketId === socket.id);

            // If game is in progress and there are 2 players, handle disconnection
            if (wasInProgress && hadTwoPlayers && leavingPlayer) {
                this.handlePlayerDisconnection(socket, roomId, room, username, 'opponent_left');
                return;
            }

            const result = room.removePlayer(socket.id);

            if (result.removed) {
                // If room is now empty, delete it immediately
                if (room.isEmpty()) {
                    this.rooms.delete(roomId);
                    this.broadcastRoomsList();
                } else {
                    // If only one player left and game was in progress, reset game state
                    if (room.players.length === 1 && wasInProgress) {
                        room.gameState.gameStatus = 'waiting';
                        room.resetGameState();
                    }
                    this.broadcastGameState(roomId);
                    this.broadcastRoomsList();
                }
            }

            // Remove socket from room mapping
            this.socketToRoom.delete(socket.id);
            socket.leave(roomId);
        });

        socket.on('disconnect', () => {
            const roomId = this.socketToRoom.get(socket.id);
            const username = socket.user?.username;

            if (roomId && this.rooms.has(roomId)) {
                const room = this.rooms.get(roomId);
                const wasInProgress = room.gameState.gameStatus === 'in-progress';
                const hadTwoPlayers = room.players.length === 2;
                const disconnectingPlayer = room.players.find(p => p.socketId === socket.id);

                // If game is in progress and there are 2 players, handle disconnection
                if (wasInProgress && hadTwoPlayers && disconnectingPlayer) {
                    this.handlePlayerDisconnection(socket, roomId, room, username, 'opponent_disconnected');
                } else {
                    const result = room.removePlayer(socket.id);

                    if (result.removed) {
                        // If room is now empty (no players, no spectators), delete it immediately
                        if (room.isEmpty()) {
                            this.rooms.delete(roomId);
                            this.broadcastRoomsList();
                        } else {
                            // If only one player left and game was in progress, reset game state
                            if (room.players.length === 1 && wasInProgress) {
                                room.gameState.gameStatus = 'waiting';
                                room.resetGameState();
                            }
                            this.broadcastGameState(roomId);
                            this.broadcastRoomsList();
                        }
                    }
                }
            }

            this.socketToRoom.delete(socket.id);
            this.onlineUsers.delete(socket.id);
            this.broadcastLobbyUpdate();
        });
    }

    broadcastGameState(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const gameState = room.getGameState();
        this.io.to(roomId).emit('gameStateUpdate', gameState);
    }

    broadcastRoomsList() {
        const roomsList = Array.from(this.rooms.values())
            .map(room => room.getRoomInfo())
            .filter(room => room.gameStatus !== 'finished');
        this.io.emit('roomsList', roomsList);
        this.broadcastLobbyUpdate();
    }

    broadcastLobbyUpdate() {
        this.io.emit('lobbyUpdate', this.getLobbyState());
    }

    getLobbyState() {
        const rooms = Array.from(this.rooms.values())
            .map(room => room.getRoomInfo())
            .filter(room => room.gameStatus !== 'finished');
        const users = Array.from(this.onlineUsers.values());
        return { rooms, users };
    }

    generateRoomId() {
        return Math.floor(100000 + Math.random() * 900000);
    }

    async getScoreboardData() {
        try {
            return await this.scoreboard.getTopPlayers(20);
        } catch (error) {
            console.error('Error getting scoreboard data:', error);
            return [];
        }
    }

    /**
     * Handles player disconnection during an active game with 2 players.
     * Records the game result, notifies remaining player and spectators, and cleans up the room.
     * @param {Socket} socket - The socket of the disconnecting player
     * @param {string} roomId - The ID of the room
     * @param {GameRoom} room - The game room object
     * @param {string} username - The username of the disconnecting player
     * @param {string} reason - The reason for disconnection ('opponent_left' or 'opponent_disconnected')
     */
    handlePlayerDisconnection(socket, roomId, room, username, reason) {
        const remainingPlayer = room.players.find(p => p.socketId !== socket.id);
        if (!remainingPlayer) {
            // No remaining player found, just clean up
            room.removePlayer(socket.id);
            this.socketToRoom.delete(socket.id);
            socket.leave(roomId);
            return;
        }

        // Remaining player wins, disconnecting player loses
        this.scoreboard.recordGameResult(remainingPlayer.role, room.players).catch(err => {
            console.error(`Error recording game result on ${reason}:`, err);
        });
        
        // Remove remaining player from room and force them to leave
        room.removePlayer(remainingPlayer.socketId);
        this.socketToRoom.delete(remainingPlayer.socketId);
        
        // Notify remaining player they won and force them to leave
        const remainingSocket = this.io.sockets.sockets.get(remainingPlayer.socketId);
        if (remainingSocket) {
            remainingSocket.leave(roomId);
            remainingSocket.emit('playerDisconnected', { 
                username,
                winner: remainingPlayer.username,
                reason,
                forceLeave: true
            });
        }
        
        // Notify all spectators and force them to leave
        room.spectators.forEach(spectator => {
            const spectatorSocket = this.io.sockets.sockets.get(spectator.socketId);
            if (spectatorSocket) {
                this.socketToRoom.delete(spectator.socketId);
                spectatorSocket.leave(roomId);
                spectatorSocket.emit('playerDisconnected', { 
                    username,
                    winner: remainingPlayer.username,
                    reason,
                    forceLeave: true
                });
            }
        });
        
        // Delete the room since both players are gone
        this.rooms.delete(roomId);
        this.broadcastRoomsList();
        
        // Remove leaving player from room mapping
        this.socketToRoom.delete(socket.id);
        socket.leave(roomId);
    }

    handleGameFinished(roomId, room) {
        // After 3 seconds, redirect all spectators to lobby
        setTimeout(() => {
            // Check if room still exists (might have been deleted)
            if (!this.rooms.has(roomId)) return;
            
            const currentRoom = this.rooms.get(roomId);
            if (!currentRoom) return;
            
            // Get winner info for the message
            const winnerRole = currentRoom.gameState.winner;
            let winnerUsername = null;
            let winnerDisplay = null;
            if (winnerRole && winnerRole !== 'draw') {
                const winnerPlayer = currentRoom.players.find(p => p.role === winnerRole);
                winnerUsername = winnerPlayer?.username || null;
                winnerDisplay = winnerUsername || winnerRole;
            } else if (winnerRole === 'draw') {
                winnerDisplay = 'Draw';
            }
            
            // Create a copy of spectators array since we'll be modifying the original
            const spectatorsToRemove = [...currentRoom.spectators];
            
            // Notify all spectators and force them to leave
            spectatorsToRemove.forEach(spectator => {
                const spectatorSocket = this.io.sockets.sockets.get(spectator.socketId);
                if (spectatorSocket) {
                    // Remove from room mapping
                    this.socketToRoom.delete(spectator.socketId);
                    // Remove from socket room
                    spectatorSocket.leave(roomId);
                    // Remove from room's spectator list
                    currentRoom.removePlayer(spectator.socketId);
                    // Emit gameFinished event
                    spectatorSocket.emit('gameFinished', { 
                        roomId,
                        winner: winnerDisplay || 'Unknown',
                        reason: 'game_ended',
                        forceLeave: true
                    });
                }
            });
            
            // If room is now empty (no players, no spectators), delete it
            if (currentRoom.isEmpty()) {
                this.rooms.delete(roomId);
                this.broadcastRoomsList();
            } else {
                // Update room list to reflect spectator removal
                this.broadcastRoomsList();
            }
        }, 3000);
    }

    /**
     * Cleans up stale socket references (for edge cases like socket ID collisions).
     * Note: This method is kept for potential edge cases but is not currently used
     * in normal flow since handlePlayerDisconnection handles active game disconnections
     * and the disconnect handler handles all other cases.
     * 
     * @param {string} socketId - The socket ID to clean up
     * @deprecated Not currently used - kept for edge cases only
     */
    cleanupSocket(socketId) {
        // Remove from any rooms
        const roomId = this.socketToRoom.get(socketId);
        if (roomId && this.rooms.has(roomId)) {
            const room = this.rooms.get(roomId);
            const wasInProgress = room.gameState.gameStatus === 'in-progress';
            const hadTwoPlayers = room.players.length === 2;
            const disconnectingPlayer = room.players.find(p => p.socketId === socketId);

            // If game is in progress and there are 2 players, record winner/loser
            if (wasInProgress && hadTwoPlayers && disconnectingPlayer) {
                const remainingPlayer = room.players.find(p => p.socketId !== socketId);
                if (remainingPlayer) {
                    // Remaining player wins, disconnected player loses
                    this.scoreboard.recordGameResult(remainingPlayer.role, room.players).catch(err => {
                        console.error('Error recording game result on cleanup:', err);
                    });
                }
            }

            room.removePlayer(socketId);
            
            // If room is now empty, delete it immediately
            if (room.isEmpty()) {
                this.rooms.delete(roomId);
            } else {
                // If only one player left and game was in progress, reset game state
                if (room.players.length === 1 && wasInProgress) {
                    room.gameState.gameStatus = 'waiting';
                    room.resetGameState();
                }
                this.broadcastGameState(roomId);
            }
        }

        // Clean up mappings
        this.socketToRoom.delete(socketId);
        this.onlineUsers.delete(socketId);
        
        // Broadcast updated room list
        this.broadcastRoomsList();
    }

    registerOnlineUser(socket) {
        const username = socket.user?.username;
        if (!username) return;
        this.onlineUsers.set(socket.id, username);
        socket.emit('lobbyMessages', this.lobbyMessages);
        this.broadcastLobbyUpdate();
    }
}

module.exports = SocketHandlers;
