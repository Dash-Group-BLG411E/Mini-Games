

class ModalManager {
    constructor(app) {
        this.app = app;
        
        this.notificationModal = document.getElementById('notification-modal');
        this.notificationMessage = document.getElementById('notification-message');
        this.notificationOkBtn = document.getElementById('notification-ok-btn');
        this.invitationModal = document.getElementById('invitation-modal');
        this.invitationMessage = document.getElementById('invitation-message');
        this.invitationAcceptBtn = document.getElementById('invitation-accept-btn');
        this.invitationDeclineBtn = document.getElementById('invitation-decline-btn');
        this.gameEndModal = document.getElementById('game-end-modal');
        this.gameEndTitle = document.getElementById('game-end-title');
        this.gameEndMessage = document.getElementById('game-end-message');
        this.gameEndRematchBtn = document.getElementById('game-end-rematch-btn');
        this.gameEndRematchStatus = document.getElementById('game-end-rematch-status');
        this.deleteAccountModal = document.getElementById('delete-account-modal');
        this.tournamentWinnerModal = document.getElementById('tournament-winner-modal');
        this.tournamentWinnerMessage = document.getElementById('tournament-winner-message');
        this.tournamentWinnerOkBtn = document.getElementById('tournament-winner-ok-btn');
        
        this.notificationCallback = null;
        this.notificationTimeout = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.notificationOkBtn?.addEventListener('click', () => this.hideNotification());
        this.notificationModal?.addEventListener('click', (e) => {
            if (e.target === this.notificationModal || e.target.classList.contains('notification-overlay')) {
                this.hideNotification();
            }
        });

        this.tournamentWinnerOkBtn?.addEventListener('click', () => this.hideTournamentWinnerModal());
        this.tournamentWinnerModal?.addEventListener('click', (e) => {
            if (e.target === this.tournamentWinnerModal || e.target.classList.contains('modal-overlay')) {
                this.hideTournamentWinnerModal();
            }
        });

        this.invitationAcceptBtn?.addEventListener('click', () => {
            if (this.app.acceptInvitation) {
                this.app.acceptInvitation();
            }
            this.hideInvitationModal();
        });
        this.invitationDeclineBtn?.addEventListener('click', () => {
            if (this.app.declineInvitation) {
                this.app.declineInvitation();
            }
            this.hideInvitationModal();
        });
        this.invitationModal?.addEventListener('click', (e) => {
            if (e.target === this.invitationModal || e.target.classList.contains('notification-overlay')) {
                this.hideInvitationModal();
            }
        });

    }

    

    showNotification(message, callback = null, autoCloseDelay = null) {
        if (!this.notificationModal || !this.notificationMessage) return;
        
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
            this.notificationTimeout = null;
        }
        
        this.notificationMessage.innerHTML = message;
        
        this.notificationModal.classList.remove('hidden');
        this.notificationCallback = callback;
        
        if (autoCloseDelay && autoCloseDelay > 0) {
            this.notificationTimeout = setTimeout(() => {
                this.hideNotification();
            }, autoCloseDelay);
        }
    }

    

    hideNotification() {
        if (this.notificationModal) {
            if (this.notificationTimeout) {
                clearTimeout(this.notificationTimeout);
                this.notificationTimeout = null;
            }
            this.notificationModal.classList.add('hidden');
            
            if (this.notificationCallback) {
                this.notificationCallback();
                this.notificationCallback = null;
            }
        }
    }

    

    showInvitationModal(message) {
        // Deprecated: Invitations now use NotificationManager instead of modal
        // This method is kept for backwards compatibility but should not be called
        console.warn('showInvitationModal is deprecated - use NotificationManager instead');
        // Do not show modal - invitations should go through NotificationManager
    }

    

    hideInvitationModal() {
        if (this.invitationModal) {
            this.invitationModal.classList.add('hidden');
        }
        if (this.app.pendingInvitation) {
            this.app.pendingInvitation = null;
        }
    }

    

    showGameEndModal() {
        if (!this.gameEndModal || !this.app.gameState) return;
        
        let title = '';
        let message = '';
        
        if (this.app.gameState.winner === this.app.myRole) {
            title = 'You Win!';
            message = 'Congratulations!';
        } else {
            title = 'You Lost';
            message = 'Better luck next time!';
        }
        
        if (this.gameEndTitle) {
            this.gameEndTitle.textContent = title;
        }
        if (this.gameEndMessage) {
            this.gameEndMessage.textContent = message;
        }
        
        this.updateGameEndRematchStatus();
        
        this.gameEndModal.classList.remove('hidden');
    }

    

    hideGameEndModal() {
        if (this.gameEndModal) {
            this.gameEndModal.classList.add('hidden');
        }
    }

    

    updateGameEndRematchStatus() {
        if (!this.gameEndRematchBtn || !this.gameEndRematchStatus) return;
        
        if (this.app.rematchRequestFrom) {
            this.gameEndRematchStatus.textContent = 'Opponent requested rematch';
            this.gameEndRematchStatus.classList.remove('hidden');
            this.gameEndRematchBtn.textContent = 'Accept Rematch';
            this.gameEndRematchBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            this.gameEndRematchBtn.disabled = false;
        } else if (this.app.hasRequestedRematch) {
            this.gameEndRematchStatus.textContent = 'Waiting for opponent...';
            this.gameEndRematchStatus.classList.remove('hidden');
            this.gameEndRematchBtn.textContent = 'Rematch (Waiting...)';
            this.gameEndRematchBtn.style.background = 'linear-gradient(135deg, #7c3aed, #4c1d95)';
            this.gameEndRematchBtn.disabled = false;
        } else {
            this.gameEndRematchStatus.classList.add('hidden');
            this.gameEndRematchBtn.textContent = 'Rematch';
            this.gameEndRematchBtn.style.background = 'linear-gradient(135deg, var(--accent-purple), var(--accent-purple-deep))';
            this.gameEndRematchBtn.disabled = false;
        }
    }

    showTournamentWinnerModal(winnerName) {
        if (!this.tournamentWinnerModal || !this.tournamentWinnerMessage) return;
        
        this.tournamentWinnerMessage.textContent = `Congratulations ${winnerName}! You won the tournament! 🎉🏆`;
        this.tournamentWinnerModal.classList.remove('hidden');
    }

    hideTournamentWinnerModal() {
        if (this.tournamentWinnerModal) {
            this.tournamentWinnerModal.classList.add('hidden');
        }
    }
}
