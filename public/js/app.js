class MiniGamesApp {
    constructor() {
        this.token = localStorage.getItem('minigames_token');
        this.currentUser = localStorage.getItem('minigames_username');
        this.userRole = localStorage.getItem('minigames_role') || 'player';
        this.userProfile = null;
        this.currentRoom = null;
        this.currentRoomName = null;
        this.rooms = [];
        this.lobbyUsers = [];
        this.userRolesMap = new Map();
        this.userAvatarsMap = new Map();
        this.userInGameMap = new Map();
        this.lobbyMessages = [];
        this.roomMessages = [];
        this.gameState = null;
        this.myRole = null;
        this.isSpectator = false;
        this.socket = null;
        this.cardActionButtons = [];
        this.userMenuOpen = false;
        this.notificationCallback = null;
        this.notificationTimeout = null;
        this.selectedPiece = null;
        this.canRemovePiece = false;
        this.lastKnownPlayers = null;
        this.battleshipSelectedShip = null;
        this.battleshipIsHorizontal = true;
        this.pendingInvitation = null;
        this.pendingReportUsername = null;
        this.pendingInviteUsername = null;
        this.battleshipGame = null;
        this.tmmGame = null;
        this.memoryGame = null;
        this.roomChatOpen = false;
        this.currentGameType = null;

        if (typeof DOMManager !== 'undefined') {
            this.domManager = new DOMManager(this);
        } else {
            this.bindDomElements();
        }

        if (typeof AppInitializer !== 'undefined') {
            this.appInitializer = new AppInitializer(this);
            this.appInitializer.initializeManagers();
            this.appInitializer.finalizeInitialization();
        } else {
            this.initializeManagersFallback();
        }

        if (typeof WarningManager !== 'undefined') {
            this.warningManager = new WarningManager(this);
        } else {
            this.setupBeforeUnloadWarning();
        }

        this.setupEventListeners();

        // Enforce guest restrictions on initialization if user is guest
        if (this.userRole === 'guest') {
            setTimeout(() => {
                if (this.navigationManager && this.navigationManager.enforceGuestRestrictions) {
                    this.navigationManager.enforceGuestRestrictions();
                }
                if (this.authManager && this.authManager.updateUserAvatarDisplay) {
                    this.authManager.updateUserAvatarDisplay();
                }
            }, 100);
        }
    }

    bindDomElements() {
        this.navContainer = document.getElementById('nav-container');
        this.lobbyNavBtn = document.getElementById('lobby-nav-btn');
        this.roomsNavBtn = document.getElementById('rooms-nav-btn');
        this.leaderboardNavBtn = document.getElementById('leaderboard-nav-btn');
        this.tournamentsNavBtn = document.getElementById('tournaments-nav-btn');
        this.userAvatarBtn = document.getElementById('user-avatar-btn');
        this.userAvatarDisplay = document.getElementById('user-avatar-display');
        this.userUsernameDisplay = document.getElementById('user-username-display');
        this.userRoleBadge = document.getElementById('user-role-badge');
        this.userMenuDropdown = document.getElementById('user-menu-dropdown');
        this.profileNavBtn = document.getElementById('profile-nav-btn');
        this.adminReportsBtn = document.getElementById('admin-reports-btn');
        this.logoutBtn = document.getElementById('logout-btn');
        this.authContainer = document.getElementById('auth-container');
        this.lobbyContainer = document.getElementById('lobby-container');
        this.roomsContainer = document.getElementById('rooms-container');
        this.lobbyChatList = document.querySelector('#lobby-chat-drawer #lobby-chat-list');
        this.lobbyChatForm = document.querySelector('#lobby-chat-drawer #lobby-chat-form');
        this.lobbyChatInput = document.querySelector('#lobby-chat-drawer #lobby-chat-input');
        if (!this.lobbyChatForm || !this.lobbyChatInput || !this.lobbyChatList) {
            console.warn('Lobby chat drawer elements not found');
        }
        this.onlinePlayersToggle = document.getElementById('online-players-toggle');
        this.onlinePlayersPopup = document.getElementById('online-players-popup');
        this.lobbyChatTab = document.getElementById('lobby-chat-tab');
        this.lobbyChatDrawer = document.getElementById('lobby-chat-drawer');
        this.lobbyChatDrawerContent = document.getElementById('lobby-chat-drawer-content');
        this.cardActionButtons = document.querySelectorAll('.game-card__action');
        this.gameContainer = document.getElementById('game-container');
        this.roomGameTypeDisplay = document.getElementById('room-game-type');
        this.gameModeMessage = document.getElementById('game-mode-message');
        this.infoText = document.querySelector('.info .class-text');
        this.gameInfoBtn = document.getElementById('game-info-btn');
        this.gameInfoModal = document.getElementById('game-info-modal');
        this.gameInfoTitle = document.getElementById('game-info-title');
        this.gameInfoContent = document.getElementById('game-info-content');
        this.gameEndModal = document.getElementById('game-end-modal');
        this.gameEndTitle = document.getElementById('game-end-title');
        this.gameEndMessage = document.getElementById('game-end-message');
        this.gameEndRematchBtn = document.getElementById('game-end-rematch-btn');
        this.gameEndRematchStatus = document.getElementById('game-end-rematch-status');
        this.rematchBtn = document.getElementById('rematch-btn');
        this.gameBoard = document.getElementById('three-mens-morris-board') || document.querySelector('.game-board');
        this.roomChatForm = document.getElementById('room-chat-form');
        this.roomChatInput = document.getElementById('room-chat-input');
        this.roomChatTab = document.getElementById('room-chat-tab');
        this.roomChatDrawer = document.getElementById('room-chat-drawer');
        this.roomChatDrawerContent = document.getElementById('room-chat-drawer-content');
        this.reportModal = document.getElementById('report-modal');
        this.reportTargetName = document.getElementById('report-target-name');
        this.reportSubmitBtn = document.getElementById('report-submit-btn');
        this.reportCancelBtn = document.getElementById('report-cancel-btn');
        this.onlinePlayersWidget = document.getElementById('online-players-widget');
        this.leaderboardContainer = document.getElementById('leaderboard-container');
        this.backToLobbyBtn = document.getElementById('back-to-lobby-btn');
        this.tournamentsContainer = document.getElementById('tournaments-container');
        this.tournamentsBackBtn = document.getElementById('tournaments-back-btn');
        this.profileContainer = document.getElementById('profile-container');
        this.deleteAccountBtn = document.getElementById('delete-account-btn');
        this.confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        this.cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        this.updateAvatarBtn = document.getElementById('update-avatar-btn');
        this.profilePasswordForm = document.getElementById('profile-password-form');
        this.leaveRoomBtn = document.getElementById('leave-room-btn');
        this.leaveRoomModal = document.getElementById('leave-room-modal');
        this.confirmLeaveBtn = document.getElementById('confirm-leave-btn');
        this.cancelLeaveBtn = document.getElementById('cancel-leave-btn');
        this.leaveRoomMessage = document.getElementById('leave-room-message');
        this.navigationWarningModal = document.getElementById('navigation-warning-modal');
        this.closeNavWarningBtn = document.getElementById('close-nav-warning-btn');
        this.inviteGameModal = document.getElementById('invite-game-modal');
        this.invitePlayerName = document.getElementById('invite-player-name');
        this.inviteConfirmBtn = document.getElementById('invite-confirm-btn');
        this.inviteCancelBtn = document.getElementById('invite-cancel-btn');
        this.battleshipShipsContainer = document.getElementById('battleship-ships-container');
        this.battleshipShipsBox = document.getElementById('battleship-ships-box');
        this.battleshipStatus = document.getElementById('battleship-status');
        this.battleshipToggleOrientation = document.getElementById('battleship-toggle-orientation');
    }

    initializeManagersFallback() {
        if (typeof ModalManager !== 'undefined') {
            this.modalManager = new ModalManager(this);
        }
        if (typeof ChatRenderer !== 'undefined') {
            this.chatRenderer = new ChatRenderer(this);
        }
        if (typeof LobbyRenderer !== 'undefined') {
            this.lobbyRenderer = new LobbyRenderer(this);
        }
        if (typeof ScoreboardManager !== 'undefined') {
            this.scoreboardManager = new ScoreboardManager(this);
        }
        if (typeof AvatarManager !== 'undefined') {
            this.avatarManager = new AvatarManager(this);
        }
        if (typeof AuthManager !== 'undefined') {
            this.authManager = new AuthManager(this);
        }
        if (typeof ViewManager !== 'undefined') {
            this.viewManager = new ViewManager(this);
        }
        if (typeof SocketManager !== 'undefined') {
            this.socketManager = new SocketManager(this);
        }
        if (typeof NavigationManager !== 'undefined') {
            this.navigationManager = new NavigationManager(this);
            this.navigationManager.registerEventListeners();
        }
        if (typeof GameStateManager !== 'undefined') {
            this.gameStateManager = new GameStateManager(this);
        }
        if (typeof RoomManager !== 'undefined') {
            this.roomManager = new RoomManager(this);
        }
        if (typeof BattleshipManager !== 'undefined') {
            this.battleshipManager = new BattleshipManager(this);
        }
        if (typeof InvitationManager !== 'undefined') {
            this.invitationManager = new InvitationManager(this);
            this.invitationManager.registerEventListeners();
        }
        if (typeof NotificationManager !== 'undefined') {
            this.notificationManager = new NotificationManager(this);
        }
        if (typeof ReportManager !== 'undefined') {
            this.reportManager = new ReportManager(this);
            this.reportManager.registerEventListeners();
        }
        if (typeof BattleshipGame !== 'undefined') {
            this.battleshipGame = new BattleshipGame(this);
        }
        if (typeof TMMGame !== 'undefined') {
            this.tmmGame = new TMMGame(this);
        }
        if (typeof MemoryGame !== 'undefined') {
            this.memoryGame = new MemoryGame(this);
        }
        if (this.viewManager) {
            this.viewManager.setCurrentGameType(this.viewManager.currentGameType);
        }
        if (this.authManager) {
            setTimeout(() => {
                this.authManager.checkStoredToken();
            }, 50);
        } else {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
                loadingScreen.classList.add('hidden');
            }
            const authContainer = document.getElementById('auth-container');
            if (authContainer) {
                authContainer.style.display = 'flex';
            }
        }
    }

    setupEventListeners() {
        if (this.viewManager) {
            this.viewManager.selectLobbyGame(this.viewManager.selectedLobbyGameType || 'three-mens-morris');
        }
    }

    waitForBadgesAndShowLobby() {
        if (this.scoreboardManager) {
            return this.scoreboardManager.waitForBadgesAndShowLobby();
        } else {
            if (this.viewManager) {
                this.viewManager.showLobby();
            }
            return Promise.resolve();
        }
    }

    clearStoredAuth() {
        if (this.authManager) {
            this.authManager.clearStoredAuth();
        }
    }

    switchAuthTab(target) {
        if (this.authManager) {
            this.authManager.switchAuthTab(target);
        }
    }

    validatePassword(password) {
        return this.authManager ? this.authManager.validatePassword(password) : { isValid: false, errors: [] };
    }

    displayPasswordError(input, errorElement, errors) {
        if (this.authManager) {
            this.authManager.displayPasswordError(input, errorElement, errors);
        }
    }

    validateRegisterPassword() {
        return this.authManager ? this.authManager.validateRegisterPassword() : false;
    }

    validateRegisterConfirmPassword() {
        return this.authManager ? this.authManager.validateRegisterConfirmPassword() : false;
    }

    validateProfileNewPassword() {
        return this.authManager ? this.authManager.validateProfileNewPassword() : false;
    }

    validateProfileConfirmPassword() {
        return this.authManager ? this.authManager.validateProfileConfirmPassword() : false;
    }

    clearPasswordValidation() {
        if (this.authManager) {
            this.authManager.clearPasswordValidation();
        }
    }

    async loginAsGuest() {
        if (this.authManager) {
            return this.authManager.loginAsGuest();
        }
    }

    async submitAuth(action, event) {
        if (this.authManager) {
            return this.authManager.submitAuth(action, event);
        }
    }

    async afterAuthentication(data) {
        if (this.authManager) {
            return this.authManager.afterAuthentication(data);
        }
    }

    logout() {
        if (this.authManager) {
            this.authManager.logout();
        } else {
            if (this.socket) {
                this.socket.disconnect();
                this.socket = null;
            }
            this.currentRoom = null;
            this.gameState = null;
            this.myRole = null;
            this.isSpectator = false;
            if (this.warningManager) {
                this.warningManager.disableBeforeUnloadWarning();
            }
            if (this.viewManager) {
                this.viewManager.showView('auth');
            }
        }
    }

    initializeSocket() {
        if (!this.token) {
            console.warn('Cannot initialize socket: no token');
            return;
        }
        if (this.socket) {
            this.socket.off();
            this.socket.disconnect();
        }
        this.socket = io({ auth: { token: this.token } });

        this.socket.on('connect', () => {
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.handleSocketError(error);
        });

        if (this.socketManager) {
            this.socketManager.registerHandlers(this.socket);
        } else {
            this.setupSocketListeners();
        }
    }

    setupSocketListeners() {
        if (!this.socket) return;
        this.socket.on('connect_error', (error) => {
            this.handleSocketError(error);
        });
    }


    handleSocketError(error) {
        if (error && error.message) {
            if (this.authManager) {
                this.authManager.showAuthMessage(error.message);
            }
        } else {
            if (this.authManager) {
                this.authManager.showAuthMessage('Socket connection failed.');
            }
        }
        this.logout();
    }

    sendGameInvitation(username) {
        if (this.invitationManager) {
            this.invitationManager.sendGameInvitation(username);
        }
    }

    confirmInviteGameType() {
        if (this.invitationManager) {
            this.invitationManager.confirmInviteGameType();
        }
    }

    hideInviteGameModal() {
        if (this.invitationManager) {
            this.invitationManager.hideInviteGameModal();
        }
    }

    showInvitationModal(message) {
        if (this.invitationManager) {
            this.invitationManager.showInvitationModal(message);
        }
    }

    hideInvitationModal() {
        if (this.invitationManager) {
            this.invitationManager.hideInvitationModal();
        }
    }

    acceptInvitation() {
        if (this.invitationManager) {
            this.invitationManager.acceptInvitation();
        }
    }

    declineInvitation() {
        if (this.invitationManager) {
            this.invitationManager.declineInvitation();
        }
    }

    requestRematch() {
        if (this.invitationManager) {
            this.invitationManager.requestRematch();
        }
    }

    updateRematchButtonStatus() {
        if (this.invitationManager) {
            this.invitationManager.updateRematchButtonStatus();
        }
    }

    makeMove(cellIndex) {
        if (this.tmmGame) {
            this.tmmGame.handleCellClick(cellIndex);
        }
    }

    showLobby() {
        if (this.viewManager) {
            this.viewManager.showLobby();
        }
    }

    showView(viewName) {
        if (this.viewManager) {
            this.viewManager.showView(viewName);
        }
    }

    showLeaderboard() {
        if (this.viewManager) {
            this.viewManager.showView('leaderboard');
        }
    }

    showTournaments() {
        if (this.viewManager) {
            this.viewManager.showView('tournaments');
        }
    }

    showProfile() {
        // Check if user is in a tournament - prevent navigation
        if (this.tournamentManager && this.tournamentManager.isInTournament()) {
            const modal = document.getElementById('tournament-navigation-warning-modal');
            if (modal) {
                modal.classList.remove('hidden');
            }
            return; // Prevent navigation
        }

        // Check if user is in a game - prevent navigation
        if (this.currentRoom && !this.isSpectator) {
            if (this.gameState && this.gameState.gameStatus === 'finished') {
                // Game finished, allow navigation
            } else {
                if (this.warningManager) {
                    this.warningManager.showNavigationWarning();
                } else {
                    this.showNavigationWarning();
                }
                return; // Prevent navigation
            }
        }

        if (this.authManager) {
            this.authManager.loadProfileData();
        }
        if (this.viewManager) {
            this.viewManager.showView('profile');
        }
    }

    showUserProfile(username) {
        console.log('[app.showUserProfile] Called with username:', username);
        if (this.userProfileManager) {
            this.userProfileManager.showUserProfile(username);
        } else {
            console.error('[app.showUserProfile] userProfileManager is not initialized!');
            console.error('[app.showUserProfile] Make sure UserProfileManager.js is loaded in index.html');
        }
    }

    toggleUserMenu() {
        if (this.navigationManager) {
            this.navigationManager.toggleUserMenu();
        } else {
            this.userMenuOpen = !this.userMenuOpen;
            if (this.userMenuDropdown) {
                this.userMenuDropdown.classList.toggle('hidden', !this.userMenuOpen);
            }
        }
    }

    closeUserMenu() {
        if (this.navigationManager) {
            this.navigationManager.closeUserMenu();
        } else {
            this.userMenuOpen = false;
            if (this.userMenuDropdown) {
                this.userMenuDropdown.classList.add('hidden');
            }
        }
    }

    showNavigationWarning() {
        if (this.warningManager) {
            this.warningManager.showNavigationWarning();
        } else if (this.navigationWarningModal) {
            this.navigationWarningModal.classList.remove('hidden');
        }
    }

    hideNavigationWarning() {
        if (this.warningManager) {
            this.warningManager.hideNavigationWarning();
        } else if (this.navigationWarningModal) {
            this.navigationWarningModal.classList.add('hidden');
        }
    }

    setupBeforeUnloadWarning() {
        if (this.warningManager) {
            return;
        }
        this.beforeUnloadHandler = (e) => {
            if (this.currentRoom && !this.isSpectator) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
    }

    enableBeforeUnloadWarning() {
        if (this.warningManager) {
            this.warningManager.enableBeforeUnloadWarning();
        } else if (this.beforeUnloadHandler) {
            window.addEventListener('beforeunload', this.beforeUnloadHandler);
        }
    }

    disableBeforeUnloadWarning() {
        if (this.warningManager) {
            this.warningManager.disableBeforeUnloadWarning();
        } else if (this.beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this.beforeUnloadHandler);
        }
    }

    updateNavigation() {
        if (this.navigationManager) {
            this.navigationManager.updateNavigation();
        } else if (this.navContainer) {
            if (this.viewManager && this.viewManager.currentView === 'auth') {
                this.navContainer.style.display = 'none';
            } else {
                this.navContainer.style.display = 'flex';
            }
        }
    }

    updateGameBoard() {
        if (this.gameStateManager) {
            this.gameStateManager.updateGameBoard();
        } else {
            console.warn('GameStateManager not loaded, using fallback');
        }
    }

    updateGameInfo() {
        if (this.gameStateManager) {
            this.gameStateManager.updateGameInfo();
        } else {
            console.warn('GameStateManager not loaded');
        }
    }

    sendLobbyChat(message) {
        if (this.chatRenderer) {
            this.chatRenderer.sendLobbyChat(message);
        }
    }

    sendRoomChat(message) {
        if (this.chatRenderer) {
            this.chatRenderer.sendRoomChat(message);
        }
    }

    openReportModal(username) {
        if (this.reportManager) {
            this.reportManager.openReportModal(username);
        }
    }

    closeReportModal() {
        if (this.reportManager) {
            this.reportManager.closeReportModal();
        }
    }

    async submitReport() {
        if (this.reportManager) {
            return this.reportManager.submitReport();
        }
    }

    updateGameInfoContent() {
        if (this.viewManager) {
            this.viewManager.updateGameInfoContent();
        }
    }

    showGameInfo() {
        if (this.viewManager) {
            this.viewManager.showGameInfo();
        }
    }

    hideGameInfo() {
        if (this.viewManager) {
            this.viewManager.hideGameInfo();
        }
    }

    async getPlayerAvatar(username, avatarFromGameState = null) {
        if (this.avatarManager) {
            return await this.avatarManager.getPlayerAvatar(username, avatarFromGameState);
        }
        return '👤';
    }






    showMemoryMatchMessage(message) {
        if (this.memoryGame && this.viewManager && this.viewManager.currentGameType === 'memory-match') {
            this.memoryGame.showMatchMessage(message);
        } else {
            const messageEl = document.getElementById('memory-match-message');
            if (messageEl) {
                messageEl.textContent = message;
                messageEl.classList.remove('hidden');
                messageEl.classList.add('show');
                setTimeout(() => this.hideMemoryMatchMessage(), 500);
            }
        }
    }

    hideMemoryMatchMessage() {
        if (this.memoryGame && this.viewManager && this.viewManager.currentGameType === 'memory-match') {
            this.memoryGame.hideMatchMessage();
        } else {
            const messageEl = document.getElementById('memory-match-message');
            if (messageEl) {
                messageEl.classList.remove('show');
                setTimeout(() => {
                    messageEl.classList.add('hidden');
                    messageEl.textContent = '';
                }, 300);
            }
        }
    }

    renderBattleshipBoards() {
        if (this.battleshipManager) {
            return this.battleshipManager.renderBattleshipBoards();
        } else if (this.battleshipGame) {
            return this.battleshipGame.renderBoards();
        }
    }

    hideShipPreview() {
        if (this.battleshipManager) {
            this.battleshipManager.hideShipPreview();
        }
    }

    handleBattleshipPlacementClick(position) {
        if (this.battleshipManager) {
            this.battleshipManager.handleBattleshipPlacementClick(position);
        }
    }

    makeBattleshipGuess(position) {
        if (this.battleshipManager) {
            this.battleshipManager.makeBattleshipGuess(position);
        }
    }

    removeBattleshipShip(shipTypeId) {
        if (this.battleshipManager) {
            this.battleshipManager.removeBattleshipShip(shipTypeId);
        }
    }

    finishBattleshipPlacement() {
        if (this.battleshipManager) {
            this.battleshipManager.finishBattleshipPlacement();
        }
    }

    unlockBattleshipPlacement() {
        if (this.battleshipManager) {
            this.battleshipManager.unlockBattleshipPlacement();
        }
    }

    updateBattleshipPlacementStatus(gameState) {
        if (this.battleshipManager) {
            this.battleshipManager.updateBattleshipPlacementStatus(gameState);
        }
    }

    startBattleshipCountdown() {
        if (this.battleshipManager) {
            this.battleshipManager.startBattleshipCountdown();
        }
    }

    updateBattleshipControls() {
        if (this.battleshipManager) {
            this.battleshipManager.updateBattleshipControls();
        }
    }

    renderPlayerShipsBox(role, state) {
        if (this.battleshipManager) {
            this.battleshipManager.renderPlayerShipsBox(role, state);
        }
    }

    async updateBattleshipPlayerInfo() {
        if (this.battleshipManager) {
            return this.battleshipManager.updateBattleshipPlayerInfo();
        } else if (this.battleshipGame) {
            return this.battleshipGame.updatePlayerInfo();
        }
    }







    toggleOnlinePlayers() {
        if (this.navigationManager) {
            this.navigationManager.toggleOnlinePlayers();
        }
    }

    closeOnlinePlayers() {
        if (this.navigationManager) {
            this.navigationManager.closeOnlinePlayers();
        }
    }

    openLobbyChatDrawer() {
        if (this.navigationManager) {
            this.navigationManager.openLobbyChatDrawer();
        }
    }

    closeLobbyChatDrawer() {
        if (this.navigationManager) {
            this.navigationManager.closeLobbyChatDrawer();
        }
    }

    openRoomChatDrawer() {
        if (this.navigationManager) {
            this.navigationManager.openRoomChatDrawer();
        }
    }

    closeRoomChatDrawer() {
        if (this.navigationManager) {
            this.navigationManager.closeRoomChatDrawer();
        }
    }

    updateChatWidgets() {
        if (this.navigationManager && this.navigationManager.updateChatWidgets) {
            this.navigationManager.updateChatWidgets();
        }
    }

    renderLobbyMessages() {
        if (this.chatRenderer && this.chatRenderer.renderLobbyMessages) {
            this.chatRenderer.renderLobbyMessages();
        }
    }

    updateLeaveButtonVisibility() {
        if (this.roomManager && this.roomManager.updateLeaveButtonVisibility) {
            this.roomManager.updateLeaveButtonVisibility();
        }
    }

    updateRoomInfoBox() {
        if (this.roomManager && this.roomManager.updateRoomInfoBox) {
            this.roomManager.updateRoomInfoBox();
        }
    }

    formatGameType(type) {
        if (this.viewManager && this.viewManager.formatGameType) {
            return this.viewManager.formatGameType(type);
        }
        const normalized = (type || 'three-mens-morris').toLowerCase().replace(/_/g, '-');
        const mapping = {
            'three-mens-morris': 'Three Men\'s Morris',
            'threemensmorris': 'Three Men\'s Morris',
            'memory-match': 'Memory Match',
            'memorymatch': 'Memory Match',
            'battleship': 'Battleship'
        };
        return mapping[normalized] || 'Three Men\'s Morris';
    }

    joinRoom(roomId, asSpectator = false) {
        if (this.roomManager && this.roomManager.joinRoom) {
            this.roomManager.joinRoom(roomId, asSpectator);
        }
    }

}
(function () {
    function ensureBasicFunctionality() {
        const loadingScreen = document.getElementById('loading-screen');
        const authContainer = document.getElementById('auth-container');

        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const guestBtn = document.getElementById('guest-login-btn');

        if (loginForm && !loginForm.hasAttribute('data-listener-attached')) {
            loginForm.setAttribute('data-listener-attached', 'true');
            loginForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                const username = this.querySelector('input[name="username"]')?.value.trim();
                const password = this.querySelector('input[name="password"]')?.value;
                if (!username || !password) {
                    const msgEl = document.getElementById('auth-message');
                    if (msgEl) msgEl.textContent = 'Please fill out all fields.';
                    return;
                }
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    const data = await response.json();
                    if (response.ok && data.token) {
                        localStorage.setItem('minigames_token', data.token);
                        localStorage.setItem('minigames_username', data.username);
                        localStorage.setItem('minigames_role', data.role || 'player');

                        const loadingScreenEl = document.getElementById('loading-screen');
                        const authContainerEl = document.getElementById('auth-container');
                        const lobbyContainerEl = document.getElementById('lobby-container');
                        const roomsContainerEl = document.getElementById('rooms-container');
                        const leaderboardContainerEl = document.getElementById('leaderboard-container');
                        const gameContainerEl = document.getElementById('game-container');

                        if (loadingScreenEl) {
                            loadingScreenEl.style.display = 'none';
                            loadingScreenEl.classList.add('hidden');
                        }
                        if (authContainerEl) authContainerEl.style.display = 'none';
                        if (roomsContainerEl) roomsContainerEl.style.display = 'none';
                        if (leaderboardContainerEl) leaderboardContainerEl.style.display = 'none';
                        if (gameContainerEl) gameContainerEl.style.display = 'none';
                        if (lobbyContainerEl) {
                            lobbyContainerEl.style.display = 'block';
                        }

                        if (window.app) {
                            window.app.token = data.token;
                            window.app.currentUser = data.username;
                            window.app.userRole = data.role || 'player';
                            if (window.app.initializeSocket) {
                                window.app.initializeSocket();
                            }
                            setTimeout(() => {
                                if (window.app && window.app.socket && window.app.socket.connected) {
                                } else if (window.app && window.app.initializeSocket) {
                                    console.warn('Socket not connected, retrying...');
                                    window.app.initializeSocket();
                                }
                            }, 2000);
                        } else {
                            setTimeout(() => {
                                if (window.app && window.app.initializeSocket) {
                                    window.app.initializeSocket();
                                }
                            }, 500);
                        }
                    } else {
                        const msgEl = document.getElementById('auth-message');
                        if (msgEl) msgEl.textContent = data.error || 'Login failed.';
                    }
                } catch (err) {
                    console.error('Login error:', err);
                    const msgEl = document.getElementById('auth-message');
                    if (msgEl) msgEl.textContent = 'Unable to connect to server.';
                }
            });
        }

        // Register form is handled by RegisterHandler - no duplicate listener needed
        // Removed duplicate event listener to prevent double submissions
        if (registerForm && !registerForm.hasAttribute('data-listener-attached')) {
            registerForm.setAttribute('data-listener-attached', 'true');
            // RegisterHandler handles form submission - this listener removed to prevent duplicates
            /*
            registerForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const username = this.querySelector('input[name="username"]')?.value.trim();
                const email = this.querySelector('input[name="email"]')?.value.trim();
                const password = this.querySelector('input[name="password"]')?.value;
                if (!username || !email || !password) {
                    const msgEl = document.getElementById('auth-message');
                    if (msgEl) msgEl.textContent = 'Please fill out all fields.';
                    return;
                }
                try {
                    const response = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, email, password })
                    });
                    const data = await response.json();
                    if (response.ok && data.token) {
                        // Guest user registration - immediate login
                        localStorage.setItem('minigames_token', data.token);
                        localStorage.setItem('minigames_username', data.username);
                        localStorage.setItem('minigames_role', data.role || 'player');
                        
                        const loadingScreenEl = document.getElementById('loading-screen');
                        const authContainerEl = document.getElementById('auth-container');
                        const lobbyContainerEl = document.getElementById('lobby-container');
                        const roomsContainerEl = document.getElementById('rooms-container');
                        const leaderboardContainerEl = document.getElementById('leaderboard-container');
                        const gameContainerEl = document.getElementById('game-container');
                        
                        if (loadingScreenEl) {
                            loadingScreenEl.style.display = 'none';
                            loadingScreenEl.classList.add('hidden');
                        }
                        if (authContainerEl) authContainerEl.style.display = 'none';
                        if (roomsContainerEl) roomsContainerEl.style.display = 'none';
                        if (leaderboardContainerEl) leaderboardContainerEl.style.display = 'none';
                        if (gameContainerEl) gameContainerEl.style.display = 'none';
                        if (lobbyContainerEl) {
                            lobbyContainerEl.style.display = 'block';
                        }
                        
                        if (window.app) {
                            window.app.token = data.token;
                            window.app.currentUser = data.username;
                            window.app.userRole = data.role || 'player';
                            if (window.app.initializeSocket) {
                                window.app.initializeSocket();
                            }
                            setTimeout(() => {
                                if (window.app && window.app.socket && window.app.socket.connected) {
                                } else if (window.app && window.app.initializeSocket) {
                                    console.warn('Socket not connected, retrying...');
                                    window.app.initializeSocket();
                                }
                            }, 2000);
                        } else {
                            setTimeout(() => {
                                if (window.app && window.app.initializeSocket) {
                                    window.app.initializeSocket();
                                }
                            }, 500);
                        }
                    } else if (response.ok && data.message) {
                        // Registration successful but email verification required
                        // Don't show error - RegisterHandler will handle showing the success modal
                        // Just return silently to let RegisterHandler handle it
                        return;
                    } else {
                        // Only show error if response is not ok
                        const msgEl = document.getElementById('auth-message');
                        if (msgEl && !response.ok) {
                            msgEl.textContent = data.error || 'Registration failed.';
                        }
                    }
                } catch (err) {
                    console.error('Register error:', err);
                    const msgEl = document.getElementById('auth-message');
                    if (msgEl) msgEl.textContent = 'Unable to connect to server.';
                }
            });
            */
        }

        if (guestBtn && !guestBtn.hasAttribute('data-listener-attached')) {
            guestBtn.setAttribute('data-listener-attached', 'true');
            guestBtn.addEventListener('click', async function () {
                try {
                    const response = await fetch('/api/auth/guest', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await response.json();
                    if (response.ok && data.token) {
                        localStorage.setItem('minigames_token', data.token);
                        localStorage.setItem('minigames_username', data.username);
                        localStorage.setItem('minigames_role', 'guest');

                        const loadingScreenEl = document.getElementById('loading-screen');
                        const authContainerEl = document.getElementById('auth-container');
                        const lobbyContainerEl = document.getElementById('lobby-container');
                        const roomsContainerEl = document.getElementById('rooms-container');
                        const leaderboardContainerEl = document.getElementById('leaderboard-container');
                        const gameContainerEl = document.getElementById('game-container');

                        if (loadingScreenEl) {
                            loadingScreenEl.style.display = 'none';
                            loadingScreenEl.classList.add('hidden');
                        }
                        if (authContainerEl) authContainerEl.style.display = 'none';
                        if (roomsContainerEl) roomsContainerEl.style.display = 'none';
                        if (leaderboardContainerEl) leaderboardContainerEl.style.display = 'none';
                        if (gameContainerEl) gameContainerEl.style.display = 'none';
                        if (lobbyContainerEl) {
                            lobbyContainerEl.style.display = 'block';
                        }

                        if (window.app) {
                            window.app.token = data.token;
                            window.app.currentUser = data.username;
                            window.app.userRole = 'guest';
                            if (window.app.initializeSocket) {
                                window.app.initializeSocket();
                            }
                        } else {
                            setTimeout(() => {
                                if (window.app && window.app.initializeSocket) {
                                    window.app.initializeSocket();
                                }
                            }, 500);
                        }
                    }
                } catch (err) {
                    console.error('Guest login error:', err);
                }
            });
        }

        const lobbyBtn = document.getElementById('lobby-nav-btn');
        if (lobbyBtn && !lobbyBtn.hasAttribute('data-listener-attached')) {
            lobbyBtn.setAttribute('data-listener-attached', 'true');
            lobbyBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                // Check if user is in a tournament - prevent navigation
                if (window.app && window.app.tournamentManager && window.app.tournamentManager.isInTournament()) {
                    const modal = document.getElementById('tournament-navigation-warning-modal');
                    if (modal) {
                        modal.classList.remove('hidden');
                    }
                    return false;
                }
                const authContainer = document.getElementById('auth-container');
                const lobbyContainer = document.getElementById('lobby-container');
                if (authContainer) authContainer.style.display = 'none';
                if (lobbyContainer) lobbyContainer.style.display = 'block';
                return false;
            });
        }
    }

    function initApp() {
        try {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    ensureBasicFunctionality();
                    setTimeout(() => {
                        try {
                            window.app = new MiniGamesApp();
                        } catch (error) {
                            console.error('App initialization error:', error);
                            ensureBasicFunctionality();
                        }
                    }, 200);
                });
            } else {
                ensureBasicFunctionality();
                setTimeout(() => {
                    try {
                        window.app = new MiniGamesApp();
                    } catch (error) {
                        console.error('App initialization error:', error);
                        ensureBasicFunctionality();
                    }
                }, 200);
            }
        } catch (error) {
            console.error('Failed to initialize app:', error);
            ensureBasicFunctionality();
            const loadingScreen = document.getElementById('loading-screen');
            const authContainer = document.getElementById('auth-container');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
                loadingScreen.classList.add('hidden');
            }
            if (authContainer) {
                authContainer.style.display = 'flex';
                authContainer.style.setProperty('display', 'flex', 'important');
            }
        }
    }

    initApp();

    setTimeout(() => {
        const token = localStorage.getItem('minigames_token');
        const username = localStorage.getItem('minigames_username');
        if (token && username) {
            const authContainer = document.getElementById('auth-container');
            if (authContainer && authContainer.style.display !== 'none') {
                fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => {
                    if (res.ok) {
                        const loadingScreen = document.getElementById('loading-screen');
                        const authContainer = document.getElementById('auth-container');
                        const lobbyContainer = document.getElementById('lobby-container');
                        const roomsContainer = document.getElementById('rooms-container');
                        const leaderboardContainer = document.getElementById('leaderboard-container');
                        const gameContainer = document.getElementById('game-container');

                        if (loadingScreen) {
                            loadingScreen.style.display = 'none';
                            loadingScreen.classList.add('hidden');
                        }
                        if (authContainer) authContainer.style.display = 'none';
                        if (roomsContainer) roomsContainer.style.display = 'none';
                        if (leaderboardContainer) leaderboardContainer.style.display = 'none';
                        if (gameContainer) gameContainer.style.display = 'none';
                        if (lobbyContainer) lobbyContainer.style.display = 'block';

                        if (window.app && window.app.initializeSocket) {
                            window.app.initializeSocket();
                        }
                    }
                }).catch(() => { });
            }
        }

        const lobbyBtn = document.getElementById('lobby-nav-btn');
        if (lobbyBtn && !lobbyBtn.hasAttribute('data-listener-attached')) {
            lobbyBtn.setAttribute('data-listener-attached', 'true');
            lobbyBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                // Check if user is in a tournament - prevent navigation
                if (window.app && window.app.tournamentManager && window.app.tournamentManager.isInTournament()) {
                    const modal = document.getElementById('tournament-navigation-warning-modal');
                    if (modal) {
                        modal.classList.remove('hidden');
                    }
                    return false;
                }
                const authContainer = document.getElementById('auth-container');
                const lobbyContainer = document.getElementById('lobby-container');
                const roomsContainer = document.getElementById('rooms-container');
                const leaderboardContainer = document.getElementById('leaderboard-container');
                if (authContainer) authContainer.style.display = 'none';
                if (roomsContainer) roomsContainer.style.display = 'none';
                if (leaderboardContainer) leaderboardContainer.style.display = 'none';
                if (lobbyContainer) lobbyContainer.style.display = 'block';
                return false;
            });
        }

        const roomsBtn = document.getElementById('rooms-nav-btn');
        if (roomsBtn && !roomsBtn.hasAttribute('data-listener-attached')) {
            roomsBtn.setAttribute('data-listener-attached', 'true');
            roomsBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                // Check if user is in a tournament - prevent navigation
                if (window.app && window.app.tournamentManager && window.app.tournamentManager.isInTournament()) {
                    const modal = document.getElementById('tournament-navigation-warning-modal');
                    if (modal) {
                        modal.classList.remove('hidden');
                    }
                    return false;
                }
                const authContainer = document.getElementById('auth-container');
                const lobbyContainer = document.getElementById('lobby-container');
                const roomsContainer = document.getElementById('rooms-container');
                const leaderboardContainer = document.getElementById('leaderboard-container');
                if (authContainer) authContainer.style.display = 'none';
                if (lobbyContainer) lobbyContainer.style.display = 'none';
                if (leaderboardContainer) leaderboardContainer.style.display = 'none';
                if (roomsContainer) roomsContainer.style.display = 'block';
                return false;
            });
        }

        const leaderboardBtn = document.getElementById('leaderboard-nav-btn');
        if (leaderboardBtn && !leaderboardBtn.hasAttribute('data-listener-attached')) {
            leaderboardBtn.setAttribute('data-listener-attached', 'true');
            leaderboardBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                // Check if user is in a tournament - prevent navigation
                if (window.app && window.app.tournamentManager && window.app.tournamentManager.isInTournament()) {
                    const modal = document.getElementById('tournament-navigation-warning-modal');
                    if (modal) {
                        modal.classList.remove('hidden');
                    }
                    return false;
                }
                const authContainer = document.getElementById('auth-container');
                const lobbyContainer = document.getElementById('lobby-container');
                const roomsContainer = document.getElementById('rooms-container');
                const leaderboardContainer = document.getElementById('leaderboard-container');
                if (authContainer) authContainer.style.display = 'none';
                if (lobbyContainer) lobbyContainer.style.display = 'none';
                if (roomsContainer) roomsContainer.style.display = 'none';
                if (leaderboardContainer) leaderboardContainer.style.display = 'block';
                return false;
            });
        }

        const lobbyChatTab = document.getElementById('lobby-chat-tab');
        if (lobbyChatTab && !lobbyChatTab.hasAttribute('data-listener-attached')) {
            lobbyChatTab.setAttribute('data-listener-attached', 'true');
            lobbyChatTab.addEventListener('click', function () {
                const drawer = document.getElementById('lobby-chat-drawer');
                if (drawer) {
                    drawer.classList.toggle('drawer-open');
                }
            });
        }

        const lobbyChatForm = document.getElementById('lobby-chat-form');
        const lobbyChatInput = document.getElementById('lobby-chat-input');
        if (lobbyChatForm && lobbyChatInput && !lobbyChatForm.hasAttribute('data-listener-attached')) {
            lobbyChatForm.setAttribute('data-listener-attached', 'true');
            lobbyChatForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const message = lobbyChatInput.value.trim();
                if (!message) return;

                if (window.app && window.app.socket && window.app.socket.connected) {
                    window.app.socket.emit('lobbyChatMessage', { message });
                    lobbyChatInput.value = '';
                } else if (window.app && window.app.initializeSocket) {
                    window.app.initializeSocket();
                    setTimeout(() => {
                        if (window.app && window.app.socket && window.app.socket.connected) {
                            window.app.socket.emit('lobbyChatMessage', { message });
                            lobbyChatInput.value = '';
                        } else {
                            console.error('Socket not connected, cannot send message');
                        }
                    }, 1000);
                } else {
                    console.error('App or socket not available');
                }
            });
        }

        const roomChatForm = document.getElementById('room-chat-form');
        const roomChatInput = document.getElementById('room-chat-input');
        if (roomChatForm && roomChatInput && !roomChatForm.hasAttribute('data-listener-attached')) {
            roomChatForm.setAttribute('data-listener-attached', 'true');
            roomChatForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const message = roomChatInput.value.trim();
                if (!message) return;

                if (window.app && window.app.socket && window.app.socket.connected && window.app.currentRoom) {
                    window.app.socket.emit('roomChatMessage', { roomId: window.app.currentRoom, message });
                    roomChatInput.value = '';
                } else if (window.app && window.app.initializeSocket) {
                    window.app.initializeSocket();
                    setTimeout(() => {
                        if (window.app && window.app.socket && window.app.socket.connected && window.app.currentRoom) {
                            window.app.socket.emit('roomChatMessage', { roomId: window.app.currentRoom, message });
                            roomChatInput.value = '';
                        } else {
                            console.error('Socket not connected or no room, cannot send message');
                        }
                    }, 1000);
                } else {
                    console.error('App, socket, or room not available');
                }
            });
        }

        const closeNavWarningBtn = document.getElementById('close-nav-warning-btn');
        if (closeNavWarningBtn && !closeNavWarningBtn.hasAttribute('data-listener-attached')) {
            closeNavWarningBtn.setAttribute('data-listener-attached', 'true');
            closeNavWarningBtn.addEventListener('click', function () {
                if (window.app && window.app.hideNavigationWarning) {
                    window.app.hideNavigationWarning();
                } else {
                    const navWarningModal = document.getElementById('navigation-warning-modal');
                    if (navWarningModal) {
                        navWarningModal.classList.add('hidden');
                    }
                }
            });
        }

        const rematchBtn = document.getElementById('rematch-btn');
        if (rematchBtn && !rematchBtn.hasAttribute('data-listener-attached')) {
            rematchBtn.setAttribute('data-listener-attached', 'true');
            rematchBtn.addEventListener('click', function () {
                if (window.app && window.app.requestRematch) {
                    window.app.requestRematch();
                }
            });
        }

        const gameEndRematchBtn = document.getElementById('game-end-rematch-btn');
        if (gameEndRematchBtn && !gameEndRematchBtn.hasAttribute('data-listener-attached')) {
            gameEndRematchBtn.setAttribute('data-listener-attached', 'true');
            gameEndRematchBtn.addEventListener('click', function () {
                if (window.app && window.app.requestRematch) {
                    window.app.requestRematch();
                }
            });
        }

        const gameInfoBtn = document.getElementById('game-info-btn');
        if (gameInfoBtn && !gameInfoBtn.hasAttribute('data-listener-attached')) {
            gameInfoBtn.setAttribute('data-listener-attached', 'true');
            gameInfoBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (window.app && window.app.showGameInfo) {
                    window.app.showGameInfo();
                } else if (window.app && window.app.viewManager && window.app.viewManager.showGameInfo) {
                    window.app.viewManager.showGameInfo();
                }
            });
        }

        const gameInfoModal = document.getElementById('game-info-modal');
        if (gameInfoModal && !gameInfoModal.hasAttribute('data-listener-attached')) {
            gameInfoModal.setAttribute('data-listener-attached', 'true');
            gameInfoModal.addEventListener('click', function (e) {
                if (e.target === gameInfoModal) {
                    if (window.app && window.app.hideGameInfo) {
                        window.app.hideGameInfo();
                    } else if (window.app && window.app.viewManager && window.app.viewManager.hideGameInfo) {
                        window.app.viewManager.hideGameInfo();
                    }
                }
            });

            // Add close button handler
            const closeBtn = document.getElementById('game-info-close-btn');
            if (closeBtn && !closeBtn.hasAttribute('data-listener-attached')) {
                closeBtn.setAttribute('data-listener-attached', 'true');
                closeBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (window.app && window.app.hideGameInfo) {
                        window.app.hideGameInfo();
                    } else if (window.app && window.app.viewManager && window.app.viewManager.hideGameInfo) {
                        window.app.viewManager.hideGameInfo();
                    }
                });
            }
        }

        const battleshipStatus = document.getElementById('battleship-status');
        if (battleshipStatus) {
            battleshipStatus.style.display = 'none';
            battleshipStatus.classList.add('hidden');
            battleshipStatus.textContent = '';
            battleshipStatus.innerHTML = '';
        }

        const battleshipControls = document.querySelector('.battleship-controls');
        if (battleshipControls) {
            battleshipControls.style.display = 'none';
            battleshipControls.classList.add('hidden');
        }

        setInterval(() => {
            const status = document.getElementById('battleship-status');
            if (status && status.style.display !== 'none') {
                status.style.display = 'none';
                status.classList.add('hidden');
                status.textContent = '';
                status.innerHTML = '';
            }
        }, 100);
    }, 500);
})();

