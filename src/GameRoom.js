class GameRoom {
    constructor(roomId, roomName = null, gameType = 'tic-tac-toe') {
        this.roomId = roomId;
        this.roomName = roomName || `Room ${roomId}`;
        this.players = [];
        this.spectators = [];
        this.gameType = gameType;
        this.restartVotes = new Set();
        this.rpsChoices = {};
        this.rpsRound = 1;
        this.rpsScores = { X: 0, O: 0 };
        this.tttScores = { X: 0, O: 0 };
        this.memoryState = null;
        this.gameState = {};
        this.resetGameState();
        this.createdAt = new Date();
    }

    setGameType(type) {
        this.gameType = type || 'tic-tac-toe';
        this.resetGameState();
    }

    resetGameState() {
        this.gameState = {
            board: Array(9).fill(''),
            currentPlayer: 'X',
            gameStatus: 'waiting',
            winner: null,
            lastStarter: 'X'
        };
        this.resetRpsChoices();
        if (this.gameType === 'tic-tac-toe') {
            this.tttScores = { X: 0, O: 0 };
        }
        if (this.gameType === 'memory-match') {
            // Always initialize memory state for memory match games
            this.initMemoryState();
        } else {
            this.memoryState = null;
        }
    }

    resetRpsChoices() {
        this.rpsChoices = {};
    }

    resetRpsGame() {
        this.rpsChoices = {};
        this.rpsRound = 1;
        this.rpsScores = { X: 0, O: 0 };
    }

    resetTttGame() {
        this.tttScores = { X: 0, O: 0 };
    }

    addPlayer(socketId, username) {
        if (this.players.length >= 2) {
            return { success: false, error: 'Room is full' };
        }

        if (this.gameState.gameStatus === 'in-progress') {
            return { success: false, error: 'Game has already started' };
        }

        const role = this.players.length === 0 ? 'X' : 'O';
        const player = { socketId, username, role };
        this.players.push(player);

        if (this.players.length === 2) {
            this.gameState.gameStatus = 'in-progress';
            if (this.gameType === 'tic-tac-toe') {
                this.gameState.currentPlayer = 'X';
            } else if (this.gameType === 'rock-paper-scissors') {
                this.resetRpsGame();
            } else if (this.gameType === 'memory-match') {
                this.initMemoryState();
            }
        } else if (this.players.length === 1 && this.gameType === 'memory-match') {
            // Initialize memory state even with one player so they can see the board
            this.initMemoryState();
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
                this.resetGame();
                this.gameState.gameStatus = 'waiting';
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

    makeMove(cellId, move, socketId) {
        if (this.gameType !== 'tic-tac-toe') {
            return { success: false, error: 'Room is not running Tic Tac Toe' };
        }

        if (this.gameState.gameStatus !== 'in-progress') {
            return { success: false, error: 'Game is not in progress' };
        }

        if (this.gameState.board[cellId] !== '') {
            return { success: false, error: 'Cell already occupied' };
        }

        const player = this.players.find(p => p.socketId === socketId);
        if (!player || player.role !== move) {
            return { success: false, error: 'Invalid move' };
        }

        if (move !== this.gameState.currentPlayer) {
            return { success: false, error: 'Not your turn' };
        }

        this.gameState.board[cellId] = move;
        const result = this.checkWin();
        let roundOver = false;
        let roundWinner = null;
        let gameOver = false;
        let gameWinner = null;
        
        if (result.winner) {
            roundOver = true;
            roundWinner = result.winner;
            this.tttScores[result.winner] += 1;
            
            // Check for game over (first to 3 wins)
            if (this.tttScores[result.winner] >= 3) {
                gameOver = true;
                gameWinner = result.winner;
                this.gameState.gameStatus = 'finished';
                this.gameState.winner = result.winner;
            } else {
                // Round is over, but game continues - reset board for next round
                this.gameState.board = Array(9).fill('');
                this.gameState.currentPlayer = this.gameState.lastStarter === 'X' ? 'O' : 'X';
                this.gameState.lastStarter = this.gameState.currentPlayer;
            }
            return { success: true, move, roundOver, roundWinner, gameOver, gameWinner, scores: { ...this.tttScores } };
        } else if (result.draw) {
            roundOver = true;
            roundWinner = 'draw';
            // Draw - reset board for next round, same starter
            this.gameState.board = Array(9).fill('');
            return { success: true, move, roundOver, roundWinner, gameOver: false, scores: { ...this.tttScores } };
        }

        this.gameState.currentPlayer = this.gameState.currentPlayer === 'X' ? 'O' : 'X';
        return { success: true, move, gameOver: false, scores: { ...this.tttScores } };
    }

    submitRpsChoice(socketId, choice) {
        if (this.gameType !== 'rock-paper-scissors') {
            return { error: 'Room is not running Rock Paper Scissors' };
        }

        // Check if game is already finished
        if (this.gameState.gameStatus === 'finished') {
            return { error: 'Game is already finished' };
        }

        const player = this.players.find(p => p.socketId === socketId);
        if (!player) {
            return { error: 'Player not found in room' };
        }

        this.rpsChoices[player.role] = choice;
        if (Object.keys(this.rpsChoices).length < 2) {
            return { waiting: true, choices: { ...this.rpsChoices } };
        }

        const choiceX = this.rpsChoices['X'];
        const choiceO = this.rpsChoices['O'];
        const winnerRole = this.evaluateRpsWinner(choiceX, choiceO);
        const winnerPlayer = this.players.find(p => p.role === winnerRole);
        const winnerUsername = winnerRole === 'draw' ? null : winnerPlayer?.username || null;

        // Update scores
        if (winnerRole !== 'draw') {
            this.rpsScores[winnerRole] += 1;
        }

        const round = this.rpsRound;
        this.rpsRound += 1;

        // Check for game over (first to 5 wins)
        let gameOver = false;
        let gameWinner = null;
        if (this.rpsScores.X >= 5) {
            gameOver = true;
            gameWinner = 'X';
            this.gameState.gameStatus = 'finished';
            this.gameState.winner = 'X';
        } else if (this.rpsScores.O >= 5) {
            gameOver = true;
            gameWinner = 'O';
            this.gameState.gameStatus = 'finished';
            this.gameState.winner = 'O';
        }

        // Reset choices for next round (if game not over)
        if (!gameOver) {
            this.resetRpsChoices();
        }

        return {
            choices: { X: choiceX, O: choiceO },
            winnerRole,
            winnerUsername,
            round,
            scores: { ...this.rpsScores },
            gameOver,
            gameWinner: gameWinner ? (this.players.find(p => p.role === gameWinner)?.username || null) : null
        };
    }

    initMemoryState() {
        const pairs = ['🍎','🍌','🍒','🥝','🍇','🍋','🍊','🍑','🥭'];
        const deck = [...pairs, ...pairs];
        for (let i = deck.length -1; i>0; i--) {
            const j = Math.floor(Math.random()* (i+1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        this.memoryState = {
            cards: deck.map((value,index) => ({
                id: index,
                value,
                revealed: false,
                matched: false
            })),
            turnRole: 'X',
            flipped: [],
            matches: { X:0, O:0 }
        };
        this.gameState.board = Array(deck.length).fill('');
        this.gameState.gameStatus = 'waiting';
    }

    flipMemoryCard(socketId, cardId) {
        if (this.gameType !== 'memory-match') {
            return { error: 'Wrong game' };
        }
        const player = this.players.find(p => p.socketId === socketId);
        if (!player) {
            return { error: 'Player not in room' };
        }
        // Prevent flipping if waiting for second player
        if (this.players.length < 2) {
            return { error: 'Waiting for second player to start the game' };
        }
        if (this.gameState.gameStatus === 'waiting') {
            return { error: 'Game has not started yet' };
        }
        if (this.gameState.gameStatus === 'finished') {
            return { error: 'Game finished' };
        }
        // Check if it's the player's turn (for multiplayer)
        if (this.players.length === 2 && this.memoryState.turnRole !== player.role) {
            return { error: 'Not your turn' };
        }
        // Prevent flipping more than 2 cards at a time
        if (this.memoryState.flipped.length >= 2) {
            return { error: 'Already flipped 2 cards, wait for result' };
        }
        const card = this.memoryState.cards[cardId];
        if (!card || card.revealed || card.matched) {
            return { invalid: true };
        }
        card.revealed = true;
        this.memoryState.flipped.push(card);
        if (this.memoryState.flipped.length === 2) {
            const [first, second] = this.memoryState.flipped;
            if (first.value === second.value) {
                first.matched = true;
                second.matched = true;
                this.memoryState.matches[player.role] +=1;
                this.memoryState.flipped = [];
                const totalMatches = this.memoryState.matches.X + this.memoryState.matches.O;
                if (totalMatches === this.memoryState.cards.length/2) {
                    this.gameState.gameStatus = 'finished';
                    const winnerRole = this.memoryState.matches.X === this.memoryState.matches.O
                        ? 'draw'
                        : this.memoryState.matches.X > this.memoryState.matches.O ? 'X' : 'O';
                    this.gameState.winner = winnerRole;
                    return { match: true, winnerRole };
                }
                return { match: true };
            }
            this.memoryState.gameStatus = 'in-progress';
            const pending = [first.id, second.id];
            this.memoryState.flipped = [];
            this.memoryState.turnRole = this.memoryState.turnRole === 'X' ? 'O' : 'X';
            return { flip: true, pendingCards: pending, turnRole: this.memoryState.turnRole };
        }
        return { flip: true };
    }

    hideMemoryCards(cardIds) {
        if (!this.memoryState) return;
        cardIds.forEach(id => {
            const card = this.memoryState.cards.find(c => c.id === id);
            if (card && !card.matched) {
                card.revealed = false;
            }
        });
    }

    evaluateRpsWinner(choiceX, choiceO) {
        if (choiceX === choiceO) {
            return 'draw';
        }
        const beats = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
        if (beats[choiceX] === choiceO) {
            return 'X';
        }
        return 'O';
    }

    checkWin() {
        if (this.gameType !== 'tic-tac-toe') {
            return {};
        }

        const board = this.gameState.board;
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
            return { draw: true };
        }

        return {};
    }

    requestRestart(socketId) {
        if (this.gameState.gameStatus !== 'finished') {
            return { success: false, error: 'Game is not finished' };
        }

        this.restartVotes.add(socketId);
        if (this.restartVotes.size === 2) {
            this.resetGame();
            this.restartVotes.clear();
            this.gameState.gameStatus = 'in-progress';
            if (this.gameType === 'tic-tac-toe') {
                this.gameState.lastStarter = this.gameState.lastStarter === 'X' ? 'O' : 'X';
                this.gameState.currentPlayer = this.gameState.lastStarter;
            } else if (this.gameType === 'memory-match') {
                this.memoryState.turnRole = 'X';
            }
            return { success: true, restart: true, firstTurn: this.gameType === 'tic-tac-toe' ? this.gameState.lastStarter : 'X' };
        }
        return { success: true, restart: false };
    }

    resetGame() {
        this.gameState.board = Array(9).fill('');
        this.gameState.currentPlayer = 'X';
        this.gameState.winner = null;
        this.restartVotes.clear();
        if (this.gameType === 'rock-paper-scissors') {
            this.resetRpsGame();
        } else if (this.gameType === 'tic-tac-toe') {
            this.resetTttGame();
        } else if (this.gameType === 'memory-match') {
            this.initMemoryState();
        } else {
            this.resetRpsChoices();
        }
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

    getGameState() {
        return {
            ...this.gameState,
            gameType: this.gameType,
            players: this.players.map(p => ({ username: p.username, role: p.role })),
            rpsScores: this.gameType === 'rock-paper-scissors' ? { ...this.rpsScores } : null,
            tttScores: this.gameType === 'tic-tac-toe' ? { ...this.tttScores } : null,
            memoryState: this.memoryState ? {
                cards: this.memoryState.cards.map(card => ({
                    id: card.id,
                    value: card.value,
                    revealed: card.revealed,
                    matched: card.matched
                })),
                matches: this.memoryState.matches,
                turnRole: this.memoryState.turnRole,
                gameStatus: this.memoryState.gameStatus
            } : null
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
}

module.exports = GameRoom;


