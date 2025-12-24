class LoginHandler {
    constructor(app, authManager) {
        this.app = app;
        this.authManager = authManager;
    }

    setupEventListeners() {
        this.loginForm = document.getElementById('login-form');
        if (this.loginForm) {
            this.loginForm.removeEventListener('submit', this.handleLogin);
            this.loginForm.addEventListener('submit', (event) => {
                this.handleLogin(event);
            });
        } else {
            console.error('Login form not found');
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        const form = event.target;
        const username = form.querySelector('input[name="username"]').value.trim();
        const password = form.querySelector('input[name="password"]').value;

        if (!username || !password) {
            this.authManager.showAuthMessage('Please fill out all fields.');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            let data;
            try {
                data = await response.json();
            } catch (e) {
                console.error('Failed to parse response:', e);
                this.authManager.showAuthMessage('Server error. Please try again.');
                return;
            }

            if (!response.ok) {
                if (response.status === 403 && data.emailVerified === false) {
                    this.authManager.showEmailVerificationMessage(data.email, data.message);
                    return;
                }
                this.authManager.showAuthMessage(data.error || 'Authentication failed.');
                return;
            }

            if (!data.token) {
                console.error('No token in response:', data);
                this.authManager.showAuthMessage('Authentication failed. No token received.');
                return;
            }

            this.authManager.afterAuthentication(data);
        } catch (error) {
            console.error('Authentication error:', error);
            this.authManager.showAuthMessage('Unable to reach the server. Check your connection.');
        }
    }
}
