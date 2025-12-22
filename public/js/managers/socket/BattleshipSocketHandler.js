class BattleshipSocketHandler {
    constructor(app) {
        this.app = app;
    }

    registerHandlers(socket) {
        socket.on('battleshipAllShipsPlaced', (data) => {
            this.handleBattleshipAllShipsPlaced(data);
        });

        socket.on('battleshipGuessResult', (result) => {
            this.handleBattleshipGuessResult(result);
        });
    }

    handleBattleshipAllShipsPlaced(data) {
        if (this.app.battleshipGame) {
            this.app.battleshipGame.clearCountdown();
        }
    }

    handleBattleshipGuessResult(result) {
        if (result.gameOver) {
            if (this.app.gameState) {
                this.app.gameState.gameStatus = 'finished';
                this.app.gameState.winner = result.winner;
            }
            if (this.app.gameStateManager && this.app.gameStateManager.updateGameInfo) {
                this.app.gameStateManager.updateGameInfo();
            }
        } else {
            const message = result.result === 'hit' ?
                `💥 Hit! ${result.shipSunk ? `${result.shipSunk.name} sunk!` : ''}` :
                '🌊 Miss!';
            this.app.showMemoryMatchMessage(message);
            setTimeout(() => {
                this.app.hideMemoryMatchMessage();
            }, 3000);
        }
    }
}
