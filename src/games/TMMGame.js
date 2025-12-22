

class TMMGame {
    constructor(room) {
        this.room = room;
    }

    

    initGameState() {
        this.room.gameState = {
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
        this.room.tmmScores = { X: 0, O: 0 };
        this.room.moveHistory = [];
    }

    

    resetGame() {
        this.room.gameState.board = Array(9).fill('');
        this.room.gameState.currentPlayer = 'X';
        this.room.gameState.winner = null;
        this.room.moveHistory = [];
        this.room.gameState.phase = 'placement';
        this.room.gameState.piecesPlaced = { X: 0, O: 0 };
        this.room.gameState.selectedPiece = null;
        this.room.gameState.canRemovePiece = false;
        this.room.tmmScores = { X: 0, O: 0 };
    }

    

    makeMove(cellId, move, socketId, fromCellId = null) {
        if (this.room.gameState.gameStatus !== 'in-progress') {
            return { success: false, error: 'Game is not in progress.' };
        }

        const player = this.room.players.find(p => p.socketId === socketId);
        if (!player || player.role !== move) {
            return { success: false, error: 'Invalid move.' };
        }

        if (move !== this.room.gameState.currentPlayer) {
            return { success: false, error: 'Not your turn.' };
        }

        if (this.room.gameState.canRemovePiece && fromCellId === null) {
            return this.removeOpponentPiece(cellId, move);
        }

        if (this.room.gameState.phase === 'placement') {
            if (this.room.gameState.piecesPlaced[move] >= 3) {
                return { success: false, error: 'All pieces already placed.' };
            }
            if (this.room.gameState.board[cellId] !== '') {
                return { success: false, error: 'Cell already occupied.' };
            }

            this.room.gameState.board[cellId] = move;
            this.room.gameState.piecesPlaced[move] += 1;
            this.room.moveHistory.push({ cellId, move, player: move, phase: 'placement' });

            if (this.room.gameState.piecesPlaced.X === 3 && this.room.gameState.piecesPlaced.O === 3) {
                this.room.gameState.phase = 'movement';
            }

        } else if (this.room.gameState.phase === 'movement') {
            if (fromCellId === null) {
                if (this.room.gameState.board[cellId] === move) {
                    if (this.room.gameState.selectedPiece === cellId) {
                        this.room.gameState.selectedPiece = null;
                    } else {
                        this.room.gameState.selectedPiece = cellId;
                    }
                    return { success: true, pieceSelected: true, selectedCell: this.room.gameState.selectedPiece };
                } else if (this.room.gameState.selectedPiece === cellId) {
                    this.room.gameState.selectedPiece = null;
                    return { success: true, pieceSelected: true, selectedCell: null };
                } else {
                    return { success: false, error: 'You can only select your own pieces.' };
                }
            } else {
                if (this.room.gameState.board[cellId] !== '') {
                    return { success: false, error: 'Target cell is occupied.' };
                }
                if (this.room.gameState.board[fromCellId] !== move) {
                    return { success: false, error: 'You can only move your own pieces.' };
                }
                if (fromCellId === cellId) {
                    return { success: false, error: 'Cannot move to the same cell.' };
                }

                if (!this.isAdjacent(fromCellId, cellId)) {
                    return { success: false, error: 'You can only move to an adjacent point.' };
                }

                this.room.gameState.board[fromCellId] = '';
                this.room.gameState.board[cellId] = move;
                this.room.gameState.selectedPiece = null;
                this.room.moveHistory.push({ cellId, move, player: move, phase: 'movement', fromCellId });
            }
        }
        
        const result = this.checkWin();
        let roundOver = false;
        let roundWinner = null;
        let gameOver = false;
        let gameWinner = null;
        
        if (result.winner) {
            const opponent = move === 'X' ? 'O' : 'X';
            const opponentPieces = this.countPiecesOnBoard(opponent);
            
            if (opponentPieces > 3) {
                this.room.gameState.canRemovePiece = true;
                return { success: true, move, threeInARow: true, canRemovePiece: true };
            } else {
                gameOver = true;
                gameWinner = result.winner;
                this.room.gameState.gameStatus = 'finished';
                this.room.gameState.winner = gameWinner;
                return { success: true, move, roundOver: true, roundWinner: gameWinner, gameOver: true, gameWinner: gameWinner };
            }
        }

        this.room.gameState.currentPlayer = this.room.gameState.currentPlayer === 'X' ? 'O' : 'X';
        return { success: true, move, gameOver: false, phase: this.room.gameState.phase, piecesPlaced: { ...this.room.gameState.piecesPlaced } };
    }

    

    removeOpponentPiece(cellId, move) {
        const opponent = move === 'X' ? 'O' : 'X';
        
        if (this.room.gameState.board[cellId] !== opponent) {
            return { success: false, error: 'You can only remove opponent pieces.' };
        }

        const opponentPieces = this.countPiecesOnBoard(opponent);
        if (opponentPieces <= 3) {
            return { success: false, error: 'Cannot remove piece - opponent has 3 or fewer pieces.' };
        }

        this.room.gameState.board[cellId] = '';
        this.room.gameState.piecesPlaced[opponent] = Math.max(0, this.room.gameState.piecesPlaced[opponent] - 1);
        this.room.gameState.canRemovePiece = false;

        const remainingOpponentPieces = this.countPiecesOnBoard(opponent);
        if (remainingOpponentPieces <= 3) {
            const gameWinner = move;
            this.room.gameState.gameStatus = 'finished';
            this.room.gameState.winner = gameWinner;
            return { success: true, move, roundOver: true, roundWinner: gameWinner, gameOver: true, gameWinner: gameWinner };
        }

        this.room.gameState.currentPlayer = this.room.gameState.currentPlayer === 'X' ? 'O' : 'X';
        return { success: true, move, pieceRemoved: true, phase: this.room.gameState.phase, piecesPlaced: { ...this.room.gameState.piecesPlaced } };
    }

    

    countPiecesOnBoard(player) {
        return this.room.gameState.board.filter(cell => cell === player).length;
    }

    

    isAdjacent(fromId, toId) {
        const adjacencyMap = {
            0: [1, 3, 4],
            1: [0, 2, 4],
            2: [1, 4, 5],
            3: [0, 4, 6],
            4: [0, 1, 2, 3, 5, 6, 7, 8],
            5: [2, 4, 8],
            6: [3, 4, 7],
            7: [4, 6, 8],
            8: [4, 5, 7]
        };

        return adjacencyMap[fromId] && adjacencyMap[fromId].includes(toId);
    }

    

    checkWin() {
        const board = this.room.gameState.board;
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let [a, b, c] of winPatterns) {
            if (board[a] && board[a] === board[b] && board[b] === board[c]) {
                return { winner: board[a] };
            }
        }

        if (board.every(cell => cell !== '')) {
            const randomIndex = Math.floor(Math.random() * board.length);
            this.room.gameState.board[randomIndex] = '';
        }

        return {};
    }

    

    getGameState() {
        return {
            piecesPlaced: { ...this.room.gameState.piecesPlaced },
            phase: this.room.gameState.phase,
            selectedPiece: this.room.gameState.selectedPiece,
            canRemovePiece: this.room.gameState.canRemovePiece
        };
    }
}

module.exports = TMMGame;
