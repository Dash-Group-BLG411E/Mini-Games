class TournamentManager {
    constructor(app) {
        this.app = app;
        this.tournaments = [];
        this.currentTournament = null;
        this.registerEventListeners();
    }

    registerEventListeners() {
        const createBtn = document.getElementById('create-tournament-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.showCreateTournamentModal();
            });
        }

        const cancelBtn = document.getElementById('cancel-create-tournament-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideCreateTournamentModal();
            });
        }

        const form = document.getElementById('create-tournament-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const tournamentName = document.getElementById('tournament-name-input').value.trim();
                const gameType = document.getElementById('tournament-game-type').value;
                const maxPlayers = parseInt(document.getElementById('tournament-max-players').value, 10);

                if (!gameType || !maxPlayers) {
                    if (this.app.modalManager) {
                        this.app.modalManager.showNotification('Please fill in all required fields.');
                    } else {
                        alert('Please fill in all required fields.');
                    }
                    return;
                }

                this.createTournament({
                    tournamentName: tournamentName || undefined,
                    gameType,
                    maxPlayers
                });
            });
        }

        // Close modal when clicking outside
        const modal = document.getElementById('create-tournament-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideCreateTournamentModal();
                }
            });
        }
    }

    showCreateTournamentModal() {
        const modal = document.getElementById('create-tournament-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideCreateTournamentModal() {
        const modal = document.getElementById('create-tournament-modal');
        if (modal) {
            modal.classList.add('hidden');
            // Reset form
            const form = document.getElementById('create-tournament-form');
            if (form) {
                form.reset();
            }
        }
    }

    createTournament(data) {
        if (!this.app.socket || !this.app.socket.connected) {
            console.error('Socket not connected');
            return;
        }

        this.app.socket.emit('createTournament', data);
    }

    joinTournament(tournamentId) {
        if (!this.app.socket || !this.app.socket.connected) {
            console.error('Socket not connected');
            return;
        }

        this.app.socket.emit('joinTournament', { tournamentId }, (error) => {
            if (error) {
                if (this.app.modalManager) {
                    this.app.modalManager.showNotification(error);
                } else {
                    alert(error);
                }
            }
        });
    }

    leaveTournament(tournamentId) {
        if (!this.app.socket || !this.app.socket.connected) {
            console.error('Socket not connected');
            return;
        }

        this.app.socket.emit('leaveTournament', { tournamentId });
    }

    startTournament(tournamentId) {
        if (!this.app.socket || !this.app.socket.connected) {
            console.error('Socket not connected');
            return;
        }

        this.app.socket.emit('startTournament', { tournamentId });
    }

    getTournaments() {
        if (!this.app.socket || !this.app.socket.connected) {
            console.error('Socket not connected');
            return;
        }

        this.app.socket.emit('getTournaments');
    }

    updateTournamentsList(tournaments) {
        this.tournaments = tournaments;
        if (this.app.tournamentRenderer) {
            this.app.tournamentRenderer.renderTournamentsList(tournaments);
        }
    }

    showPostMatchOptions(data) {
        const modal = document.getElementById('tournament-post-match-modal');
        if (!modal) return;

        const messageEl = document.getElementById('tournament-post-match-message');
        const optionsEl = document.getElementById('tournament-post-match-options');
        const activeMatchesEl = document.getElementById('tournament-active-matches');

        if (messageEl) {
            if (data.won) {
                if (data.isAdvancing) {
                    messageEl.innerHTML = `🎉 <strong>You won!</strong> You've advanced to Round ${data.nextRound}!`;
                } else {
                    messageEl.innerHTML = `🎉 <strong>Congratulations! You won the tournament!</strong> 🏆`;
                }
            } else {
                messageEl.innerHTML = `You were eliminated from the tournament.`;
            }
        }

        // Show active matches for spectating
        if (activeMatchesEl && data.activeMatches && data.activeMatches.length > 0) {
            activeMatchesEl.innerHTML = `
                <h4>Watch Other Matches:</h4>
                <div class="active-matches-list">
                    ${data.activeMatches.map(match => `
                        <div class="active-match-item">
                            <span>${match.roomName} - ${match.players.join(' vs ')}</span>
                            <button class="btn-watch-match" data-match-id="${match.matchId}">Watch</button>
                        </div>
                    `).join('')}
                </div>
            `;

            // Attach watch match listeners
            activeMatchesEl.querySelectorAll('.btn-watch-match').forEach(btn => {
                btn.addEventListener('click', () => {
                    const matchId = btn.dataset.matchId;
                    this.watchMatch(matchId);
                });
            });
        } else if (activeMatchesEl) {
            activeMatchesEl.innerHTML = '<p>No other matches available to watch.</p>';
        }

        // Show options
        if (optionsEl) {
            optionsEl.innerHTML = '';
            
            if (data.won && data.isAdvancing) {
                // Winner advancing - can watch or wait
                optionsEl.innerHTML = `
                    <button class="btn-wait-next-round" id="wait-next-round-btn">Wait for Next Round</button>
                    <button class="btn-leave-tournament" id="leave-tournament-btn">Leave Tournament</button>
                `;
                
                document.getElementById('wait-next-round-btn')?.addEventListener('click', () => {
                    this.hidePostMatchModal();
                    if (this.app.modalManager) {
                        this.app.modalManager.showNotification('Waiting for next round to start...');
                    }
                });
            } else if (data.won && !data.isAdvancing) {
                // Tournament winner
                optionsEl.innerHTML = `
                    <button class="btn-leave-tournament" id="leave-tournament-btn">Return to Lobby</button>
                `;
            } else {
                // Loser - can watch or leave
                optionsEl.innerHTML = `
                    <button class="btn-leave-tournament" id="leave-tournament-btn">Leave Tournament</button>
                `;
            }

            document.getElementById('leave-tournament-btn')?.addEventListener('click', () => {
                if (data.tournamentId) {
                    this.leaveTournament(data.tournamentId);
                }
                this.hidePostMatchModal();
                if (this.app.viewManager) {
                    this.app.viewManager.showLobby();
                }
            });
        }

        modal.classList.remove('hidden');
    }

    hidePostMatchModal() {
        const modal = document.getElementById('tournament-post-match-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    watchMatch(matchId) {
        if (!this.app.roomManager) return;
        this.hidePostMatchModal();
        this.app.roomManager.joinRoom(matchId, true); // Join as spectator
    }
}

