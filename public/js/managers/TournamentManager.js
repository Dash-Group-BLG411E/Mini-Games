class TournamentManager {
    constructor(app) {
        this.app = app;
        this.currentTournament = null;
        this.tournaments = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        const createBtn = document.getElementById('tournament-create-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                const modal = document.getElementById('create-tournament-modal');
                if (modal) {
                    modal.classList.remove('hidden');
                }
            });
        }

        const createConfirmBtn = document.getElementById('create-tournament-confirm-btn');
        if (createConfirmBtn) {
            createConfirmBtn.addEventListener('click', () => {
                const gameType = document.getElementById('modal-tournament-game-type')?.value || 'three-mens-morris';
                const maxPlayers = parseInt(document.getElementById('modal-tournament-player-count')?.value || '4');
                this.createTournament(gameType, maxPlayers);
                const modal = document.getElementById('create-tournament-modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
        }

        const createCancelBtn = document.getElementById('create-tournament-cancel-btn');
        if (createCancelBtn) {
            createCancelBtn.addEventListener('click', () => {
                const modal = document.getElementById('create-tournament-modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
        }

        const createModal = document.getElementById('create-tournament-modal');
        if (createModal) {
            createModal.addEventListener('click', (e) => {
                if (e.target === createModal || e.target.classList.contains('modal-overlay')) {
                    createModal.classList.add('hidden');
                }
            });
        }

        const leaveBtn = document.getElementById('tournament-leave-btn');
        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => {
                this.showLeaveTournamentModal();
            });
        }

        const confirmLeaveOwnerBtn = document.getElementById('confirm-leave-tournament-owner-btn');
        if (confirmLeaveOwnerBtn) {
            confirmLeaveOwnerBtn.addEventListener('click', () => {
                this.leaveTournament();
                const modal = document.getElementById('leave-tournament-owner-modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
        }

        const cancelLeaveOwnerBtn = document.getElementById('cancel-leave-tournament-owner-btn');
        if (cancelLeaveOwnerBtn) {
            cancelLeaveOwnerBtn.addEventListener('click', () => {
                const modal = document.getElementById('leave-tournament-owner-modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
        }

        const confirmLeaveBtn = document.getElementById('confirm-leave-tournament-btn');
        if (confirmLeaveBtn) {
            confirmLeaveBtn.addEventListener('click', () => {
                this.confirmLeaveTournament();
            });
        }

        const cancelLeaveBtn = document.getElementById('cancel-leave-tournament-btn');
        if (cancelLeaveBtn) {
            cancelLeaveBtn.addEventListener('click', () => {
                const modal = document.getElementById('leave-tournament-confirm-modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
        }
    }

    showLeaveTournamentModal() {
        if (!this.currentTournament) return;

        const isOwner = this.currentTournament.creatorUsername === this.app.currentUser;
        const isWaiting = this.currentTournament.status === 'waiting';

        if (isOwner && isWaiting) {
            const modal = document.getElementById('leave-tournament-owner-modal');
            if (modal) {
                modal.classList.remove('hidden');
            }
        } else {
            // Regular user or tournament has started - leave directly
            this.leaveTournament();
        }
    }

    createTournament(gameType, maxPlayers) {
        if (!this.app.socket || !this.app.socket.connected) {
            console.error('Socket not connected');
            return;
        }

        this.app.socket.emit('createTournament', { gameType, maxPlayers }, (response) => {
            if (response.success) {
                this.currentTournament = response.tournament;
                // Redirect to tournament detail page
                if (this.app.tournamentSocketHandler) {
                    this.app.tournamentSocketHandler.showTournamentDetail(response.tournament.tournamentId);
                }
            } else {
                console.error('Failed to create tournament:', response.error);
                if (this.app.modalManager) {
                    this.app.modalManager.showNotification(response.error || 'Failed to create tournament');
                }
            }
        });
    }

    joinTournament(tournamentId) {
        if (!this.app.socket || !this.app.socket.connected) {
            console.error('Socket not connected');
            return;
        }

        this.app.socket.emit('joinTournament', { tournamentId }, (response) => {
            if (response.success) {
                this.currentTournament = response.tournament;
                // Redirect to tournament detail page
                if (this.app.tournamentSocketHandler) {
                    this.app.tournamentSocketHandler.showTournamentDetail(tournamentId);
                    this.app.tournamentSocketHandler.updateTournamentsList();
                }
            } else {
                console.error('Failed to join tournament:', response.error);
                if (this.app.modalManager) {
                    this.app.modalManager.showNotification(response.error || 'Failed to join tournament');
                }
            }
        });
    }

    leaveTournament() {
        if (!this.app.socket || !this.app.socket.connected) {
            console.error('Socket not connected');
            return;
        }

        if (!this.currentTournament) {
            return;
        }

        this.app.socket.emit('leaveTournament', {}, (response) => {
            if (response.success) {
                this.currentTournament = null;
                // Go back to tournaments list
                if (this.app.viewManager) {
                    this.app.viewManager.showTournaments();
                }
                if (this.app.tournamentSocketHandler) {
                    this.app.tournamentSocketHandler.updateTournamentsList();
                }
            } else if (response.error === 'CONFIRM_REQUIRED') {
                // Show confirmation modal
                this.showLeaveTournamentConfirmModal();
            } else {
                console.error('Failed to leave tournament:', response.error);
                if (this.app.modalManager) {
                    this.app.modalManager.showNotification(response.error || 'Failed to leave tournament');
                }
            }
        });
    }
    
    showLeaveTournamentConfirmModal() {
        const modal = document.getElementById('leave-tournament-confirm-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
    
    confirmLeaveTournament() {
        if (!this.app.socket || !this.app.socket.connected) {
            console.error('Socket not connected');
            return;
        }

        if (!this.currentTournament) {
            return;
        }

        this.app.socket.emit('leaveTournamentConfirmed', { 
            tournamentId: this.currentTournament.tournamentId 
        }, (response) => {
            const modal = document.getElementById('leave-tournament-confirm-modal');
            if (modal) {
                modal.classList.add('hidden');
            }
            
            if (response.success) {
                this.currentTournament = null;
                // Go back to tournaments list
                if (this.app.viewManager) {
                    this.app.viewManager.showTournaments();
                }
                if (this.app.tournamentSocketHandler) {
                    this.app.tournamentSocketHandler.updateTournamentsList();
                }
            } else {
                console.error('Failed to leave tournament:', response.error);
                if (this.app.modalManager) {
                    this.app.modalManager.showNotification(response.error || 'Failed to leave tournament');
                }
            }
        });
    }

    isInTournament() {
        return this.currentTournament !== null;
    }

    startTournament() {
        if (!this.app.socket || !this.app.socket.connected) {
            console.error('Socket not connected');
            return;
        }

        if (!this.currentTournament) {
            return;
        }

        this.app.socket.emit('startTournament', { tournamentId: this.currentTournament.tournamentId }, (response) => {
            if (response.success) {
                this.currentTournament = response.tournament;
                if (this.app.tournamentSocketHandler) {
                    this.app.tournamentSocketHandler.updateTournamentView();
                }
            } else {
                console.error('Failed to start tournament:', response.error);
                if (this.app.modalManager) {
                    this.app.modalManager.showNotification(response.error || 'Failed to start tournament');
                }
            }
        });
    }

    setTournaments(tournaments) {
        this.tournaments = tournaments;
    }

    setCurrentTournament(tournament) {
        this.currentTournament = tournament;
    }
}
