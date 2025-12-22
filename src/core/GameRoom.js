const TMMGame = require('../games/TMMGame');
const MemoryGame = require('../games/MemoryGame');
const BattleshipGame = require('../games/BattleshipGame');

class GameRoom {
    constructor(roomId, roomName = null, gameType = 'three-mens-morris') {
        this.roomId = roomId;
        this.roomName = roomName || `Room ${roomId}`;
        this.players = [];
        this.spectators = [];
        this.gameType = gameType;
        this.restartVotes = new Set();
        this.tmmScores = { X: 0, O: 0 };
        this.memoryState = null;
        this.battleshipState = null;
        this.gameState = {};
        this.moveHistory = [];
        
        this.tmmGame = new TMMGame(this);
        this.memoryGame = new MemoryGame(this);
        this.battleshipGame = new BattleshipGame(this);
        
        this.resetGameState();
        this.createdAt = new Date();
    }

    setGameType(type) {
        this.gameType = type || 'three-mens-morris';
        this.resetGameState();
    }

    resetGameState() {
        this.gameState = {
            board: Array(9).fill(''),
            currentPlayer: 'X',
            gameStatus: 'waiting',
            winner: null,
            lastStarter: 'X',
            phase: 'placement',
            piecesPlaced: { X: 0, O: 0 },
            selectedPiece: null,
            canRemovePiece: false
        };
        this.moveHistory = [];
        
        if (this.gameType === 'three-mens-morris') {
            this.tmmGame.initGameState();
        } else if (this.gameType === 'memory-match') {
            this.memoryGame.initGameState();
        } else if (this.gameType === 'battleship') {
            this.battleshipGame.initGameState();
        }
    }


    resetTmmGame() {
        this.tmmScores = { X: 0, O: 0 };
    }

    addPlayer(socketId, username) {
        if (this.players.length >= 2) {
            return { success: false, error: 'Room is full.' };
        }

        if (this.gameState.gameStatus === 'in-progress') {
            return { success: false, error: 'Game has already started.' };
        }

        const role = this.players.length === 0 ? 'X' : 'O';
        const player = { socketId, username, role };
        this.players.push(player);

        if (this.players.length === 2) {
            this.gameState.gameStatus = 'in-progress';
            if (this.gameType === 'three-mens-morris') {
                this.gameState.currentPlayer = 'X';
                if (!this.gameState.phase) {
                    this.gameState.phase = 'placement';
                }
            } else if (this.gameType === 'memory-match') {
                this.memoryGame.initGameState();
            } else if (this.gameType === 'battleship') {
                this.battleshipGame.initGameState();
                if (this.battleshipState) {
                    this.battleshipState.placementStartTime = Date.now();
                }
            }
        } else if (this.players.length === 1 && this.gameType === 'memory-match') {
            this.memoryGame.initGameState();
        } else if (this.players.length === 1 && this.gameType === 'three-mens-morris') {
            if (!this.gameState.phase) {
                this.gameState.phase = 'placement';
            }
        } else if (this.players.length === 1 && this.gameType === 'battleship') {
            this.battleshipGame.initGameState();
        }

        return { success: true, player };
    }

    addSpectator(socketId, username) {
        const spectator = { socketId, username };
        this.spectators.push(spectator);
        return { success: true, spectator };
    }

    removePlayer(socketId) {
        const playerIndex = this.players.findIndex(p => p.socketId === socketId);
        if (playerIndex !== -1) {
            this.players.splice(playerIndex, 1);
            if (this.gameState.gameStatus === 'in-progress') {
                if (this.gameType === 'three-mens-morris') {
                    this.tmmScores = { X: 0, O: 0 };
                    this.gameState.phase = 'placement';
                    this.gameState.piecesPlaced = { X: 0, O: 0 };
                    this.gameState.selectedPiece = null;
                    this.gameState.canRemovePiece = false;
                } else if (this.gameType === 'memory-match') {
                    this.memoryGame.initGameState();
                } else if (this.gameType === 'battleship') {
                    this.battleshipGame.initGameState();
                }
                this.gameState.gameStatus = 'waiting';
                this.gameState.currentPlayer = 'X';
                this.gameState.winner = null;
                this.gameState.board = Array(9).fill('');
                this.moveHistory = [];
            }
            return { type: 'player', removed: true };
        }

        const spectatorIndex = this.spectators.findIndex(s => s.socketId === socketId);
        if (spectatorIndex !== -1) {
            this.spectators.splice(spectatorIndex, 1);
            return { type: 'spectator', removed: true };
        }

        return { removed: false };
    }

    makeMove(cellId, move, socketId, fromCellId = null) {
        if (this.gameType !== 'three-mens-morris') {
            return { success: false, error: 'Room is not running Three Men\'s Morris.' };
        }
        return this.tmmGame.makeMove(cellId, move, socketId, fromCellId);
    }

    removeOpponentPiece(cellId, move) {
        return this.tmmGame.removeOpponentPiece(cellId, move);
    }

    countPiecesOnBoard(player) {
        return this.tmmGame.countPiecesOnBoard(player);
    }

    isAdjacent(fromId, toId) {
        return this.tmmGame.isAdjacent(fromId, toId);
    }


    initMemoryState() {
        this.memoryGame.initGameState();
    }

    flipMemoryCard(socketId, cardId) {
        if (this.gameType !== 'memory-match') {
            return { error: 'Wrong game.' };
        }
        return this.memoryGame.flipCard(socketId, cardId);
    }

    hideMemoryCards(cardIds) {
        this.memoryGame.hideCards(cardIds);
    }


    checkWin() {
        if (this.gameType !== 'three-mens-morris') {
            return {};
        }
        return this.tmmGame.checkWin();
    }

    requestRestart(socketId) {
        if (this.gameState.gameStatus !== 'finished') {
            return { success: false, error: 'Game is not finished.' };
        }

        this.restartVotes.add(socketId);
        if (this.restartVotes.size === 2) {
            this.resetGame();
            this.restartVotes.clear();
            this.gameState.gameStatus = 'in-progress';
            if (this.gameType === 'three-mens-morris') {
                this.gameState.lastStarter = this.gameState.lastStarter === 'X' ? 'O' : 'X';
                this.gameState.currentPlayer = this.gameState.lastStarter;
            } else if (this.gameType === 'memory-match') {
                this.memoryState.turnRole = 'X';
            } else if (this.gameType === 'battleship') {
                this.battleshipGame.initGameState();
            }
            return { success: true, restart: true, firstTurn: this.gameType === 'three-mens-morris' ? this.gameState.lastStarter : 'X' };
        }
        return { success: true, restart: false };
    }

    resetGame() {
        this.gameState.board = Array(9).fill('');
        this.gameState.currentPlayer = 'X';
        this.gameState.winner = null;
        this.moveHistory = [];
        this.restartVotes.clear();
        if (this.gameType === 'three-mens-morris') {
            this.tmmGame.resetGame();
        } else if (this.gameType === 'memory-match') {
            this.memoryGame.resetGame();
        } else if (this.gameType === 'battleship') {
            this.battleshipGame.resetGame();
        }
    }

    resetBattleshipGame() {
        this.battleshipGame.resetGame();
    }

    getRoomInfo() {
        return {
            roomId: this.roomId,
            roomName: this.roomName,
            playerCount: this.players.length,
            spectatorCount: this.spectators.length,
            gameStatus: this.gameState.gameStatus,
            gameType: this.gameType,
            players: this.players.map(p => ({ username: p.username, role: p.role })),
            spectators: this.spectators.map(s => ({ username: s.username }))
        };
    }

    async getGameState() {
        const UserStore = require('../auth/UserStore');
        
        const playersWithAvatars = await Promise.all(
            this.players.map(async (p) => {
                const user = await UserStore.getUser(p.username);
                return {
                    username: p.username,
                    role: p.role,
                    avatar: user?.avatar || null
                };
            })
        );

        return {
            ...this.gameState,
            gameType: this.gameType,
            players: playersWithAvatars,
            piecesPlaced: this.gameType === 'three-mens-morris' ? (this.tmmGame ? this.tmmGame.getGameState().piecesPlaced : { ...this.gameState.piecesPlaced }) : null,
            phase: this.gameType === 'three-mens-morris' ? (this.tmmGame ? this.tmmGame.getGameState().phase : this.gameState.phase) : null,
            selectedPiece: this.gameType === 'three-mens-morris' ? (this.tmmGame ? this.tmmGame.getGameState().selectedPiece : this.gameState.selectedPiece) : null,
            canRemovePiece: this.gameType === 'three-mens-morris' ? (this.tmmGame ? this.tmmGame.getGameState().canRemovePiece : this.gameState.canRemovePiece) : null,
            memoryState: this.gameType === 'memory-match' ? (this.memoryGame ? this.memoryGame.getGameState() : null) : null,
            battleshipState: this.gameType === 'battleship' ? (this.battleshipGame ? this.battleshipGame.getGameState() : null) : null
        };
    }

    isPlayer(socketId) {
        return this.players.some(p => p.socketId === socketId);
    }

    isSpectator(socketId) {
        return this.spectators.some(s => s.socketId === socketId);
    }

    isEmpty() {
        return this.players.length === 0 && this.spectators.length === 0;
    }

    initBattleshipState() {
        this.battleshipGame.initGameState();
    }

    placeBattleshipShip(socketId, shipTypeId, startPos, isHorizontal) {
        if (this.gameType !== 'battleship') {
            return { error: 'Room is not running Battleship.' };
        }
        return this.battleshipGame.placeShip(socketId, shipTypeId, startPos, isHorizontal);
    }

    removeBattleshipShip(socketId, shipTypeId) {
        if (this.gameType !== 'battleship') {
            return { error: 'Room is not running Battleship.' };
        }
        return this.battleshipGame.removeShip(socketId, shipTypeId);
    }

    finishBattleshipPlacement(socketId) {
        if (this.gameType !== 'battleship') {
            return { error: 'Room is not running Battleship.' };
        }
        return this.battleshipGame.finishPlacement(socketId);
    }

    unlockBattleshipPlacement(socketId) {
        if (this.gameType !== 'battleship') {
            return { error: 'Room is not running Battleship.' };
        }
        return this.battleshipGame.unlockPlacement(socketId);
    }

    handleBattleshipPlacementTimeout() {
        if (this.gameType !== 'battleship') {
            return { error: 'Room is not running Battleship.' };
        }
        return this.battleshipGame.handlePlacementTimeout();
    }

    makeBattleshipGuess(socketId, position) {
        if (this.gameType !== 'battleship') {
            return { error: 'Room is not running Battleship.' };
        }
        return this.battleshipGame.makeGuess(socketId, position);
    }

    getBattleshipBoard(role, isOwnBoard) {
        return this.battleshipGame.getBoard(role, isOwnBoard);
    }

    getPlayerColor(role) {
        return role === 'X' ? 'Red' : 'Blue';
    }

    getPlayerNumber(role) {
        return role === 'X' ? 'Player 1' : 'Player 2';
    }
}

module.exports = GameRoom;


