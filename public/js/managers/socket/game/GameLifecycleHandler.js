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
            
            // Show different message for spectators vs players
            const message = wasSpectator 
                ? 'Someone left the room.<br><br>Redirecting to lobby...'
                : 'The other user left the room.<br><br>Redirecting to lobby...';
            
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
        // Check if this is a tournament match
        const isTournamentMatch = this.app.currentRoom && 
            typeof this.app.currentRoom === 'string' && 
            this.app.currentRoom.startsWith('tournament-');

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
            } else {
                message = `Game finished!<br><br>The winner is ${winnerName}! 🎉<br><br>Redirecting to lobby...`;
            }
            
            // Don't auto-redirect for tournament matches - let post-match modal handle it
            if (!isTournamentMatch) {
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
            }
        } else {
            // For tournament matches, don't show game finished notifications
            // The tournament system handles notifications via tournamentMatchWon/tournamentMatchFinished
            if (isTournamentMatch) {
                // Just update the game state silently
                if (this.app.gameState) {
                    this.app.gameState.gameStatus = 'finished';
                }
                if (this.app.updateGameInfo) {
                    this.app.updateGameInfo();
                }
                return; // Don't show any notifications for tournament matches
            }
            
            if (this.app.gameState) {
                this.app.gameState.gameStatus = 'finished';
                // Don't overwrite winner from gameState - it's already set as role from broadcast
                // data.winner is username for display purposes only
            }
            if (this.app.updateGameInfo) {
                this.app.updateGameInfo();
            }
        }
    }
}
