class TicTacToeApp {
    constructor() {
        this.token = localStorage.getItem('tictactoe_token');
        this.currentUser = localStorage.getItem('tictactoe_username');
        this.userProfile = null;
        this.currentRoom = null;
        this.currentRoomName = null;
        this.currentView = 'auth';
        this.rooms = [];
        this.lobbyUsers = [];
        this.lobbyMessages = [];
        this.roomMessages = [];
        this.gameState = null;
        this.myRole = null;
        this.isSpectator = false;
        this.socket = null;
        this.currentGameType = 'tic-tac-toe';
        this.rpsResult = null;
        this.rpsChoiceSent = false;
        this.rpsScores = { X: 0, O: 0 };
        this.rpsGameOver = false;
        this.ticTacToeGridInitialized = false;
        this.selectedLobbyGameType = 'tic-tac-toe';
        this.gameCards = [];
        this.cardActionButtons = [];
        this.userMenuOpen = false;
        this.notificationCallback = null;
        this.notificationTimeout = null;

        this.bindDomElements();
        this.setCurrentGameType(this.currentGameType);
        this.setupEventListeners();
        this.checkStoredToken();
        this.setupBeforeUnloadWarning();
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
        this.userMenuDropdown = document.getElementById('user-menu-dropdown');
        this.profileNavBtn = document.getElementById('profile-nav-btn');
        this.logoutBtn = document.getElementById('logout-btn');

        this.authContainer = document.getElementById('auth-container');
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.authMessage = document.getElementById('auth-message');
        this.authTabs = document.querySelectorAll('.auth-tab');

        this.lobbyContainer = document.getElementById('lobby-container');
        this.roomNameModal = document.getElementById('room-name-modal');
        this.modalRoomNameInput = document.getElementById('modal-room-name-input');
        this.modalCreateBtn = document.getElementById('modal-create-btn');
        this.modalCancelBtn = document.getElementById('modal-cancel-btn');
        this.pendingGameType = null;
        this.roomsContainer = document.getElementById('rooms-container');
        this.roomsList = document.getElementById('rooms-list');
        this.lobbyUsersList = document.getElementById('lobby-users');
        this.lobbyChatList = document.getElementById('lobby-chat-list');
        this.lobbyChatForm = document.getElementById('lobby-chat-form');
        this.lobbyChatInput = document.getElementById('lobby-chat-input');
        
        // Widget state
        this.onlinePlayersOpen = false;
        this.lobbyChatOpen = false;
        
        // Widget elements
        this.onlinePlayersToggle = document.getElementById('online-players-toggle');
        this.onlinePlayersPopup = document.getElementById('online-players-popup');
        this.lobbyChatTab = document.getElementById('lobby-chat-tab');
        this.lobbyChatDrawer = document.getElementById('lobby-chat-drawer');
        this.lobbyChatDrawerContent = document.getElementById('lobby-chat-drawer-content');
        this.gameCards = document.querySelectorAll('.game-card');
        this.cardActionButtons = document.querySelectorAll('.game-card__action');

        this.gameContainer = document.getElementById('game-container');
        this.roomGameTypeDisplay = document.getElementById('room-game-type');
        this.gameModeMessage = document.getElementById('game-mode-message');
        this.infoText = document.querySelector('.info .class-text');
        this.gameInfoBtn = document.getElementById('game-info-btn');
        this.gameInfoModal = document.getElementById('game-info-modal');
        this.gameInfoTitle = document.getElementById('game-info-title');
        this.gameInfoContent = document.getElementById('game-info-content');
        this.playAgainBtn = document.querySelector('.go-home');
        this.gameBoard = document.getElementById('tic-tac-toe-board') || document.querySelector('.game-board');
        this.roomChatList = document.getElementById('room-chat-list');
        this.roomChatForm = document.getElementById('room-chat-form');
        this.roomChatInput = document.getElementById('room-chat-input');
        this.roomChatTab = document.getElementById('room-chat-tab');
        this.roomChatDrawer = document.getElementById('room-chat-drawer');
        this.roomChatDrawerContent = document.getElementById('room-chat-drawer-content');
        this.onlinePlayersWidget = document.getElementById('online-players-widget');
        this.roomChatOpen = false;
        this.rpsStage = document.getElementById('rps-stage');
        this.rpsControls = document.getElementById('rps-controls');
        this.rpsButtons = document.querySelectorAll('.rps-btn');
        this.rpsPlayerIcon = document.getElementById('rps-player-choice');
        this.rpsOpponentIcon = document.getElementById('rps-opponent-choice');
        this.rpsResultDisplay = document.getElementById('rps-result');
        this.rpsPlayerX = document.getElementById('rps-player-x');
        this.rpsPlayerXAvatar = document.getElementById('rps-player-x-avatar');
        this.rpsPlayerXName = document.getElementById('rps-player-x-name');
        this.rpsPlayerXScore = document.getElementById('rps-player-x-score');
        this.rpsPlayerO = document.getElementById('rps-player-o');
        this.rpsPlayerOAvatar = document.getElementById('rps-player-o-avatar');
        this.rpsPlayerOName = document.getElementById('rps-player-o-name');
        this.rpsPlayerOScore = document.getElementById('rps-player-o-score');
        this.memoryStage = document.getElementById('memory-stage');
        this.memoryGrid = document.getElementById('memory-grid');
        this.memoryStatus = document.getElementById('memory-status');
        this.memoryMatchMessage = document.getElementById('memory-match-message');
        this.memoryPlayerX = document.getElementById('memory-player-x');
        this.memoryPlayerXAvatar = document.getElementById('memory-player-x-avatar');
        this.memoryPlayerXName = document.getElementById('memory-player-x-name');
        this.memoryPlayerXScore = document.getElementById('memory-player-x-score');
        this.memoryPlayerO = document.getElementById('memory-player-o');
        this.memoryPlayerOAvatar = document.getElementById('memory-player-o-avatar');
        this.memoryPlayerOName = document.getElementById('memory-player-o-name');
        this.memoryPlayerOScore = document.getElementById('memory-player-o-score');

        this.tttStage = document.getElementById('ttt-stage');
        this.tttPlayerX = document.getElementById('ttt-player-x');
        this.tttPlayerXRole = document.getElementById('ttt-player-x-role');
        this.tttPlayerXAvatar = document.getElementById('ttt-player-x-avatar');
        this.tttPlayerXName = document.getElementById('ttt-player-x-name');
        this.tttPlayerXScore = document.getElementById('ttt-player-x-score');
        this.tttPlayerO = document.getElementById('ttt-player-o');
        this.tttPlayerORole = document.getElementById('ttt-player-o-role');
        this.tttPlayerOAvatar = document.getElementById('ttt-player-o-avatar');
        this.tttPlayerOName = document.getElementById('ttt-player-o-name');
        this.tttPlayerOScore = document.getElementById('ttt-player-o-score');

        this.leaderboardContainer = document.getElementById('leaderboard-container');
        this.scoreboardList = document.getElementById('scoreboard-list');
        this.backToLobbyBtn = document.getElementById('back-to-lobby-btn');
        this.tournamentsContainer = document.getElementById('tournaments-container');
        this.tournamentsBackBtn = document.getElementById('tournaments-back-btn');

        this.profileContainer = document.getElementById('profile-container');
        this.profileAvatarDisplay = document.getElementById('profile-avatar-display');
        this.avatarOptionsGrid = document.getElementById('avatar-options-grid');
        this.avatarOptions = document.querySelectorAll('.avatar-option');
        this.selectedAvatar = null;
        this.updateAvatarBtn = document.getElementById('update-avatar-btn');
        this.profilePasswordForm = document.getElementById('profile-password-form');
        this.profileCurrentPasswordInput = document.getElementById('profile-current-password');
        this.profileNewPasswordInput = document.getElementById('profile-new-password');
        this.profileConfirmPasswordInput = document.getElementById('profile-confirm-password');
        this.profileMessage = document.getElementById('profile-message');
        this.deleteAccountBtn = document.getElementById('delete-account-btn');
        this.deleteAccountModal = document.getElementById('delete-account-modal');
        this.confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        this.cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        this.leaveRoomBtn = document.getElementById('leave-room-btn');
        this.leaveRoomModal = document.getElementById('leave-room-modal');
        this.confirmLeaveBtn = document.getElementById('confirm-leave-btn');
        this.cancelLeaveBtn = document.getElementById('cancel-leave-btn');
        this.leaveRoomMessage = document.getElementById('leave-room-message');
        this.navigationWarningModal = document.getElementById('navigation-warning-modal');
        this.closeNavWarningBtn = document.getElementById('close-nav-warning-btn');
        this.notificationModal = document.getElementById('notification-modal');
        this.notificationMessage = document.getElementById('notification-message');
        this.notificationOkBtn = document.getElementById('notification-ok-btn');
        this.notificationTimeout = null;

        // Password error elements
        this.registerPasswordInput = document.getElementById('register-password');
        this.registerPasswordError = document.getElementById('register-password-error');
        this.registerConfirmPasswordInput = document.getElementById('register-confirm-password');
        this.registerConfirmPasswordError = document.getElementById('register-confirm-password-error');
        this.profileNewPasswordError = document.getElementById('profile-new-password-error');
        this.profileConfirmPasswordError = document.getElementById('profile-confirm-password-error');
        
        // Room info box elements
        this.roomInfoBox = document.getElementById('room-info-box');
        this.roomInfoName = document.getElementById('room-info-name');
        this.roomInfoPlayers = document.getElementById('room-info-players');
        this.roomInfoSpectators = document.getElementById('room-info-spectators');
    }

    setupEventListeners() {
        this.loginForm.addEventListener('submit', (event) => this.submitAuth('login', event));
        this.registerForm.addEventListener('submit', (event) => this.submitAuth('register', event));

        this.authTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchAuthTab(tab.dataset.authTarget));
        });

        this.backToLobbyBtn?.addEventListener('click', () => this.showLobby());
        this.tournamentsBackBtn?.addEventListener('click', () => this.showLobby());
        this.lobbyNavBtn.addEventListener('click', () => {
            if (this.currentRoom && !this.isSpectator) {
                this.showNavigationWarning();
                return;
            }
            // Spectators can navigate freely
            if (this.currentRoom && this.isSpectator) {
                this.leaveRoomAsSpectator();
            }
            this.showLobby();
        });
        this.roomsNavBtn.addEventListener('click', () => {
            if (this.currentRoom && !this.isSpectator) {
                this.showNavigationWarning();
                return;
            }
            // Spectators can navigate freely
            if (this.currentRoom && this.isSpectator) {
                this.leaveRoomAsSpectator();
            }
            this.showView('rooms');
        });
        this.leaderboardNavBtn.addEventListener('click', () => {
            if (this.currentRoom && !this.isSpectator) {
                this.showNavigationWarning();
                return;
            }
            // Spectators can navigate freely
            if (this.currentRoom && this.isSpectator) {
                this.leaveRoomAsSpectator();
            }
            this.showLeaderboard();
        });
        this.tournamentsNavBtn.addEventListener('click', () => this.showTournaments());
        this.userAvatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleUserMenu();
        });
        this.profileNavBtn.addEventListener('click', () => {
            this.closeUserMenu();
            if (this.currentRoom && !this.isSpectator) {
                this.showNavigationWarning();
                return;
            }
            this.showProfile();
        });
        this.logoutBtn.addEventListener('click', () => {
            this.closeUserMenu();
            if (this.currentRoom && !this.isSpectator) {
                this.showNavigationWarning();
                return;
            }
            this.logout();
        });

        // Close user menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.userAvatarBtn && this.userMenuDropdown) {
                if (!this.userAvatarBtn.contains(e.target) && !this.userMenuDropdown.contains(e.target)) {
                    this.closeUserMenu();
                }
            }
        });

        // Profile form handlers
        this.avatarOptions?.forEach(option => {
            option.addEventListener('click', () => this.selectAvatar(option));
        });
        this.updateAvatarBtn?.addEventListener('click', () => this.updateAvatar());
        this.profilePasswordForm?.addEventListener('submit', (e) => this.updatePassword(e));
        this.deleteAccountBtn?.addEventListener('click', () => this.showDeleteAccountModal());
        this.confirmDeleteBtn?.addEventListener('click', () => this.deleteAccount());
        this.cancelDeleteBtn?.addEventListener('click', () => this.hideDeleteAccountModal());
        
        // Leave room handlers
        this.leaveRoomBtn?.addEventListener('click', () => this.showLeaveRoomModal());
        this.confirmLeaveBtn?.addEventListener('click', () => this.leaveRoom());
        this.cancelLeaveBtn?.addEventListener('click', () => this.hideLeaveRoomModal());
        
        // Game info handlers
        this.gameInfoBtn?.addEventListener('click', () => this.showGameInfo());
        this.gameInfoModal?.addEventListener('click', (e) => {
            if (e.target === this.gameInfoModal) {
                this.hideGameInfo();
            }
        });
        const gameInfoCard = document.getElementById('game-info-card');
        if (gameInfoCard) {
            gameInfoCard.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // Navigation warning handlers
        this.closeNavWarningBtn?.addEventListener('click', () => this.hideNavigationWarning());
        
        // Notification modal handlers
        this.notificationOkBtn?.addEventListener('click', () => this.hideNotification());
        this.notificationModal?.addEventListener('click', (e) => {
            if (e.target === this.notificationModal || e.target.classList.contains('notification-overlay')) {
                this.hideNotification();
            }
        });
        
        // Close modals when clicking outside
        this.deleteAccountModal?.addEventListener('click', (e) => {
            if (e.target === this.deleteAccountModal) {
                this.hideDeleteAccountModal();
            }
        });
        this.leaveRoomModal?.addEventListener('click', (e) => {
            if (e.target === this.leaveRoomModal) {
                this.hideLeaveRoomModal();
            }
        });
        this.navigationWarningModal?.addEventListener('click', (e) => {
            if (e.target === this.navigationWarningModal) {
                this.hideNavigationWarning();
            }
        });

        // Password validation listeners
        this.registerPasswordInput?.addEventListener('input', () => this.validateRegisterPassword());
        this.registerPasswordInput?.addEventListener('blur', () => this.validateRegisterPassword());
        this.registerConfirmPasswordInput?.addEventListener('input', () => this.validateRegisterConfirmPassword());
        this.registerConfirmPasswordInput?.addEventListener('blur', () => this.validateRegisterConfirmPassword());
        this.profileNewPasswordInput?.addEventListener('input', () => this.validateProfileNewPassword());
        this.profileNewPasswordInput?.addEventListener('blur', () => this.validateProfileNewPassword());
        this.profileConfirmPasswordInput?.addEventListener('input', () => this.validateProfileConfirmPassword());
        this.profileConfirmPasswordInput?.addEventListener('blur', () => this.validateProfileConfirmPassword());

        // Show password buttons (hold to reveal)
        this.setupShowPasswordButtons();

        this.gameCards.forEach(card => {
            card.addEventListener('click', () => this.selectLobbyGame(card.dataset.game));
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
                this.showRoomNameModal(cardType);
            });
        });

        this.modalCreateBtn.addEventListener('click', () => {
            if (this.pendingGameType) {
                this.createRoom(this.pendingGameType);
                this.hideRoomNameModal();
            }
        });

        this.modalCancelBtn.addEventListener('click', () => {
            this.hideRoomNameModal();
        });

        this.roomNameModal.addEventListener('click', (e) => {
            if (e.target === this.roomNameModal) {
                this.hideRoomNameModal();
            }
        });

        this.modalRoomNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.pendingGameType) {
                this.createRoom(this.pendingGameType);
                this.hideRoomNameModal();
            }
        });
        this.selectLobbyGame(this.selectedLobbyGameType);

        this.playAgainBtn.addEventListener('click', () => {
            if (this.currentRoom && this.socket) {
                this.socket.emit('restartRequest', this.currentRoom);
            }
        });

        // Widget toggle handlers
        this.onlinePlayersToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onlinePlayersOpen) {
                this.closeOnlinePlayers();
            } else {
                this.toggleOnlinePlayers();
            }
        });

        // Close online players when clicking outside
        document.addEventListener('click', (e) => {
            if (this.onlinePlayersOpen && 
                !this.onlinePlayersPopup.contains(e.target) && 
                !this.onlinePlayersToggle.contains(e.target)) {
                this.closeOnlinePlayers();
            }
        });
        
        this.lobbyChatTab.addEventListener('click', () => {
            if (this.lobbyChatOpen) {
                this.closeLobbyChatDrawer();
            } else {
                this.openLobbyChatDrawer();
            }
        });

        if (this.roomChatTab) {
            this.roomChatTab.addEventListener('click', () => {
                if (this.roomChatOpen) {
                    this.closeRoomChatDrawer();
                } else {
                    this.openRoomChatDrawer();
                }
            });
        }

        this.lobbyChatForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const message = this.lobbyChatInput.value.trim();
            if (message) {
                this.sendLobbyChat(message);
                this.lobbyChatInput.value = '';
            }
        });

        this.roomChatForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const message = this.roomChatInput.value.trim();
            if (message) {
                this.sendRoomChat(message);
                this.roomChatInput.value = '';
            }
        });

        this.rpsButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.submitRpsChoice(button.dataset.choice);
            });
        });
        this.memoryGrid?.addEventListener('click', (event) => {
            const card = event.target.closest('.memory-card');
            if (!card) return;
            // Prevent clicking if waiting for second player or game hasn't started
            if (this.gameState && this.gameState.players && this.gameState.players.length < 2) {
                return;
            }
            if (this.gameState && this.gameState.gameStatus === 'waiting') {
                return;
            }
            // Prevent clicking if card is already revealed, matched, or disabled
            if (card.classList.contains('revealed') || card.classList.contains('matched') || card.classList.contains('disabled')) {
                return;
            }
            // Prevent clicking if 2 cards are already flipped (client-side protection)
            const revealedCards = this.memoryGrid.querySelectorAll('.memory-card.revealed:not(.matched)');
            if (revealedCards.length >= 2) {
                return;
            }
            const cardId = Number(card.dataset.id);
            if (!Number.isFinite(cardId)) return;
            // Disable card temporarily to prevent double-clicks
            card.classList.add('disabled');
            this.submitMemoryFlip(cardId);
        });
    }

    async checkStoredToken() {
        if (this.token && this.currentUser) {
            await this.loadUserProfile();
            this.initializeSocket();
            this.showLobby();
        } else {
            this.showView('auth');
        }
    }

    switchAuthTab(target) {
        this.authTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.authTarget === target);
        });
        this.loginForm.classList.toggle('hidden', target !== 'login');
        this.registerForm.classList.toggle('hidden', target !== 'register');
        this.showAuthMessage('');
        // Clear password validation when switching tabs
        if (target === 'login') {
            this.clearPasswordValidation();
        }
    }

    validatePassword(password) {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        
        if (!/[a-zA-Z]/.test(password)) {
            errors.push('Password must contain at least one letter');
        }
        
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        // Check for forbidden special characters
        const forbiddenChars = /[!@#$%^&*(),.'"?/]/;
        if (forbiddenChars.test(password)) {
            errors.push('Password cannot contain special characters (! @ # $ % ^ & * ( ) , . \' " ? /)');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    displayPasswordError(input, errorElement, errors) {
        if (errors.length > 0) {
            input.classList.remove('valid');
            input.classList.add('invalid');
            errorElement.textContent = errors[0]; // Show first error
        } else {
            input.classList.remove('invalid');
            input.classList.add('valid');
            errorElement.textContent = '';
        }
    }

    validateRegisterPassword() {
        if (!this.registerPasswordInput || !this.registerPasswordError) return;
        const password = this.registerPasswordInput.value;
        const validation = this.validatePassword(password);
        this.displayPasswordError(this.registerPasswordInput, this.registerPasswordError, validation.errors);
        return validation.isValid;
    }

    validateRegisterConfirmPassword() {
        if (!this.registerConfirmPasswordInput || !this.registerConfirmPasswordError) return;
        const password = this.registerPasswordInput?.value || '';
        const confirmPassword = this.registerConfirmPasswordInput.value;
        const errors = [];
        
        if (confirmPassword && confirmPassword !== password) {
            errors.push('Passwords do not match');
        }
        
        this.displayPasswordError(this.registerConfirmPasswordInput, this.registerConfirmPasswordError, errors);
        return errors.length === 0;
    }

    validateProfileNewPassword() {
        if (!this.profileNewPasswordInput || !this.profileNewPasswordError) return;
        const password = this.profileNewPasswordInput.value;
        const validation = this.validatePassword(password);
        this.displayPasswordError(this.profileNewPasswordInput, this.profileNewPasswordError, validation.errors);
        return validation.isValid;
    }

    validateProfileConfirmPassword() {
        if (!this.profileConfirmPasswordInput || !this.profileConfirmPasswordError) return;
        const password = this.profileNewPasswordInput?.value || '';
        const confirmPassword = this.profileConfirmPasswordInput.value;
        const errors = [];
        
        if (confirmPassword && confirmPassword !== password) {
            errors.push('Passwords do not match');
        }
        
        this.displayPasswordError(this.profileConfirmPasswordInput, this.profileConfirmPasswordError, errors);
        return errors.length === 0;
    }

    clearPasswordValidation() {
        // Clear register form validation
        if (this.registerPasswordInput) {
            this.registerPasswordInput.classList.remove('invalid', 'valid');
            this.registerPasswordInput.value = '';
        }
        if (this.registerPasswordError) {
            this.registerPasswordError.textContent = '';
        }
        if (this.registerConfirmPasswordInput) {
            this.registerConfirmPasswordInput.classList.remove('invalid', 'valid');
            this.registerConfirmPasswordInput.value = '';
        }
        if (this.registerConfirmPasswordError) {
            this.registerConfirmPasswordError.textContent = '';
        }
    }

    async submitAuth(action, event) {
        event.preventDefault();
        const form = event.target;
        const username = form.querySelector('input[name="username"]').value.trim();
        const password = form.querySelector('input[name="password"]').value;
        const confirmPassword = form.querySelector('input[name="confirmPassword"]')?.value;

        if (!username || !password) {
            this.showAuthMessage('Please fill out all fields.');
            return;
        }

        // Validate password for registration
        if (action === 'register') {
            const passwordValidation = this.validatePassword(password);
            if (!passwordValidation.isValid) {
                this.showAuthMessage(passwordValidation.errors[0]);
                this.displayPasswordError(this.registerPasswordInput, this.registerPasswordError, passwordValidation.errors);
                return;
            }

            if (password !== confirmPassword) {
                this.showAuthMessage('Passwords do not match.');
                this.validateRegisterConfirmPassword();
                return;
            }
        }

        try {
            const response = await fetch(`/api/auth/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (!response.ok) {
                this.showAuthMessage(data.error || 'Authentication failed.');
                return;
            }

            this.afterAuthentication(data);
        } catch (error) {
            console.error('Authentication error:', error);
            this.showAuthMessage('Unable to reach the server.');
        }
    }

    async afterAuthentication(data) {
        this.token = data.token;
        this.currentUser = data.username;
        localStorage.setItem('tictactoe_token', this.token);
        localStorage.setItem('tictactoe_username', this.currentUser);
        this.showAuthMessage('');
        await this.loadUserProfile();
        this.initializeSocket();
        this.showLobby();
    }

    logout() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.token = null;
        this.currentUser = null;
        this.currentRoom = null;
        this.gameState = null;
        this.myRole = null;
        this.isSpectator = false;
        this.disableBeforeUnloadWarning();
        localStorage.removeItem('tictactoe_token');
        localStorage.removeItem('tictactoe_username');
        this.updateLeaveButtonVisibility();
        if (this.roomInfoBox) {
            this.roomInfoBox.classList.add('hidden');
        }
        this.showView('auth');
    }

    initializeSocket() {
        if (!this.token) return;
        if (this.socket) {
            this.socket.off();
            this.socket.disconnect();
        }
        this.socket = io({ auth: { token: this.token } });
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Socket connected');
        });

        this.socket.on('connect_error', (error) => {
            this.handleSocketError(error);
        });

        this.socket.on('lobbyUpdate', (data) => {
            this.rooms = data.rooms || [];
            this.lobbyUsers = data.users || [];
            this.updateLobbyUsers();
            this.updateRoomsList();
        });

        this.socket.on('lobbyMessages', (messages) => {
            this.lobbyMessages = messages || [];
            this.renderLobbyMessages();
        });

        this.socket.on('lobbyMessage', (message) => {
            this.lobbyMessages.push(message);
            if (this.lobbyMessages.length > 120) {
                this.lobbyMessages.shift();
            }
            this.renderLobbyMessages();
        });

        this.socket.on('roomsList', (rooms) => {
            this.rooms = rooms;
            this.updateRoomsList();
            this.updateRoomInfoBox();
        });

        this.socket.on('roomCreated', (data) => {
            this.currentRoom = data.roomId;
            this.currentRoomName = data.roomName || `Room ${data.roomId}`;
            this.myRole = data.player.role;
            this.isSpectator = false;
            this.roomMessages = [];
            this.renderRoomMessages();
            this.setCurrentGameType(data.gameType);
            if (data.gameType === 'rock-paper-scissors') {
                this.rpsScores = { X: 0, O: 0 };
                this.rpsGameOver = false;
                this.rpsChoiceSent = false;
            }
            this.updateLeaveButtonVisibility();
            this.updateRoomInfoBox();
            this.enableBeforeUnloadWarning();
            this.showGame();
        });

        this.socket.on('playersRole', (data) => {
            this.myRole = data.role;
            this.isSpectator = false;
            this.currentRoomName = data.roomName || this.currentRoomName;
            this.setCurrentGameType(data.gameType);
            this.updateChatWidgets();
            if (data.gameType === 'rock-paper-scissors') {
                this.rpsScores = { X: 0, O: 0 };
                this.rpsGameOver = false;
                this.rpsChoiceSent = false;
            }
            this.enableBeforeUnloadWarning();
            this.updateLeaveButtonVisibility();
            this.updateRoomInfoBox();
            this.showGame();
        });

        this.socket.on('joinedAsSpectator', (data) => {
            this.isSpectator = true;
            this.currentRoom = data.room.roomId;
            this.currentRoomName = data.room.roomName || `Room ${data.room.roomId}`;
            this.roomMessages = [];
            this.renderRoomMessages();
            this.setCurrentGameType(data.gameType);
            this.updateChatWidgets();
            this.updateLeaveButtonVisibility();
            this.updateRoomInfoBox();
            this.disableBeforeUnloadWarning();
            this.showGame();
        });

        this.socket.on('startGame', (data) => {
            if (data.gameType === 'rock-paper-scissors') {
                this.rpsScores = { X: 0, O: 0 };
                this.rpsGameOver = false;
                this.rpsChoiceSent = false;
                this.rpsResult = null;
                this.updateRpsPlayerInfo();
                // Ensure buttons are visible when game starts
                if (this.rpsControls) {
                    this.rpsControls.style.display = 'flex';
                    this.rpsControls.classList.remove('hidden');
                }
            } else {
                this.infoText.textContent = `Game started! First turn: ${data.firstTurn}`;
            }
            this.setCurrentGameType(data.gameType);
            this.updateRpsStatus();
            this.renderRpsControls();
        });

        this.socket.on('gameStateUpdate', (gameState) => {
            this.gameState = gameState;
            this.setCurrentGameType(gameState.gameType);
            this.updateGameBoard();
            this.updateGameInfo();
            this.updateRoomInfoBox();
            if (gameState.gameType === 'rock-paper-scissors') {
                this.updateRpsPlayerLabels();
                if (gameState.rpsScores) {
                    this.rpsScores = gameState.rpsScores;
                    this.updateRpsScores();
                }
                this.rpsGameOver = gameState.gameStatus === 'finished';
                this.updateRpsStatus();
                this.renderRpsControls();
            } else if (gameState.gameType === 'memory-match') {
                this.renderMemoryBoard(gameState.memoryState);
            } else if (gameState.gameType === 'tic-tac-toe') {
                this.updateTttPlayerInfo();
            } else if (this.memoryStage) {
                this.memoryStage.classList.add('hidden');
            }
        });

        this.socket.on('restartGame', (data) => {
            this.infoText.textContent = `New game! First turn: ${data.firstTurn}`;
            this.setCurrentGameType(data.gameType);
        });

        this.socket.on('playerDisconnected', (data) => {
            if (data.forceLeave) {
                // Opponent left during game - force leave and redirect to lobby
                // Store spectator status before resetting
                const wasSpectator = this.isSpectator;
                
                this.currentRoom = null;
                this.gameState = null;
                this.myRole = null;
                this.isSpectator = false;
                this.disableBeforeUnloadWarning();
                this.updateChatWidgets();
                
                // Show appropriate message based on whether user is a player or spectator
                let message;
                if (wasSpectator) {
                    message = `${data.username} left the game<br><br>The winner is ${data.winner}! 🎉<br><br>Redirecting to lobby...`;
                } else {
                    message = `${data.username} left the game<br><br>You win! 🎉<br><br>Redirecting to lobby...`;
                }
                
                this.showNotification(message, () => {
                    this.showLobby();
                }, 3000); // Auto-close after 3 seconds
            } else {
                this.showNotification(`${data.username} disconnected from the game`);
            }
        });

        this.socket.on('gameFinished', (data) => {
            if (data.forceLeave && this.isSpectator) {
                // Game ended - redirect spectators to lobby after 3 seconds
                // Store spectator status before resetting
                const wasSpectator = this.isSpectator;
                
                this.currentRoom = null;
                this.gameState = null;
                this.myRole = null;
                this.isSpectator = false;
                this.disableBeforeUnloadWarning();
                this.updateChatWidgets();
                
                // Show message and redirect to lobby
                const winnerName = data.winner || 'Unknown';
                let message;
                if (winnerName === 'Draw') {
                    message = `Game finished!<br><br>The game ended in a draw!<br><br>Redirecting to lobby...`;
                } else {
                    message = `Game finished!<br><br>The winner is ${winnerName}! 🎉<br><br>Redirecting to lobby...`;
                }
                
                this.showNotification(message, () => {
                    this.showLobby();
                }, 3000); // Auto-close after 3 seconds
            }
        });

        this.socket.on('roomMessage', (message) => {
            if (message.roomId !== this.currentRoom) return;
            this.roomMessages.push(message);
            if (this.roomMessages.length > 100) {
                this.roomMessages.shift();
            }
            this.renderRoomMessages();
        });

        this.socket.on('memoryResult', ({ result }) => {
            if (!result) return;
            // Re-enable all cards after result
            if (this.memoryGrid) {
                this.memoryGrid.querySelectorAll('.memory-card.disabled').forEach(card => {
                    card.classList.remove('disabled');
                });
            }
            if (result.error) {
                // Show error but don't update status
                return;
            }
            if (result.winnerRole) {
                // Hide status for all users (winner info is shown at the top banner)
                if (this.memoryStatus) {
                    this.memoryStatus.style.display = 'none';
                }
                this.hideMemoryMatchMessage();
            } else if (result.match) {
                // Show temporary fade-away message
                this.showMemoryMatchMessage('Match found! Keep going.');
            } else if (result.flip) {
                this.hideMemoryMatchMessage();
            }
        });

        this.socket.on('tttRoundResult', (data) => {
            // Show temporary message for round result
            if (data.roundWinner === 'draw') {
                this.showMemoryMatchMessage('Round Draw! Next round...');
            } else {
                const isWinner = data.roundWinner === this.myRole;
                if (this.isSpectator) {
                    const winnerPlayer = this.gameState?.players?.find(p => p.role === data.roundWinner);
                    const winnerName = winnerPlayer?.username || data.roundWinner;
                    this.showMemoryMatchMessage(`${winnerName} wins the round!`);
                } else {
                    this.showMemoryMatchMessage(isWinner ? 'You win the round! 🎉' : 'Opponent wins the round!');
                }
            }
            setTimeout(() => {
                this.hideMemoryMatchMessage();
            }, 2000);
        });

        this.socket.on('rpsResult', (data) => {
            this.rpsResult = data;
            // Reset choice sent flag after result is received
            this.rpsChoiceSent = false;
            if (data.scores) {
                this.rpsScores = data.scores;
                this.updateRpsScores();
            }
            if (data.gameOver) {
                this.rpsGameOver = true;
            } else {
                // If game is not over, reset for next round after showing result
                // Clear the result after 3 seconds to allow next round
                setTimeout(() => {
                    if (!this.rpsGameOver && this.gameState?.gameStatus === 'in-progress') {
                        this.rpsResult = null;
                        this.updateRpsIconsPlaceholder();
                        this.updateRpsStatus();
                        this.renderRpsControls();
                    }
                }, 3000);
            }
            this.renderRpsResult();
            this.updateRpsStatus();
            this.renderRpsControls();
        });

        this.socket.on('rpsStatus', (status) => {
            if (status.waiting && this.currentGameType === 'rock-paper-scissors') {
                this.updateRpsStatus();
            }
        });

        this.socket.on('scoreboardData', (data) => {
            this.updateScoreboard(data);
        });

        this.socket.on('error', (error) => {
            this.showNotification(error);
        });

        this.socket.on('moveError', (error) => {
            this.showNotification(error);
        });
    }

    handleSocketError(error) {
        if (error && error.message) {
            this.showAuthMessage(error.message);
        } else {
            this.showAuthMessage('Socket connection failed.');
        }
        this.logout();
    }

    showRoomNameModal(gameType) {
        this.pendingGameType = gameType;
        this.modalRoomNameInput.value = '';
        this.roomNameModal.classList.remove('hidden');
        this.modalRoomNameInput.focus();
    }

    hideRoomNameModal() {
        this.roomNameModal.classList.add('hidden');
        this.pendingGameType = null;
    }

    createRoom(gameType) {
        const roomName = this.modalRoomNameInput.value.trim() || `Room ${Math.floor(Math.random() * 1000)}`;
        const normalizedType = (gameType || this.selectedLobbyGameType || 'tic-tac-toe')
            .toLowerCase()
            .replace(/_/g, '-');
        if (this.socket) {
            this.socket.emit('createRoom', { roomName, gameType: normalizedType });
        }
        this.modalRoomNameInput.value = '';
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

    joinRoom(roomId, asSpectator = false) {
        if (!this.socket || !roomId) return;
        this.currentRoom = roomId;
        this.socket.emit('joinRoom', { roomId, asSpectator }, (error) => {
            if (error) {
                this.showNotification(`Failed to join room: ${error}`);
                this.currentRoom = null;
                this.updateChatWidgets();
            } else {
                this.updateChatWidgets();
            }
        });
    }

    makeMove(cellIndex) {
        if (
            !this.socket ||
            !this.currentRoom ||
            !this.gameState ||
            this.gameState.gameStatus !== 'in-progress' ||
            this.gameState.currentPlayer !== this.myRole ||
            this.isSpectator
        ) {
            return;
        }

        if (this.currentGameType !== 'tic-tac-toe') {
            return;
        }

        if (this.gameState.board[cellIndex]) {
            return;
        }

        this.socket.emit('makeMove', {
            roomId: this.currentRoom,
            cellId: cellIndex,
            move: this.myRole
        });
    }

    showView(viewName) {
        document.querySelectorAll('.view').forEach(view => view.style.display = 'none');
        const targetView = document.getElementById(`${viewName}-container`);
        if (targetView) {
            targetView.style.display = 'block';
        }
        this.currentView = viewName;
        this.updateNavigation();
        this.updateChatWidgets();

        if (viewName === 'lobby') {
            this.socket && this.socket.emit('getRooms');
        } else if (viewName === 'rooms') {
            this.socket && this.socket.emit('getRooms');
        } else if (viewName === 'leaderboard') {
            this.socket && this.socket.emit('getScoreboard');
        }
    }

    showLobby() {
        this.currentRoom = null;
        this.currentRoomName = null;
        this.gameState = null;
        this.myRole = null;
        this.isSpectator = false;
        this.rpsResult = null;
        this.rpsChoiceSent = false;
        this.rpsScores = { X: 0, O: 0 };
        this.rpsGameOver = false;
        this.disableBeforeUnloadWarning();
        this.updateChatWidgets();
        this.updateLeaveButtonVisibility();
        this.updateRoomInfoBox();
        this.showView('lobby');
    }

    showGame() {
        this.roomMessages = [];
        this.renderRoomMessages();
        this.updateChatWidgets();
        this.updateLeaveButtonVisibility();
        this.showView('game');
    }

    updateLeaveButtonVisibility() {
        // Hide leave game button for spectators
        if (this.leaveRoomBtn) {
            if (this.isSpectator) {
                this.leaveRoomBtn.style.display = 'none';
            } else {
                this.leaveRoomBtn.style.display = 'block';
            }
        }
    }

    updateRoomInfoBox() {
        if (!this.roomInfoBox) return;

        // Show box only when in a room
        if (this.currentRoom) {
            this.roomInfoBox.classList.remove('hidden');
            
            // Update room name
            if (this.roomInfoName) {
                const roomName = this.currentRoomName || `Room ${this.currentRoom}`;
                this.roomInfoName.textContent = roomName;
                this.roomInfoName.title = roomName; // Tooltip for full text on hover
            }
            
            // Update player names
            if (this.roomInfoPlayers) {
                if (this.gameState && this.gameState.players && this.gameState.players.length > 0) {
                    const playerNames = this.gameState.players.map(p => p.username).join(', ');
                    const playersText = `Players: ${playerNames}`;
                    this.roomInfoPlayers.textContent = playersText;
                    this.roomInfoPlayers.title = playersText; // Tooltip for full text on hover
                } else {
                    this.roomInfoPlayers.textContent = 'Players: -';
                    this.roomInfoPlayers.title = '';
                }
            }
            
            // Update spectator count
            if (this.roomInfoSpectators) {
                // Try to get spectator count from rooms list if available
                let spectatorCount = 0;
                if (this.rooms && this.currentRoom) {
                    const room = this.rooms.find(r => r.roomId === this.currentRoom);
                    if (room) {
                        spectatorCount = room.spectatorCount || 0;
                    }
                }
                this.roomInfoSpectators.textContent = `Spectators: ${spectatorCount}`;
            }
        } else {
            // Hide box when not in a room
            this.roomInfoBox.classList.add('hidden');
        }
    }

    leaveRoomAsSpectator() {
        if (!this.currentRoom || !this.socket || !this.isSpectator) {
            return;
        }
        // Spectators can leave without confirmation
        this.socket.emit('leaveRoom', { roomId: this.currentRoom });
        this.currentRoom = null;
        this.currentRoomName = null;
        this.gameState = null;
        this.myRole = null;
        this.isSpectator = false;
        this.disableBeforeUnloadWarning();
        this.updateChatWidgets();
        this.updateRoomInfoBox();
    }

    showLeaderboard() {
        this.showView('leaderboard');
    }

    showTournaments() {
        this.showView('tournaments');
    }

    showProfile() {
        this.loadProfileData();
        this.showView('profile');
    }

    toggleUserMenu() {
        this.userMenuOpen = !this.userMenuOpen;
        this.userMenuDropdown.classList.toggle('hidden', !this.userMenuOpen);
    }

    closeUserMenu() {
        this.userMenuOpen = false;
        this.userMenuDropdown.classList.add('hidden');
    }

    async loadUserProfile() {
        if (!this.token) return;
        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            if (response.ok) {
                this.userProfile = await response.json();
                this.updateUserAvatarDisplay();
            }
        } catch (error) {
            console.error('Failed to load user profile:', error);
        }
    }

    updateUserAvatarDisplay() {
        if (this.userProfile && this.userAvatarDisplay) {
            this.userAvatarDisplay.textContent = this.userProfile.avatar || '👤';
        }
        if (this.userProfile && this.profileAvatarDisplay) {
            this.profileAvatarDisplay.textContent = this.userProfile.avatar || '👤';
        }
        if (this.userProfile && this.userUsernameDisplay) {
            this.userUsernameDisplay.textContent = this.userProfile.username || '';
        }
    }

    loadProfileData() {
        if (this.userProfile) {
            if (this.profileAvatarDisplay) {
                this.profileAvatarDisplay.textContent = this.userProfile.avatar || '👤';
            }
            // Highlight the current avatar in the options
            if (this.userProfile.avatar && this.avatarOptions) {
                this.avatarOptions.forEach(option => {
                    if (option.dataset.avatar === this.userProfile.avatar) {
                        option.classList.add('selected');
                    } else {
                        option.classList.remove('selected');
                    }
                });
            }
        }
    }

    selectAvatar(optionElement) {
        // Remove selected class from all options
        this.avatarOptions?.forEach(opt => opt.classList.remove('selected'));
        
        // Add selected class to clicked option
        optionElement.classList.add('selected');
        this.selectedAvatar = optionElement.dataset.avatar;
    }

    async updateAvatar() {
        if (!this.token) return;
        if (!this.selectedAvatar) {
            this.showProfileMessage('Please select an avatar.', 'error');
            return;
        }
        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ avatar: this.selectedAvatar })
            });
            const data = await response.json();
            if (response.ok) {
                this.userProfile = data;
                this.updateUserAvatarDisplay();
                this.selectedAvatar = null;
                // Clear selection
                this.avatarOptions?.forEach(opt => opt.classList.remove('selected'));
                this.showProfileMessage('Avatar updated successfully!', 'success');
            } else {
                this.showProfileMessage(data.error || 'Failed to update avatar.', 'error');
            }
        } catch (error) {
            this.showProfileMessage('Unable to reach the server.', 'error');
        }
    }

    async updatePassword(event) {
        event.preventDefault();
        if (!this.token) return;
        const currentPassword = this.profileCurrentPasswordInput.value;
        const newPassword = this.profileNewPasswordInput.value;
        const confirmPassword = this.profileConfirmPasswordInput.value;
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showProfileMessage('Please fill out all password fields.', 'error');
            return;
        }

        // Validate new password
        const passwordValidation = this.validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            this.showProfileMessage(passwordValidation.errors[0], 'error');
            this.displayPasswordError(this.profileNewPasswordInput, this.profileNewPasswordError, passwordValidation.errors);
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showProfileMessage('New passwords do not match.', 'error');
            this.validateProfileConfirmPassword();
            return;
        }
        try {
            const response = await fetch('/api/auth/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await response.json();
            if (response.ok) {
                this.profileCurrentPasswordInput.value = '';
                this.profileNewPasswordInput.value = '';
                this.profileConfirmPasswordInput.value = '';
                this.showProfileMessage('Password updated successfully!', 'success');
            } else {
                this.showProfileMessage(data.error || 'Failed to update password.', 'error');
            }
        } catch (error) {
            this.showProfileMessage('Unable to reach the server.', 'error');
        }
    }

    showProfileMessage(message, type = 'info') {
        if (!this.profileMessage) return;
        this.profileMessage.textContent = message;
        this.profileMessage.className = `profile-message ${type}`;
        setTimeout(() => {
            this.profileMessage.textContent = '';
            this.profileMessage.className = 'profile-message';
        }, 5000);
    }

    showDeleteAccountModal() {
        if (this.deleteAccountModal) {
            this.deleteAccountModal.classList.remove('hidden');
        }
    }

    hideDeleteAccountModal() {
        if (this.deleteAccountModal) {
            this.deleteAccountModal.classList.add('hidden');
        }
    }

    showLeaveRoomModal() {
        if (!this.leaveRoomModal) return;
        
        // If game is finished, skip modal and go directly to lobby
        if (this.gameState && this.gameState.gameStatus === 'finished') {
            this.leaveRoom();
            return;
        }
        
        // If user is alone in the room (only 1 player), skip modal and go directly to lobby
        if (this.gameState && this.gameState.players && this.gameState.players.length === 1) {
            this.leaveRoom();
            return;
        }
        
        // Update message based on game state
        if (this.gameState && this.gameState.gameStatus === 'in-progress') {
            this.leaveRoomMessage.textContent = 'If you leave now, your opponent will win and your stats will be updated. You will be counted as the loser.';
            this.leaveRoomMessage.style.display = 'block';
        } else {
            this.leaveRoomMessage.textContent = '';
            this.leaveRoomMessage.style.display = 'none';
        }
        
        this.leaveRoomModal.classList.remove('hidden');
    }

    hideLeaveRoomModal() {
        if (this.leaveRoomModal) {
            this.leaveRoomModal.classList.add('hidden');
        }
    }

    showNavigationWarning() {
        if (this.navigationWarningModal) {
            this.navigationWarningModal.classList.remove('hidden');
        }
    }

    hideNavigationWarning() {
        if (this.navigationWarningModal) {
            this.navigationWarningModal.classList.add('hidden');
        }
    }

    setupBeforeUnloadWarning() {
        this.beforeUnloadHandler = (e) => {
            // Only warn if user is in a game as a player (not spectator)
            if (this.currentRoom && !this.isSpectator) {
                // Modern browsers require returnValue to be set
                e.preventDefault();
                e.returnValue = ''; // Chrome requires returnValue to be set
                return ''; // Some browsers require a return value
            }
        };
    }

    enableBeforeUnloadWarning() {
        window.addEventListener('beforeunload', this.beforeUnloadHandler);
    }

    disableBeforeUnloadWarning() {
        window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    }

    showNotification(message, callback = null, autoCloseDelay = null) {
        if (!this.notificationModal || !this.notificationMessage) return;
        
        // Clear any existing timeout
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
            this.notificationTimeout = null;
        }
        
        // Always use innerHTML to support HTML content like <br> tags
        this.notificationMessage.innerHTML = message;
        
        this.notificationModal.classList.remove('hidden');
        // Store callback to execute when user clicks OK
        this.notificationCallback = callback;
        
        // Auto-close after delay if specified
        if (autoCloseDelay && autoCloseDelay > 0) {
            this.notificationTimeout = setTimeout(() => {
                this.hideNotification();
            }, autoCloseDelay);
        }
    }

    hideNotification() {
        if (this.notificationModal) {
            // Clear timeout if exists
            if (this.notificationTimeout) {
                clearTimeout(this.notificationTimeout);
                this.notificationTimeout = null;
            }
            
            this.notificationModal.classList.add('hidden');
            // Execute callback if provided
            if (this.notificationCallback) {
                const cb = this.notificationCallback;
                this.notificationCallback = null;
                cb();
            }
        }
    }

    leaveRoom() {
        if (!this.currentRoom || !this.socket) {
            this.hideLeaveRoomModal();
            return;
        }

        // Emit leave room event
        this.socket.emit('leaveRoom', { roomId: this.currentRoom });
        
        // Clear room state
        this.currentRoom = null;
        this.currentRoomName = null;
        this.gameState = null;
        this.myRole = null;
        this.isSpectator = false;
        this.disableBeforeUnloadWarning();
        this.updateChatWidgets();
        this.updateLeaveButtonVisibility();
        this.updateRoomInfoBox();
        
        // Hide modal and go to lobby
        this.hideLeaveRoomModal();
        this.showLobby();
    }

    async deleteAccount() {
        if (!this.token) return;
        
        try {
            const response = await fetch('/api/auth/account', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            if (response.ok) {
                this.hideDeleteAccountModal();
                this.showNotification('Your account has been deleted successfully.', () => {
                    this.logout();
                });
            } else {
                this.showProfileMessage(data.error || 'Failed to delete account.', 'error');
                this.hideDeleteAccountModal();
            }
        } catch (error) {
            this.showProfileMessage('Unable to reach the server.', 'error');
            this.hideDeleteAccountModal();
        }
    }

    updateNavigation() {
        if (this.currentView === 'auth') {
            this.navContainer.style.display = 'none';
        } else {
            this.navContainer.style.display = 'flex';
        }
    }

    updateRoomsList() {
        this.roomsList.innerHTML = '';

        if (!this.rooms || this.rooms.length === 0) {
            this.roomsList.innerHTML = '<div class="no-rooms">No active rooms. Create one to get started!</div>';
            return;
        }

        this.rooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.className = 'room-item';
            const canJoinAsPlayer = room.playerCount < 2 && room.gameStatus === 'waiting';

            roomElement.innerHTML = `
                <div class="room-info">
                    <h3>${room.roomName}</h3>
                    <p>Game: ${this.formatGameType(room.gameType)} | Players: ${room.playerCount}/2 | Spectators: ${room.spectatorCount} | Status: ${room.gameStatus}</p>
                </div>
                <div class="room-actions">
                    ${canJoinAsPlayer ? `<button onclick="app.joinRoom(${room.roomId}, false)" class="join-btn">Join as Player</button>` : `<button disabled class="join-btn disabled">Room Full</button>`}
                    <button onclick="app.joinRoom(${room.roomId}, true)" class="spectate-btn">Join as Spectator</button>
                </div>
            `;

            this.roomsList.appendChild(roomElement);
        });
    }

    updateGameBoard() {
        if (!this.gameState || !this.gameBoard) return;
        if (this.currentGameType === 'tic-tac-toe') {
            this.renderTicTacToeGrid();
        }

        const cells = this.gameBoard.querySelectorAll('.cells');
        cells.forEach((cell, index) => {
            cell.textContent = this.gameState.board[index] || '';
        });
    }

    updateGameInfo() {
        if (!this.gameState) return;

        // Special handling for Rock Paper Scissors
        if (this.currentGameType === 'rock-paper-scissors') {
            this.updateRpsStatus();
            return;
        }

        // Special handling for Memory Match
        if (this.currentGameType === 'memory-match') {
            this.updateMemoryStatus();
            return;
        }

        let finishedMessage;
        if (this.gameState.winner === 'draw') {
            finishedMessage = 'Game ended in a draw!';
        } else if (this.isSpectator) {
            // For spectators, show the winner's name
            const winnerPlayer = this.gameState.players?.find(p => p.role === this.gameState.winner);
            const winnerName = winnerPlayer?.username || this.gameState.winner;
            finishedMessage = `The winner is ${winnerName}`;
        } else {
            // For players, show "You win!" or "You lose!"
            finishedMessage = this.gameState.winner === this.myRole ? 'You win!' : 'You lose!';
        }

        // Check if waiting for second player
        const hasTwoPlayers = this.gameState.players && this.gameState.players.length === 2;
        
        const statusMessages = {
            waiting: hasTwoPlayers ? 'Waiting for players...' : 'Waiting for opponent...',
            'in-progress': this.isSpectator ? 'Watching Game' : (this.gameState.currentPlayer === this.myRole ? 'Your turn!' : "Opponent's turn"),
            finished: finishedMessage
        };

        const message = statusMessages[this.gameState.gameStatus] || 'Game in progress';
        this.infoText.textContent = message;
        
        // Add purple background class for "Your turn!"
        if (this.infoText && this.infoText.parentElement) {
            if (message === 'Your turn!') {
                this.infoText.parentElement.classList.add('your-turn-active');
            } else {
                this.infoText.parentElement.classList.remove('your-turn-active');
            }
        }
        
        // Hide play again button (functionality to be added later)
        this.playAgainBtn.style.display = 'none';
    }

    updateMemoryStatus() {
        if (!this.gameState || this.currentGameType !== 'memory-match') return;

        let message = '';
        let isYourTurn = false;

        // Check if waiting for second player
        const hasTwoPlayers = this.gameState.players && this.gameState.players.length === 2;

        // Spectators always see "Watching Game"
        if (this.isSpectator) {
            message = 'Watching Game';
        } else if (!hasTwoPlayers) {
            // Only one player - waiting for opponent to join
            message = 'Waiting for opponent...';
        } else if (this.gameState.gameStatus === 'waiting') {
            // Two players but game hasn't started yet
            message = 'Waiting for players...';
        } else if (this.gameState.gameStatus === 'finished') {
            // Game finished
            const winner = this.gameState.winner;
            if (winner === 'draw') {
                message = 'Game Over: Draw!';
            } else {
                const isWinner = winner === this.myRole;
                message = isWinner ? 'Game Over: You Win!' : 'Game Over: You Lose!';
            }
        } else if (this.gameState.gameStatus === 'in-progress') {
            // Game in progress - check whose turn it is
            const turnRole = this.gameState.memoryState?.turnRole;
            if (turnRole === this.myRole) {
                message = 'Your turn!';
                isYourTurn = true;
            } else {
                message = "Opponent's turn";
            }
        } else {
            message = 'Game in progress';
        }

        if (this.infoText) {
            this.infoText.textContent = message;
        }

        // Add purple background class for "Your turn!"
        if (this.infoText && this.infoText.parentElement) {
            if (isYourTurn && this.gameState.gameStatus === 'in-progress') {
                this.infoText.parentElement.classList.add('your-turn-active');
            } else {
                this.infoText.parentElement.classList.remove('your-turn-active');
            }
        }
    }

    updateRpsStatus() {
        if (!this.gameState || this.currentGameType !== 'rock-paper-scissors') return;

        let message = '';
        let isYourTurn = false;

        // Spectators always see "Watching Game"
        if (this.isSpectator) {
            message = 'Watching Game';
        } else if (this.gameState.gameStatus === 'waiting') {
            message = 'Waiting for an opponent…';
        } else if (this.gameState.gameStatus === 'finished' || this.rpsGameOver) {
            const winner = this.gameState.winner;
            if (winner === 'draw') {
                message = 'Game Over: Draw!';
            } else {
                const isWinner = winner === this.myRole;
                message = isWinner ? 'Game Over: You Win!' : 'Game Over: You Lose!';
            }
        } else if (this.rpsChoiceSent) {
            // Player has already chosen, waiting for opponent
            message = 'Waiting for opponent…';
        } else {
            // Game is in progress and player hasn't chosen yet
            // In RPS, both players can choose simultaneously, so if player hasn't chosen, it's their turn
            message = 'Your turn!';
            isYourTurn = true;
        }

        if (this.infoText) {
            this.infoText.textContent = message;
        }

        // Add purple background class for "Your turn!"
        if (this.infoText && this.infoText.parentElement) {
            if (isYourTurn && this.gameState.gameStatus === 'in-progress' && !this.rpsGameOver) {
                this.infoText.parentElement.classList.add('your-turn-active');
            } else {
                this.infoText.parentElement.classList.remove('your-turn-active');
            }
        }
    }

    updateRpsScores() {
        // Use the new player info update function
        this.updateRpsPlayerInfo();
    }

    updateRpsPlayerLabels() {
        // Use the new player info update function
        this.updateRpsPlayerInfo();
    }


    sendLobbyChat(message) {
        if (!this.socket || !message) return;
        this.socket.emit('lobbyChatMessage', { message });
    }

    sendRoomChat(message) {
        if (!this.socket || !message || !this.currentRoom) return;
        this.socket.emit('roomChatMessage', { roomId: this.currentRoom, message });
    }

    updateLobbyUsers() {
        if (!this.lobbyUsersList) return;
        this.lobbyUsersList.innerHTML = '';
        this.lobbyUsers.forEach(username => {
            const userRow = document.createElement('div');
            userRow.className = 'user-item';
            userRow.textContent = username;
            this.lobbyUsersList.appendChild(userRow);
        });
    }

    renderLobbyMessages() {
        if (!this.lobbyChatList) return;
        this.lobbyChatList.innerHTML = '';
        this.lobbyMessages.forEach(({ username, message, timestamp }) => {
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message';
            messageElement.innerHTML = `<strong>${username}</strong><span>${this.formatTimestamp(timestamp)}</span><p>${message}</p>`;
            this.lobbyChatList.appendChild(messageElement);
        });
        this.lobbyChatList.scrollTop = this.lobbyChatList.scrollHeight;
    }

    renderRoomMessages() {
        if (!this.roomChatList) return;
        this.roomChatList.innerHTML = '';
        this.roomMessages.forEach(({ username, message, timestamp }) => {
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message';
            messageElement.innerHTML = `<strong>${username}</strong><span>${this.formatTimestamp(timestamp)}</span><p>${message}</p>`;
            this.roomChatList.appendChild(messageElement);
        });
        this.roomChatList.scrollTop = this.roomChatList.scrollHeight;
    }

    formatTimestamp(value) {
        const date = new Date(value || Date.now());
        return date.toLocaleTimeString();
    }

    formatGameType(type) {
        if (!type) return 'Tic Tac Toe';
        return type
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    }

    setCurrentGameType(type) {
        const rawGameType = typeof type === 'string' ? type : 'tic-tac-toe';
        this.currentGameType = rawGameType.toLowerCase().replace(/_/g, '-');
        if (this.roomGameTypeDisplay) {
            this.roomGameTypeDisplay.textContent = `Game: ${this.formatGameType(this.currentGameType)}`;
        }
        this.renderGameModeMessage();
        this.renderActiveGameLayout();
        this.updateGameInfoContent();
    }

    renderGameModeMessage() {
        if (!this.gameModeMessage || !this.gameBoard) return;
        const isTicTacToe = this.currentGameType === 'tic-tac-toe';
        if (isTicTacToe) {
            this.gameModeMessage.textContent = 'Playing Tic Tac Toe';
        } else {
            this.gameModeMessage.textContent = `This room runs ${this.formatGameType(this.currentGameType)}. Tic Tac Toe controls are disabled until the selected game is implemented.`;
        }
        this.gameBoard.style.pointerEvents = isTicTacToe ? 'auto' : 'none';
        this.gameBoard.style.filter = isTicTacToe ? 'none' : 'grayscale(0.7)';
        this.renderRpsControls();
    }

    renderActiveGameLayout() {
        const type = this.currentGameType;
        switch (type) {
            case 'tic-tac-toe':
                this.setElementVisibility(this.tttStage, true);
                this.setElementVisibility(this.gameBoard, true);
                this.setElementVisibility(this.rpsStage, false);
                this.setElementVisibility(this.rpsControls, false);
                this.setElementVisibility(this.rpsResultDisplay, false);
                this.setElementVisibility(this.memoryStage, false);
                this.renderTicTacToeGrid();
                this.updateTttPlayerInfo();
                break;
            case 'rock-paper-scissors':
                this.setElementVisibility(this.tttStage, false);
                this.setElementVisibility(this.gameBoard, false);
                this.setElementVisibility(this.rpsStage, true);
                this.setElementVisibility(this.memoryStage, false);
                // Ensure rps-controls is visible (it's inside rps-stage)
                if (this.rpsControls) {
                    this.rpsControls.style.display = 'flex';
                    this.rpsControls.classList.remove('hidden');
                }
                this.updateRpsPlayerInfo();
                this.updateRpsStatus();
                this.renderRpsControls();
                break;
            case 'memory-match':
                this.setElementVisibility(this.tttStage, false);
                this.setElementVisibility(this.gameBoard, false);
                this.setElementVisibility(this.rpsStage, false);
                this.setElementVisibility(this.rpsControls, false);
                this.setElementVisibility(this.rpsResultDisplay, false);
                this.setElementVisibility(this.memoryStage, true);
                // Render memory board if state exists
                if (this.gameState && this.gameState.memoryState) {
                    this.renderMemoryBoard(this.gameState.memoryState);
                } else {
                    // Show empty board if no state yet
                    this.renderMemoryBoard(null);
                }
                break;
            default:
                this.setElementVisibility(this.gameBoard, false);
                this.setElementVisibility(this.rpsStage, false);
                this.setElementVisibility(this.rpsControls, false);
                this.setElementVisibility(this.rpsResultDisplay, false);
                this.setElementVisibility(this.memoryStage, false);
        }
    }

    getGameRules(gameType) {
        const rules = {
            'tic-tac-toe': {
                title: 'Tic Tac Toe',
                rules: `
                    <h3>How to Play:</h3>
                    <ul>
                        <li>Players take turns placing X or O on a 3×3 grid</li>
                        <li>The first player to get 3 in a row (horizontal, vertical, or diagonal) wins the round</li>
                        <li>If all 9 squares are filled with no winner, it's a draw</li>
                        <li>First player to win 3 rounds wins the game</li>
                    </ul>
                `
            },
            'rock-paper-scissors': {
                title: 'Rock Paper Scissors',
                rules: `
                    <h3>How to Play:</h3>
                    <ul>
                        <li>Both players choose Rock, Paper, or Scissors simultaneously</li>
                        <li>Rock beats Scissors, Scissors beats Paper, Paper beats Rock</li>
                        <li>First player to win 5 rounds wins the game</li>
                    </ul>
                `
            },
            'memory-match': {
                title: 'Memory Match',
                rules: `
                    <h3>How to Play:</h3>
                    <ul>
                        <li>Flip two cards to find matching pairs</li>
                        <li>If the cards match, they stay face up</li>
                        <li>If they don't match, they flip back</li>
                        <li>The player who finds the most pairs wins</li>
                    </ul>
                `
            }
        };
        return rules[gameType] || rules['tic-tac-toe'];
    }

    updateGameInfoContent() {
        if (!this.gameInfoTitle || !this.gameInfoContent) return;
        const gameRules = this.getGameRules(this.currentGameType);
        this.gameInfoTitle.textContent = gameRules.title;
        this.gameInfoContent.innerHTML = gameRules.rules;
    }

    showGameInfo() {
        if (this.gameInfoModal) {
            this.updateGameInfoContent();
            this.gameInfoModal.classList.remove('hidden');
        }
    }

    hideGameInfo() {
        if (this.gameInfoModal) {
            this.gameInfoModal.classList.add('hidden');
        }
    }

    renderTicTacToeGrid() {
        if (!this.gameBoard || this.ticTacToeGridInitialized) return;
        this.gameBoard.innerHTML = '';
        let cellIdCounter = 0;

        for (let row = 0; row < 3; row++) {
            const rowElement = document.createElement('div');
            rowElement.className = 'rows';

            for (let col = 0; col < 3; col++) {
                const currentCellId = cellIdCounter++;
                const cellEl = document.createElement('div');
                cellEl.className = 'cells';
                cellEl.id = `${currentCellId}`;
                cellEl.addEventListener('click', () => this.makeMove(currentCellId));
                rowElement.appendChild(cellEl);
            }

            this.gameBoard.appendChild(rowElement);
        }

        this.ticTacToeGridInitialized = true;
        this.updateGameBoard();
    }

    setElementVisibility(element, visible) {
        if (!element) return;
        element.classList.toggle('hidden', !visible);
        if (visible) {
            element.style.removeProperty('display');
        } else {
            element.style.display = 'none';
        }
    }

    renderRpsControls() {
        if (!this.rpsControls) return;
        const show = this.currentGameType === 'rock-paper-scissors';
        // Don't hide rps-controls - it's inside rps-stage which is already controlled
        // Just ensure it's visible when RPS is active
        if (show) {
            this.rpsControls.style.display = 'flex';
            this.rpsControls.classList.remove('hidden');
        } else {
            this.rpsControls.classList.add('hidden');
        }
        
        // Disable buttons if:
        // - Not RPS game
        // - Choice already sent (waiting for opponent)
        // - Game is over
        // - Waiting for opponent (only one player)
        // - Not player's turn (shouldn't happen in RPS but safety check)
        const shouldDisable = !show || 
                              this.rpsChoiceSent || 
                              this.rpsGameOver || 
                              this.gameState?.gameStatus === 'waiting' ||
                              this.gameState?.gameStatus === 'finished' ||
                              this.isSpectator;
        
        this.rpsButtons.forEach(button => {
            button.disabled = shouldDisable;
        });
        
        if (show) {
            this.renderRpsResult();
        } else if (this.rpsResultDisplay) {
            this.rpsResultDisplay.textContent = '';
        }
    }

    renderRpsResult() {
        if (!this.rpsResultDisplay) return;
        if (this.currentGameType !== 'rock-paper-scissors') {
            this.rpsResultDisplay.textContent = '';
            return;
        }

        if (!this.rpsResult) {
            this.updateRpsIconsPlaceholder();
            return;
        }

        const { choices, winnerRole, winnerUsername, round, gameOver, gameWinner } = this.rpsResult;
        
        // Always show X on left and O on right to match screen layout
        // Left side of screen = Player X, Right side of screen = Player O
        const leftChoice = choices.X;
        const rightChoice = choices.O;
        
        if (this.rpsPlayerIcon && leftChoice) {
            this.rpsPlayerIcon.textContent = this.formatRpsEmoji(leftChoice);
        }
        if (this.rpsOpponentIcon && rightChoice) {
            this.rpsOpponentIcon.textContent = this.formatRpsEmoji(rightChoice);
        }

        this.clearRpsIcons();
        
        if (gameOver) {
            // Game is over
            if (gameWinner) {
                if (this.isSpectator) {
                    // For spectators, determine winner based on username
                    const winnerPlayer = this.gameState?.players?.find(p => p.username === gameWinner);
                    const winnerRole = winnerPlayer?.role;
                    if (winnerRole === 'X') {
                        this.rpsPlayerIcon?.classList.add('win');
                    } else if (winnerRole === 'O') {
                        this.rpsOpponentIcon?.classList.add('win');
                    }
                    this.rpsResultDisplay.textContent = `Game Over! ${gameWinner} Wins! (First to 5 wins)`;
                } else {
                    const isWinner = (this.myRole === 'X' && gameWinner === this.gameState?.players?.find(p => p.role === 'X')?.username) ||
                                    (this.myRole === 'O' && gameWinner === this.gameState?.players?.find(p => p.role === 'O')?.username);
                    // Always show X on left, O on right
                    const winnerPlayer = this.gameState?.players?.find(p => p.username === gameWinner);
                    const winnerRole = winnerPlayer?.role;
                    if (winnerRole === 'X') {
                        this.rpsPlayerIcon?.classList.add('win');
                        this.rpsOpponentIcon?.classList.add('lose');
                    } else if (winnerRole === 'O') {
                        this.rpsOpponentIcon?.classList.add('win');
                        this.rpsPlayerIcon?.classList.add('lose');
                    }
                    if (isWinner) {
                        this.rpsResultDisplay.textContent = `Game Over! You Win! (First to 5 wins)`;
                    } else {
                        this.rpsResultDisplay.textContent = `Game Over! You Lose! (First to 5 wins)`;
                    }
                }
            }
        } else if (winnerRole === 'draw') {
            this.rpsPlayerIcon?.classList.add('draw');
            this.rpsOpponentIcon?.classList.add('draw');
            this.rpsResultDisplay.textContent = `Round ${round}: Draw!`;
        } else {
            if (this.isSpectator) {
                // For spectators, show winner based on role
                if (winnerRole === 'X') {
                    this.rpsPlayerIcon?.classList.add('win');
                    this.rpsOpponentIcon?.classList.add('lose');
                } else if (winnerRole === 'O') {
                    this.rpsOpponentIcon?.classList.add('win');
                    this.rpsPlayerIcon?.classList.add('lose');
                }
                const resultText = winnerUsername
                    ? `Round ${round}: ${winnerUsername} wins!`
                    : `Round ${round}: ${winnerRole} wins!`;
                this.rpsResultDisplay.textContent = resultText;
            } else {
                // Always show X on left, O on right
                if (winnerRole === 'X') {
                    this.rpsPlayerIcon?.classList.add('win');
                    this.rpsOpponentIcon?.classList.add('lose');
                } else if (winnerRole === 'O') {
                    this.rpsOpponentIcon?.classList.add('win');
                    this.rpsPlayerIcon?.classList.add('lose');
                }
                const resultText = winnerUsername
                    ? `Round ${round}: ${winnerUsername} wins!`
                    : `Round ${round}: ${winnerRole === this.myRole ? 'You' : 'Opponent'} wins!`;
                this.rpsResultDisplay.textContent = resultText;
            }
        }

        this.rpsChoiceSent = false;
    }

    renderMemoryBoard(state) {
        if (!this.memoryStage || !this.memoryGrid) return;
        // Always show memory stage for memory-match game type
        if (this.currentGameType === 'memory-match') {
            this.memoryStage.classList.remove('hidden');
        } else {
            this.memoryStage.classList.add('hidden');
            return;
        }
        
        if (!state || !state.cards) {
            // If no state, show empty grid or initialize
            this.memoryGrid.innerHTML = '';
            if (this.memoryStatus) {
                this.memoryStatus.style.display = 'none';
            }
            // Still update player info even if game hasn't started
            if (this.gameState && this.gameState.players) {
                // Update player info on both sides
        this.updateMemoryPlayerInfo(state);
            }
            return;
        }
        
        this.memoryGrid.innerHTML = '';
        state.cards.forEach(card => {
            const cardEl = document.createElement('div');
            const classes = ['memory-card'];
            if (card.revealed || card.matched) classes.push('revealed');
            if (card.matched) classes.push('matched');
            cardEl.className = classes.join(' ');
            cardEl.dataset.id = card.id;
            cardEl.textContent = card.revealed || card.matched ? card.value : '';
            this.memoryGrid.appendChild(cardEl);
        });
        
        // Hide the status line completely
        if (this.memoryStatus) {
            this.memoryStatus.style.display = 'none';
        }
        
        // Update player info on both sides
        this.updateMemoryPlayerInfo(state);
    }

    getDefaultAvatar(username) {
        // Generate a simple emoji-based avatar from first letter
        const emojis = ['😀', '😃', '😄', '😁', '😆', '😊', '😎', '🤓', '🧐', '😇', '🤗', '🤔', '😋', '😌', '😍', '🥰'];
        if (!username || username.length === 0) return '👤';
        const index = username.charCodeAt(0) % emojis.length;
        return emojis[index];
    }

    async getPlayerAvatar(username) {
        // Try to get avatar from userProfile if it's the current user
        if (this.userProfile && this.userProfile.username === username) {
            return this.userProfile.avatar || this.getDefaultAvatar(username);
        }
        // For other players, use default avatar (could be enhanced to fetch from API)
        return this.getDefaultAvatar(username);
    }

    async updateMemoryPlayerInfo(state) {
        if (!this.gameState || !this.gameState.players) return;
        
        const playerX = this.gameState.players.find(p => p.role === 'X');
        const playerO = this.gameState.players.find(p => p.role === 'O');
        
        const scoreX = state.matches?.X || 0;
        const scoreO = state.matches?.O || 0;
        
        // Update Player X (left side)
        if (playerX) {
            const avatarX = await this.getPlayerAvatar(playerX.username);
            if (this.memoryPlayerXAvatar) {
                this.memoryPlayerXAvatar.textContent = avatarX;
            }
            if (this.memoryPlayerXName) {
                if (this.isSpectator) {
                    this.memoryPlayerXName.textContent = playerX.username;
                } else {
                    this.memoryPlayerXName.textContent = this.myRole === 'X' ? 'You' : 'Opponent';
                }
            }
            if (this.memoryPlayerXScore) {
                this.memoryPlayerXScore.textContent = scoreX;
            }
        }
        
        // Update Player O (right side)
        if (playerO) {
            const avatarO = await this.getPlayerAvatar(playerO.username);
            if (this.memoryPlayerOAvatar) {
                this.memoryPlayerOAvatar.textContent = avatarO;
            }
            if (this.memoryPlayerOName) {
                if (this.isSpectator) {
                    this.memoryPlayerOName.textContent = playerO.username;
                } else {
                    this.memoryPlayerOName.textContent = this.myRole === 'O' ? 'You' : 'Opponent';
                }
            }
            if (this.memoryPlayerOScore) {
                this.memoryPlayerOScore.textContent = scoreO;
            }
        } else {
            // When playerO doesn't exist yet (waiting for opponent)
            if (this.memoryPlayerOName && !this.isSpectator) {
                this.memoryPlayerOName.textContent = 'Opponent';
            }
        }
    }

    async updateTttPlayerInfo() {
        if (!this.gameState || !this.gameState.players) return;
        
        const playerX = this.gameState.players.find(p => p.role === 'X');
        const playerO = this.gameState.players.find(p => p.role === 'O');
        
        const scoreX = this.gameState.tttScores?.X || 0;
        const scoreO = this.gameState.tttScores?.O || 0;
        
        // Update Player X (left side)
        if (playerX) {
            if (this.tttPlayerXRole) {
                this.tttPlayerXRole.textContent = 'X';
            }
            const avatarX = await this.getPlayerAvatar(playerX.username);
            if (this.tttPlayerXAvatar) {
                this.tttPlayerXAvatar.textContent = avatarX;
            }
            if (this.tttPlayerXName) {
                if (this.isSpectator) {
                    this.tttPlayerXName.textContent = playerX.username;
                } else {
                    this.tttPlayerXName.textContent = this.myRole === 'X' ? 'You' : 'Opponent';
                }
            }
            if (this.tttPlayerXScore) {
                this.tttPlayerXScore.textContent = scoreX;
            }
        }
        
        // Update Player O (right side)
        if (playerO) {
            if (this.tttPlayerORole) {
                this.tttPlayerORole.textContent = 'O';
            }
            const avatarO = await this.getPlayerAvatar(playerO.username);
            if (this.tttPlayerOAvatar) {
                this.tttPlayerOAvatar.textContent = avatarO;
            }
            if (this.tttPlayerOName) {
                if (this.isSpectator) {
                    this.tttPlayerOName.textContent = playerO.username;
                } else {
                    this.tttPlayerOName.textContent = this.myRole === 'O' ? 'You' : 'Opponent';
                }
            }
            if (this.tttPlayerOScore) {
                this.tttPlayerOScore.textContent = scoreO;
            }
        } else {
            // When playerO doesn't exist yet (waiting for opponent)
            if (this.tttPlayerOName && !this.isSpectator) {
                this.tttPlayerOName.textContent = 'Opponent';
            }
        }
    }

    async updateRpsPlayerInfo() {
        if (!this.gameState || !this.gameState.players) return;
        
        const playerX = this.gameState.players.find(p => p.role === 'X');
        const playerO = this.gameState.players.find(p => p.role === 'O');
        
        const scoreX = this.gameState.rpsScores?.X || 0;
        const scoreO = this.gameState.rpsScores?.O || 0;
        
        // Update Player X (left side)
        if (playerX) {
            const avatarX = await this.getPlayerAvatar(playerX.username);
            if (this.rpsPlayerXAvatar) {
                this.rpsPlayerXAvatar.textContent = avatarX;
            }
            if (this.rpsPlayerXName) {
                if (this.isSpectator) {
                    this.rpsPlayerXName.textContent = playerX.username;
                } else {
                    this.rpsPlayerXName.textContent = this.myRole === 'X' ? 'You' : 'Opponent';
                }
            }
            if (this.rpsPlayerXScore) {
                this.rpsPlayerXScore.textContent = scoreX;
            }
        }
        
        // Update Player O (right side)
        if (playerO) {
            const avatarO = await this.getPlayerAvatar(playerO.username);
            if (this.rpsPlayerOAvatar) {
                this.rpsPlayerOAvatar.textContent = avatarO;
            }
            if (this.rpsPlayerOName) {
                if (this.isSpectator) {
                    this.rpsPlayerOName.textContent = playerO.username;
                } else {
                    this.rpsPlayerOName.textContent = this.myRole === 'O' ? 'You' : 'Opponent';
                }
            }
            if (this.rpsPlayerOScore) {
                this.rpsPlayerOScore.textContent = scoreO;
            }
        } else {
            // When playerO doesn't exist yet (waiting for opponent)
            if (this.rpsPlayerOName && !this.isSpectator) {
                this.rpsPlayerOName.textContent = 'Opponent';
            }
        }
    }


    submitMemoryFlip(cardId) {
        if (!this.socket || !this.currentRoom || this.currentGameType !== 'memory-match') return;
        this.socket.emit('memoryFlip', { roomId: this.currentRoom, cardId });
    }

    showMemoryMatchMessage(message) {
        if (!this.memoryMatchMessage) return;
        this.memoryMatchMessage.textContent = message;
        this.memoryMatchMessage.classList.remove('hidden');
        this.memoryMatchMessage.classList.add('show');
        // Auto-hide after 2 seconds
        setTimeout(() => {
            this.hideMemoryMatchMessage();
        }, 2000);
    }

    hideMemoryMatchMessage() {
        if (!this.memoryMatchMessage) return;
        this.memoryMatchMessage.classList.remove('show');
        setTimeout(() => {
            this.memoryMatchMessage.classList.add('hidden');
            this.memoryMatchMessage.textContent = '';
        }, 300); // Wait for fade-out animation
    }

    submitRpsChoice(choice) {
        if (
            !this.socket ||
            !this.currentRoom ||
            this.currentGameType !== 'rock-paper-scissors' ||
            this.rpsChoiceSent
        ) {
            return;
        }

        this.rpsChoiceSent = true;
        if (this.rpsResultDisplay) {
            this.rpsResultDisplay.textContent = 'Choice sent. Waiting for opponent...';
        }
        this.renderRpsControls();
        this.socket.emit('rpsChoice', { roomId: this.currentRoom, choice });
    }

    updateScoreboard(data) {
        if (!this.scoreboardList) return;
        this.scoreboardList.innerHTML = '';
        if (!data || data.length === 0) {
            this.scoreboardList.innerHTML = '<div class="no-scores">No games played yet! Be the first to play.</div>';
            return;
        }

        data.forEach((player, index) => {
            const rank = index + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            const playerElement = document.createElement('div');
            playerElement.className = 'scoreboard-item';
            playerElement.innerHTML = `
                <div class="rank">${medal}</div>
                <div class="player-info">
                    <h3>${player.username}</h3>
                    <p>Games: ${player.totalGames} | Win Rate: ${player.winRate}%</p>
                </div>
                <div class="stats">
                    <div class="stat">
                        <span class="stat-label">Wins</span>
                        <span class="stat-value wins">${player.wins}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Losses</span>
                        <span class="stat-value losses">${player.losses}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Draws</span>
                        <span class="stat-value draws">${player.draws}</span>
                    </div>
                </div>
            `;
            this.scoreboardList.appendChild(playerElement);
        });
    }

    clearRpsIcons() {
        [this.rpsPlayerIcon, this.rpsOpponentIcon].forEach(icon => {
            icon?.classList.remove('win', 'lose', 'draw');
        });
    }

    updateRpsIconsPlaceholder() {
        if (this.rpsPlayerIcon) this.rpsPlayerIcon.textContent = '?';
        if (this.rpsOpponentIcon) this.rpsOpponentIcon.textContent = '?';
        this.clearRpsIcons();
    }

    formatRpsEmoji(choice) {
        const map = { rock: '🪨', paper: '📄', scissors: '✂️' };
        return map[choice] || '?';
    }

    showAuthMessage(message) {
        if (!this.authMessage) return;
        this.authMessage.textContent = message || '';
    }

    toggleOnlinePlayers() {
        this.onlinePlayersOpen = !this.onlinePlayersOpen;
        if (this.onlinePlayersOpen) {
            this.onlinePlayersPopup.classList.remove('hidden');
            this.closeLobbyChatDrawer(); // Close chat if open
        } else {
            this.onlinePlayersPopup.classList.add('hidden');
        }
    }

    closeOnlinePlayers() {
        this.onlinePlayersOpen = false;
        this.onlinePlayersPopup.classList.add('hidden');
    }

    openLobbyChatDrawer() {
        this.lobbyChatOpen = true;
        this.lobbyChatDrawer.classList.add('drawer-open');
        this.closeOnlinePlayers(); // Close players if open
    }

    closeLobbyChatDrawer() {
        this.lobbyChatOpen = false;
        this.lobbyChatDrawer.classList.remove('drawer-open');
    }

    openRoomChatDrawer() {
        this.roomChatOpen = true;
        this.roomChatDrawer.classList.add('drawer-open');
    }

    closeRoomChatDrawer() {
        this.roomChatOpen = false;
        this.roomChatDrawer.classList.remove('drawer-open');
    }

    updateChatWidgets() {
        // Hide all widgets on auth screen
        if (this.currentView === 'auth') {
            this.lobbyChatDrawer.classList.add('hidden');
            this.roomChatDrawer.classList.add('hidden');
            this.onlinePlayersWidget.classList.add('hidden');
            this.closeLobbyChatDrawer();
            this.closeOnlinePlayers();
            this.closeRoomChatDrawer();
            return;
        }

        if (this.currentRoom) {
            // In a room: show room chat, hide lobby chat and online players
            this.lobbyChatDrawer.classList.add('hidden');
            this.roomChatDrawer.classList.remove('hidden');
            this.onlinePlayersWidget.classList.add('hidden');
            this.closeLobbyChatDrawer();
            this.closeOnlinePlayers();
        } else {
            // Not in a room: show lobby chat and online players, hide room chat
            this.lobbyChatDrawer.classList.remove('hidden');
            this.roomChatDrawer.classList.add('hidden');
            this.onlinePlayersWidget.classList.remove('hidden');
            this.closeRoomChatDrawer();
        }
    }

    setupShowPasswordButtons() {
        const showPasswordButtons = document.querySelectorAll('.show-password-btn');
        showPasswordButtons.forEach(button => {
            const input = button.parentElement.querySelector('input[type="password"], input[type="text"]');
            if (!input) return;

            const icon = button.querySelector('.show-password-icon');
            const eyePath = icon.querySelector('path');
            const eyeCircle = icon.querySelector('circle');
            const eyeSlash = icon.querySelector('line');

            // Create slash line for hidden state if it doesn't exist
            if (!eyeSlash) {
                const slash = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                slash.setAttribute('x1', '1');
                slash.setAttribute('y1', '1');
                slash.setAttribute('x2', '23');
                slash.setAttribute('y2', '23');
                slash.setAttribute('stroke', 'currentColor');
                slash.setAttribute('stroke-width', '2');
                slash.setAttribute('stroke-linecap', 'round');
                slash.style.display = 'none';
                icon.appendChild(slash);
            }

            const updateIcon = (isVisible) => {
                const slash = icon.querySelector('line');
                if (isVisible) {
                    // Show crossed-out eye (hidden state)
                    if (slash) slash.style.display = 'block';
                } else {
                    // Show normal eye (visible state)
                    if (slash) slash.style.display = 'none';
                }
            };

            // Mouse events
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                input.type = 'text';
                updateIcon(true);
            });

            button.addEventListener('mouseup', () => {
                input.type = 'password';
                updateIcon(false);
            });

            button.addEventListener('mouseleave', () => {
                input.type = 'password';
                updateIcon(false);
            });

            // Touch events for mobile
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                input.type = 'text';
                updateIcon(true);
            });

            button.addEventListener('touchend', () => {
                input.type = 'password';
                updateIcon(false);
            });

            button.addEventListener('touchcancel', () => {
                input.type = 'password';
                updateIcon(false);
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new TicTacToeApp();
});
