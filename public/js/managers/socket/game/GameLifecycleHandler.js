class GameLifecycleHandler {
    constructor(app) {
        this.app = app;
    }

    registerHandlers(socket) {
        socket.on('restartGame', (data) => {
            this.handleRestartGame(data);
        });

        socket.on('playerDisconnected', (data) => {
            this.handlePlayerDisconnected(data);
        });

        socket.on('opponentLeftAfterGame', (data) => {
            this.handleOpponentLeftAfterGame(data);
        });

        socket.on('gameFinished', (data) => {
            this.handleGameFinished(data);
        });

        socket.on('error', (error) => {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification(error);
            }
        });

        socket.on('moveError', (error) => {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification(error);
            }
        });
    }

    handleRestartGame(data) {
        if (this.app.viewManager && this.app.viewManager.currentGameType === 'three-mens-morris' && this.app.tmmGame) {
            this.app.tmmGame.init();
        }
        this.app.selectedPiece = null;
        this.app.canRemovePiece = false;
        if (this.app.rematchBtn) {
            this.app.rematchBtn.classList.add('hidden');
        }
        if (this.app.infoText) {
            this.app.infoText.textContent = `New game! First turn: ${data.firstTurn}`;
        }
        if (this.app.viewManager) {
            this.app.viewManager.setCurrentGameType(data.gameType);
        }
        if (this.app.updateGameInfo) {
            this.app.updateGameInfo();
        }
        if (this.app.updateGameBoard) {
            this.app.updateGameBoard();
        }
        if (this.app.viewManager && this.app.viewManager.currentGameType === 'memory-match' && this.app.memoryGame) {
            this.app.memoryGame.updateStatus();
        }
        this.app.rematchRequestFrom = null;
        this.app.hasRequestedRematch = false;
        this.app.updateRematchButtonStatus();
    }

    handlePlayerDisconnected(data) {
        if (data.forceLeave) {
            if (this.app.modalManager) {
                this.app.modalManager.hideGameEndModal();
            }
            
            const wasSpectator = this.app.isSpectator;
            
            this.app.currentRoom = null;
            this.app.gameState = null;
            this.app.myRole = null;
            this.app.isSpectator = false;
            this.app.disableBeforeUnloadWarning();
            if (this.app.navigationManager) {
                this.app.navigationManager.updateChatWidgets();
            }
            
            const message = 'The other user left the room.<br><br>Redirecting to lobby...';
            
            if (this.app.modalManager) {
                this.app.modalManager.showNotification(message, () => {
                    if (this.app.viewManager) {
                        this.app.viewManager.showLobby();
                    }
                }, 3000);
            }
        } else {
            this.app.rematchRequestFrom = null;
            this.app.hasRequestedRematch = false;
            
            if (this.app.gameState && this.app.gameState.gameStatus === 'finished' && this.app.rematchBtn) {
                this.app.updateRematchButtonStatus();
                const hasTwoPlayers = this.app.gameState.players && this.app.gameState.players.length === 2;
                if (!hasTwoPlayers) {
                    this.app.rematchBtn.textContent = 'Rematch Not Possible';
                    this.app.rematchBtn.style.background = 'linear-gradient(135deg, #6b7280, #4b5563)';
                    this.app.rematchBtn.disabled = true;
                }
            }
            if (this.app.modalManager) {
                this.app.modalManager.showNotification(`${data.username} disconnected from the game.`);
            }
        }
    }

    handleOpponentLeftAfterGame(data) {
        const message = data.message || 'The other player left the room.';
        
        this.app.rematchRequestFrom = null;
        this.app.hasRequestedRematch = false;
        
        if (this.app.rematchBtn) {
            this.app.updateRematchButtonStatus();
            if (this.app.gameState && this.app.gameState.players && this.app.gameState.players.length === 2) {
                this.app.rematchBtn.textContent = 'Rematch Not Possible';
                this.app.rematchBtn.style.background = 'linear-gradient(135deg, #6b7280, #4b5563)';
                this.app.rematchBtn.disabled = true;
            }
        }
        
        if (this.app.modalManager) {
            this.app.modalManager.showNotification(message, () => {
                if (this.app.rematchBtn) {
                    const hasTwoPlayers = this.app.gameState && this.app.gameState.players && this.app.gameState.players.length === 2;
                    if (!hasTwoPlayers) {
                        this.app.updateRematchButtonStatus();
                    } else {
                        this.app.rematchBtn.textContent = 'Rematch Not Possible';
                        this.app.rematchBtn.style.background = 'linear-gradient(135deg, #6b7280, #4b5563)';
                        this.app.rematchBtn.disabled = true;
                    }
                }
            });
        }
    }

    handleGameFinished(data) {
        if (data.forceLeave) {
            if (this.app.modalManager) {
                this.app.modalManager.hideGameEndModal();
            }
            
            const wasSpectator = this.app.isSpectator;
            this.app.currentRoom = null;
            this.app.gameState = null;
            this.app.myRole = null;
            this.app.isSpectator = false;
            this.app.disableBeforeUnloadWarning();
            if (this.app.navigationManager) {
                this.app.navigationManager.updateChatWidgets();
            } else if (this.app.updateChatWidgets) {
                this.app.updateChatWidgets();
            }
            
            const winnerName = data.winner || 'Unknown';
            let message;
            if (data.reason === 'creator_left') {
                message = 'The room creator left the room.<br><br>Redirecting to lobby...';
            } else if (winnerName === 'Draw') {
                message = `Game finished!<br><br>The game ended in a draw!<br><br>Redirecting to lobby...`;
            } else {
                message = `Game finished!<br><br>The winner is ${winnerName}! 🎉<br><br>Redirecting to lobby...`;
            }
            
            if (this.app.modalManager) {
                this.app.modalManager.showNotification(message, () => {
                    if (this.app.viewManager) {
                        this.app.viewManager.showLobby();
                    }
                }, 3000);
            } else {
                setTimeout(() => {
                    if (this.app.viewManager) {
                        this.app.viewManager.showLobby();
                    }
                }, 3000);
            }
        } else {
            if (this.app.gameState) {
                this.app.gameState.gameStatus = 'finished';
                if (data.winner) {
                    this.app.gameState.winner = data.winner;
                }
            }
            if (this.app.updateGameInfo) {
                this.app.updateGameInfo();
            }
        }
    }
}
