const GameStats = require('./models/GameStats');

class Scoreboard {
    async recordGameResult(winner, players) {
        const player1 = players[0];
        const player2 = players[1];

        try {
            if (winner === 'draw') {
                // Update both players with draws
                await Promise.all([
                    this.updateStats(player1.username, { draws: 1 }),
                    this.updateStats(player2.username, { draws: 1 })
                ]);
            } else {
                // Find winner and loser
                const winnerPlayer = players.find(p => p.role === winner);
                const loserPlayer = players.find(p => p.role !== winner);

                await Promise.all([
                    this.updateStats(winnerPlayer.username, { wins: 1 }),
                    this.updateStats(loserPlayer.username, { losses: 1 })
                ]);
            }
        } catch (error) {
            console.error('Error recording game result:', error);
        }
    }

    async updateStats(username, increment) {
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

            await GameStats.findOneAndUpdate(
                { username: usernameLower },
                { $inc },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error('Error updating stats:', error);
            throw error;
        }
    }

    async getPlayerStats(username) {
        try {
            const stats = await GameStats.findOne({ username: username.toLowerCase() });
            if (!stats) {
                return { wins: 0, losses: 0, draws: 0 };
            }
            return {
                wins: stats.wins,
                losses: stats.losses,
                draws: stats.draws
            };
        } catch (error) {
            console.error('Error getting player stats:', error);
            return { wins: 0, losses: 0, draws: 0 };
        }
    }

    async getAllStats() {
        try {
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
                    winRate: parseFloat(winRate)
                });
            }

            // Sort by wins, then by win rate, then by total games
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

    async getTopPlayers(limit = 10) {
        try {
            const allStats = await this.getAllStats();
            return allStats.slice(0, limit);
        } catch (error) {
            console.error('Error getting top players:', error);
            return [];
        }
    }
}

module.exports = Scoreboard;


