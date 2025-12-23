

class ScoreboardManager {
    constructor(app) {
        this.app = app;
        
        this.scoreboardList = document.getElementById('scoreboard-list');
        this.earnedBadgesContainer = document.getElementById('profile-earned-badges');
        this.availableBadgesContainer = document.getElementById('profile-available-badges');
        this.modalEarnedBadges = document.getElementById('modal-earned-badges');
        this.modalAvailableBadges = document.getElementById('modal-available-badges');
        this.viewEarnedBadgesBtn = document.getElementById('view-earned-badges-btn');
        this.viewAvailableBadgesBtn = document.getElementById('view-available-badges-btn');
        this.earnedBadgesModal = document.getElementById('earned-badges-modal');
        this.availableBadgesModal = document.getElementById('available-badges-modal');
        this.closeEarnedBadgesBtn = document.getElementById('close-earned-badges-btn');
        this.closeAvailableBadgesBtn = document.getElementById('close-available-badges-btn');
        
        this.setupBadgeModalListeners();
    }

    setupBadgeModalListeners() {
        // Re-bind elements in case they weren't available during construction
        this.viewEarnedBadgesBtn = document.getElementById('view-earned-badges-btn');
        this.viewAvailableBadgesBtn = document.getElementById('view-available-badges-btn');
        this.earnedBadgesModal = document.getElementById('earned-badges-modal');
        this.availableBadgesModal = document.getElementById('available-badges-modal');
        this.closeEarnedBadgesBtn = document.getElementById('close-earned-badges-btn');
        this.closeAvailableBadgesBtn = document.getElementById('close-available-badges-btn');
        
        this.viewEarnedBadgesBtn?.addEventListener('click', () => this.showEarnedBadgesModal());
        this.viewAvailableBadgesBtn?.addEventListener('click', () => this.showAvailableBadgesModal());
        this.closeEarnedBadgesBtn?.addEventListener('click', () => this.hideEarnedBadgesModal());
        this.closeAvailableBadgesBtn?.addEventListener('click', () => this.hideAvailableBadgesModal());
        
        this.earnedBadgesModal?.addEventListener('click', (e) => {
            if (e.target === this.earnedBadgesModal) {
                this.hideEarnedBadgesModal();
            }
        });
        
        this.availableBadgesModal?.addEventListener('click', (e) => {
            if (e.target === this.availableBadgesModal) {
                this.hideAvailableBadgesModal();
            }
        });
    }

    showEarnedBadgesModal() {
        console.log('[ScoreboardManager] showEarnedBadgesModal called');
        if (this.earnedBadgesModal) {
            this.earnedBadgesModal.classList.remove('hidden');
            
            // Check if modal content is empty or only has whitespace
            if (this.modalEarnedBadges) {
                const currentContent = this.modalEarnedBadges.innerHTML.trim();
                console.log('[ScoreboardManager] Current modal content:', currentContent);
                console.log('[ScoreboardManager] Modal content length:', currentContent.length);
                
                // If modal content is empty, show the "no badges" message
                if (currentContent === '' || currentContent === null) {
                    console.log('[ScoreboardManager] Modal is empty, showing no badges message');
                    this.modalEarnedBadges.innerHTML = '<div class="no-badges">You don\'t have any badges.<br>Play games to win some!</div>';
                }
            } else {
                console.warn('[ScoreboardManager] modalEarnedBadges element not found!');
            }
        } else {
            console.warn('[ScoreboardManager] earnedBadgesModal element not found!');
        }
    }

    hideEarnedBadgesModal() {
        if (this.earnedBadgesModal) {
            this.earnedBadgesModal.classList.add('hidden');
        }
    }

    showAvailableBadgesModal() {
        if (this.availableBadgesModal) {
            this.availableBadgesModal.classList.remove('hidden');
        }
    }

    hideAvailableBadgesModal() {
        if (this.availableBadgesModal) {
            this.availableBadgesModal.classList.add('hidden');
        }
    }

    loadLeaderboard() {
        if (!this.app.socket) return;
        this.app.socket.emit('getScoreboard', { gameType: null });
    }

    

    loadUserBadges() {
        if (!this.app.socket) return;
        this.app.socket.emit('getUserBadges');
    }

    

    getAllBadges() {
        return {
            'tmm-first-win': { emoji: '🎯', name: 'First TMM Win', description: 'Win your first game of Three Men\'s Morris' },
            'tmm-10-wins': { emoji: '⭐', name: 'TMM 10 Wins', description: 'Win 10 games of Three Men\'s Morris' },
            'tmm-50-wins': { emoji: '🌟', name: 'TMM 50 Wins', description: 'Win 50 games of Three Men\'s Morris' },
            'tmm-100-wins': { emoji: '💎', name: 'TMM Master', description: 'Win 100 games of Three Men\'s Morris' },
            'tmm-80-percent': { emoji: '🏆', name: 'TMM Expert', description: 'Achieve 80% win rate in Three Men\'s Morris (min 10 games)' },
            'memory-first-win': { emoji: '🎯', name: 'First Memory Win', description: 'Win your first game of Memory Match' },
            'memory-10-wins': { emoji: '⭐', name: 'Memory 10 Wins', description: 'Win 10 games of Memory Match' },
            'memory-50-wins': { emoji: '🌟', name: 'Memory 50 Wins', description: 'Win 50 games of Memory Match' },
            'memory-100-wins': { emoji: '💎', name: 'Memory Master', description: 'Win 100 games of Memory Match' },
            'memory-80-percent': { emoji: '🏆', name: 'Memory Expert', description: 'Achieve 80% win rate in Memory Match (min 10 games)' },
            'battleship-first-win': { emoji: '🎯', name: 'First Battleship Win', description: 'Win your first game of Battleship' },
            'battleship-10-wins': { emoji: '⭐', name: 'Battleship 10 Wins', description: 'Win 10 games of Battleship' },
            'battleship-50-wins': { emoji: '🌟', name: 'Battleship 50 Wins', description: 'Win 50 games of Battleship' },
            'battleship-100-wins': { emoji: '💎', name: 'Battleship Master', description: 'Win 100 games of Battleship' },
            'battleship-80-percent': { emoji: '🏆', name: 'Battleship Expert', description: 'Achieve 80% win rate in Battleship (min 10 games)' },
            'overall-10-wins': { emoji: '🔥', name: 'Rising Star', description: 'Win 10 games across all games' },
            'overall-50-wins': { emoji: '⚡', name: 'Champion', description: 'Win 50 games across all games' },
            'overall-100-wins': { emoji: '👑', name: 'Legend', description: 'Win 100 games across all games' },
            'veteran': { emoji: '🎖️', name: 'Veteran', description: 'Play 50 games across all games' },
            'legend': { emoji: '🏅', name: 'Hall of Fame', description: 'Play 100 games across all games' }
        };
    }

    

    displayBadges(earnedBadges = []) {
        console.log('[ScoreboardManager] displayBadges called with:', earnedBadges);
        const allBadges = this.getAllBadges();
        
        // Normalize earnedBadges - ensure it's an array
        const normalizedBadges = Array.isArray(earnedBadges) ? earnedBadges : [];
        const earnedSet = new Set(normalizedBadges);
        
        console.log('[ScoreboardManager] Normalized badges:', normalizedBadges);
        console.log('[ScoreboardManager] Badge count:', normalizedBadges.length);
        
        // Clear all containers
        if (this.earnedBadgesContainer) this.earnedBadgesContainer.innerHTML = '';
        if (this.availableBadgesContainer) this.availableBadgesContainer.innerHTML = '';
        if (this.modalEarnedBadges) this.modalEarnedBadges.innerHTML = '';
        if (this.modalAvailableBadges) this.modalAvailableBadges.innerHTML = '';
        
        // Display earned badges in modal
        if (normalizedBadges.length === 0) {
            console.log('[ScoreboardManager] No badges, showing empty message');
            if (this.modalEarnedBadges) {
                this.modalEarnedBadges.innerHTML = '<div class="no-badges">You don\'t have any badges.<br>Play games to win some!</div>';
                console.log('[ScoreboardManager] Set empty message in modal');
            } else {
                console.warn('[ScoreboardManager] modalEarnedBadges element not found!');
            }
        } else {
            console.log('[ScoreboardManager] Displaying', normalizedBadges.length, 'badges');
            normalizedBadges.forEach(badgeId => {
                const badge = allBadges[badgeId];
                if (badge) {
                    const badgeElement = this.createBadgeElement(badge, true);
                    if (this.modalEarnedBadges) {
                        this.modalEarnedBadges.appendChild(badgeElement.cloneNode(true));
                    }
                }
            });
        }
        
        // Display available badges in modal
        Object.keys(allBadges).forEach(badgeId => {
            if (!earnedSet.has(badgeId)) {
                const badge = allBadges[badgeId];
                const badgeElement = this.createBadgeElement(badge, false);
                if (this.modalAvailableBadges) {
                    this.modalAvailableBadges.appendChild(badgeElement);
                }
            }
        });
    }

    

    createBadgeElement(badge, earned) {
        const badgeDiv = document.createElement('div');
        badgeDiv.className = `badge-item ${earned ? 'earned' : 'available'}`;
        badgeDiv.innerHTML = `
            <div class="badge-icon">${badge.emoji}</div>
            <div class="badge-info">
                <div class="badge-name">${badge.name}</div>
                <div class="badge-description">${badge.description}</div>
            </div>
        `;
        return badgeDiv;
    }

    

    getBadgeDisplay(badges) {
        // Badges removed from leaderboard - return empty string
        return '';
    }

    

    updateScoreboard(data) {
        if (!this.scoreboardList) return;
        
        this.scoreboardList.innerHTML = '';
        if (!data || data.length === 0) {
            this.scoreboardList.innerHTML = '<div class="no-scores">No games played yet! Be the first to play.</div>';
            return;
        }

        data.forEach((player, index) => {
            const rank = index + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            const playerElement = document.createElement('div');
            playerElement.className = 'scoreboard-item';
            const badgesHtml = this.getBadgeDisplay(player.badges);
            playerElement.innerHTML = `
                <div class="rank">${medal}</div>
                <div class="player-info">
                    <div class="player-header">
                        <h3>${player.username}</h3>
                        ${badgesHtml}
                    </div>
                    <p>Games: ${player.totalGames} | Win Rate: ${player.winRate}%</p>
                </div>
                <div class="stats">
                    <div class="stat">
                        <span class="stat-label">Wins</span>
                        <span class="stat-value wins">${player.wins}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Losses</span>
                        <span class="stat-value losses">${player.losses}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Draws</span>
                        <span class="stat-value draws">${player.draws}</span>
                    </div>
                </div>
            `;
            this.scoreboardList.appendChild(playerElement);
        });
    }

    

    waitForBadgesAndShowLobby() {
        return new Promise((resolve) => {
            let badgesReceived = false;
            let timeoutId = null;
            
            const initialBadgesHandler = (data) => {
                if (!badgesReceived) {
                    badgesReceived = true;
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                        timeoutId = null;
                    }
                    this.app.socket.off('userBadges', initialBadgesHandler);
                    
                    this.displayBadges(data.badges || []);
                    
                    if (this.app.viewManager) {
                        this.app.viewManager.showLobby();
                    }
                    resolve();
                }
            };
            
            this.app.socket.once('userBadges', initialBadgesHandler);
            
            if (this.app.socket && this.app.socket.connected) {
                this.loadUserBadges();
            } else {
                this.app.socket.once('connect', () => {
                    this.loadUserBadges();
                });
            }
            
            timeoutId = setTimeout(() => {
                if (!badgesReceived) {
                    console.warn('Badges loading timeout, showing lobby anyway');
                    this.app.socket.off('userBadges', initialBadgesHandler);
                    if (this.app.viewManager) {
                        this.app.viewManager.showLobby();
                    }
                    resolve();
                }
            }, 3000);
        });
    }
}
