class TournamentSocketHandler {
    constructor(app) {
        this.app = app;
        this.bracketRenderer = new TournamentBracketRenderer();
    }

    registerHandlers(socket) {
        // Store reference to socket handler on app
        this.app.tournamentSocketHandler = this;

        socket.on('tournamentListUpdate', (tournaments) => {
            if (this.app.tournamentManager) {
                this.app.tournamentManager.setTournaments(tournaments);
                this.updateTournamentsList();
            }
        });

        socket.on('tournamentUpdate', (tournament) => {
            if (this.app.tournamentManager) {
                // Check if current user is in this tournament
                const isInTournament = tournament.players && tournament.players.some(p => p.username === this.app.currentUser);
                if (isInTournament) {
                    this.app.tournamentManager.setCurrentTournament(tournament);
                    // Update tournament detail if viewing it
                    const detailView = document.getElementById('tournament-detail-container');
                    if (detailView && !detailView.classList.contains('hidden') && detailView.style.display !== 'none') {
                        this.renderTournamentDetail(tournament);
                    }
                }
                // Always update the tournaments list
                this.updateTournamentsList();
            }
        });

        socket.on('tournamentStarted', (tournament) => {
            if (this.app.tournamentManager) {
                this.app.tournamentManager.setCurrentTournament(tournament);
                // Update tournament detail if viewing it
                const detailView = document.getElementById('tournament-detail-container');
                if (detailView && !detailView.classList.contains('hidden') && detailView.style.display !== 'none') {
                    this.renderTournamentDetail(tournament);
                }
            }
            // Update info div instead of modal
            this.updateTournamentInfo('Tournament starting in 3...');
            let countdown = 3;
            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    this.updateTournamentInfo(`Tournament starting in ${countdown}...`);
                } else {
                    this.updateTournamentInfo('Tournament in progress - Round 1');
                    clearInterval(countdownInterval);
                }
            }, 1000);
        });

        socket.on('tournamentMatchStart', (data) => {
            // Handle match start - players will be redirected to game room
            // Update info div if on tournament detail page
            const detailView = document.getElementById('tournament-detail-container');
            if (detailView && !detailView.classList.contains('hidden') && detailView.style.display !== 'none') {
                this.updateTournamentInfo(`Match starting: ${data.player1} vs ${data.player2}`);
            }
            // The room socket handler will handle the actual game room joining
        });

        socket.on('tournamentMatchNextGame', (data) => {
            // Handle next game in mixed mode - update info div
            const scores = data.scores ? ` (${data.scores[data.player1] || 0}-${data.scores[data.player2] || 0})` : '';
            const detailView = document.getElementById('tournament-detail-container');
            if (detailView && !detailView.classList.contains('hidden') && detailView.style.display !== 'none') {
                this.updateTournamentInfo(`Next game: ${data.gameType}${scores}`);
            }
            // Update tournament room flag
            if (data.roomId) {
                this.app.isTournamentRoom = true;
                this.app.tournamentId = data.tournamentId;
                this.app.matchId = data.matchId;
            }
        });

        socket.on('tournamentRoundComplete', (data) => {
            if (this.app.tournamentManager) {
                this.app.tournamentManager.setCurrentTournament(data.tournament);
                // Update tournament detail if viewing it
                const detailView = document.getElementById('tournament-detail-container');
                if (detailView && !detailView.classList.contains('hidden') && detailView.style.display !== 'none') {
                    this.updateTournamentInfo(`Round ${data.roundNumber} complete! Next round starting...`);
                    this.renderTournamentDetail(data.tournament);
                }
            }
        });

        socket.on('tournamentFinished', (data) => {
            if (this.app.tournamentManager) {
                this.app.tournamentManager.currentTournament = null;
                this.updateTournamentsList();
                // If viewing tournament detail, update it to show finished state
                const detailView = document.getElementById('tournament-detail-container');
                if (detailView && !detailView.classList.contains('hidden') && detailView.style.display !== 'none') {
                    this.updateTournamentInfo(`Tournament finished! Winner: ${data.winner} 🎉`);
                    if (data.tournament) {
                        this.renderTournamentDetail(data.tournament);
                    }
                }
            }
        });

        socket.on('tournamentDeleted', (data) => {
            // Tournament was deleted by owner - redirect to tournaments page
            if (this.app.tournamentManager) {
                this.app.tournamentManager.currentTournament = null;
            }
            if (this.app.viewManager) {
                this.app.viewManager.showTournaments();
            }
            // No modal - just redirect (info will be shown on tournaments page if needed)
        });

        socket.on('tournamentMatchFinished', (data) => {
            // Match finished - update info and redirect to tournament detail page
            const winnerName = data.winner || 'Unknown';
            this.updateTournamentInfo(`Game finished! Winner: ${winnerName} 🎉`);
            if (this.app.tournamentManager && this.app.viewManager) {
                // Clear room state
                this.app.currentRoom = null;
                this.app.currentRoomName = null;
                this.app.gameState = null;
                this.app.myRole = null;
                this.app.isSpectator = false;
                this.app.isTournamentRoom = false;
                this.app.tournamentId = null;
                this.app.matchId = null;
                this.app.viewManager.showTournamentDetail(data.tournamentId);
            }
        });

        socket.on('tournamentRoomLeft', (data) => {
            // Player left tournament room - redirect to tournament detail page
            if (this.app.tournamentManager && this.app.viewManager) {
                this.app.viewManager.showTournamentDetail(data.tournamentId);
            }
        });

        socket.on('tournamentPlayerLeft', (data) => {
            // Another player left tournament - update view
            if (this.app.tournamentManager && this.app.viewManager) {
                const detailView = document.getElementById('tournament-detail-container');
                if (detailView && !detailView.classList.contains('hidden') && detailView.style.display !== 'none') {
                    // Refresh tournament data
                    if (this.app.tournamentManager.currentTournament) {
                        this.renderTournamentDetail(this.app.tournamentManager.currentTournament);
                    }
                }
            }
        });

        // Fetch tournaments will be done when tournaments view is shown
    }

    updateTournamentsList() {
        const container = document.getElementById('tournaments-list');
        if (!container) return;

        const tournaments = this.app.tournamentManager?.tournaments || [];

        if (tournaments.length === 0) {
            container.innerHTML = `
                <div class="no-tournaments">
                    <button id="no-tournaments-create-btn" class="btn-primary tournament-create-btn">Create Tournament</button>
                    <p>No active tournaments. Create one to get started!</p>
                </div>
            `;
            // Hide the fixed create button when showing inline one
            const fixedBtn = document.getElementById('tournament-create-btn');
            if (fixedBtn) fixedBtn.style.display = 'none';
            // Add click listener to inline button
            const inlineBtn = document.getElementById('no-tournaments-create-btn');
            if (inlineBtn) {
                inlineBtn.addEventListener('click', () => {
                    const modal = document.getElementById('create-tournament-modal');
                    if (modal) {
                        modal.classList.remove('hidden');
                    }
                });
            }
            return;
        }

        // Show the fixed create button when there are tournaments
        const fixedBtn = document.getElementById('tournament-create-btn');
        if (fixedBtn) fixedBtn.style.display = 'block';

        container.innerHTML = tournaments.map(tournament => {
            const gameTypeDisplay = this.getGameTypeDisplay(tournament.gameType);
            const statusBadge = this.getStatusBadge(tournament.status);
            const canJoin = tournament.status === 'waiting' &&
                tournament.currentPlayers < tournament.maxPlayers &&
                !this.isPlayerInTournament(tournament);

            return `
                <div class="tournament-item">
                    <div class="tournament-info">
                        <div class="tournament-info-header">
                            <h3>Tournament #${tournament.tournamentId} ${statusBadge}</h3>
                        </div>
                        <p><strong>Game:</strong> ${gameTypeDisplay}</p>
                        <p><strong>Players:</strong> ${tournament.currentPlayers}/${tournament.maxPlayers}</p>
                    </div>
                    <div class="tournament-actions">
                        ${canJoin ? `<button class="btn-join-tournament join-btn" data-tournament-id="${tournament.tournamentId}" data-as-spectator="false">Join Tournament</button>` : '<button class="btn-view-tournament spectate-btn" data-tournament-id="${tournament.tournamentId}" data-as-spectator="true">Join as Spectator</button>'}
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners
        container.querySelectorAll('.btn-view-tournament').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tournamentId = parseInt(e.target.dataset.tournamentId);
                // View button acts like Join as Spectator
                if (this.app.tournamentSocketHandler) {
                    this.app.tournamentSocketHandler.showTournamentDetail(tournamentId);
                }
            });
        });

        container.querySelectorAll('.btn-join-tournament').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tournamentId = parseInt(e.target.dataset.tournamentId);
                const asSpectator = e.target.dataset.asSpectator === 'true';
                // For now, tournaments don't support spectators - treat as player join
                this.app.tournamentManager.joinTournament(tournamentId);
            });
        });

        // Removed btn-spectate-tournament event listener - button no longer exists
    }

    showTournamentDetail(tournamentId) {
        const tournament = this.app.tournamentManager?.tournaments.find(t => t.tournamentId === tournamentId);
        if (!tournament) {
            // Fetch tournament details from server
            if (this.app.socket && this.app.socket.connected) {
                this.app.socket.emit('getTournament', { tournamentId }, (response) => {
                    if (response && response.success) {
                        this.renderTournamentDetail(response.tournament);
                    }
                });
            }
            return;
        }
        this.renderTournamentDetail(tournament);
    }

    renderTournamentDetail(tournament) {
        if (this.app.viewManager) {
            this.app.viewManager.showView('tournament-detail');
            // Update lobby chat title to Tournament Chat
            this.app.viewManager.updateLobbyChatTitle(true);
        }
        const container = document.getElementById('tournament-detail-view');
        if (!container) return;

        // Update current tournament in manager
        if (this.app.tournamentManager) {
            this.app.tournamentManager.setCurrentTournament(tournament);
        }

        const gameTypeDisplay = this.getGameTypeDisplay(tournament.gameType);
        const statusBadge = this.getStatusBadge(tournament.status);
        const isPlayerInTournament = this.isPlayerInTournament(tournament);
        const canJoin = tournament.status === 'waiting' &&
            tournament.currentPlayers < tournament.maxPlayers &&
            !isPlayerInTournament;
        const canStart = tournament.status === 'waiting' &&
            tournament.currentPlayers === tournament.maxPlayers &&
            tournament.creatorUsername === this.app.currentUser;
        const isWaiting = tournament.status === 'waiting';

        // Create a set of player usernames for quick lookup
        const playerUsernames = new Set();
        tournament.players.forEach(p => {
            const username = typeof p === 'string' ? p : (p.username || p);
            if (username) playerUsernames.add(username);
        });

        // Render bracket using SVG
        const bracketContainer = document.createElement('div');
        bracketContainer.className = 'tournament-bracket-container';
        if (this.bracketRenderer) {
            this.bracketRenderer.renderBracket(tournament, bracketContainer);
        } else {
            bracketContainer.innerHTML = '<p>Bracket renderer not initialized</p>';
        }
        const bracketHtml = bracketContainer.outerHTML;

        let waitingInfoHtml = '';
        if (isWaiting) {
            waitingInfoHtml = `
                <div class="tournament-waiting-info">
                    <p>Waiting for more players to join... (${tournament.currentPlayers}/${tournament.maxPlayers})</p>
                </div>
            `;
        }

        // Update tournament info div
        const tournamentInfoText = document.getElementById('tournament-info-text');
        if (tournamentInfoText) {
            if (isWaiting) {
                tournamentInfoText.textContent = `Waiting for more players to join... (${tournament.currentPlayers}/${tournament.maxPlayers})`;
            } else if (tournament.status === 'in-progress') {
                tournamentInfoText.textContent = `Tournament in progress - Round ${tournament.currentRound}/${tournament.totalRounds}`;
            } else if (tournament.status === 'finished') {
                tournamentInfoText.textContent = tournament.winner ? `Tournament finished! Winner: ${tournament.winner} 🎉` : 'Tournament finished!';
            } else {
                tournamentInfoText.textContent = 'Tournament';
            }
        }

        // Don't show tournament-detail-actions div (removed completely)
        container.innerHTML = `
            <div class="tournament-details">
                ${bracketHtml}
            </div>
        `;

        // Show/hide leave button
        const leaveBtn = document.getElementById('tournament-leave-btn');
        if (leaveBtn) {
            if (isPlayerInTournament) {
                leaveBtn.style.display = 'block';
            } else {
                leaveBtn.style.display = 'none';
            }
        }
    }

    updateTournamentView() {
        // This method is kept for backwards compatibility but is not used for the main tournaments list
        // Tournament details are now shown in a separate view via showTournamentDetail
    }

    getGameTypeDisplay(gameType) {
        const gameTypes = {
            'three-mens-morris': 'Three Men\'s Morris',
            'battleship': 'Battleship',
            'memory-match': 'Memory Match',
            'mixed': 'Mixed (All Games)'
        };
        return gameTypes[gameType] || gameType;
    }

    getStatusBadge(status) {
        const badges = {
            'waiting': '<span class="status-badge status-waiting">Waiting</span>',
            'in-progress': '<span class="status-badge status-in-progress">In Progress</span>',
            'finished': '<span class="status-badge status-finished">Finished</span>'
        };
        return badges[status] || '';
    }

    isPlayerInTournament(tournament) {
        if (!this.app.currentUser || !tournament.players) return false;
        return tournament.players.some(p => p.username === this.app.currentUser);
    }

    updateTournamentInfo(message) {
        const tournamentInfoText = document.getElementById('tournament-info-text');
        if (tournamentInfoText) {
            tournamentInfoText.textContent = message;
        }
    }
}
