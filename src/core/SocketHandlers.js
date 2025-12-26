const GameRoom = require('./GameRoom');
const Scoreboard = require('./Scoreboard');
const UserStore = require('../auth/UserStore');
const BattleshipHandler = require('../handlers/games/BattleshipHandler');
const MemoryHandler = require('../handlers/games/MemoryHandler');
const TMMHandler = require('../handlers/games/TMMHandler');
const ChatHandler = require('../handlers/ChatHandler');
const RoomHandler = require('../handlers/RoomHandler');
const ScoreboardHandler = require('../handlers/ScoreboardHandler');
const InvitationHandler = require('../handlers/InvitationHandler');
const TournamentHandler = require('../handlers/tournament/TournamentHandler');

class SocketHandlers {
    constructor(io) {
        this.io = io;
        this.rooms = new Map();
        this.scoreboard = new Scoreboard();
        this.socketToRoom = new Map();
        this.onlineUsers = new Map();
        this.userRoles = new Map();
        this.lobbyMessages = [];
        this.maxLobbyMessages = 120;
        this.pendingInvitations = new Map(); // Map<recipient, Array<{from, gameType}>>
        this.sentInvitations = new Map(); // Map<sender, {to, gameType}> - track one invitation per sender
        
        this.battleshipHandler = new BattleshipHandler(this);
        this.memoryHandler = new MemoryHandler(this);
        this.tmmHandler = new TMMHandler(this);
        
        this.chatHandler = new ChatHandler(this);
        this.roomHandler = new RoomHandler(this);
        this.scoreboardHandler = new ScoreboardHandler(this);
        this.invitationHandler = new InvitationHandler(this);
        this.tournamentHandler = new TournamentHandler(this);
    }

    handleConnection(socket) {

        this.registerOnlineUser(socket);

        this.chatHandler.registerHandlers(socket);
        this.roomHandler.registerHandlers(socket);
        this.scoreboardHandler.registerHandlers(socket);
        this.invitationHandler.registerHandlers(socket);
        this.tournamentHandler.registerHandlers(socket);
        this.memoryHandler.registerHandlers(socket);
        this.tmmHandler.registerHandlers(socket);
        this.battleshipHandler.registerHandlers(socket);


        socket.on('disconnect', () => {
            const roomId = this.socketToRoom.get(socket.id);
            const username = socket.user?.username;

            if (roomId && this.rooms.has(roomId)) {
                const room = this.rooms.get(roomId);
                const wasInProgress = room.gameState.gameStatus === 'in-progress';
                const hadTwoPlayers = room.players.length === 2;
                const disconnectingPlayer = room.players.find(p => p.socketId === socket.id);

                if (wasInProgress && hadTwoPlayers && disconnectingPlayer) {
                    this.handlePlayerDisconnection(socket, roomId, room, username, 'opponent_disconnected');
                } else {
                    const result = room.removePlayer(socket.id);

                    if (result.removed) {
                        if (room.isEmpty()) {
                            this.rooms.delete(roomId);
                            this.broadcastRoomsList();
                        } else {
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
            if (username) {
                this.userRoles.delete(username);
            }
            this.broadcastLobbyUpdate();
        });
    }

    async broadcastGameState(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        try {
            const gameState = await room.getGameState();
            this.io.to(roomId).emit('gameStateUpdate', gameState);
        } catch (error) {
            console.error('Error broadcasting game state:', error);
            const gameState = {
                ...room.gameState,
                gameType: room.gameType,
                players: room.players.map(p => ({ username: p.username, role: p.role })),
                piecesPlaced: room.gameType === 'three-mens-morris' ? { ...room.gameState.piecesPlaced } : null,
                phase: room.gameType === 'three-mens-morris' ? room.gameState.phase : null,
                selectedPiece: room.gameType === 'three-mens-morris' ? room.gameState.selectedPiece : null,
                canRemovePiece: room.gameType === 'three-mens-morris' ? room.gameState.canRemovePiece : null,
                memoryState: room.memoryState ? {
                    cards: room.memoryState.cards.map(card => ({
                        id: card.id,
                        value: card.value,
                        revealed: card.revealed,
                        matched: card.matched
                    })),
                    matches: room.memoryState.matches,
                    turnRole: room.memoryState.turnRole,
                    gameStatus: room.memoryState.gameStatus
                } : null,
                battleshipState: room.battleshipState ? {
                    phase: room.battleshipState.phase,
                    currentPlayer: room.battleshipState.currentPlayer,
                    shipsPlaced: { ...room.battleshipState.shipsPlaced },
                    placementFinished: room.battleshipState.placementFinished ? { ...room.battleshipState.placementFinished } : { X: false, O: false },
                    ships: {
                        X: room.battleshipState.ships.X ? [...room.battleshipState.ships.X] : [],
                        O: room.battleshipState.ships.O ? [...room.battleshipState.ships.O] : []
                    },
                    sunkShips: {
                        X: [...room.battleshipState.sunkShips.X],
                        O: [...room.battleshipState.sunkShips.O]
                    },
                    shipTypes: room.battleshipState.shipTypes,
                    lastGuess: room.battleshipState.lastGuess,
                    boards: room.battleshipState.boards,
                    placementStartTime: room.battleshipState.placementStartTime,
                    placementTimeout: room.battleshipState.placementTimeout
                } : null
            };
            this.io.to(roomId).emit('gameStateUpdate', gameState);
        }
    }

    broadcastRoomsList() {
        const roomsList = Array.from(this.rooms.values())
            .map(room => room.getRoomInfo())
            .filter(room => room.gameStatus !== 'finished');
        this.io.emit('roomsList', roomsList);
        this.broadcastLobbyUpdate();
    }

    async broadcastLobbyUpdate() {
        const lobbyState = await this.getLobbyState();
        this.io.emit('lobbyUpdate', lobbyState);
    }

    async getLobbyState() {
        const rooms = Array.from(this.rooms.values())
            .map(room => room.getRoomInfo())
            .filter(room => room.gameStatus !== 'finished');
        
        const UserStore = require('../auth/UserStore');
        const users = await Promise.all(
            Array.from(this.onlineUsers.entries()).map(async ([socketId, username]) => {
                const role = this.userRoles.get(username) || 'player';
                const isInGame = this.socketToRoom.has(socketId);
                let avatar = null;
                try {
                    const user = await UserStore.getUser(username);
                    if (user && user.avatar) {
                        avatar = user.avatar;
                    }
                } catch (error) {
                    console.error(`Failed to get avatar for ${username}:`, error);
                }
                return {
                    username,
                    role,
                    avatar,
                    isInGame
                };
            })
        );
        return { rooms, users };
    }

    generateRoomId() {
        return Math.floor(100000 + Math.random() * 900000);
    }

    generateRematchRoomId() {
        return Math.floor(100 + Math.random() * 900);
    }

    async getScoreboardData(gameType = null) {
        try {
            return await this.scoreboard.getTopPlayers(20, gameType);
        } catch (error) {
            console.error('Error getting scoreboard data:', error);
            return [];
        }
    }

    

    handlePlayerDisconnection(socket, roomId, room, username, reason) {
        const remainingPlayer = room.players.find(p => p.socketId !== socket.id);
        if (!remainingPlayer) {
            room.removePlayer(socket.id);
            this.socketToRoom.delete(socket.id);
            socket.leave(roomId);
            // Broadcast after deleting from socketToRoom
            this.broadcastRoomsList();
            return;
        }

        this.scoreboard.recordGameResult(remainingPlayer.role, room.players, room.gameType, this.userRoles).catch(err => {
            console.error(`Error recording game result on ${reason}:`, err);
        });
        
        // Delete leaving player's socket from socketToRoom FIRST, before any operations
        this.socketToRoom.delete(socket.id);
        
        room.removePlayer(socket.id);
        
        // Delete remaining player's socket from socketToRoom since they're being forced to leave
        this.socketToRoom.delete(remainingPlayer.socketId);
        
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
        
        this.rooms.delete(roomId);
        
        // Broadcast AFTER deleting from socketToRoom
        this.broadcastRoomsList();
        socket.leave(roomId);
    }

    handleGameFinished(roomId, room) {
        if (!this.rooms.has(roomId)) return;
        
        const currentRoom = this.rooms.get(roomId);
        if (!currentRoom) return;
        
        currentRoom.gameState.gameStatus = 'finished';
        
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
        
        // Check if this is a tournament match
        if (winnerUsername) {
            this.tournamentHandler.handleGameFinished(roomId, winnerUsername);
        }
        
        const spectatorsToRemove = [...currentRoom.spectators];
        
        spectatorsToRemove.forEach(spectator => {
            const spectatorSocket = this.io.sockets.sockets.get(spectator.socketId);
            if (spectatorSocket) {
                this.socketToRoom.delete(spectator.socketId);
                spectatorSocket.leave(roomId);
                currentRoom.removePlayer(spectator.socketId);
                spectatorSocket.emit('gameFinished', { 
                    roomId,
                    winner: winnerDisplay || 'Unknown',
                    reason: 'game_ended',
                    forceLeave: true
                });
            }
        });
        
        const playersToNotify = [...currentRoom.players];
        playersToNotify.forEach(player => {
            const playerSocket = this.io.sockets.sockets.get(player.socketId);
            if (playerSocket) {
                playerSocket.emit('gameFinished', {
                    roomId,
                    winner: winnerDisplay || 'Unknown',
                    reason: 'game_ended',
                    forceLeave: false
                });
            }
        });
        
        setTimeout(() => {
            if (this.rooms.has(roomId)) {
                const finalRoom = this.rooms.get(roomId);
                if (finalRoom && finalRoom.gameState.gameStatus === 'finished') {
                    const allOccupants = [...finalRoom.players, ...finalRoom.spectators];
                    allOccupants.forEach(occupant => {
                        const occupantSocket = this.io.sockets.sockets.get(occupant.socketId);
                        if (occupantSocket) {
                            this.socketToRoom.delete(occupant.socketId);
                            occupantSocket.leave(roomId);
                            occupantSocket.emit('gameFinished', {
                                roomId,
                                winner: winnerDisplay || 'Unknown',
                                reason: 'game_ended',
                                forceLeave: true
                            });
                        }
                    });
                    this.rooms.delete(roomId);
                }
            }
        }, 60000);
        
        this.broadcastRoomsList();
    }

    

    cleanupSocket(socketId) {
        const roomId = this.socketToRoom.get(socketId);
        if (roomId && this.rooms.has(roomId)) {
            const room = this.rooms.get(roomId);
            const wasInProgress = room.gameState.gameStatus === 'in-progress';
            const hadTwoPlayers = room.players.length === 2;
            const disconnectingPlayer = room.players.find(p => p.socketId === socketId);

            if (wasInProgress && hadTwoPlayers && disconnectingPlayer) {
                const remainingPlayer = room.players.find(p => p.socketId !== socketId);
                if (remainingPlayer) {
                    const gameType = room.gameType || 'three-mens-morris';
                    this.scoreboard.recordGameResult(remainingPlayer.role, room.players, gameType, this.userRoles).catch(err => {
                        console.error('Error recording game result on cleanup:', err);
                    });
                }
            }

            room.removePlayer(socketId);
            
            if (room.isEmpty()) {
                this.rooms.delete(roomId);
            } else {
                if (room.players.length === 1 && wasInProgress) {
                    room.gameState.gameStatus = 'waiting';
                    room.resetGameState();
                }
                this.broadcastGameState(roomId);
            }
        }

        const username = this.onlineUsers.get(socketId);
        this.socketToRoom.delete(socketId);
        this.onlineUsers.delete(socketId);
        if (username) {
            this.userRoles.delete(username);
        }
        
        this.broadcastRoomsList();
    }

    registerOnlineUser(socket) {
        const username = socket.user?.username;
        const role = socket.user?.role;
        if (!username) return;
        this.onlineUsers.set(socket.id, username);
        if (role) {
            this.userRoles.set(username, role);
        }
        socket.emit('lobbyMessages', this.lobbyMessages);
        this.broadcastLobbyUpdate();
    }
}

module.exports = SocketHandlers;
