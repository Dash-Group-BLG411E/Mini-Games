

class InvitationManager {
    constructor(app) {
        this.app = app;
        
        this.inviteGameModal = app.inviteGameModal;
        this.invitePlayerName = app.invitePlayerName;
        this.inviteConfirmBtn = app.inviteConfirmBtn;
        this.inviteCancelBtn = app.inviteCancelBtn;
        this.rematchBtn = app.rematchBtn;
        
        this.pendingInviteUsername = null;
    }

    

    sendGameInvitation(username) {
        if (!username) return;
        
        if (this.app.userRole === 'guest') {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('Guests cannot send invitations. Please register or log in.');
            }
            return;
        }
        
        if (!this.app.socket || !this.app.socket.connected) {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('Connecting to server... Please wait.');
            }
            if (this.app.initializeSocket) {
                this.app.initializeSocket();
            }
            setTimeout(() => {
                if (this.app.socket && this.app.socket.connected) {
                    this.sendGameInvitation(username);
                } else {
                    if (this.app.modalManager) {
                        this.app.modalManager.showNotification('Connection failed. Please refresh the page.');
                    }
                }
            }, 1500);
            return;
        }
        
        this.pendingInviteUsername = username;
        if (this.invitePlayerName) {
            this.invitePlayerName.textContent = username;
        }
        if (this.inviteGameModal) {
            this.inviteGameModal.classList.remove('hidden');
        }
    }

    

    confirmInviteGameType() {
        if (!this.pendingInviteUsername) return;
        
        if (!this.app.socket || !this.app.socket.connected) {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('Connection lost. Please refresh the page.');
            }
            this.hideInviteGameModal();
            return;
        }
        
        const selectedGameType = document.querySelector('input[name="invite-game-type"]:checked')?.value || 'three-mens-morris';
        this.app.socket.emit('sendInvitation', { to: this.pendingInviteUsername, gameType: selectedGameType });
        this.hideInviteGameModal();
        this.pendingInviteUsername = null;
    }

    

    hideInviteGameModal() {
        if (this.inviteGameModal) {
            this.inviteGameModal.classList.add('hidden');
        }
        this.pendingInviteUsername = null;
    }

    

    showInvitationModal(message) {
        if (this.app.modalManager) {
            this.app.modalManager.showInvitationModal(message);
        }
    }

    

    hideInvitationModal() {
        if (this.app.modalManager) {
            this.app.modalManager.hideInvitationModal();
        }
        this.app.pendingInvitation = null;
    }

    

    acceptInvitation() {
        if (!this.app.pendingInvitation) return;
        if (this.app.socket) {
            this.app.socket.emit('acceptInvitation', { from: this.app.pendingInvitation.from });
        }
        if (this.app.modalManager) {
            this.app.modalManager.hideInvitationModal();
        }
    }

    

    declineInvitation() {
        if (!this.app.pendingInvitation) return;
        if (this.app.socket) {
            this.app.socket.emit('declineInvitation', { from: this.app.pendingInvitation.from });
        }
        if (this.app.modalManager) {
            this.app.modalManager.hideInvitationModal();
        }
    }

    

    requestRematch() {
        if (!this.app.currentRoom) return;
        if (this.app.isSpectator) return;
        if (this.app.gameState?.gameStatus !== 'finished') return;
        
        if (!this.app.socket || !this.app.socket.connected) {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('Connection lost. Please refresh the page.');
            }
            return;
        }
        
        this.app.socket.emit('restartRequest', this.app.currentRoom);
        this.app.hasRequestedRematch = true;
        this.updateRematchButtonStatus();
    }

    

    updateRematchButtonStatus() {
        if (!this.rematchBtn) return;

        if (!this.app.gameState || this.app.gameState.gameStatus !== 'finished') {
            return;
        }

        const hasTwoPlayers = this.app.gameState && this.app.gameState.players && this.app.gameState.players.length === 2;
        
        if (!hasTwoPlayers) {
            this.rematchBtn.textContent = 'Rematch Not Possible';
            this.rematchBtn.style.background = 'linear-gradient(135deg, #6b7280, #4b5563)';
            this.rematchBtn.disabled = true;
            this.app.rematchRequestFrom = null;
            this.app.hasRequestedRematch = false;
            return;
        }

        if (this.app.rematchRequestFrom) {
            this.rematchBtn.textContent = 'Accept Rematch';
            this.rematchBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            this.rematchBtn.disabled = false;
        } else if (this.app.hasRequestedRematch) {
            this.rematchBtn.textContent = 'Rematch (Waiting...)';
            this.rematchBtn.style.background = 'linear-gradient(135deg, #7c3aed, #4c1d95)';
            this.rematchBtn.disabled = false;
        } else {
            this.rematchBtn.textContent = 'Rematch';
            this.rematchBtn.style.background = 'linear-gradient(135deg, var(--accent-purple), var(--accent-purple-deep))';
            this.rematchBtn.disabled = false;
        }
    }

    

    registerEventListeners() {
        if (this.inviteConfirmBtn) {
            this.inviteConfirmBtn.addEventListener('click', () => this.confirmInviteGameType());
        }
        if (this.inviteCancelBtn) {
            this.inviteCancelBtn.addEventListener('click', () => this.hideInviteGameModal());
        }

        if (this.inviteGameModal) {
            this.inviteGameModal.addEventListener('click', (e) => {
                if (e.target === this.inviteGameModal) {
                    this.hideInviteGameModal();
                }
            });
        }
    }
}
