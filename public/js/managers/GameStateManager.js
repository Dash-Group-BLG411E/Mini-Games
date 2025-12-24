

class GameStateManager {
    constructor(app) {
        this.app = app;
        
        this.gameBoard = app.gameBoard;
        this.infoText = app.infoText;
        this.rematchBtn = app.rematchBtn;
    }

    

    updateGameBoard() {
        if (!this.app.gameState || !this.gameBoard) return;
        
        if (this.app.viewManager && this.app.viewManager.currentGameType === 'three-mens-morris') {
            if (this.app.tmmGame) {
                if (!this.app.tmmGame.gridInitialized || !this.app.tmmGame.gameBoard?.querySelector('.tmm-board-svg')) {
                    this.app.tmmGame.init();
                    this.app.tmmGame.renderGrid();
                    this.app.tmmGame.gridInitialized = true;
                }
            }
        }

        const currentGameType = this.app.viewManager ? this.app.viewManager.currentGameType : 'three-mens-morris';
        const gameBoard = currentGameType === 'three-mens-morris' && this.app.tmmGame ? this.app.tmmGame.gameBoard : this.gameBoard;
        const cells = gameBoard?.querySelectorAll(currentGameType === 'three-mens-morris' ? '.tmm-intersection' : '.cells') || [];
        
        if (!this.app.gameState.board && currentGameType !== 'three-mens-morris') {
            return;
        }
        
        cells.forEach((cell, index) => {
            const piece = this.app.gameState.board ? this.app.gameState.board[index] : undefined;
            
            if (this.app.viewManager && this.app.viewManager.currentGameType === 'three-mens-morris') {
                if (piece) {
                    cell.innerHTML = `<div class="tmm-piece tmm-piece-${piece.toLowerCase()}"></div>`;
                    cell.classList.add('has-piece');
                } else {
                    cell.innerHTML = '';
                    cell.classList.remove('has-piece');
                }
                
                cell.style.opacity = '';
                cell.style.cursor = '';
                cell.style.border = '';
                cell.style.boxShadow = '';
                
                if (this.app.selectedPiece === index) {
                    cell.style.border = '3px solid #10b981';
                    cell.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.5)';
                    cell.style.transform = 'translate(-50%, -50%) scale(1.15)';
                }
                else if (this.app.canRemovePiece && piece && piece !== this.app.myRole) {
                    cell.style.border = '3px solid #ef4444';
                    cell.style.cursor = 'pointer';
                    cell.style.opacity = '0.8';
                    cell.style.transform = 'translate(-50%, -50%)';
                }
                else {
                    cell.style.transform = 'translate(-50%, -50%)';
                }
            } else {
                cell.textContent = piece || '';
            }
        });
    }

    

    updateGameInfo() {
        if (!this.app.gameState) {
            if (this.app.currentRoom) {
                if (this.app.isSpectator) {
                    if (this.infoText) {
                        this.infoText.textContent = 'Watching game';
                    }
                } else {
                    const message = 'Waiting for opponent...';
                    if (this.infoText) {
                        this.infoText.textContent = message;
                    }
                }
                if (this.infoText && this.infoText.parentElement) {
                    this.infoText.parentElement.classList.remove('your-turn-active');
                }
            }
            return;
        }

        if (this.app.viewManager && this.app.viewManager.currentGameType === 'battleship') {
            this._handleBattleshipGameInfo();
            return;
        }


        if (this.app.viewManager && this.app.viewManager.currentGameType === 'memory-match') {
            this._handleMemoryGameInfo();
            return;
        }

        this._handleTmmGameInfo();
    }

    

    _handleBattleshipGameInfo() {
        if (this.app.isSpectator) {
            if (this.infoText) {
                this.infoText.textContent = 'Watching game';
            }
            if (this.infoText && this.infoText.parentElement) {
                this.infoText.parentElement.classList.remove('your-turn-active');
            }
            return;
        }
        
        let hasTwoPlayersBattleship = this.app.gameState.players && this.app.gameState.players.length === 2;
        if (this.app.gameState.gameStatus === 'finished' && !hasTwoPlayersBattleship && this.app.lastKnownPlayers && this.app.lastKnownPlayers.length === 2) {
            hasTwoPlayersBattleship = true;
        }
        
        const isPlacementPhase = this.app.gameState.battleshipState && this.app.gameState.battleshipState.phase === 'placement';
        
        if (this.app.gameState.gameStatus === 'finished' && !this.app.isSpectator && hasTwoPlayersBattleship) {
            if (this.app.modalManager) {
                this.app.modalManager.hideGameEndModal();
            }
            if (this.infoText) {
                const winner = this.app.gameState.winner;
                const myRole = this.app.myRole;
                // Ensure both are strings for comparison
                const winnerStr = String(winner || '').trim();
                const myRoleStr = String(myRole || '').trim();
                
                if (winnerStr && myRoleStr && winnerStr === myRoleStr) {
                    this.infoText.textContent = 'Game Over: You Win! 🎉';
                } else if (winnerStr && myRoleStr && winnerStr !== myRoleStr) {
                    this.infoText.textContent = 'Game Over: You Lose! 😔';
                } else {
                    // If winner is not set, show generic message
                    this.infoText.textContent = 'Game Over!';
                }
            }
            if (this.infoText && this.infoText.parentElement) {
                this.infoText.parentElement.classList.remove('your-turn-active');
            }
            if (this.rematchBtn) {
                this.rematchBtn.classList.remove('hidden');
                this.rematchBtn.style.display = '';
                if (this.app.updateRematchButtonStatus) {
                    this.app.updateRematchButtonStatus();
                }
            }
            return;
        }
        
        if (this.rematchBtn) {
            if (isPlacementPhase || this.app.gameState.gameStatus !== 'finished') {
                this.rematchBtn.classList.add('hidden');
            }
        }
        
        if (this.app.updateBattleshipControls) {
            this.app.updateBattleshipControls();
        }
    }

    


    

    _handleMemoryGameInfo() {
        if (this.app.isSpectator) {
            if (this.infoText) {
                this.infoText.textContent = 'Watching game';
            }
            if (this.infoText && this.infoText.parentElement) {
                this.infoText.parentElement.classList.remove('your-turn-active');
            }
            return;
        }
        
        let hasTwoPlayersMemory = this.app.gameState.players && this.app.gameState.players.length === 2;
        if (this.app.gameState.gameStatus === 'finished' && !hasTwoPlayersMemory && this.app.lastKnownPlayers && this.app.lastKnownPlayers.length === 2) {
            hasTwoPlayersMemory = true;
        }
        
        if (this.app.gameState.gameStatus === 'finished' && !this.app.isSpectator && hasTwoPlayersMemory) {
            if (this.app.modalManager) {
                this.app.modalManager.hideGameEndModal();
            }
            if (this.infoText) {
                const winner = String(this.app.gameState.winner || '');
                const myRole = String(this.app.myRole || '');
                if (winner && myRole && winner === myRole) {
                    this.infoText.textContent = 'Game Over: You Win! 🎉';
                } else if (winner && myRole && winner !== myRole) {
                    this.infoText.textContent = 'Game Over: You Lose! 😔';
                } else {
                    // If winner is not set, check if we have a winner from gameState
                    console.warn('Battleship winner not set correctly:', { winner, myRole, gameState: this.app.gameState });
                    this.infoText.textContent = 'Game Over!';
                }
            }
            if (this.infoText && this.infoText.parentElement) {
                this.infoText.parentElement.classList.remove('your-turn-active');
            }
            if (this.rematchBtn) {
                this.rematchBtn.classList.remove('hidden');
                this.rematchBtn.style.display = '';
                if (this.app.updateRematchButtonStatus) {
                    this.app.updateRematchButtonStatus();
                }
            }
            return;
        }
        if (this.app.memoryGame) {
            this.app.memoryGame.updateStatus();
        }
    }

    

    _handleTmmGameInfo() {
        if (this.app.isSpectator) {
            if (this.infoText) {
                this.infoText.textContent = 'Watching game';
            }
            if (this.infoText && this.infoText.parentElement) {
                this.infoText.parentElement.classList.remove('your-turn-active');
            }
            return;
        }
        
        let finishedMessage = '';

        let hasTwoPlayers = this.app.gameState.players && this.app.gameState.players.length === 2;
        if (this.app.gameState.gameStatus === 'finished' && !hasTwoPlayers && this.app.lastKnownPlayers && this.app.lastKnownPlayers.length === 2) {
            hasTwoPlayers = true;
        }

        if (!hasTwoPlayers && !this.app.isSpectator && this.app.gameState.gameStatus !== 'finished') {
            const message = 'Waiting for opponent...';
            if (this.infoText) {
                this.infoText.textContent = message;
            }
            if (this.infoText && this.infoText.parentElement) {
                this.infoText.parentElement.classList.remove('your-turn-active');
            }
            return;
        }
        
        if (this.app.gameState.gameStatus === 'finished' && !this.app.isSpectator) {
            if (this.app.modalManager) {
                this.app.modalManager.hideGameEndModal();
            }
            if (this.infoText) {
                const winner = this.app.gameState.winner;
                const myRole = this.app.myRole;
                if (winner && myRole && winner === myRole) {
                    this.infoText.textContent = 'Game Over: You Win! 🎉';
                } else if (winner && myRole && winner !== myRole) {
                    this.infoText.textContent = 'Game Over: You Lose! 😔';
                } else {
                    // If winner is not set, check if we have a winner from gameState
                    console.warn('Battleship winner not set correctly:', { winner, myRole, gameState: this.app.gameState });
                    this.infoText.textContent = 'Game Over!';
                }
            }
            if (this.infoText && this.infoText.parentElement) {
                this.infoText.parentElement.classList.remove('your-turn-active');
            }
            if (this.rematchBtn) {
                this.rematchBtn.classList.remove('hidden');
                this.rematchBtn.style.display = '';
                if (this.app.updateRematchButtonStatus) {
                    this.app.updateRematchButtonStatus();
                }
            }
            return;
        } else {
            if (this.rematchBtn) {
                this.rematchBtn.classList.add('hidden');
            }
        }
        
        const statusMessages = {
            waiting: 'Waiting for opponent...',
            'in-progress': this.app.isSpectator ? 'Watching Game' : (() => {
                if (!hasTwoPlayers) {
                    return 'Waiting for opponent...';
                }
                if (this.app.viewManager && this.app.viewManager.currentGameType === 'three-mens-morris' && this.app.gameState.phase) {
                    const currentPlayer = this.app.gameState.players.find(p => p.role === this.app.gameState.currentPlayer);
                    const currentPlayerName = currentPlayer ? currentPlayer.username : 'Player';
                    
                    if (this.app.gameState.canRemovePiece) {
                        if (this.app.gameState.currentPlayer === this.app.myRole) {
                            return 'Remove opponent piece!';
                        } else {
                            return `${currentPlayerName}'s turn`;
                        }
                    } else if (this.app.gameState.phase === 'placement') {
                        if (this.app.gameState.currentPlayer === this.app.myRole) {
                            return 'Place piece';
                        } else {
                            return `${currentPlayerName}'s turn`;
                        }
                    } else if (this.app.gameState.phase === 'movement') {
                        if (this.app.selectedPiece !== null) {
                            return 'Select destination';
                        }
                        if (this.app.gameState.currentPlayer === this.app.myRole) {
                            return 'Select piece to move';
                        } else {
                            return `${currentPlayerName}'s turn`;
                        }
                    }
                }
                const currentPlayer = this.app.gameState.players.find(p => p.role === this.app.gameState.currentPlayer);
                const currentPlayerName = currentPlayer ? currentPlayer.username : 'Player';
                if (this.app.gameState.currentPlayer === this.app.myRole) {
                    return `${currentPlayerName}'s turn`;
                } else {
                    return `${currentPlayerName}'s turn`;
                }
            })(),
            finished: finishedMessage
        };

        const hasTwoPlayersCheck = this.app.gameState.players && this.app.gameState.players.length === 2;
        if (!hasTwoPlayersCheck && !this.app.isSpectator && this.app.gameState.gameStatus !== 'finished') {
            const message = 'Waiting for opponent...';
            if (this.infoText) {
                this.infoText.textContent = message;
            }
            if (this.infoText && this.infoText.parentElement) {
                this.infoText.parentElement.classList.remove('your-turn-active');
            }
            return;
        }
        
        const message = statusMessages[this.app.gameState.gameStatus] || 'Game in progress';
        if (this.infoText) {
            this.infoText.textContent = message;
        }
        
        if (this.infoText && this.infoText.parentElement) {
            if (message === 'Your turn' || message.startsWith('Place piece') || message === 'Select piece to move' || message === 'Select destination' || message === 'Remove opponent piece!') {
                this.infoText.parentElement.classList.add('your-turn-active');
            } else {
                this.infoText.parentElement.classList.remove('your-turn-active');
            }
        }
        
        if (this.app.gameState.gameStatus !== 'finished' || this.app.isSpectator || !this.app.gameState.players || this.app.gameState.players.length !== 2) {
            if (this.app.hideGameEndModal) {
                this.app.hideGameEndModal();
            }
            this.app.rematchRequestFrom = null;
            this.app.hasRequestedRematch = false;
        }
    }
}
