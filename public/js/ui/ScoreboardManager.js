

class ScoreboardManager {
    constructor(app) {
        this.app = app;
        
        this.scoreboardList = document.getElementById('scoreboard-list');
        this.badgesPanel = document.getElementById('badges-panel');
        this.badgesToggleBtn = document.getElementById('badges-toggle-btn');
        this.badgesDropdown = document.getElementById('badges-dropdown');
        this.earnedBadgesContainer = document.getElementById('earned-badges');
        this.availableBadgesContainer = document.getElementById('available-badges');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.badgesToggleBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleBadgesPanel();
        });

        document.addEventListener('click', (e) => {
            if (this.badgesPanel && !this.badgesPanel.contains(e.target) && 
                this.badgesToggleBtn && !this.badgesToggleBtn.contains(e.target)) {
                this.closeBadgesPanel();
            }
        });
    }

    

    loadLeaderboard() {
        if (!this.app.socket) return;
        this.app.socket.emit('getScoreboard', { gameType: null });
    }

    

    updateScoreboard(data) {
        if (!this.scoreboardList) return;
        this.scoreboardList.innerHTML = '';

        if (!data || data.length === 0) {
            this.scoreboardList.innerHTML = '<div class="no-scores">No scores yet. Be the first to play!</div>';
            return;
        }

        data.forEach((player, index) => {
            const rank = index + 1;
            const row = document.createElement('div');
            row.className = 'scoreboard-row';
            
            const totalGames = (player.wins || 0) + (player.losses || 0) + (player.draws || 0);
            const winRate = totalGames > 0 ? ((player.wins || 0) / totalGames * 100).toFixed(1) : '0.0';
            
            row.innerHTML = `
                <div class="rank">${rank}</div>
                <div class="username">${player.username}</div>
                <div class="stats">
                    <span class="wins">${player.wins || 0}W</span>
                    <span class="losses">${player.losses || 0}L</span>
                    <span class="draws">${player.draws || 0}D</span>
                </div>
                <div class="win-rate">${winRate}%</div>
            `;
            
            this.scoreboardList.appendChild(row);
        });
    }

    

    toggleBadgesPanel() {
        if (!this.badgesDropdown) return;
        this.badgesDropdown.classList.toggle('hidden');
        if (!this.badgesDropdown.classList.contains('hidden')) {
            this.loadUserBadges();
        }
    }

    

    closeBadgesPanel() {
        if (this.badgesDropdown) {
            this.badgesDropdown.classList.add('hidden');
        }
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
            'overall-10-wins': { emoji: '🔥', name: 'Rising Star', description: 'Win 10 games across all games' },
            'overall-50-wins': { emoji: '⚡', name: 'Champion', description: 'Win 50 games across all games' },
            'overall-100-wins': { emoji: '👑', name: 'Legend', description: 'Win 100 games across all games' },
            'veteran': { emoji: '🎖️', name: 'Veteran', description: 'Play 50 games across all games' },
            'legend': { emoji: '🏅', name: 'Hall of Fame', description: 'Play 100 games across all games' }
        };
    }

    

    displayBadges(earnedBadges = []) {
        if (!this.earnedBadgesContainer || !this.availableBadgesContainer) return;
        
        const allBadges = this.getAllBadges();
        const earnedSet = new Set(earnedBadges);
        
        this.earnedBadgesContainer.innerHTML = '';
        this.availableBadgesContainer.innerHTML = '';
        
        if (earnedBadges.length === 0) {
            this.earnedBadgesContainer.innerHTML = '<div class="no-badges">No badges earned yet. Play games to earn badges!</div>';
        } else {
            earnedBadges.forEach(badgeId => {
                const badge = allBadges[badgeId];
                if (badge) {
                    const badgeElement = this.createBadgeElement(badge, true);
                    this.earnedBadgesContainer.appendChild(badgeElement);
                }
            });
        }
        
        Object.keys(allBadges).forEach(badgeId => {
            if (!earnedSet.has(badgeId)) {
                const badge = allBadges[badgeId];
                const badgeElement = this.createBadgeElement(badge, false);
                this.availableBadgesContainer.appendChild(badgeElement);
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
        if (!badges || badges.length === 0) return '';
        
        const badgeMap = {
            'tmm-first-win': { emoji: '🎯', name: 'First TMM Win' },
            'tmm-10-wins': { emoji: '⭐', name: 'TMM 10 Wins' },
            'tmm-50-wins': { emoji: '🌟', name: 'TMM 50 Wins' },
            'tmm-100-wins': { emoji: '💎', name: 'TMM Master' },
            'tmm-80-percent': { emoji: '🏆', name: 'TMM Expert' },
            'memory-first-win': { emoji: '🎯', name: 'First Memory Win' },
            'memory-10-wins': { emoji: '⭐', name: 'Memory 10 Wins' },
            'memory-50-wins': { emoji: '🌟', name: 'Memory 50 Wins' },
            'memory-100-wins': { emoji: '💎', name: 'Memory Master' },
            'memory-80-percent': { emoji: '🏆', name: 'Memory Expert' },
            'overall-10-wins': { emoji: '🔥', name: 'Rising Star' },
            'overall-50-wins': { emoji: '⚡', name: 'Champion' },
            'overall-100-wins': { emoji: '👑', name: 'Legend' },
            'veteran': { emoji: '🎖️', name: 'Veteran' },
            'legend': { emoji: '🏅', name: 'Hall of Fame' }
        };
        
        const badgeElements = badges.slice(0, 5).map(badgeId => {
            const badge = badgeMap[badgeId] || { emoji: '🏅', name: badgeId };
            return `<span class="badge" title="${badge.name}">
                <span class="badge-emoji">${badge.emoji}</span>
                <span class="badge-name">${badge.name}</span>
            </span>`;
        }).join('');
        
        const moreBadges = badges.length > 5 ? `<span class="badge-more" title="${badges.slice(5).map(b => badgeMap[b]?.name || b).join(', ')}">+${badges.length - 5}</span>` : '';
        
        return `<div class="badges-container">${badgeElements}${moreBadges}</div>`;
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
