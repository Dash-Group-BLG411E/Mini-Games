class ScoreboardHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }

    registerHandlers(socket) {
        socket.on('getScoreboard', async (data) => {
            try {
                const gameType = data?.gameType || null;
                const { normalizeGameType } = require('../../utils/gameTypeUtils');
                const normalizedGameType = gameType ? normalizeGameType(gameType) : null;
                const topPlayers = await this.handlers.scoreboard.getTopPlayers(20, normalizedGameType);
                socket.emit('scoreboardData', topPlayers);
            } catch (error) {
                console.error('Error getting scoreboard:', error);
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
    }
}

module.exports = ScoreboardHandler;
