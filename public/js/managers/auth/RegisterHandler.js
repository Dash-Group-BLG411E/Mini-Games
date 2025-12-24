class RegisterHandler {
    constructor(app, authManager, passwordValidator) {
        this.app = app;
        this.authManager = authManager;
        this.passwordValidator = passwordValidator;
    }

    setupEventListeners() {
        this.registerForm = document.getElementById('register-form');
        this.registerPasswordInput = document.getElementById('register-password');
        this.registerPasswordError = document.getElementById('register-password-error');
        this.registerConfirmPasswordInput = document.getElementById('register-confirm-password');
        this.registerConfirmPasswordError = document.getElementById('register-confirm-password-error');
        
        if (this.registerForm) {
            this.registerForm.removeEventListener('submit', this.handleRegister);
            this.registerForm.addEventListener('submit', (event) => {
                this.handleRegister(event);
            });
        } else {
            console.error('Register form not found');
        }
        
        if (this.registerPasswordInput) {
            this.registerPasswordInput.addEventListener('input', () => this.validatePassword());
            this.registerPasswordInput.addEventListener('blur', () => this.validatePassword());
        }
        
        if (this.registerConfirmPasswordInput) {
            this.registerConfirmPasswordInput.addEventListener('input', () => this.validateConfirmPassword());
            this.registerConfirmPasswordInput.addEventListener('blur', () => this.validateConfirmPassword());
        }
    }

    validatePassword() {
        if (!this.registerPasswordInput || !this.registerPasswordError) return false;
        const password = this.registerPasswordInput.value;
        const validation = this.passwordValidator.validatePassword(password);
        this.passwordValidator.displayPasswordError(this.registerPasswordInput, this.registerPasswordError, validation.errors);
        return validation.isValid;
    }

    validateConfirmPassword() {
        if (!this.registerConfirmPasswordInput || !this.registerConfirmPasswordError) return false;
        const password = this.registerPasswordInput?.value || '';
        const confirmPassword = this.registerConfirmPasswordInput.value;
        const validation = this.passwordValidator.validateConfirmPassword(password, confirmPassword);
        this.passwordValidator.displayPasswordError(this.registerConfirmPasswordInput, this.registerConfirmPasswordError, validation.errors);
        return validation.isValid;
    }

    clearValidation() {
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

    async handleRegister(event) {
        event.preventDefault();
        const form = event.target;
        const username = form.querySelector('input[name="username"]').value.trim();
        const email = form.querySelector('input[name="email"]')?.value.trim();
        const password = form.querySelector('input[name="password"]').value.trim();
        const confirmPassword = form.querySelector('input[name="confirmPassword"]')?.value.trim();

        console.log('Registration attempt:', { username, email, passwordLength: password.length });

        if (!username || !email || !password) {
            this.authManager.showAuthMessage('Please fill out all fields.');
            return;
        }

        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            this.authManager.showAuthMessage('Please enter a valid email address.');
            return;
        }

        const passwordValidation = this.passwordValidator.validatePassword(password);
        if (!passwordValidation.isValid) {
            this.authManager.showAuthMessage(passwordValidation.errors[0]);
            this.passwordValidator.displayPasswordError(this.registerPasswordInput, this.registerPasswordError, passwordValidation.errors);
            return;
        }

        if (password !== confirmPassword) {
            this.authManager.showAuthMessage('Passwords do not match.');
            this.validateConfirmPassword();
            return;
        }

        try {
            const requestBody = { username, email, password };
            console.log('Sending registration request:', { username, email, passwordLength: password.length });
            
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            let data;
            try {
                const responseText = await response.text();
                console.log('Registration response status:', response.status);
                console.log('Registration response text:', responseText);
                data = JSON.parse(responseText);
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
                const errorMessage = data.error || data.message || `Registration failed (${response.status}).`;
                console.error('Registration error:', errorMessage);
                this.authManager.showAuthMessage(errorMessage);
                return;
            }

            if (!data.token) {
                this.authManager.showRegistrationSuccessMessage(data.email, data.message, data.emailPreviewUrl);
                return;
            }

            this.authManager.afterAuthentication(data);
        } catch (error) {
            console.error('Registration error:', error);
            this.authManager.showAuthMessage('Unable to reach the server. Check your connection.');
        }
    }
}
