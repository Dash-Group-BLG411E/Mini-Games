class ScoreboardHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }

    registerHandlers(socket) {
        socket.on('getScoreboard', async (data) => {
            try {
                const gameType = data?.gameType || null;
                const { normalizeGameType } = require('../utils/gameTypeUtils');
                const normalizedGameType = gameType ? normalizeGameType(gameType) : null;
                console.log(`📊 Scoreboard request: gameType=${gameType}, normalized=${normalizedGameType}`);
                const topPlayers = await this.handlers.scoreboard.getTopPlayers(20, normalizedGameType);
                console.log(`📊 Sending ${topPlayers.length} players to client`);
                socket.emit('scoreboardData', topPlayers);
            } catch (error) {
                console.error('❌ Error getting scoreboard:', error);
                console.error('Error stack:', error.stack);
                socket.emit('scoreboardData', []);
            }
        });

        socket.on('getUserBadges', async () => {
            try {
                const username = socket.user?.username;
                if (!username) {
                    socket.emit('userBadges', { badges: [] });
                    return;
                }
                const stats = await this.handlers.scoreboard.getPlayerStats(username);
                const badges = stats.badges || [];
                socket.emit('userBadges', { badges });
            } catch (error) {
                console.error('Error getting user badges:', error);
                socket.emit('userBadges', { badges: [] });
            }
        });

        socket.on('getUserBadgesFor', async (data) => {
            try {
                const targetUsername = data?.username;
                if (!targetUsername) {
                    socket.emit('userBadgesFor', { username: targetUsername, badges: [] });
                    return;
                }
                const stats = await this.handlers.scoreboard.getPlayerStats(targetUsername);
                const badges = stats.badges || [];
                socket.emit('userBadgesFor', { username: targetUsername, badges });
            } catch (error) {
                console.error('Error getting user badges for:', error);
                socket.emit('userBadgesFor', { username: data?.username, badges: [] });
            }
        });
    }
}

module.exports = ScoreboardHandler;
