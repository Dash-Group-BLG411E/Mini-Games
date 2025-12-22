class GameStateHandler {
    constructor(app) {
        this.app = app;
    }

    registerHandlers(socket) {
        socket.on('startGame', (data) => {
            this.handleStartGame(data);
        });

        socket.on('gameStateUpdate', (gameState) => {
            this.handleGameStateUpdate(gameState);
        });
    }

    handleStartGame(data) {
        if (data.gameType === 'battleship') {
            this.app.battleshipSelectedShip = null;
            this.app.battleshipIsHorizontal = true;
            if (this.app.viewManager) {
                this.app.viewManager.setCurrentGameType('battleship');
            }
            if (this.app.gameState && this.app.gameState.battleshipState) {
                this.app.renderBattleshipBoards();
                this.app.updateBattleshipPlayerInfo();
                this.app.updateBattleshipControls();
                if (this.app.gameState.players && this.app.gameState.players.length === 2 && 
                    this.app.gameState.battleshipState.phase === 'placement') {
                    this.app.startBattleshipCountdown();
                }
            }
        }
        if (data.gameType !== 'battleship') {
            if (this.app.viewManager) {
                this.app.viewManager.setCurrentGameType(data.gameType);
            }
        }
    }

    handleGameStateUpdate(gameState) {
        if (!this.app.currentRoom) {
            return;
        }
        
        if (gameState.players && Array.isArray(gameState.players)) {
            gameState.players.forEach(player => {
                if (player.username && player.avatar) {
                    if (this.app.avatarManager) {
                        this.app.avatarManager.playerAvatarsCache.set(player.username.toLowerCase(), player.avatar);
                    }
                }
            });
        }
        
        if (gameState.gameStatus === 'finished' && gameState.players && gameState.players.length === 2) {
            this.app.lastKnownPlayers = JSON.parse(JSON.stringify(gameState.players));
        }
        
        this.app.gameState = gameState;
        
        if (gameState.winner && !this.app.gameState.winner) {
            this.app.gameState.winner = gameState.winner;
        }
        
        if (this.app.viewManager && this.app.viewManager.currentView !== 'game') {
            this.app.viewManager.showGame();
        }
        
        if (this.app.viewManager) {
            this.app.viewManager.setCurrentGameType(gameState.gameType);
        }
        
        if (gameState.gameType === 'three-mens-morris') {
            if (gameState.selectedPiece !== undefined) {
                this.app.selectedPiece = gameState.selectedPiece;
            }
            this.app.canRemovePiece = gameState.canRemovePiece || false;
        }
        
        if (this.app.viewManager && this.app.viewManager.currentView === 'game') {
            if (this.app.updateGameBoard) {
                this.app.updateGameBoard();
            }
            if (this.app.updateGameInfo) {
                this.app.updateGameInfo();
            }
            if (this.app.roomManager) {
                this.app.roomManager.updateRoomInfoBox();
            }
            
            if (gameState.gameStatus === 'finished' && this.app.rematchBtn) {
                const hasTwoPlayers = gameState.players && gameState.players.length === 2;
                if (!hasTwoPlayers) {
                    this.app.rematchRequestFrom = null;
                    this.app.hasRequestedRematch = false;
                }
                this.app.updateRematchButtonStatus();
            }
            
            if (gameState.gameStatus !== 'finished') {
                if (gameState.gameType === 'three-mens-morris') {
                    if (this.app.tmmGame) {
                        this.app.tmmGame.init();
                        this.app.tmmGame.renderGrid();
                        this.app.tmmGame.updatePlayerInfo();
                    }
                } else if (gameState.gameType === 'memory-match' && this.app.memoryGame) {
                    if (gameState.memoryState) {
                        this.app.memoryGame.renderBoard(gameState.memoryState);
                    } else {
                        this.app.memoryGame.renderBoard(null);
                    }
                    this.app.memoryGame.updatePlayerInfo(gameState.memoryState);
                    this.app.memoryGame.updateStatus();
                } else if (gameState.gameType === 'battleship') {
                    if (gameState.battleshipState) {
                        this.app.hideShipPreview();
                        this.app.renderBattleshipBoards();
                        if (this.app.battleshipSelectedShip) {
                            this.app.renderBattleshipBoards();
                        }
                        this.app.updateBattleshipPlayerInfo();
                        this.app.updateBattleshipControls();
                        
                        const battleshipStatus = document.getElementById('battleship-status');
                        const battleshipControls = document.querySelector('.battleship-controls');
                        if (battleshipStatus) {
                            battleshipStatus.style.display = 'none';
                            battleshipStatus.classList.add('hidden');
                            battleshipStatus.textContent = '';
                            battleshipStatus.innerHTML = '';
                        }
                        if (battleshipControls) {
                            battleshipControls.style.display = 'none';
                            battleshipControls.classList.add('hidden');
                        }
                        
                        if (gameState.battleshipState.phase === 'placement') {
                            const players = gameState.players || [];
                            const hasTwoPlayers = players.length === 2;
                            
                            if (this.app.isSpectator) {
                                if (this.app.infoText) {
                                    this.app.infoText.textContent = 'Watching game';
                                }
                            } else if (!hasTwoPlayers) {
                                if (this.app.infoText) {
                                    this.app.infoText.textContent = 'Waiting for opponent...';
                                }
                            } else {
                                if (this.app.myRole) {
                                    if (this.app.startBattleshipCountdown) {
                                        this.app.startBattleshipCountdown();
                                    }
                                    if (this.app.updateBattleshipPlacementStatus) {
                                        this.app.updateBattleshipPlacementStatus(gameState);
                                    }
                                    if (this.app.battleshipShipsContainer && this.app.battleshipShipsBox && gameState.battleshipState.shipTypes) {
                                        setTimeout(() => {
                                            if (this.app.renderPlayerShipsBox && this.app.myRole) {
                                                this.app.renderPlayerShipsBox(this.app.myRole, gameState.battleshipState);
                                            }
                                        }, 200);
                                    }
                                }
                            }
                        } else if (this.app.infoText && gameState.battleshipState.phase === 'playing' && gameState.gameStatus !== 'finished') {
                            if (this.app.isSpectator) {
                                this.app.infoText.textContent = 'Watching game';
                                if (this.app.infoText.parentElement) {
                                    this.app.infoText.parentElement.classList.remove('your-turn-active');
                                }
                            } else {
                                if (this.app.battleshipCountdownInterval) {
                                    clearInterval(this.app.battleshipCountdownInterval);
                                    this.app.battleshipCountdownInterval = null;
                                }
                                const role = this.app.myRole;
                                if (gameState.battleshipState.currentPlayer === role) {
                                    this.app.infoText.textContent = `Your turn to attack!`;
                                    if (this.app.infoText.parentElement) {
                                        this.app.infoText.parentElement.classList.add('your-turn-active');
                                    }
                                } else {
                                    this.app.infoText.textContent = `Opponent's Turn`;
                                    if (this.app.infoText.parentElement) {
                                        this.app.infoText.parentElement.classList.remove('your-turn-active');
                                    }
                                }
                            }
                        }
                        if (gameState.battleshipState.phase !== 'placement' && this.app.battleshipCountdownInterval) {
                            clearInterval(this.app.battleshipCountdownInterval);
                            this.app.battleshipCountdownInterval = null;
                        }
                        
                        if (gameState.gameStatus === 'finished') {
                            if (this.app.gameState) {
                                this.app.gameState.gameStatus = 'finished';
                                if (gameState.winner !== undefined && gameState.winner !== null) {
                                    this.app.gameState.winner = gameState.winner;
                                }
                            }
                        }
                    }
                }
            }
            
            if (gameState.gameType === 'three-mens-morris') {
                if (this.app.tmmGame) {
                    this.app.tmmGame.init();
                    this.app.tmmGame.renderGrid();
                    this.app.tmmGame.updatePlayerInfo();
                }
            } else if (gameState.gameType === 'memory-match' && this.app.memoryGame) {
                if (this.app.memoryGame.stage) {
                    this.app.memoryGame.stage.classList.remove('hidden');
                }
                if (gameState.memoryState) {
                    this.app.memoryGame.renderBoard(gameState.memoryState);
                } else {
                    this.app.memoryGame.renderBoard(null);
                }
                this.app.memoryGame.updatePlayerInfo(gameState.memoryState);
            } else if (this.app.memoryGame && this.app.memoryGame.stage) {
                this.app.memoryGame.stage.classList.add('hidden');
            }
        }
    }
}
