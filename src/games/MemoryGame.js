

class MemoryGame {
    constructor(room) {
        this.room = room;
    }

    

    initGameState() {
        const pairs = ['🍎','🍌','🍒','🥝','🍇','🍋','🍊','🍑','🥭'];
        const deck = [...pairs, ...pairs];
        for (let i = deck.length -1; i>0; i--) {
            const j = Math.floor(Math.random()* (i+1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        this.room.memoryState = {
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
        this.room.gameState.board = Array(deck.length).fill('');
    }

    

    resetGame() {
        this.initGameState();
    }

    

    flipCard(socketId, cardId) {
        const player = this.room.players.find(p => p.socketId === socketId);
        if (!player) {
            return { error: 'Player not in room.' };
        }
        if (this.room.players.length < 2) {
            return { error: 'Waiting for second player to start the game.' };
        }
        if (this.room.gameState.gameStatus === 'waiting') {
            return { error: 'Game has not started yet.' };
        }
        if (this.room.gameState.gameStatus === 'finished') {
            return { error: 'Game finished.' };
        }
        if (this.room.players.length === 2 && this.room.memoryState.turnRole !== player.role) {
            return { error: 'Not your turn.' };
        }
        if (this.room.memoryState.flipped.length >= 2) {
            return { error: 'Already flipped 2 cards, wait for result.' };
        }
        const card = this.room.memoryState.cards[cardId];
        if (!card || card.revealed || card.matched) {
            return { invalid: true };
        }
        card.revealed = true;
        this.room.memoryState.flipped.push(card);
        if (this.room.memoryState.flipped.length === 2) {
            const [first, second] = this.room.memoryState.flipped;
            if (first.value === second.value) {
                first.matched = true;
                second.matched = true;
                this.room.memoryState.matches[player.role] +=1;
                this.room.memoryState.flipped = [];
                const totalMatches = this.room.memoryState.matches.X + this.room.memoryState.matches.O;
                if (totalMatches === this.room.memoryState.cards.length/2) {
                    this.room.gameState.gameStatus = 'finished';
                    let winnerRole;
                    if (this.room.memoryState.matches.X > this.room.memoryState.matches.O) {
                        winnerRole = 'X';
                    } else if (this.room.memoryState.matches.O > this.room.memoryState.matches.X) {
                        winnerRole = 'O';
                    } else {
                        winnerRole = Math.random() < 0.5 ? 'X' : 'O';
                    }
                    this.room.gameState.winner = winnerRole;
                    return { match: true, winnerRole };
                }
                return { match: true };
            }
            this.room.memoryState.gameStatus = 'in-progress';
            const pending = [first.id, second.id];
            this.room.memoryState.flipped = [];
            this.room.memoryState.turnRole = this.room.memoryState.turnRole === 'X' ? 'O' : 'X';
            return { flip: true, pendingCards: pending, turnRole: this.room.memoryState.turnRole };
        }
        return { flip: true };
    }

    

    hideCards(cardIds) {
        if (!this.room.memoryState) return;
        cardIds.forEach(id => {
            const card = this.room.memoryState.cards.find(c => c.id === id);
            if (card && !card.matched) {
                card.revealed = false;
            }
        });
    }

    

    getGameState() {
        if (!this.room.memoryState) return null;
        return {
            cards: this.room.memoryState.cards.map(card => ({
                id: card.id,
                value: card.value,
                revealed: card.revealed,
                matched: card.matched
            })),
            matches: this.room.memoryState.matches,
            turnRole: this.room.memoryState.turnRole,
            gameStatus: this.room.memoryState.gameStatus
        };
    }
}

module.exports = MemoryGame;
