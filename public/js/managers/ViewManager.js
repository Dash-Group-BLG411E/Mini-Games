

class ViewManager {
    constructor(app) {
        this.app = app;
        
        this.authContainer = document.getElementById('auth-container');
        this.roomGameTypeDisplay = document.getElementById('room-game-type-display');
        this.gameModeMessage = document.getElementById('game-mode-message');
        this.gameBoard = document.getElementById('game-board');
        this.battleshipStage = document.getElementById('battleship-stage');
        this.gameInfoModal = document.getElementById('game-info-modal');
        this.gameInfoTitle = document.getElementById('game-info-title');
        this.gameInfoContent = document.getElementById('game-info-content');
        
        this.currentView = null;
        this.currentGameType = 'three-mens-morris';
        this.selectedLobbyGameType = 'three-mens-morris';
        this.gameCards = document.querySelectorAll('.game-card');
        this.cardActionButtons = app.cardActionButtons;
        
        this.setupGameCardListeners();
        this.initGameInfoModal();
    }

    

    setupGameCardListeners() {
        this.gameCards.forEach(card => {
            card.addEventListener('click', () => {
                this.selectLobbyGame(card.dataset.game);
            });
            card.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.selectLobbyGame(card.dataset.game);
                }
            });
        });

        this.cardActionButtons.forEach(action => {
            action.addEventListener('click', (event) => {
                event.stopPropagation();
                const cardType = action.dataset.game;
                this.selectLobbyGame(cardType);
                if (this.app.roomManager) {
                    this.app.roomManager.showRoomNameModal(cardType);
                }
            });
        });
    }

    

    showView(viewName) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            loadingScreen.classList.add('hidden');
        }
        
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
            view.classList.remove('view-active');
        });
        
        if (viewName === 'auth') {
            if (this.authContainer) {
                this.authContainer.style.display = 'flex';
                this.authContainer.style.setProperty('display', 'flex', 'important');
                this.authContainer.classList.add('view-active');
            } else {
                console.error('authContainer not found');
            }
            
            const navContainer = document.getElementById('nav-container');
            const onlinePlayersWidget = document.getElementById('online-players-widget');
            const lobbyChatDrawer = document.getElementById('lobby-chat-drawer');
            const gameInfoBtn = document.getElementById('game-info-btn');
            const userProfileReportBtn = document.getElementById('user-profile-report-btn');
            
            if (navContainer) {
                navContainer.style.display = 'none';
                navContainer.classList.add('hidden');
            }
            if (onlinePlayersWidget) {
                onlinePlayersWidget.style.display = 'none';
                onlinePlayersWidget.classList.add('hidden');
            }
            if (lobbyChatDrawer) {
                lobbyChatDrawer.style.display = 'none';
                lobbyChatDrawer.classList.add('hidden');
            }
            if (gameInfoBtn) {
                gameInfoBtn.style.display = 'none';
                gameInfoBtn.classList.add('hidden');
            }
            if (userProfileReportBtn) {
                userProfileReportBtn.style.display = 'none';
                userProfileReportBtn.classList.add('hidden');
            }
        } else {
            if (this.authContainer) {
                this.authContainer.style.display = 'none';
                this.authContainer.classList.remove('view-active');
            }
            const targetView = document.getElementById(`${viewName}-container`);
            if (viewName === 'user-profile') {
                console.log('[ViewManager.showView] Switching to user-profile view');
                console.log('[ViewManager.showView] Looking for element: user-profile-container');
                console.log('[ViewManager.showView] Found element:', targetView);
            }
            if (targetView) {
                targetView.style.display = 'block';
                targetView.classList.add('view-active');
                if (viewName === 'user-profile') {
                    console.log('[ViewManager.showView] user-profile-container is now visible');
                }
            } else {
                if (viewName === 'user-profile') {
                    console.error('[ViewManager.showView] user-profile-container NOT FOUND!');
                }
            }
            
            const navContainer = document.getElementById('nav-container');
            const onlinePlayersWidget = document.getElementById('online-players-widget');
            const lobbyChatDrawer = document.getElementById('lobby-chat-drawer');
            const gameInfoBtn = document.getElementById('game-info-btn');
            const userProfileReportBtn = document.getElementById('user-profile-report-btn');
            
            if (navContainer) {
                navContainer.style.display = '';
                navContainer.classList.remove('hidden');
            }
            
            // Hide chat drawer and online players widget for guest users
            const isGuest = this.app.userRole === 'guest';
            
            // Show online players widget only on lobby, rooms, leaderboard, tournaments
            // Hide for guest users
            const allowedViews = ['lobby', 'rooms', 'leaderboard', 'tournaments'];
            if (onlinePlayersWidget && viewName !== 'auth' && allowedViews.includes(viewName) && !isGuest) {
                onlinePlayersWidget.style.display = '';
                onlinePlayersWidget.classList.remove('hidden');
            } else if (onlinePlayersWidget) {
                onlinePlayersWidget.style.display = 'none';
                onlinePlayersWidget.classList.add('hidden');
            }
            
            // Load badges when profile view is shown
            if (viewName === 'profile') {
                if (this.app.scoreboardManager) {
                    this.app.scoreboardManager.loadUserBadges();
                    // Re-setup badge modal listeners in case profile wasn't loaded when ScoreboardManager was initialized
                    if (this.app.scoreboardManager.setupBadgeModalListeners) {
                        this.app.scoreboardManager.setupBadgeModalListeners();
                    }
                }
                if (this.app.authManager && this.app.authManager.profileManager) {
                    this.app.authManager.loadProfileData();
                    // Re-setup profile listeners
                    if (this.app.authManager.profileManager.setupEventListeners) {
                        this.app.authManager.profileManager.setupEventListeners();
                    }
                }
            }
            
            // Hide chat drawer for guest users, profile, and user-profile views
            if (lobbyChatDrawer && viewName !== 'auth' && viewName !== 'user-profile' && viewName !== 'profile' && !isGuest) {
                lobbyChatDrawer.style.display = '';
                lobbyChatDrawer.classList.remove('hidden');
            } else if (lobbyChatDrawer) {
                lobbyChatDrawer.style.display = 'none';
                lobbyChatDrawer.classList.add('hidden');
            }
            if (gameInfoBtn) {
                if (viewName === 'game') {
                    gameInfoBtn.style.display = '';
                    gameInfoBtn.classList.remove('hidden');
                } else {
                    gameInfoBtn.style.display = 'none';
                    gameInfoBtn.classList.add('hidden');
                }
            }
            if (userProfileReportBtn) {
                if (viewName === 'user-profile') {
                    userProfileReportBtn.style.display = 'block';
                    userProfileReportBtn.classList.remove('hidden');
                } else {
                    userProfileReportBtn.style.display = 'none';
                    userProfileReportBtn.classList.add('hidden');
                }
            }
        }
        
        this.currentView = viewName;
        
        if (typeof this.app.updateNavigation === 'function') {
            this.app.updateNavigation();
        }
        if (typeof this.app.updateChatWidgets === 'function') {
            this.app.updateChatWidgets();
        }

        if (viewName === 'lobby') {
            this.app.socket && this.app.socket.emit('getRooms');
        } else if (viewName === 'rooms') {
            this.app.socket && this.app.socket.emit('getRooms');
        } else if (viewName === 'leaderboard') {
            if (this.app.scoreboardManager) {
                this.app.scoreboardManager.loadLeaderboard();
            }
        } else if (viewName === 'tournaments') {
            if (this.app.tournamentManager) {
                this.app.tournamentManager.getTournaments();
            }
        }
    }

    

    showLobby() {
        this.app.currentRoom = null;
        this.app.currentRoomName = null;
        const lobbyContainer = document.getElementById('lobby-container');
        if (lobbyContainer) {
            lobbyContainer.style.display = '';
            lobbyContainer.classList.remove('hidden');
        }
        this.app.gameState = null;
        this.app.myRole = null;
        this.app.isSpectator = false;
        if (this.app.disableBeforeUnloadWarning) {
            this.app.disableBeforeUnloadWarning();
        }
        if (this.app.updateChatWidgets) {
            this.app.updateChatWidgets();
        }
        if (this.app.roomManager && this.app.roomManager.updateLeaveButtonVisibility) {
            this.app.roomManager.updateLeaveButtonVisibility();
        }
        if (this.app.roomManager && this.app.roomManager.updateRoomInfoBox) {
            this.app.roomManager.updateRoomInfoBox();
        }
        this.showView('lobby');
    }

    

    showGame() {
        this.app.roomMessages = [];
        if (this.app.chatRenderer) {
            this.app.chatRenderer.renderRoomMessages();
        }
        this.app.updateChatWidgets();
        if (this.app.roomManager && this.app.roomManager.updateLeaveButtonVisibility) {
            this.app.roomManager.updateLeaveButtonVisibility();
        }
        this.showView('game');
        const lobbyContainer = document.getElementById('lobby-container');
        if (lobbyContainer) {
            lobbyContainer.style.display = 'none';
            lobbyContainer.classList.add('hidden');
        }
    }

    

    showAuth() {
        this.showView('auth');
    }

    

    setCurrentGameType(type) {
        const rawGameType = typeof type === 'string' ? type : 'three-mens-morris';
        this.currentGameType = rawGameType.toLowerCase().replace(/_/g, '-');
        if (this.app) {
            this.app.currentGameType = this.currentGameType;
        }
        if (this.roomGameTypeDisplay) {
            this.roomGameTypeDisplay.textContent = `Game: ${this.formatGameType(this.currentGameType)}`;
        }
        this.renderGameModeMessage();
        this.renderActiveGameLayout();
        this.updateGameInfoContent();
        this.app.updateGameInfo();
    }

    

    selectLobbyGame(type) {
        if (!type) return;
        const normalized = type.toLowerCase().replace(/_/g, '-');
        this.selectedLobbyGameType = normalized;
        this.gameCards.forEach(card => {
            const cardType = card.dataset.game;
            const isActive = cardType === normalized;
            card.classList.toggle('is-active', isActive);
            card.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    

    renderGameModeMessage() {
        if (!this.gameModeMessage || !this.gameBoard) return;
        const isThreeMensMorris = this.currentGameType === 'three-mens-morris';
        if (isThreeMensMorris) {
            this.gameModeMessage.textContent = 'Playing Three Men\'s Morris';
        } else {
            this.gameModeMessage.textContent = `This room runs ${this.formatGameType(this.currentGameType)}.`;
        }
        this.gameBoard.style.pointerEvents = isThreeMensMorris ? 'auto' : 'none';
        this.gameBoard.style.filter = isThreeMensMorris ? 'none' : 'grayscale(0.7)';
    }

    

    renderActiveGameLayout() {
        const type = this.currentGameType;
        switch (type) {
            case 'three-mens-morris':
                if (this.app.tmmGame) {
                    this.setElementVisibility(this.app.tmmGame.stage, true);
                    this.setElementVisibility(this.app.tmmGame.gameBoard, true);
                }
                if (this.app.memoryGame) {
                    this.setElementVisibility(this.app.memoryGame.stage, false);
                }
                this.setElementVisibility(this.battleshipStage, false);
                if (this.battleshipStage) {
                    this.battleshipStage.classList.add('hidden');
                    this.battleshipStage.style.display = 'none';
                }
                if (this.app.tmmGame) {
                    this.app.tmmGame.init();
                    if (this.app.tmmGame.gameBoard) {
                        this.app.tmmGame.gameBoard.style.display = '';
                        this.app.tmmGame.gameBoard.style.visibility = 'visible';
                    }
                    this.app.tmmGame.renderGrid();
                    this.app.tmmGame.updatePlayerInfo();
                }
                break;
            case 'battleship':
                if (this.app.tmmGame) {
                    this.setElementVisibility(this.app.tmmGame.stage, false);
                    this.setElementVisibility(this.app.tmmGame.gameBoard, false);
                }
                if (this.app.memoryGame) {
                    this.setElementVisibility(this.app.memoryGame.stage, false);
                }
                this.setElementVisibility(this.battleshipStage, true);
                if (this.app.gameState && this.app.gameState.battleshipState) {
                    this.app.renderBattleshipBoards();
                    this.app.updateBattleshipPlayerInfo();
                    this.app.updateBattleshipControls();
                }
                break;
            case 'memory-match':
                if (this.app.tmmGame) {
                    this.setElementVisibility(this.app.tmmGame.stage, false);
                    this.setElementVisibility(this.app.tmmGame.gameBoard, false);
                }
                this.setElementVisibility(this.battleshipStage, false);
                if (this.app.memoryGame) {
                    this.setElementVisibility(this.app.memoryGame.stage, true);
                    if (this.app.gameState && this.app.gameState.memoryState) {
                        this.app.memoryGame.renderBoard(this.app.gameState.memoryState);
                    } else {
                        this.app.memoryGame.renderBoard(null);
                    }
                    this.app.memoryGame.updatePlayerInfo(this.app.gameState?.memoryState);
                    this.app.memoryGame.updateStatus();
                }
                break;
            default:
                this.setElementVisibility(this.gameBoard, false);
                if (this.app.memoryGame) {
                    this.setElementVisibility(this.app.memoryGame.stage, false);
                }
                this.setElementVisibility(this.battleshipStage, false);
                break;
        }
    }

    

    formatGameType(type) {
        const gameTypeNames = {
            'three-mens-morris': 'Three Men\'s Morris',
            'three-mens-morris': 'Three Men\'s Morris',
            'battleship': 'Battleship',
            'memory-match': 'Memory Match'
        };
        return gameTypeNames[type] || type.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    

    getGameRules(gameType) {
        const rules = {
            'three-mens-morris': {
                title: 'Three Men\'s Morris',
                rules: `
                    <h4>How to Play the Game</h4>
                    <h4>Phase 1 - Placing Pieces:</h4>
                    <ul>
                        <li>Each player has three game pieces</li>
                        <li>Taking turns, each player places one piece at a time at any intersecting point on the board</li>
                        <li>The first person to get three pieces in a straight line wins the game</li>
                    </ul>
                    <h4>Phase 2 - Moving Pieces:</h4>
                    <ul>
                        <li>If after all the pieces have been placed on the board, and no one has won, then players take turns moving their pieces</li>
                        <li>The players take turns moving one of their pieces to an unoccupied point next to their piece following the marked lines</li>
                        <li>Only one piece may occupy any point at a given time. If a point is occupied, you may not move to that point</li>
                        <li>You cannot jump over pieces</li>
                        <li>Some pieces may become trapped and cannot move</li>
                        <li>Players take turns moving a piece until someone gets three in a row</li>
                    </ul>
                    <h4>Winning:</h4>
                    <p>The first person to get three pieces in a straight line wins the game.</p>
                `
            },
            'memory-match': {
                title: 'Memory Match',
                rules: `
                    <h4>How to Play the Game</h4>
                    <ul>
                        <li>Players take turns flipping two cards at a time to find matching pairs</li>
                        <li>Click on a card to flip it and reveal its symbol</li>
                        <li>If the two flipped cards match, they stay face up and the player scores a point</li>
                        <li>If the cards don't match, they flip back face down and it becomes the opponent's turn</li>
                    </ul>
                    <h4>Winning:</h4>
                    <p>The player who finds the most matching pairs wins the game.</p>
                `
            },
            'battleship': {
                title: 'Battleship',
                rules: `
                    <h4>How to Play the Game</h4>
                    <h4>Phase 1 - Ship Placement:</h4>
                    <ul>
                        <li>Each player has five ships to place on their board</li>
                        <li>Ships come in different sizes: Carrier (5 cells), Battleship (4 cells), Destroyer (3 cells), Submarine (3 cells), Patrol Boat (2 cells)</li>
                        <li>Select a ship from the ships box, choose horizontal or vertical orientation, then click on your board to place it</li>
                        <li>Ships cannot overlap or extend outside the board boundaries</li>
                        <li>Players place all their ships before the game begins</li>
                        <li>Once all ships are placed, the placement phase ends automatically</li>
                    </ul>
                    <h4>Phase 2 - Battle Phase:</h4>
                    <ul>
                        <li>Players take turns guessing coordinates on the opponent's board</li>
                        <li>Click on a cell in the opponent's board to make your guess</li>
                        <li>Hit 💥: You successfully hit an enemy ship</li>
                        <li>Miss 🌊: You hit empty water</li>
                        <li>When you hit a ship, you get another turn. When you miss, it becomes your opponent's turn</li>
                        <li>A ship is sunk when all of its cells have been hit</li>
                    </ul>
                    <h4>Winning:</h4>
                    <p>The first player to sink all of their opponent's ships wins the game.</p>
                `
            }
        };
        return rules[gameType] || rules['three-mens-morris'];
    }

    

    setElementVisibility(element, visible) {
        if (!element) return;
        if (visible) {
            element.style.display = '';
            element.classList.remove('hidden');
        } else {
            element.style.display = 'none';
            element.classList.add('hidden');
        }
    }

    

    updateGameInfoContent() {
        if (!this.gameInfoTitle || !this.gameInfoContent) return;
        const gameRules = this.getGameRules(this.currentGameType);
        this.gameInfoTitle.textContent = gameRules.title;
        this.gameInfoContent.innerHTML = gameRules.rules;
    }

    

    showGameInfo() {
        if (this.gameInfoModal) {
            const isHidden = this.gameInfoModal.classList.contains('hidden');
            if (isHidden) {
                this.updateGameInfoContent();
                this.gameInfoModal.classList.remove('hidden');
            } else {
                this.hideGameInfo();
            }
        }
    }

    hideGameInfo() {
        if (this.gameInfoModal) {
            this.gameInfoModal.classList.add('hidden');
        }
    }
    
    initGameInfoModal() {
        if (this.gameInfoModal) {
            this.gameInfoModal.addEventListener('click', (e) => {
                if (e.target === this.gameInfoModal) {
                    this.hideGameInfo();
                }
            });
        }
    }
}

