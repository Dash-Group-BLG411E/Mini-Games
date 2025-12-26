

class InvitationManager {
    constructor(app) {
        this.app = app;
        
        this.inviteGameModal = app.inviteGameModal;
        this.invitePlayerName = app.invitePlayerName;
        this.inviteConfirmBtn = app.inviteConfirmBtn;
        this.inviteCancelBtn = app.inviteCancelBtn;
        this.rematchBtn = app.rematchBtn;
        this.waitingInvitationModal = document.getElementById('waiting-invitation-modal');
        this.waitingInvitationMessage = document.getElementById('waiting-invitation-message');
        this.cancelInvitationBtn = document.getElementById('cancel-invitation-btn');
        
        this.pendingInviteUsername = null;
        this.sentInvitation = null; // Track invitation we sent (only one at a time): { to, gameType }
    }

    

    sendGameInvitation(username) {
        if (!username) return;
        
        // Check if user is already waiting for an invitation response
        if (this.sentInvitation) {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('You already have a pending invitation. Please wait for a response or cancel it first.');
            }
            return;
        }
        
        // Check if target user is in a game
        const isInGame = this.app.userInGameMap.get(username) || false;
        if (isInGame) {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('User is already playing a game.');
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
        
        // Store the sent invitation
        this.sentInvitation = {
            to: this.pendingInviteUsername,
            gameType: selectedGameType
        };
        
        this.app.socket.emit('sendInvitation', { to: this.pendingInviteUsername, gameType: selectedGameType });
        this.hideInviteGameModal();
        this.pendingInviteUsername = null;
        
        // Show waiting modal
        this.showWaitingInvitationModal();
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

        // Hide rematch button for tournament rooms
        if (this.app.isTournamentRoom) {
            this.rematchBtn.classList.add('hidden');
            this.rematchBtn.style.display = 'none';
            return;
        }

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

    

    showWaitingInvitationModal() {
        if (!this.waitingInvitationModal || !this.waitingInvitationMessage || !this.sentInvitation) return;
        
        const playerName = this.sentInvitation.to;
        const gameType = this.sentInvitation.gameType;
        let gameTypeDisplay = 'the game';
        if (this.app.viewManager && this.app.viewManager.formatGameType) {
            gameTypeDisplay = this.app.viewManager.formatGameType(gameType);
        } else {
            // Fallback
            if (gameType === 'three-mens-morris') {
                gameTypeDisplay = 'Three Men\'s Morris';
            } else if (gameType === 'memory-match') {
                gameTypeDisplay = 'Memory Match';
            } else if (gameType === 'battleship') {
                gameTypeDisplay = 'Battleship';
            }
        }
        
        this.waitingInvitationMessage.textContent = `Waiting for ${playerName} to accept the invitation to play ${gameTypeDisplay}. Please do not close this screen.`;
        
        if (this.waitingInvitationModal) {
            this.waitingInvitationModal.classList.remove('hidden');
        }
    }

    hideWaitingInvitationModal() {
        if (this.waitingInvitationModal) {
            this.waitingInvitationModal.classList.add('hidden');
        }
        this.sentInvitation = null;
    }

    cancelSentInvitation() {
        if (!this.sentInvitation || !this.app.socket || !this.app.socket.connected) {
            this.hideWaitingInvitationModal();
            return;
        }
        
        // Emit cancel invitation event to server
        this.app.socket.emit('cancelInvitation', { to: this.sentInvitation.to });
        this.hideWaitingInvitationModal();
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

        if (this.cancelInvitationBtn) {
            this.cancelInvitationBtn.addEventListener('click', () => this.cancelSentInvitation());
        }

        if (this.waitingInvitationModal) {
            this.waitingInvitationModal.addEventListener('click', (e) => {
                if (e.target === this.waitingInvitationModal || e.target.classList.contains('notification-overlay')) {
                    // Don't allow closing by clicking outside - user must cancel explicitly
                }
            });
        }
    }
}
