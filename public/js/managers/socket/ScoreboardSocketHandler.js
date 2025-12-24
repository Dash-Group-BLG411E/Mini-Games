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

        socket.on('userBadgesFor', (data) => {
            console.log('[ScoreboardSocketHandler] Received userBadgesFor:', data);
            if (this.app.userProfileManager) {
                console.log('[ScoreboardSocketHandler] Current viewedUsername:', this.app.userProfileManager.viewedUsername);
                if (data.username === this.app.userProfileManager.viewedUsername) {
                    console.log('[ScoreboardSocketHandler] Username matches, displaying badges');
                    this.app.userProfileManager.displayBadges(data.badges || []);
                } else {
                    console.log('[ScoreboardSocketHandler] Username mismatch, ignoring');
                }
            } else {
                console.warn('[ScoreboardSocketHandler] userProfileManager not available');
            }
        });
    }
}
