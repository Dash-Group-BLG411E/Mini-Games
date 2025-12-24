class TournamentRenderer {
    constructor(app) {
        this.app = app;
    }

    renderTournamentsList(tournaments) {
        const container = document.getElementById('tournaments-list');
        if (!container) return;

        if (tournaments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No active tournaments. Create one to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = tournaments.map(tournament => {
            const isCreator = tournament.creatorUsername === this.app.currentUser;
            const isParticipant = tournament.players.some(p => p.username === this.app.currentUser);
            const canJoin = !isParticipant && tournament.status === 'waiting' && tournament.currentPlayers < tournament.maxPlayers;
            const canStart = isCreator && tournament.status === 'waiting' && tournament.currentPlayers === tournament.maxPlayers;

            const gameTypeNames = {
                'three-mens-morris': 'Three Men\'s Morris',
                'battleship': 'Battleship',
                'memory-match': 'Memory Match'
            };

            const statusLabels = {
                'waiting': 'Waiting for Players',
                'in-progress': 'In Progress',
                'finished': 'Finished'
            };

            return `
                <div class="tournament-card">
                    <div class="tournament-header">
                        <h3>${tournament.tournamentName}</h3>
                        <span class="tournament-status tournament-status-${tournament.status}">${statusLabels[tournament.status] || tournament.status}</span>
                    </div>
                    <div class="tournament-info">
                        <div class="tournament-info-item">
                            <strong>Game:</strong> ${gameTypeNames[tournament.gameType] || tournament.gameType}
                        </div>
                        <div class="tournament-info-item">
                            <strong>Players:</strong> ${tournament.currentPlayers}/${tournament.maxPlayers}
                        </div>
                        <div class="tournament-info-item">
                            <strong>Creator:</strong> ${tournament.creatorUsername}
                        </div>
                        ${tournament.winner ? `<div class="tournament-info-item"><strong>Winner:</strong> ${tournament.winner}</div>` : ''}
                    </div>
                    <div class="tournament-players">
                        <strong>Participants:</strong>
                        <div class="tournament-players-list">
                            ${tournament.players.map(p => `<span class="tournament-player">${p.username}</span>`).join('')}
                        </div>
                    </div>
                    <div class="tournament-actions">
                        ${canJoin ? `<button class="btn-join-tournament" data-tournament-id="${tournament.tournamentId}">Join Tournament</button>` : ''}
                        ${canStart ? `<button class="btn-start-tournament" data-tournament-id="${tournament.tournamentId}">Start Tournament</button>` : ''}
                        ${isParticipant && tournament.status === 'waiting' ? `<button class="btn-leave-tournament" data-tournament-id="${tournament.tournamentId}">Leave Tournament</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Attach event listeners
        container.querySelectorAll('.btn-join-tournament').forEach(btn => {
            btn.addEventListener('click', () => {
                const tournamentId = parseInt(btn.dataset.tournamentId, 10);
                if (this.app.tournamentManager && !isNaN(tournamentId)) {
                    this.app.tournamentManager.joinTournament(tournamentId);
                }
            });
        });

        container.querySelectorAll('.btn-start-tournament').forEach(btn => {
            btn.addEventListener('click', () => {
                const tournamentId = parseInt(btn.dataset.tournamentId, 10);
                if (this.app.tournamentManager && !isNaN(tournamentId)) {
                    this.app.tournamentManager.startTournament(tournamentId);
                }
            });
        });

        container.querySelectorAll('.btn-leave-tournament').forEach(btn => {
            btn.addEventListener('click', () => {
                const tournamentId = parseInt(btn.dataset.tournamentId, 10);
                if (this.app.tournamentManager && !isNaN(tournamentId)) {
                    this.app.tournamentManager.leaveTournament(tournamentId);
                }
            });
        });
    }
}

