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
const TournamentHandler = require('../handlers/TournamentHandler');

class SocketHandlers {
    constructor(io) {
        this.io = io;
        this.rooms = new Map();
        this.tournaments = new Map();
        this.scoreboard = new Scoreboard();
        this.socketToRoom = new Map();
        this.socketToTournament = new Map();
        this.onlineUsers = new Map();
        this.userRoles = new Map();
        this.lobbyMessages = [];
        this.maxLobbyMessages = 120;
        this.pendingInvitations = new Map();
        
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
            
            // Handle tournament disconnection
            const tournamentId = this.socketToTournament.get(socket.id);
            if (tournamentId && this.tournaments.has(tournamentId)) {
                const tournament = this.tournaments.get(tournamentId);
                tournament.removePlayer(socket.id);
                this.socketToTournament.delete(socket.id);
                
                if (tournament.isEmpty()) {
                    this.tournaments.delete(tournamentId);
                } else {
                    tournament.players.forEach(player => {
                        const playerSocket = this.getSocketByUsername(player.username);
                        if (playerSocket) {
                            this.io.to(playerSocket.id).emit('tournamentUpdate', {
                                tournamentId,
                                tournamentInfo: tournament.getTournamentInfo()
                            });
                        }
                    });
                }
                this.broadcastTournamentsList();
            }
            
            this.onlineUsers.delete(socket.id);
            if (username) {
                this.userRoles.delete(username);
            }
            this.broadcastLobbyUpdate();
        });
    }

    async broadcastGameState(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            console.warn(`Cannot broadcast game state: Room ${roomId} not found`);
            return;
        }

        // Verify room has players
        if (room.players.length === 0 && room.spectators.length === 0) {
            console.warn(`Cannot broadcast game state: Room ${roomId} has no players or spectators`);
            return;
        }

        try {
            const gameState = await room.getGameState();
            
            // First, emit to all sockets in the room (primary method)
            this.io.to(roomId).emit('gameStateUpdate', gameState);
            
            // Also emit directly to each player/spectator as a fallback to ensure delivery
            // This ensures moves are never missed even if socket room membership has issues
            const allOccupants = [...room.players, ...room.spectators];
            allOccupants.forEach(occupant => {
                const occupantSocket = this.getSocketByUsername(occupant.username);
                if (occupantSocket) {
                    // Ensure socket is in the room
                    if (!occupantSocket.rooms || !occupantSocket.rooms.has(roomId)) {
                        console.warn(`Socket for ${occupant.username} not in room ${roomId}, joining now`);
                        occupantSocket.join(roomId);
                    }
                    // Emit directly as well to guarantee delivery
                    occupantSocket.emit('gameStateUpdate', gameState);
                } else {
                    console.warn(`Could not find socket for ${occupant.username} to broadcast game state`);
                }
            });
        } catch (error) {
            console.error('Error broadcasting game state:', error);
            // Fallback: try to send basic game state
            try {
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
                
                // Emit to room
                this.io.to(roomId).emit('gameStateUpdate', gameState);
                
                // Also emit directly to each player/spectator
                const allOccupants = [...room.players, ...room.spectators];
                allOccupants.forEach(occupant => {
                    const occupantSocket = this.getSocketByUsername(occupant.username);
                    if (occupantSocket) {
                        occupantSocket.emit('gameStateUpdate', gameState);
                    }
                });
            } catch (fallbackError) {
                console.error('Fallback broadcast also failed:', fallbackError);
            }
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
            Array.from(this.onlineUsers.values()).map(async (username) => {
                const role = this.userRoles.get(username) || 'player';
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
                    avatar
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

    generateTournamentId() {
        return Math.floor(100000 + Math.random() * 900000);
    }

    getSocketByUsername(username) {
        for (const [socketId, socket] of this.io.sockets.sockets) {
            if (socket.user?.username === username) {
                return socket;
            }
        }
        return null;
    }

    broadcastTournamentsList() {
        const tournamentsList = Array.from(this.tournaments.values())
            .map(tournament => tournament.getTournamentInfo());
        this.io.emit('tournamentsList', tournamentsList);
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
            return;
        }

        this.scoreboard.recordGameResult(remainingPlayer.role, room.players, room.gameType).catch(err => {
            console.error(`Error recording game result on ${reason}:`, err);
        });
        
        room.removePlayer(remainingPlayer.socketId);
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
        this.broadcastRoomsList();
        
        this.socketToRoom.delete(socket.id);
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

        // Check if this is a tournament match and if tournament finished
        let tournamentFinished = false;
        if (roomId && typeof roomId === 'string' && roomId.startsWith('tournament-')) {
            // Check tournament status before updating
            for (const [tournamentId, tournament] of this.tournaments.entries()) {
                const match = tournament.matches.find(m => m.matchId === roomId);
                if (match) {
                    const wasFinished = tournament.status === 'finished';
                    this.handleTournamentMatchResult(roomId, currentRoom, winnerUsername);
                    // Check if tournament just finished
                    if (!wasFinished && tournament.status === 'finished') {
                        tournamentFinished = true;
                    }
                    break;
                }
            }
        } else {
            // Not a tournament match, handle normally
            this.handleTournamentMatchResult(roomId, currentRoom, winnerUsername);
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
                    reason: tournamentFinished ? 'tournament_finished' : 'game_ended',
                    forceLeave: true
                });
            }
        });
        
        // Only send gameFinished to players if this is NOT a tournament match
        // Tournament matches use tournamentMatchWon/tournamentMatchFinished events instead
        const isTournamentMatch = roomId && typeof roomId === 'string' && roomId.startsWith('tournament-');
        if (!tournamentFinished && !isTournamentMatch) {
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
        }
        
        setTimeout(() => {
            if (this.rooms.has(roomId)) {
                const finalRoom = this.rooms.get(roomId);
                if (finalRoom && finalRoom.gameState.gameStatus === 'finished') {
                    const isTournamentMatchTimeout = roomId && typeof roomId === 'string' && roomId.startsWith('tournament-');
                    const allOccupants = [...finalRoom.players, ...finalRoom.spectators];
                    allOccupants.forEach(occupant => {
                        const occupantSocket = this.io.sockets.sockets.get(occupant.socketId);
                        if (occupantSocket) {
                            this.socketToRoom.delete(occupant.socketId);
                            occupantSocket.leave(roomId);
                            // Don't send gameFinished to players in tournament matches
                            // Only send to spectators or if it's not a tournament match
                            if (!isTournamentMatchTimeout || occupant.role === 'spectator') {
                                occupantSocket.emit('gameFinished', {
                                    roomId,
                                    winner: winnerDisplay || 'Unknown',
                                    reason: 'game_ended',
                                    forceLeave: true
                                });
                            }
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
                    this.scoreboard.recordGameResult(remainingPlayer.role, room.players, gameType).catch(err => {
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

    handleTournamentMatchResult(roomId, room, winnerUsername) {
        // Check if this room is part of a tournament
        for (const [tournamentId, tournament] of this.tournaments.entries()) {
            const match = tournament.matches.find(m => m.matchId === roomId);
            if (match) {
                // Update tournament bracket
                const result = tournament.updateMatchResult(roomId, winnerUsername);
                if (result.success) {
                    // Return result to caller so they know if tournament finished
                    const tournamentFinished = tournament.status === 'finished' || result.tournamentFinished;
                    // Check if tournament is finished first (before other notifications)
                    const isTournamentFinished = tournament.status === 'finished' || result.tournamentFinished;
                    
                    // Notify all tournament participants about the update (unless tournament is finished)
                    if (!isTournamentFinished) {
                        tournament.players.forEach(player => {
                            const playerSocket = this.getSocketByUsername(player.username);
                            if (playerSocket) {
                                this.io.to(playerSocket.id).emit('tournamentUpdate', {
                                    tournamentId,
                                    tournamentInfo: tournament.getTournamentInfo()
                                });
                            }
                        });
                    }

                    // Get winner and loser usernames
                    const winnerPlayer = room.players.find(p => p.username === winnerUsername);
                    const loserPlayer = room.players.find(p => p.username !== winnerUsername);
                    const loserUsername = loserPlayer?.username || null;

                    // Notify players about match result
                    const TournamentMatchHandler = require('../handlers/tournament/TournamentMatchHandler');
                    const matchHandler = new TournamentMatchHandler(this);
                    matchHandler.notifyMatchFinished(tournament, match, winnerUsername, loserUsername);

                    // If tournament is finished, notify all players and clean up
                    if (tournament.status === 'finished' || result.tournamentFinished) {
                        console.log(`Tournament ${tournamentId} finished! Winner: ${tournament.winner}`);
                        
                        // Remove all players from tournament match rooms first
                        tournament.players.forEach(player => {
                            const playerSocket = this.getSocketByUsername(player.username);
                            if (playerSocket) {
                                // Leave any tournament match rooms
                                const roomId = this.socketToRoom.get(playerSocket.id);
                                if (roomId && roomId.startsWith('tournament-')) {
                                    const matchRoom = this.rooms.get(roomId);
                                    if (matchRoom) {
                                        matchRoom.removePlayer(playerSocket.id);
                                        if (matchRoom.isEmpty()) {
                                            this.rooms.delete(roomId);
                                        }
                                    }
                                    playerSocket.leave(roomId);
                                    this.socketToRoom.delete(playerSocket.id);
                                }
                                
                                // Remove from tournament mapping
                                this.socketToTournament.delete(playerSocket.id);
                            }
                        });
                        
                        // Notify all tournament participants about tournament completion
                        // Don't send gameFinished here - only send tournamentFinished
                        tournament.players.forEach(player => {
                            const playerSocket = this.getSocketByUsername(player.username);
                            if (playerSocket) {
                                this.io.to(playerSocket.id).emit('tournamentFinished', {
                                    tournamentId,
                                    winner: tournament.winner,
                                    tournamentInfo: tournament.getTournamentInfo()
                                });
                            }
                        });
                        
                        // Broadcast updated tournament list (tournament will show as finished)
                        this.broadcastTournamentsList();
                        
                        // Return early to prevent further processing
                        return true; // Indicate tournament finished
                    } else {
                        // If a next round match is ready (both players determined), create it immediately
                        if (result.nextMatchReady && result.nextMatchIndex !== null) {
                            // Get the next round index
                            // If round just completed, currentRound was incremented, so we need to use currentRound - 1
                            // Otherwise, use currentRound (which is the next round index)
                            const nextRoundIndex = result.roundComplete ? tournament.currentRound - 1 : tournament.currentRound;
                            
                            if (nextRoundIndex >= tournament.bracket.rounds.length) {
                                console.error(`Invalid nextRoundIndex: ${nextRoundIndex}, bracket has ${tournament.bracket.rounds.length} rounds`);
                                break;
                            }
                            
                            const nextRound = tournament.bracket.rounds[nextRoundIndex];
                            if (!nextRound) {
                                console.error(`Next round at index ${nextRoundIndex} not found`);
                                break;
                            }
                            
                            const nextMatch = nextRound.matches[result.nextMatchIndex];
                            if (!nextMatch) {
                                console.error(`Next match at index ${result.nextMatchIndex} not found in round ${nextRoundIndex}`);
                                break;
                            }
                            
                            if (nextMatch.player1 && nextMatch.player2) {
                                // Check if match already exists
                                const existingMatch = tournament.matches.find(m => 
                                    m.roundNumber === nextRoundIndex + 1 && 
                                    m.bracketMatchIndex === result.nextMatchIndex
                                );
                                
                                if (existingMatch) {
                                    console.log(`Match already exists for round ${nextRoundIndex + 1}, match ${result.nextMatchIndex}`);
                                    break;
                                }
                                
                                console.log(`Creating match for ${nextMatch.player1} vs ${nextMatch.player2} in round ${nextRoundIndex + 1}, currentRound=${tournament.currentRound}`);
                                
                                // Ensure tournament currentRound is set to the round we're creating
                                // nextRoundIndex is 0-based, so round number is nextRoundIndex + 1
                                const targetRoundNumber = nextRoundIndex + 1;
                                if (tournament.currentRound !== targetRoundNumber) {
                                    console.log(`Updating tournament currentRound from ${tournament.currentRound} to ${targetRoundNumber}`);
                                    tournament.currentRound = targetRoundNumber;
                                }
                                
                                // Create this specific match
                                const room = tournament.createMatchForBracketMatch(nextMatch, result.nextMatchIndex);
                                this.rooms.set(room.roomId, room);

                                // Join players to their match rooms
                                const player1 = tournament.players.find(p => p.username === nextMatch.player1);
                                const player2 = tournament.players.find(p => p.username === nextMatch.player2);
                                
                                if (player1) {
                                    const player1Socket = this.getSocketByUsername(player1.username);
                                    if (player1Socket) {
                                        player1Socket.join(room.roomId);
                                        this.socketToRoom.set(player1Socket.id, room.roomId);
                                    }
                                }
                                if (player2) {
                                    const player2Socket = this.getSocketByUsername(player2.username);
                                    if (player2Socket) {
                                        player2Socket.join(room.roomId);
                                        this.socketToRoom.set(player2Socket.id, room.roomId);
                                    }
                                }

                                // If both players are in the room, start the game
                                if (room.players.length === 2 && room.gameState.gameStatus === 'in-progress') {
                                    this.io.to(room.roomId).emit('startGame', {
                                        firstTurn: room.gameType === 'three-mens-morris' ? room.gameState.currentPlayer : 'X',
                                        players: room.players.map(p => ({ username: p.username, role: p.role })),
                                        gameType: room.gameType
                                    });
                                }

                                // Emit roomCreated for each player
                                const player1Socket = nextMatch.player1 ? this.getSocketByUsername(nextMatch.player1) : null;
                                const player2Socket = nextMatch.player2 ? this.getSocketByUsername(nextMatch.player2) : null;
                                
                                if (player1Socket) {
                                    const player1InRoom = room.players.find(p => p.socketId === player1Socket.id);
                                    player1Socket.emit('roomCreated', {
                                        roomId: room.roomId,
                                        roomName: room.roomName,
                                        player: player1InRoom ? { role: player1InRoom.role } : null,
                                        gameType: room.gameType
                                    });
                                    player1Socket.emit('playersRole', {
                                        role: player1InRoom ? player1InRoom.role : 'X',
                                        roomName: room.roomName,
                                        players: room.players.map(p => ({ username: p.username, role: p.role })),
                                        gameType: room.gameType
                                    });
                                    player1Socket.emit('tournamentMatchStarted', {
                                        tournamentId,
                                        matchId: room.roomId,
                                        opponent: nextMatch.player2,
                                        round: tournament.currentRound
                                    });
                                }
                                if (player2Socket) {
                                    const player2InRoom = room.players.find(p => p.socketId === player2Socket.id);
                                    player2Socket.emit('roomCreated', {
                                        roomId: room.roomId,
                                        roomName: room.roomName,
                                        player: player2InRoom ? { role: player2InRoom.role } : null,
                                        gameType: room.gameType
                                    });
                                    player2Socket.emit('playersRole', {
                                        role: player2InRoom ? player2InRoom.role : 'O',
                                        roomName: room.roomName,
                                        players: room.players.map(p => ({ username: p.username, role: p.role })),
                                        gameType: room.gameType
                                    });
                                    player2Socket.emit('tournamentMatchStarted', {
                                        tournamentId,
                                        matchId: room.roomId,
                                        opponent: nextMatch.player1,
                                        round: tournament.currentRound
                                    });
                                }

                                // Broadcast game state
                                this.broadcastGameState(room.roomId);
                                
                                // Broadcast rooms list so new tournament matches appear in lobby
                                this.broadcastRoomsList();
                            }
                        }
                        
                        // Also check if round is complete and create any remaining matches
                        if (result.roundComplete && tournament.currentRound <= tournament.bracket.rounds.length) {
                            // Create any remaining next round matches that have both players
                            matchHandler.createNextRoundMatches(tournament);
                            // Broadcast rooms list after creating next round matches
                            this.broadcastRoomsList();
                        }
                    }

                    this.broadcastTournamentsList();
                }
                break;
            }
        }
    }
}

module.exports = SocketHandlers;
