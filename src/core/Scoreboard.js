const GameStats = require('../models/GameStats');
const { normalizeGameType } = require('../utils/gameTypeUtils');

class Scoreboard {
    async recordGameResult(winner, players, gameType = 'three-mens-morris') {
        const player1 = players[0];
        const player2 = players[1];
        const normalizedGameType = normalizeGameType(gameType);

        try {
            const winnerPlayer = players.find(p => p.role === winner);
            const loserPlayer = players.find(p => p.role !== winner);

            await Promise.all([
                this.updateStats(winnerPlayer.username, { wins: 1 }, normalizedGameType),
                this.updateStats(loserPlayer.username, { losses: 1 }, normalizedGameType)
            ]);
        } catch (error) {
            console.error('Error recording game result:', error);
        }
    }

    async updateStats(username, increment, gameType = null) {
        try {
            const usernameLower = username.toLowerCase();
            const $inc = {};
            
            if (increment.wins) {
                $inc.wins = increment.wins;
            }
            if (increment.losses) {
                $inc.losses = increment.losses;
            }
            if (increment.draws) {
                $inc.draws = increment.draws;
            }

            if (gameType) {
                if (increment.wins) {
                    $inc[`${gameType}.wins`] = increment.wins;
                }
                if (increment.losses) {
                    $inc[`${gameType}.losses`] = increment.losses;
                }
                if (increment.draws) {
                    $inc[`${gameType}.draws`] = increment.draws;
                }
            }

            const updatedStats = await GameStats.findOneAndUpdate(
                { username: usernameLower },
                { $inc, $setOnInsert: { badges: [] } },
                { upsert: true, new: true }
            );

            if (updatedStats) {
                await this.checkAndAwardBadges(usernameLower, gameType);
            }
        } catch (error) {
            console.error('Error updating stats:', error);
            throw error;
        }
    }

    async checkAndAwardBadges(username, gameType) {
        try {
            const stats = await GameStats.findOne({ username: username.toLowerCase() });
            if (!stats) return;

            const badges = new Set(stats.badges || []);
            let newBadges = [];

            const gameStats = stats[gameType] || { wins: 0, losses: 0, draws: 0 };
            const totalGames = gameStats.wins + gameStats.losses + gameStats.draws;

            if (gameType === 'threeMensMorris') {
                if (gameStats.wins >= 1 && !badges.has('tmm-first-win')) {
                    badges.add('tmm-first-win');
                    newBadges.push('tmm-first-win');
                }
                if (gameStats.wins >= 10 && !badges.has('tmm-10-wins')) {
                    badges.add('tmm-10-wins');
                    newBadges.push('tmm-10-wins');
                }
                if (gameStats.wins >= 50 && !badges.has('tmm-50-wins')) {
                    badges.add('tmm-50-wins');
                    newBadges.push('tmm-50-wins');
                }
                if (gameStats.wins >= 100 && !badges.has('tmm-100-wins')) {
                    badges.add('tmm-100-wins');
                    newBadges.push('tmm-100-wins');
                }
                if (totalGames >= 10 && gameStats.wins / totalGames >= 0.8 && !badges.has('tmm-80-percent')) {
                    badges.add('tmm-80-percent');
                    newBadges.push('tmm-80-percent');
                }
            } else if (gameType === 'memoryMatch') {
                if (gameStats.wins >= 1 && !badges.has('memory-first-win')) {
                    badges.add('memory-first-win');
                    newBadges.push('memory-first-win');
                }
                if (gameStats.wins >= 10 && !badges.has('memory-10-wins')) {
                    badges.add('memory-10-wins');
                    newBadges.push('memory-10-wins');
                }
                if (gameStats.wins >= 50 && !badges.has('memory-50-wins')) {
                    badges.add('memory-50-wins');
                    newBadges.push('memory-50-wins');
                }
                if (gameStats.wins >= 100 && !badges.has('memory-100-wins')) {
                    badges.add('memory-100-wins');
                    newBadges.push('memory-100-wins');
                }
                if (totalGames >= 10 && gameStats.wins / totalGames >= 0.8 && !badges.has('memory-80-percent')) {
                    badges.add('memory-80-percent');
                    newBadges.push('memory-80-percent');
                }
            } else if (gameType === 'battleship') {
                if (gameStats.wins >= 1 && !badges.has('battleship-first-win')) {
                    badges.add('battleship-first-win');
                    newBadges.push('battleship-first-win');
                }
                if (gameStats.wins >= 10 && !badges.has('battleship-10-wins')) {
                    badges.add('battleship-10-wins');
                    newBadges.push('battleship-10-wins');
                }
                if (gameStats.wins >= 50 && !badges.has('battleship-50-wins')) {
                    badges.add('battleship-50-wins');
                    newBadges.push('battleship-50-wins');
                }
                if (gameStats.wins >= 100 && !badges.has('battleship-100-wins')) {
                    badges.add('battleship-100-wins');
                    newBadges.push('battleship-100-wins');
                }
                if (totalGames >= 10 && gameStats.wins / totalGames >= 0.8 && !badges.has('battleship-80-percent')) {
                    badges.add('battleship-80-percent');
                    newBadges.push('battleship-80-percent');
                }
            }

            const overallWins = stats.wins || 0;
            const overallGames = (stats.wins || 0) + (stats.losses || 0) + (stats.draws || 0);
            
            if (overallWins >= 10 && !badges.has('overall-10-wins')) {
                badges.add('overall-10-wins');
                newBadges.push('overall-10-wins');
            }
            if (overallWins >= 50 && !badges.has('overall-50-wins')) {
                badges.add('overall-50-wins');
                newBadges.push('overall-50-wins');
            }
            if (overallWins >= 100 && !badges.has('overall-100-wins')) {
                badges.add('overall-100-wins');
                newBadges.push('overall-100-wins');
            }
            if (overallGames >= 50 && !badges.has('veteran')) {
                badges.add('veteran');
                newBadges.push('veteran');
            }
            if (overallGames >= 100 && !badges.has('legend')) {
                badges.add('legend');
                newBadges.push('legend');
            }

            if (newBadges.length > 0) {
                await GameStats.findOneAndUpdate(
                    { username: username.toLowerCase() },
                    { $set: { badges: Array.from(badges) } }
                );
            }
        } catch (error) {
            console.error('Error checking badges:', error);
        }
    }

    async getPlayerStats(username) {
        try {
            const stats = await GameStats.findOne({ username: username.toLowerCase() });
            if (!stats) {
                return { wins: 0, losses: 0, draws: 0, badges: [] };
            }
            return {
                wins: stats.wins,
                losses: stats.losses,
                draws: stats.draws,
                badges: stats.badges || []
            };
        } catch (error) {
            console.error('Error getting player stats:', error);
            return { wins: 0, losses: 0, draws: 0, badges: [] };
        }
    }

    async getAllStats(gameType = null) {
        try {
            if (gameType) {
                return await this.getTopPlayersByGame(1000, gameType);
            }
            
            const allStats = await GameStats.find({}).lean();
            const stats = [];
            
            for (const stat of allStats) {
                const totalGames = stat.wins + stat.losses + stat.draws;
                const winRate = totalGames > 0 ? (stat.wins / totalGames * 100).toFixed(1) : 0;
                
                stats.push({
                    username: stat.username,
                    wins: stat.wins,
                    losses: stat.losses,
                    draws: stat.draws,
                    totalGames,
                    winRate: parseFloat(winRate),
                    badges: stat.badges || []
                });
            }

            return stats.sort((a, b) => {
                if (b.wins !== a.wins) return b.wins - a.wins;
                if (b.winRate !== a.winRate) return b.winRate - a.winRate;
                return b.totalGames - a.totalGames;
            });
        } catch (error) {
            console.error('Error getting all stats:', error);
            return [];
        }
    }

    async getTopPlayers(limit = 10, gameType = null) {
        try {
            if (gameType) {
                return await this.getTopPlayersByGame(limit, gameType);
            }
            const allStats = await this.getAllStats(null);
            return allStats.slice(0, limit);
        } catch (error) {
            console.error('Error getting top players:', error);
            return [];
        }
    }

    async getTopPlayersByGame(limit = 10, gameType = 'threeMensMorris') {
        try {
            const allStats = await GameStats.find({}).lean();
            const stats = [];
            
            for (const stat of allStats) {
                const gameStats = stat[gameType] || { wins: 0, losses: 0, draws: 0 };
                const totalGames = gameStats.wins + gameStats.losses + gameStats.draws;
                const winRate = totalGames > 0 ? (gameStats.wins / totalGames * 100).toFixed(1) : 0;
                
                if (totalGames > 0) {
                    stats.push({
                        username: stat.username,
                        wins: gameStats.wins,
                        losses: gameStats.losses,
                        draws: gameStats.draws,
                        totalGames,
                        winRate: parseFloat(winRate),
                        badges: stat.badges || []
                    });
                }
            }

            return stats.sort((a, b) => {
                if (b.wins !== a.wins) return b.wins - a.wins;
                if (b.winRate !== a.winRate) return b.winRate - a.winRate;
                return b.totalGames - a.totalGames;
            }).slice(0, limit);
        } catch (error) {
            console.error('Error getting top players by game:', error);
            return [];
        }
    }
}

module.exports = Scoreboard;


