

class MemoryGame {
    constructor(app) {
        this.app = app;
        
        this.stage = document.getElementById('memory-stage');
        this.grid = document.getElementById('memory-grid');
        this.status = document.getElementById('memory-status');
        this.matchMessage = document.getElementById('memory-match-message');
        this.memoryMatchMessage = document.getElementById('memory-match-message');
        this.player1 = document.getElementById('memory-player-1');
        this.player1Avatar = document.getElementById('memory-player-1-avatar');
        this.player1Name = document.getElementById('memory-player-1-name');
        this.player1Score = document.getElementById('memory-player-1-score');
        this.player2 = document.getElementById('memory-player-2');
        this.player2Avatar = document.getElementById('memory-player-2-avatar');
        this.player2Name = document.getElementById('memory-player-2-name');
        this.player2Score = document.getElementById('memory-player-2-score');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.grid) {
            this.grid.addEventListener('click', (event) => {
                const card = event.target.closest('.memory-card');
                if (!card) return;
                if (this.app.gameState && this.app.gameState.players && this.app.gameState.players.length < 2) {
                    return;
                }
                if (this.app.gameState && this.app.gameState.gameStatus === 'waiting') {
                    return;
                }
                if (card.classList.contains('revealed') || card.classList.contains('matched') || card.classList.contains('disabled')) {
                    return;
                }
                const revealedCards = this.grid.querySelectorAll('.memory-card.revealed:not(.matched)');
                if (revealedCards.length >= 2) {
                    return;
                }
                const cardId = Number(card.dataset.id);
                if (isNaN(cardId)) return;
                
                card.classList.add('disabled');
                
                this.submitFlip(cardId);
            });
        }
    }

    init() {
    }

    renderBoard(state) {
        if (!this.stage || !this.grid) return;
        if (this.app.currentGameType === 'memory-match') {
            this.stage.classList.remove('hidden');
        } else {
            this.stage.classList.add('hidden');
            return;
        }
        
        const memoryState = state || (this.app.gameState && this.app.gameState.memoryState) || null;
        
        if (!memoryState || !memoryState.cards) {
            this.grid.innerHTML = '';
            const hasTwoPlayers = this.app.gameState && this.app.gameState.players && this.app.gameState.players.length === 2;
            if (!hasTwoPlayers) {
                for (let i = 0; i < 18; i++) {
                    const cardEl = document.createElement('div');
                    cardEl.className = 'memory-card';
                    cardEl.dataset.id = i;
                    this.grid.appendChild(cardEl);
                }
            }
            if (this.status) {
                this.status.style.display = 'none';
            }
            if (this.app.gameState && this.app.gameState.players) {
                this.updatePlayerInfo(memoryState);
            }
            return;
        }
        
        const cardsToRender = memoryState.cards || [];
        
        this.grid.innerHTML = '';
        cardsToRender.forEach(card => {
            const cardEl = document.createElement('div');
            const classes = ['memory-card'];
            if (card.revealed || card.matched) classes.push('revealed');
            if (card.matched) classes.push('matched');
            cardEl.className = classes.join(' ');
            cardEl.dataset.id = card.id;
            cardEl.textContent = card.revealed || card.matched ? card.value : '';
            this.grid.appendChild(cardEl);
        });
        
        if (this.status) {
            this.status.style.display = 'none';
        }
        
        this.updatePlayerInfo(state);
    }

    async updatePlayerInfo(state) {
        if (!this.app.gameState) return;
        
        let players = this.app.gameState.players || [];
        
        if (this.app.gameState.gameStatus === 'finished' && players.length === 1 && this.app.lastKnownPlayers && this.app.lastKnownPlayers.length === 2) {
            players = this.app.lastKnownPlayers;
        }
        
        const player1 = players.find(p => p.role === 'X');
        const player2 = players.find(p => p.role === 'O');

        const score1 = (state && state.matches) ? state.matches.X || 0 : 0;
        const score2 = (state && state.matches) ? state.matches.O || 0 : 0;
        
        const isSpectator = this.app.isSpectator;
        const hasTwoPlayers = players.length === 2;
        
        // For spectators, show both player names
        if (isSpectator) {
            if (player1) {
                const avatar1 = this.app.avatarManager ? await this.app.avatarManager.getPlayerAvatar(player1.username, player1.avatar) : '👤';
                if (this.player1Avatar) {
                    this.player1Avatar.textContent = avatar1;
                }
                if (this.player1Name) {
                    this.player1Name.textContent = player1.username;
                }
                if (this.player1Score) {
                    if (hasTwoPlayers) {
                        this.player1Score.textContent = score1;
                    } else {
                        this.player1Score.textContent = '';
                    }
                }
            }
            
            if (player2) {
                const avatar2 = this.app.avatarManager ? await this.app.avatarManager.getPlayerAvatar(player2.username, player2.avatar) : '👤';
                if (this.player2Avatar) {
                    this.player2Avatar.textContent = avatar2;
                }
                if (this.player2Name) {
                    this.player2Name.textContent = player2.username;
                }
                if (this.player2Score) {
                    if (hasTwoPlayers) {
                        this.player2Score.textContent = score2;
                    } else {
                        this.player2Score.textContent = '';
                    }
                }
            }
            return;
        }
        
        // For players, show "You" on left and "Opponent" on right with correct scores
        const myRole = this.app.myRole;
        const myPlayer = players.find(p => p.role === myRole);
        const opponentRole = myRole === 'X' ? 'O' : 'X';
        const opponentPlayer = players.find(p => p.role === opponentRole);
        
        // Left side always shows current user (You), right side shows opponent
        const leftPlayer = myPlayer;
        const rightPlayer = opponentPlayer;
        const leftScore = myRole === 'X' ? score1 : score2;
        const rightScore = opponentRole === 'X' ? score1 : score2;
        
        if (leftPlayer) {
            const avatar1 = this.app.avatarManager ? await this.app.avatarManager.getPlayerAvatar(leftPlayer.username, leftPlayer.avatar) : '👤';
            if (this.player1Avatar) {
                this.player1Avatar.textContent = avatar1;
            }
            if (this.player1Name) {
                this.player1Name.textContent = leftPlayer.username;
            }
            if (this.player1Score) {
                if (hasTwoPlayers) {
                    this.player1Score.textContent = leftScore;
                } else {
                    this.player1Score.textContent = '';
                }
            }
        }
        
        if (rightPlayer) {
            const avatar2 = this.app.avatarManager ? await this.app.avatarManager.getPlayerAvatar(rightPlayer.username, rightPlayer.avatar) : '👤';
            if (this.player2Avatar) {
                this.player2Avatar.textContent = avatar2;
            }
            if (this.player2Name) {
                this.player2Name.textContent = rightPlayer.username;
            }
            if (this.player2Score) {
                if (hasTwoPlayers) {
                    this.player2Score.textContent = rightScore;
                } else {
                    this.player2Score.textContent = '';
                }
            }
        } else {
            if (this.app.gameState.gameStatus === 'finished' && this.app.lastKnownPlayers && this.app.lastKnownPlayers.length === 2) {
                const lastKnownOpponent = this.app.lastKnownPlayers.find(p => p.username !== this.app.currentUser);
                if (lastKnownOpponent) {
                    const lastScore = lastKnownOpponent.role === 'X' ? score1 : score2;
                    
                    const lastAvatar2 = this.app.avatarManager ? await this.app.avatarManager.getPlayerAvatar(lastKnownOpponent.username, lastKnownOpponent.avatar) : '👤';
                    if (this.player2Avatar) {
                        this.player2Avatar.textContent = lastAvatar2;
                    }
                    if (this.player2Name) {
                        this.player2Name.textContent = lastKnownOpponent.username;
                    }
                    if (this.player2Score && state && state.matches) {
                        this.player2Score.textContent = lastScore;
                    } else if (this.player2Score) {
                        this.player2Score.textContent = '';
                    }
                }
            } else {
                if (this.player2Name) {
                    this.player2Name.textContent = 'Waiting...';
                    if (this.player2Avatar) {
                        this.player2Avatar.textContent = '👤';
                    }
                    if (this.player2Score) {
                        this.player2Score.textContent = '';
                    }
                }
            }
        }
    }

    updateStatus() {
        if (this.app.currentGameType !== 'memory-match') return;

        if (!this.app.gameState) {
            if (this.app.currentRoom && !this.app.isSpectator) {
                const message = 'Waiting for opponent...';
                if (this.app.infoText) {
                    this.app.infoText.textContent = message;
                }
                if (this.app.infoText && this.app.infoText.parentElement) {
                    this.app.infoText.parentElement.classList.remove('your-turn-active');
                }
            }
            return;
        }

        let message = '';
        let isYourTurn = false;

        const hasTwoPlayers = this.app.gameState.players && this.app.gameState.players.length === 2;

        if (this.app.isSpectator) {
            message = 'Watching Game';
        } else if (!hasTwoPlayers) {
            message = 'Waiting for opponent...';
        } else if (this.app.gameState.gameStatus === 'waiting') {
            message = 'Waiting for players...';
        } else if (this.app.gameState.gameStatus === 'finished') {
            return;
        } else if (this.app.gameState.gameStatus === 'in-progress' && hasTwoPlayers) {
            const turnRole = this.app.gameState.memoryState?.turnRole;
            const currentPlayer = this.app.gameState.players.find(p => p.role === turnRole);
            const currentPlayerName = currentPlayer ? currentPlayer.username : 'Player';
            
            if (turnRole === this.app.myRole) {
                message = `${currentPlayerName}'s turn`;
                isYourTurn = true;
            } else {
                message = `${currentPlayerName}'s turn`;
            }
        } else if (this.app.gameState.gameStatus === 'in-progress' && !hasTwoPlayers) {
            message = 'Waiting for opponent...';
        } else {
            message = 'Game in progress';
        }

        if (this.app.isSpectator) {
            if (this.app.infoText) {
                this.app.infoText.textContent = 'Watching game';
            }
            if (this.app.infoText && this.app.infoText.parentElement) {
                this.app.infoText.parentElement.classList.remove('your-turn-active');
            }
            return;
        }

        if (this.app.infoText) {
            this.app.infoText.textContent = message;
        }

        if (this.app.infoText && this.app.infoText.parentElement) {
            if (isYourTurn && this.app.gameState.gameStatus === 'in-progress') {
                this.app.infoText.parentElement.classList.add('your-turn-active');
            } else {
                this.app.infoText.parentElement.classList.remove('your-turn-active');
            }
        }
        
        if (this.app.gameState.gameStatus !== 'finished') {
            this.app.rematchRequestFrom = null;
            this.app.hasRequestedRematch = false;
        }
    }

    submitFlip(cardId) {
        if (!this.app.socket || !this.app.currentRoom || this.app.currentGameType !== 'memory-match') return;
        this.app.socket.emit('memoryFlip', { roomId: this.app.currentRoom, cardId });
    }

    

    showMatchMessage(message) {
        if (!this.memoryMatchMessage) return;
        this.memoryMatchMessage.textContent = message;
        this.memoryMatchMessage.classList.remove('hidden');
        this.memoryMatchMessage.classList.add('show');
        setTimeout(() => {
            this.hideMatchMessage();
        }, 500);
    }

    

    hideMatchMessage() {
        if (!this.memoryMatchMessage) return;
        this.memoryMatchMessage.classList.remove('show');
        setTimeout(() => {
            this.memoryMatchMessage.classList.add('hidden');
            this.memoryMatchMessage.textContent = '';
        }, 300);
    }
}
