class ScoreboardSocketHandler {
    constructor(app) {
        this.app = app;
    }

    registerHandlers(socket) {
        socket.on('scoreboardData', (data) => {
            if (this.app.scoreboardManager) {
                this.app.scoreboardManager.updateScoreboard(data);
            }
        });

        socket.on('userBadges', (data) => {
            if (this.app.scoreboardManager) {
                this.app.scoreboardManager.displayBadges(data.badges || []);
            }
        });
    }
}
