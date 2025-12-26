class RoomSocketHandler {
    constructor(app) {
        this.app = app;
    }

    registerHandlers(socket) {
        socket.on('roomCreated', (data) => {
            // Tournament room flags are set in handleRoomCreated BEFORE showGame() is called
            // This prevents navigation warnings from triggering
            this.handleRoomCreated(data);
        });

        socket.on('playersRole', (data) => {
            this.handlePlayersRole(data);
        });

        socket.on('joinedAsSpectator', (data) => {
            this.handleJoinedAsSpectator(data);
        });

        socket.on('roomMessage', (message) => {
            if (message.roomId !== this.app.currentRoom) return;
            this.app.roomMessages.push(message);
            if (this.app.roomMessages.length > 100) {
                this.app.roomMessages.shift();
            }
            if (this.app.chatRenderer) {
                this.app.chatRenderer.renderRoomMessages();
            }
        });
    }

    handleRoomCreated(data) {
        if (!data || !data.roomId) {
            console.error('Invalid roomCreated data:', data);
            return;
        }
        
        this.app.currentRoom = data.roomId;
        this.app.currentRoomName = data.roomName || `Room ${data.roomId}`;
        this.app.myRole = data.player?.role || null;
        this.app.isSpectator = false;
        this.app.roomMessages = [];
        
        // Set tournament room flags BEFORE showing game view to prevent navigation warnings
        if (data.tournamentId) {
            this.app.isTournamentRoom = true;
            this.app.tournamentId = data.tournamentId;
            this.app.matchId = data.matchId;
        } else {
            this.app.isTournamentRoom = false;
            this.app.tournamentId = null;
            this.app.matchId = null;
        }
        
        // Hide waiting invitation modal if we sent an invitation that was accepted
        if (this.app.invitationManager) {
            this.app.invitationManager.hideWaitingInvitationModal();
        }
        
        // Hide notification dropdown if open
        if (this.app.notificationManager) {
            this.app.notificationManager.hideDropdown();
        }
        
        this.app.selectedPiece = null;
        this.app.canRemovePiece = false;
        
        const gameType = data.gameType || 'three-mens-morris';
        
        if (gameType === 'three-mens-morris' && this.app.tmmGame) {
            this.app.tmmGame.init();
        }
        
        this.app.gameState = {
            players: [{ username: this.app.currentUser, role: data.player?.role || 'X' }],
            gameStatus: 'waiting',
            gameType: gameType,
            board: Array(9).fill(''),
            phase: 'placement',
            piecesPlaced: { X: 0, O: 0 },
            currentPlayer: 'X',
            winner: null,
            selectedPiece: null,
            canRemovePiece: false
        };
        
        if (this.app.viewManager) {
            this.app.viewManager.setCurrentGameType(gameType);
            this.app.viewManager.showGame();
            this.app.viewManager.updateNotificationButtonVisibility();
        }
        
        if (gameType === 'battleship') {
            this.app.battleshipSelectedShip = null;
            this.app.battleshipIsHorizontal = true;
        }
        
        if (this.app.roomManager) {
            this.app.roomManager.updateLeaveButtonVisibility();
            this.app.roomManager.updateRoomInfoBox();
        }
        
        if (this.app.enableBeforeUnloadWarning) {
            this.app.enableBeforeUnloadWarning();
        }
        
        if (this.app.updateGameInfo) {
            this.app.updateGameInfo();
        }
        
        setTimeout(() => {
            if (gameType === 'three-mens-morris' || gameType === 'threeMensMorris') {
                if (this.app.tmmGame) {
                    this.app.tmmGame.updatePlayerInfo();
                }
            } else if (gameType === 'battleship') {
                if (this.app.gameState && this.app.gameState.battleshipState && this.app.battleshipGame) {
                    this.app.battleshipGame.renderBoards();
                    this.app.battleshipGame.updatePlayerInfo();
                    this.app.battleshipGame.updateControls();
                    const battleshipStatus = document.getElementById('battleship-status');
                    if (battleshipStatus) {
                        battleshipStatus.style.display = 'none';
                        battleshipStatus.classList.add('hidden');
                        battleshipStatus.textContent = '';
                    }
                    if (this.app.gameState.players && this.app.gameState.players.length === 2 && 
                        this.app.gameState.battleshipState.phase === 'placement' && !this.app.isSpectator && this.app.myRole) {
                        if (this.app.battleshipGame.startCountdown) {
                            this.app.battleshipGame.startCountdown();
                        }
                        if (this.app.startBattleshipCountdown) {
                            this.app.startBattleshipCountdown();
                        }
                    }
                } else if (this.app.battleshipGame) {
                    this.app.battleshipGame.renderBoards();
                    this.app.battleshipGame.updatePlayerInfo();
                    this.app.battleshipGame.updateControls();
                    const battleshipStatus = document.getElementById('battleship-status');
                    if (battleshipStatus) {
                        battleshipStatus.style.display = 'none';
                        battleshipStatus.classList.add('hidden');
                        battleshipStatus.textContent = '';
                    }
                }
            } else if (gameType === 'memory-match' || gameType === 'memoryMatch') {
                if (this.app.viewManager) {
                    this.app.viewManager.setCurrentGameType('memory-match');
                }
                if (this.app.memoryGame) {
                    this.app.memoryGame.init();
                    this.app.memoryGame.renderBoard();
                }
            }
        }, 100);
    }

    handlePlayersRole(data) {
        this.app.myRole = data.role;
        this.app.isSpectator = false;
        this.app.currentRoomName = data.roomName || this.app.currentRoomName;
        if (!this.app.gameState) {
            this.app.gameState = {
                players: [{ role: data.role }],
                gameStatus: 'waiting'
            };
        }
        if (this.app.viewManager) {
            this.app.viewManager.setCurrentGameType(data.gameType);
        }
        if (this.app.navigationManager) {
            this.app.navigationManager.updateChatWidgets();
        }
        if (data.gameType === 'battleship') {
            this.app.battleshipSelectedShip = null;
            this.app.battleshipIsHorizontal = true;
        }
        this.app.enableBeforeUnloadWarning();
        if (this.app.roomManager) {
            this.app.roomManager.updateLeaveButtonVisibility();
            this.app.roomManager.updateRoomInfoBox();
        }
        if (this.app.viewManager) {
            this.app.viewManager.showGame();
            this.app.viewManager.updateNotificationButtonVisibility();
        }
        if (this.app.updateGameInfo) {
            this.app.updateGameInfo();
        }
    }

    handleJoinedAsSpectator(data) {
        this.app.isSpectator = true;
        this.app.currentRoom = data.room.roomId;
        this.app.currentRoomName = data.room.roomName || `Room ${data.room.roomId}`;
        this.app.roomMessages = [];
        if (this.app.chatRenderer) {
            this.app.chatRenderer.renderRoomMessages();
        }
        if (this.app.viewManager) {
            this.app.viewManager.setCurrentGameType(data.gameType);
        }
        if (this.app.navigationManager) {
            this.app.navigationManager.updateChatWidgets();
        }
        if (this.app.roomManager) {
            this.app.roomManager.updateLeaveButtonVisibility();
            this.app.roomManager.updateRoomInfoBox();
        }
        this.app.disableBeforeUnloadWarning();
        if (this.app.viewManager) {
            this.app.viewManager.showGame();
            this.app.viewManager.updateNotificationButtonVisibility();
        }
    }
}
