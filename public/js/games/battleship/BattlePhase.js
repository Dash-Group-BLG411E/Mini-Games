class BattlePhase {
    constructor(battleshipGame) {
        this.battleshipGame = battleshipGame;
        this.app = battleshipGame.app;
    }

    makeGuess(position) {
        if (!this.app.socket || !this.app.currentRoom) return;
        this.app.socket.emit('battleshipGuess', { roomId: this.app.currentRoom, position });
    }
}
