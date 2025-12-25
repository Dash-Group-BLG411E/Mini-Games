class AuthManager {
    constructor(app) {
        this.app = app;
        
        this.authTabs = document.querySelectorAll('.auth-tab');
        this.guestLoginBtn = document.getElementById('guest-login-btn');
        this.authMessage = document.getElementById('auth-message');
        this.userAvatarDisplay = document.getElementById('user-avatar-display');
        this.userUsernameDisplay = document.getElementById('user-username-display');
        this.userRoleBadge = document.getElementById('user-role-badge');
        this.adminReportsBtn = document.getElementById('admin-reports-btn');
        
        if (typeof PasswordValidator !== 'undefined') {
            this.passwordValidator = new PasswordValidator();
        }
        if (typeof LoginHandler !== 'undefined') {
            this.loginHandler = new LoginHandler(this.app, this);
        }
        if (typeof RegisterHandler !== 'undefined') {
            this.registerHandler = new RegisterHandler(this.app, this, this.passwordValidator);
        }
        if (typeof ProfileManager !== 'undefined') {
            this.profileManager = new ProfileManager(this.app, this, this.passwordValidator);
        }
        
        setTimeout(() => {
            this.setupEventListeners();
        }, 50);
    }

    setupEventListeners() {
        this.authTabs = document.querySelectorAll('.auth-tab');
        this.guestLoginBtn = document.getElementById('guest-login-btn');
        
        if (this.authTabs && this.authTabs.length > 0) {
            this.authTabs.forEach(tab => {
                if (tab) {
                    tab.addEventListener('click', () => this.switchAuthTab(tab.dataset.authTarget));
                }
            });
        }

        if (this.guestLoginBtn) {
            this.guestLoginBtn.addEventListener('click', () => this.loginAsGuest());
        }
        
        this.setupShowPasswordButtons();
        
        if (this.loginHandler && typeof this.loginHandler.setupEventListeners === 'function') {
            this.loginHandler.setupEventListeners();
        } else {
            console.warn('LoginHandler not available');
        }
        if (this.registerHandler && typeof this.registerHandler.setupEventListeners === 'function') {
            this.registerHandler.setupEventListeners();
        } else {
            console.warn('RegisterHandler not available');
        }
        if (this.profileManager && typeof this.profileManager.setupEventListeners === 'function') {
            this.profileManager.setupEventListeners();
        }
    }

    setupShowPasswordButtons() {
        const showPasswordButtons = document.querySelectorAll('.show-password-btn');
        showPasswordButtons.forEach(button => {
            const input = button.parentElement.querySelector('input[type="password"], input[type="text"]');
            if (!input) return;

            const icon = button.querySelector('.show-password-icon');
            const eyeSlash = icon.querySelector('line');

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
                    if (slash) slash.style.display = 'block';
                } else {
                    if (slash) slash.style.display = 'none';
                }
            };

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

            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                input.type = 'text';
                updateIcon(true);
            });

            button.addEventListener('touchend', () => {
                input.type = 'password';
                updateIcon(false);
            });
        });
    }

    async checkStoredToken() {
        const hideLoadingScreen = () => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
                loadingScreen.classList.add('hidden');
            }
        };
        
        const token = localStorage.getItem('minigames_token');
        const username = localStorage.getItem('minigames_username');
        
        if (token && username) {
            this.app.token = token;
            this.app.currentUser = username;
            this.app.userRole = localStorage.getItem('minigames_role') || 'player';
            
            try {
                const response = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    this.app.userProfile = userData;
                    this.app.userRole = userData.role || this.app.userRole || 'player';
                    localStorage.setItem('minigames_role', this.app.userRole);
                    this.updateUserAvatarDisplay();
                    
                    // Hide chat and online players widget for guests
                    if (this.app.userRole === 'guest') {
                        const lobbyChatDrawer = document.getElementById('lobby-chat-drawer');
                        const onlinePlayersWidget = document.getElementById('online-players-widget');
                        if (lobbyChatDrawer) {
                            lobbyChatDrawer.style.display = 'none';
                            lobbyChatDrawer.classList.add('hidden');
                        }
                        if (onlinePlayersWidget) {
                            onlinePlayersWidget.style.display = 'none';
                            onlinePlayersWidget.classList.add('hidden');
                        }
                    }
                    
                    this.app.currentRoom = null;
                    this.app.currentRoomName = null;
                    this.app.gameState = null;
                    this.app.myRole = null;
                    this.app.isSpectator = false;
                    
                    this.app.initializeSocket();
                    
                    await this.app.waitForBadgesAndShowLobby();
                    
                    hideLoadingScreen();
                    
                    const authContainer = document.getElementById('auth-container');
                    const lobbyContainer = document.getElementById('lobby-container');
                    if (authContainer) authContainer.style.display = 'none';
                    if (lobbyContainer) lobbyContainer.style.display = 'block';
                    
                    // Update chat widgets after role is set (hides for guests)
                    if (this.app.updateChatWidgets) {
                        this.app.updateChatWidgets();
                    }
                    
                    if (this.app.initializeSocket) {
                        this.app.initializeSocket();
                    }
                    
                    if (this.app.waitForBadgesAndShowLobby) {
                        await this.app.waitForBadgesAndShowLobby();
                    }
                    return;
                } else {
                    console.warn('Token validation failed, clearing auth');
                    this.clearStoredAuth();
                }
            } catch (error) {
                console.error('Failed to validate token:', error);
                this.clearStoredAuth();
            }
        }
        
        this.clearStoredAuth();
        hideLoadingScreen();
        setTimeout(() => {
            const authContainer = document.getElementById('auth-container');
            const lobbyContainer = document.getElementById('lobby-container');
            if (authContainer) {
                authContainer.style.display = 'flex';
                authContainer.style.setProperty('display', 'flex', 'important');
            }
            if (lobbyContainer) {
                lobbyContainer.style.display = 'none';
            }
        }, 100);
    }

    clearStoredAuth() {
        this.app.token = null;
        this.app.currentUser = null;
        this.app.userRole = 'player';
        this.app.userProfile = null;
        localStorage.removeItem('minigames_token');
        localStorage.removeItem('minigames_username');
        localStorage.removeItem('minigames_role');
    }

    switchAuthTab(target) {
        this.authTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.authTarget === target);
        });
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        if (loginForm) loginForm.classList.toggle('hidden', target !== 'login');
        if (registerForm) registerForm.classList.toggle('hidden', target !== 'register');
        
        const guestLoginBlock = document.querySelector('.guest-login-block');
        if (guestLoginBlock) {
            guestLoginBlock.classList.toggle('hidden', target === 'register');
        }
        
        this.showAuthMessage('');
        if (target === 'login') {
            this.registerHandler.clearValidation();
        }
    }

    validatePassword(password) {
        return this.passwordValidator.validatePassword(password);
    }

    displayPasswordError(input, errorElement, errors) {
        this.passwordValidator.displayPasswordError(input, errorElement, errors);
    }

    validateRegisterPassword() {
        return this.registerHandler.validatePassword();
    }

    validateRegisterConfirmPassword() {
        return this.registerHandler.validateConfirmPassword();
    }

    validateProfileNewPassword() {
        return this.profileManager.validateNewPassword();
    }

    validateProfileConfirmPassword() {
        return this.profileManager.validateConfirmPassword();
    }

    clearPasswordValidation() {
        this.registerHandler.clearValidation();
    }

    async loginAsGuest() {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const username = `guest-${randomSuffix}`;
        const password = `guest-${randomSuffix}-${Date.now()}`;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role: 'guest' })
            });
            const data = await response.json();

            if (!response.ok) {
                const message = data.error || 'Unable to start guest session.';
                this.showAuthMessage(message);
                return;
            }

            if (data.token) {
                this.showAuthMessage('Guest session created.');
                this.afterAuthentication(data);
            } else {
                this.showAuthMessage('Guest session created, but authentication failed.');
            }
        } catch (error) {
            console.error('Guest login error:', error);
            this.showAuthMessage('Unable to reach the server.');
        }
    }

    async submitAuth(action, event) {
        if (action === 'login') {
            return this.loginHandler.handleLogin(event);
        } else if (action === 'register') {
            return this.registerHandler.handleRegister(event);
        }
    }

    async afterAuthentication(data) {
        if (!data || !data.token) {
            console.error('Invalid authentication data:', data);
            if (this.showAuthMessage) {
                this.showAuthMessage('Authentication failed. Please try again.');
            }
            return;
        }
        
        this.app.token = data.token;
        this.app.currentUser = data.username;
        this.app.userRole = data.role || 'player';
        localStorage.setItem('minigames_token', this.app.token);
        localStorage.setItem('minigames_username', this.app.currentUser);
        localStorage.setItem('minigames_role', this.app.userRole);
        
        // Hide chat and online players widget for guests immediately
        if (this.app.userRole === 'guest') {
            const lobbyChatDrawer = document.getElementById('lobby-chat-drawer');
            const onlinePlayersWidget = document.getElementById('online-players-widget');
            if (lobbyChatDrawer) {
                lobbyChatDrawer.style.display = 'none';
                lobbyChatDrawer.classList.add('hidden');
            }
            if (onlinePlayersWidget) {
                onlinePlayersWidget.style.display = 'none';
                onlinePlayersWidget.classList.add('hidden');
            }
        }
        
        // Update avatar display (hides profile button for guests)
        this.updateUserAvatarDisplay();
        
        if (this.showAuthMessage) {
            this.showAuthMessage('');
        }

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
        
        if (authContainer) {
            authContainer.style.display = 'none';
        }
        
        if (roomsContainer) {
            roomsContainer.style.display = 'none';
        }
        
        if (leaderboardContainer) {
            leaderboardContainer.style.display = 'none';
        }
        
        if (gameContainer) {
            gameContainer.style.display = 'none';
        }
        
        if (lobbyContainer) {
            lobbyContainer.style.display = 'block';
        }

        if (this.app.initializeSocket) {
            this.app.initializeSocket();
        }
        
        // Update chat widgets after role is set (hides for guests)
        if (this.app.updateChatWidgets) {
            this.app.updateChatWidgets();
        }
        
        setTimeout(async () => {
            if (this.loadUserProfile) {
                try {
                    await this.loadUserProfile();
                } catch (e) {
                    console.error('Profile load failed (non-blocking):', e);
                }
            }
        }, 1000);
        
        if (this.app.viewManager && this.app.viewManager.showLobby) {
            setTimeout(() => {
                this.app.viewManager.showLobby();
            }, 100);
        }
    }

    logout() {
        if (this.app.socket) {
            this.app.socket.disconnect();
            this.app.socket = null;
        }
        this.clearStoredAuth();
        this.app.currentRoom = null;
        this.app.gameState = null;
        this.app.myRole = null;
        this.app.isSpectator = false;
        if (this.app.warningManager) {
            this.app.warningManager.disableBeforeUnloadWarning();
        } else {
            this.app.disableBeforeUnloadWarning();
        }
        if (this.app.viewManager) {
            this.app.viewManager.showView('auth');
        }
        if (this.app.roomManager) {
            this.app.roomManager.updateLeaveButtonVisibility();
            if (this.app.roomManager.roomInfoBox) {
                this.app.roomManager.roomInfoBox.classList.add('hidden');
            }
        }
    }

    async loadUserProfile() {
        if (!this.app.token) return;
        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${this.app.token}`
                }
            });
            if (response.ok) {
                this.app.userProfile = await response.json();
                this.app.userRole = this.app.userProfile.role || this.app.userRole || 'player';
                localStorage.setItem('minigames_role', this.app.userRole);
                this.updateUserAvatarDisplay();
            }
        } catch (error) {
            console.error('Failed to load user profile:', error);
        }
    }

    updateUserAvatarDisplay() {
        if (this.app.userProfile && this.userAvatarDisplay) {
            this.userAvatarDisplay.textContent = this.app.userProfile.avatar || '👤';
        }
        if (this.app.userProfile && this.profileManager.profileAvatarDisplay) {
            this.profileManager.profileAvatarDisplay.textContent = this.app.userProfile.avatar || '👤';
        }
        if (this.app.userProfile && this.userUsernameDisplay) {
            this.userUsernameDisplay.textContent = this.app.userProfile.username || '';
        }
        if (this.userRoleBadge) {
            if (this.app.userRole) {
                this.userRoleBadge.textContent = this.app.userRole;
                this.userRoleBadge.classList.remove('hidden');
            } else {
                this.userRoleBadge.classList.add('hidden');
                this.userRoleBadge.textContent = '';
            }
        }
        
        if (this.adminReportsBtn) {
            if (this.app.userRole === 'admin') {
                this.adminReportsBtn.classList.remove('hidden');
            } else {
                this.adminReportsBtn.classList.add('hidden');
            }
        }
        
        if (this.profileNavBtn) {
            if (this.app.userRole === 'guest') {
                this.profileNavBtn.classList.add('hidden');
            } else {
                this.profileNavBtn.classList.remove('hidden');
            }
        }
    }

    loadProfileData() {
        this.profileManager.loadProfileData();
        // Load badges when profile is shown
        if (this.app.scoreboardManager) {
            this.app.scoreboardManager.loadUserBadges();
        }
    }

    showAuthMessage(message) {
        if (!this.authMessage) return;
        this.authMessage.textContent = message || '';
        this.authMessage.className = 'auth-message';
    }

    showEmailVerificationMessage(email, message) {
        if (!this.app.modalManager) return;
        
        const messageHtml = `
            <div style="color: #e74c3c; font-weight: 600; margin-bottom: 15px; font-size: 1.1rem;">
                ${message || 'Please verify your email before logging in.'}
            </div>
            <button id="resend-verification-btn" class="resend-verification-btn" style="margin-top: 15px; padding: 10px 20px; background: linear-gradient(135deg, var(--accent-purple), var(--accent-purple-deep)); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; width: 100%; transition: all 0.3s ease;">
                Resend Verification Email
            </button>
        `;
        
        this.app.modalManager.showNotification(messageHtml, null, null);
        
        // Set up button event listener after modal is shown
        setTimeout(() => {
            const resendBtn = document.getElementById('resend-verification-btn');
            if (resendBtn) {
                resendBtn.onclick = () => {
                    this.resendVerificationEmail(email);
                    this.app.modalManager.hideNotification();
                };
                resendBtn.onmouseover = () => resendBtn.style.transform = 'translateY(-2px)';
                resendBtn.onmouseout = () => resendBtn.style.transform = 'translateY(0)';
            }
        }, 10);
    }

    showRegistrationSuccessMessage(email, message, emailPreviewUrl = null) {
        if (!this.app.modalManager) return;
        
        let messageHtml = `
            <div style="color: #111827; font-weight: 600; margin-bottom: 15px; font-size: 1.1rem;">
                ${message || 'Registration successful!<br>Please check your email to verify your account.'}
            </div>
        `;
        
        // Don't show test email preview URL to users - only for development
        // Preview URLs are logged in server console for development purposes
        
        messageHtml += `
            <button id="resend-verification-btn" class="resend-verification-btn" style="margin-top: 15px; padding: 0.75rem 1.5rem; background: #fcd34d; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; font-weight: 700; color: #2c1b60; width: 70%; transition: transform 0.3s ease, box-shadow 0.3s ease; box-shadow: 0 4px 15px rgba(252, 211, 77, 0.4);">
                Resend Verification Email
            </button>
        `;
        
        this.app.modalManager.showNotification(messageHtml, null, null);
        
        // Set up button event listener after modal is shown
        setTimeout(() => {
            const resendBtn = document.getElementById('resend-verification-btn');
            if (resendBtn) {
                resendBtn.onclick = () => {
                    this.resendVerificationEmail(email);
                    this.app.modalManager.hideNotification();
                };
                resendBtn.onmouseover = () => {
                    resendBtn.style.transform = 'translateY(-2px)';
                    resendBtn.style.boxShadow = '0 6px 20px rgba(252, 211, 77, 0.5)';
                };
                resendBtn.onmouseout = () => {
                    resendBtn.style.transform = 'translateY(0)';
                    resendBtn.style.boxShadow = '0 4px 15px rgba(252, 211, 77, 0.4)';
                };
            }
        }, 10);
        
        const registerForm = document.getElementById('register-form');
        if (registerForm) registerForm.reset();
    }

    async resendVerificationEmail(email) {
        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();

            if (response.ok) {
                // Show success in modal
                if (this.app.modalManager) {
                    const successMessage = `<div style="color: #111827; font-weight: 600; font-size: 1.1rem;">${data.message || 'Verification email sent successfully. Please check your inbox.'}</div>`;
                    this.app.modalManager.showNotification(successMessage);
                }
            } else {
                // Show errors in auth-message
                this.showAuthMessage(data.error || 'Failed to send verification email. Please try again later.');
            }
        } catch (error) {
            console.error('Resend verification error:', error);
            // Show errors in auth-message
            this.showAuthMessage('Unable to reach the server.');
        }
    }
}
