class AppInitializer {
    constructor(app) {
        this.app = app;
    }

    initializeManagers() {
        this.initializeUIManagers();
        this.initializeCoreManagers();
        this.initializeGameManagers();
        this.initializeGameModules();
    }

    initializeUIManagers() {
        if (typeof ModalManager !== 'undefined') {
            this.app.modalManager = new ModalManager(this.app);
        }
        if (typeof ChatRenderer !== 'undefined') {
            this.app.chatRenderer = new ChatRenderer(this.app);
        }
        if (typeof LobbyRenderer !== 'undefined') {
            this.app.lobbyRenderer = new LobbyRenderer(this.app);
        }
        if (typeof ScoreboardManager !== 'undefined') {
            this.app.scoreboardManager = new ScoreboardManager(this.app);
        }
        if (typeof AvatarManager !== 'undefined') {
            this.app.avatarManager = new AvatarManager(this.app);
        }
    }

    initializeCoreManagers() {
        if (typeof AuthManager !== 'undefined') {
            this.app.authManager = new AuthManager(this.app);
        }
        if (typeof ViewManager !== 'undefined') {
            this.app.viewManager = new ViewManager(this.app);
        }
        if (typeof SocketManager !== 'undefined') {
            this.app.socketManager = new SocketManager(this.app);
        }
        if (typeof NavigationManager !== 'undefined') {
            this.app.navigationManager = new NavigationManager(this.app);
            this.app.navigationManager.registerEventListeners();
        }
        if (typeof NotificationManager !== 'undefined') {
            this.app.notificationManager = new NotificationManager(this.app);
        }
        if (typeof GameStateManager !== 'undefined') {
            this.app.gameStateManager = new GameStateManager(this.app);
        }
        if (typeof RoomManager !== 'undefined') {
            this.app.roomManager = new RoomManager(this.app);
        }
        if (typeof UserProfileManager !== 'undefined') {
            this.app.userProfileManager = new UserProfileManager(this.app);
        }
    }

    initializeGameManagers() {
        if (typeof BattleshipManager !== 'undefined') {
            this.app.battleshipManager = new BattleshipManager(this.app);
        }
        if (typeof InvitationManager !== 'undefined') {
            this.app.invitationManager = new InvitationManager(this.app);
            this.app.invitationManager.registerEventListeners();
        }
        if (typeof ReportManager !== 'undefined') {
            this.app.reportManager = new ReportManager(this.app);
            this.app.reportManager.registerEventListeners();
        }
    }

    initializeGameModules() {
        if (typeof BattleshipGame !== 'undefined') {
            this.app.battleshipGame = new BattleshipGame(this.app);
        }
        if (typeof TMMGame !== 'undefined') {
            this.app.tmmGame = new TMMGame(this.app);
        }
        if (typeof MemoryGame !== 'undefined') {
            this.app.memoryGame = new MemoryGame(this.app);
        }
    }

    finalizeInitialization() {
        if (this.app.viewManager) {
            this.app.viewManager.setCurrentGameType(this.app.viewManager.currentGameType);
        }
        if (this.app.authManager) {
            setTimeout(() => {
                this.app.authManager.checkStoredToken();
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
}
