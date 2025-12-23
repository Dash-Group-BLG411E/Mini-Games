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
        const randomSuffix = Math.floor(100000 + Math.random() * 900000);
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
        if (!this.authMessage) return;
        const resendBtn = document.createElement('button');
        resendBtn.textContent = 'Resend Verification Email';
        resendBtn.className = 'resend-verification-btn';
        resendBtn.style.cssText = 'margin-top: 10px; padding: 8px 16px; background: #7c3aed; color: white; border: none; border-radius: 5px; cursor: pointer;';
        resendBtn.onclick = () => this.resendVerificationEmail(email);
        
        this.authMessage.innerHTML = `<div style="color: #e74c3c;">${message || 'Please verify your email before logging in.'}</div>`;
        this.authMessage.appendChild(resendBtn);
    }

    showRegistrationSuccessMessage(email, message, emailPreviewUrl = null) {
        if (!this.authMessage) return;
        const resendBtn = document.createElement('button');
        resendBtn.textContent = 'Resend Verification Email';
        resendBtn.className = 'resend-verification-btn';
        resendBtn.style.cssText = 'margin-top: 10px; padding: 8px 16px; background: #7c3aed; color: white; border: none; border-radius: 5px; cursor: pointer;';
        resendBtn.onclick = () => this.resendVerificationEmail(email);
        
        let messageHtml = `<div style="color: #27ae60;">${message || 'Registration successful! Please check your email to verify your account.'}</div>`;
        
        if (emailPreviewUrl) {
            messageHtml += `<div style="margin-top: 10px; padding: 10px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; color: #856404;">
                <strong>📧 Test Email Service:</strong> Since email is not configured, this is a test email. 
                <a href="${emailPreviewUrl}" target="_blank" style="color: #7c3aed; text-decoration: underline;">Click here to view the verification email</a>
            </div>`;
        }
        
        this.authMessage.innerHTML = messageHtml;
        this.authMessage.appendChild(resendBtn);
        
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
                this.showAuthMessage(data.message || 'Verification email sent successfully. Please check your inbox.');
            } else {
                this.showAuthMessage(data.error || 'Failed to send verification email. Please try again later.');
            }
        } catch (error) {
            console.error('Resend verification error:', error);
            this.showAuthMessage('Unable to reach the server.');
        }
    }
}
