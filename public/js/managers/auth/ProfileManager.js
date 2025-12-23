class ProfileManager {
    constructor(app, authManager, passwordValidator) {
        this.app = app;
        this.authManager = authManager;
        this.passwordValidator = passwordValidator;
        this.selectedAvatar = null;
        this.bindElements();
    }

    bindElements() {
        this.profileAvatarDisplay = document.getElementById('profile-avatar-display');
        this.avatarOptions = document.querySelectorAll('.avatar-option');
        this.updateAvatarBtn = document.getElementById('update-avatar-btn');
        this.profilePasswordForm = document.getElementById('profile-password-form');
        this.profileNewPasswordInput = document.getElementById('profile-new-password');
        this.profileNewPasswordError = document.getElementById('profile-new-password-error');
        this.profileConfirmPasswordInput = document.getElementById('profile-confirm-password');
        this.profileConfirmPasswordError = document.getElementById('profile-confirm-password-error');
        this.profileCurrentPasswordInput = document.getElementById('profile-current-password');
        this.profileMessage = document.getElementById('profile-message');
        this.deleteAccountModal = document.getElementById('delete-account-modal');
        this.deleteAccountBtn = document.getElementById('delete-account-btn');
        this.confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        this.cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        this.changePasswordBtn = document.getElementById('change-password-btn');
        this.changePasswordModal = document.getElementById('change-password-modal');
        this.modalPasswordForm = document.getElementById('modal-password-form');
        this.modalCurrentPasswordInput = document.getElementById('modal-current-password');
        this.modalNewPasswordInput = document.getElementById('modal-new-password');
        this.modalConfirmPasswordInput = document.getElementById('modal-confirm-password');
        this.modalNewPasswordError = document.getElementById('modal-new-password-error');
        this.modalConfirmPasswordError = document.getElementById('modal-confirm-password-error');
        this.modalCurrentPasswordError = document.getElementById('modal-current-password-error');
        this.cancelPasswordBtn = document.getElementById('cancel-password-btn');
    }

    setupEventListeners() {
        // Re-bind elements in case they weren't available during construction
        this.bindElements();
        
        this.avatarOptions?.forEach(option => {
            option.addEventListener('click', () => this.selectAvatar(option));
        });

        this.updateAvatarBtn?.addEventListener('click', () => this.updateAvatar());
        this.profilePasswordForm?.addEventListener('submit', (e) => this.updatePassword(e));
        this.deleteAccountBtn?.addEventListener('click', () => this.showDeleteAccountModal());
        this.confirmDeleteBtn?.addEventListener('click', () => this.deleteAccount());
        this.cancelDeleteBtn?.addEventListener('click', () => this.hideDeleteAccountModal());

        this.deleteAccountModal?.addEventListener('click', (e) => {
            if (e.target === this.deleteAccountModal) {
                this.hideDeleteAccountModal();
            }
        });

        this.changePasswordBtn?.addEventListener('click', () => this.showChangePasswordModal());
        this.modalPasswordForm?.addEventListener('submit', (e) => this.updatePasswordFromModal(e));
        this.cancelPasswordBtn?.addEventListener('click', () => this.hideChangePasswordModal());
        this.changePasswordModal?.addEventListener('click', (e) => {
            if (e.target === this.changePasswordModal) {
                this.hideChangePasswordModal();
            }
        });

        this.profileNewPasswordInput?.addEventListener('input', () => this.validateNewPassword());
        this.profileNewPasswordInput?.addEventListener('blur', () => this.validateNewPassword());
        this.profileConfirmPasswordInput?.addEventListener('input', () => this.validateConfirmPassword());
        this.profileConfirmPasswordInput?.addEventListener('blur', () => this.validateConfirmPassword());
        
        this.modalNewPasswordInput?.addEventListener('input', () => this.validateModalNewPassword());
        this.modalNewPasswordInput?.addEventListener('blur', () => this.validateModalNewPassword());
        this.modalConfirmPasswordInput?.addEventListener('input', () => this.validateModalConfirmPassword());
        this.modalConfirmPasswordInput?.addEventListener('blur', () => this.validateModalConfirmPassword());
    }

    validateNewPassword() {
        if (!this.profileNewPasswordInput || !this.profileNewPasswordError) return false;
        const password = this.profileNewPasswordInput.value;
        const validation = this.passwordValidator.validatePassword(password);
        this.passwordValidator.displayPasswordError(this.profileNewPasswordInput, this.profileNewPasswordError, validation.errors);
        return validation.isValid;
    }

    validateConfirmPassword() {
        if (!this.profileConfirmPasswordInput || !this.profileConfirmPasswordError) return false;
        const password = this.profileNewPasswordInput?.value || '';
        const confirmPassword = this.profileConfirmPasswordInput.value;
        const validation = this.passwordValidator.validateConfirmPassword(password, confirmPassword);
        this.passwordValidator.displayPasswordError(this.profileConfirmPasswordInput, this.profileConfirmPasswordError, validation.errors);
        return validation.isValid;
    }

    loadProfileData() {
        if (this.app.userProfile) {
            if (this.profileAvatarDisplay) {
                this.profileAvatarDisplay.textContent = this.app.userProfile.avatar || '👤';
            }
            if (this.app.userProfile.avatar && this.avatarOptions) {
                this.avatarOptions.forEach(option => {
                    if (option.dataset.avatar === this.app.userProfile.avatar) {
                        option.classList.add('selected');
                    } else {
                        option.classList.remove('selected');
                    }
                });
            }
        }
    }

    selectAvatar(optionElement) {
        this.avatarOptions?.forEach(opt => opt.classList.remove('selected'));
        optionElement.classList.add('selected');
        this.selectedAvatar = optionElement.dataset.avatar;
    }

    async updateAvatar() {
        if (!this.app.token) return;
        if (!this.selectedAvatar) {
            this.showProfileMessage('Please select an avatar.', 'error');
            return;
        }
        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.app.token}`
                },
                body: JSON.stringify({ avatar: this.selectedAvatar })
            });
            const data = await response.json();
            if (response.ok) {
                this.app.userProfile = data;
                this.authManager.updateUserAvatarDisplay();
                this.selectedAvatar = null;
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
        if (!this.app.token) return;
        const currentPassword = this.profileCurrentPasswordInput.value;
        const newPassword = this.profileNewPasswordInput.value;
        const confirmPassword = this.profileConfirmPasswordInput.value;
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showProfileMessage('Please fill out all password fields.', 'error');
            return;
        }

        const passwordValidation = this.passwordValidator.validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            this.showProfileMessage(passwordValidation.errors[0], 'error');
            this.passwordValidator.displayPasswordError(this.profileNewPasswordInput, this.profileNewPasswordError, passwordValidation.errors);
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showProfileMessage('New passwords do not match.', 'error');
            this.validateConfirmPassword();
            return;
        }
        try {
            const response = await fetch('/api/auth/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.app.token}`
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

    async deleteAccount() {
        if (!this.app.token) return;
        
        try {
            const response = await fetch('/api/auth/account', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.app.token}`
                }
            });
            
            const data = await response.json();
            if (response.ok) {
                this.hideDeleteAccountModal();
                if (this.app.modalManager) {
                    this.app.modalManager.showNotification('Your account has been deleted successfully.', () => {
                        this.authManager.logout();
                    });
                }
            } else {
                this.showProfileMessage(data.error || 'Failed to delete account.', 'error');
                this.hideDeleteAccountModal();
            }
        } catch (error) {
            this.showProfileMessage('Unable to reach the server.', 'error');
            this.hideDeleteAccountModal();
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

    showChangePasswordModal() {
        if (this.changePasswordModal) {
            this.changePasswordModal.classList.remove('hidden');
            // Clear form
            if (this.modalCurrentPasswordInput) this.modalCurrentPasswordInput.value = '';
            if (this.modalNewPasswordInput) this.modalNewPasswordInput.value = '';
            if (this.modalConfirmPasswordInput) this.modalConfirmPasswordInput.value = '';
            if (this.modalNewPasswordError) this.modalNewPasswordError.textContent = '';
            if (this.modalConfirmPasswordError) this.modalConfirmPasswordError.textContent = '';
        }
    }

    hideChangePasswordModal() {
        if (this.changePasswordModal) {
            this.changePasswordModal.classList.add('hidden');
        }
    }

    validateModalNewPassword() {
        if (!this.modalNewPasswordInput || !this.modalNewPasswordError) return false;
        const password = this.modalNewPasswordInput.value;
        const validation = this.passwordValidator.validatePassword(password);
        this.passwordValidator.displayPasswordError(this.modalNewPasswordInput, this.modalNewPasswordError, validation.errors);
        return validation.isValid;
    }

    validateModalConfirmPassword() {
        if (!this.modalConfirmPasswordInput || !this.modalConfirmPasswordError) return false;
        const password = this.modalNewPasswordInput?.value || '';
        const confirmPassword = this.modalConfirmPasswordInput.value;
        const validation = this.passwordValidator.validateConfirmPassword(password, confirmPassword);
        this.passwordValidator.displayPasswordError(this.modalConfirmPasswordInput, this.modalConfirmPasswordError, validation.errors);
        return validation.isValid;
    }

    async updatePasswordFromModal(event) {
        event.preventDefault();
        if (!this.app.token) return;
        const currentPassword = this.modalCurrentPasswordInput.value;
        const newPassword = this.modalNewPasswordInput.value;
        const confirmPassword = this.modalConfirmPasswordInput.value;
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showProfileMessage('Please fill out all password fields.', 'error');
            return;
        }

        const passwordValidation = this.passwordValidator.validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            this.showProfileMessage(passwordValidation.errors[0], 'error');
            this.passwordValidator.displayPasswordError(this.modalNewPasswordInput, this.modalNewPasswordError, passwordValidation.errors);
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showProfileMessage('New passwords do not match.', 'error');
            this.validateModalConfirmPassword();
            return;
        }
        try {
            const response = await fetch('/api/auth/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.app.token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await response.json();
            if (response.ok) {
                this.modalCurrentPasswordInput.value = '';
                this.modalNewPasswordInput.value = '';
                this.modalConfirmPasswordInput.value = '';
                this.hideChangePasswordModal();
                this.showProfileMessage('Password updated successfully!', 'success');
            } else {
                this.showProfileMessage(data.error || 'Failed to update password.', 'error');
            }
        } catch (error) {
            this.showProfileMessage('Unable to reach the server.', 'error');
        }
    }
}
