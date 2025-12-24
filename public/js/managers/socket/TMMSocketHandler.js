class TMMSocketHandler {
    constructor(app) {
        this.app = app;
    }

    registerHandlers(socket) {
        socket.on('tmmThreeInARow', (data) => {
            this.app.showMemoryMatchMessage('3 in a row! Remove opponent piece');
            setTimeout(() => {
                this.app.hideMemoryMatchMessage();
            }, 2000);
        });

        socket.on('tmmPieceRemoved', (data) => {
            this.app.showMemoryMatchMessage('Piece removed!');
            setTimeout(() => {
                this.app.hideMemoryMatchMessage();
            }, 1500);
        });

        socket.on('tmmRoundResult', (data) => {
            this.handleTmmRoundResult(data);
        });
    }

    handleTmmRoundResult(data) {
        const isWinner = data.roundWinner === this.app.myRole;
        if (this.app.isSpectator) {
            const winnerPlayer = this.app.gameState?.players?.find(p => p.role === data.roundWinner);
            const winnerName = winnerPlayer?.username || data.roundWinner;
            this.app.showMemoryMatchMessage(`${winnerName} wins!`);
        } else {
            this.app.showMemoryMatchMessage(isWinner ? 'You win! 🎉' : 'Opponent wins!');
        }
        setTimeout(() => {
            this.app.hideMemoryMatchMessage();
        }, 1500);
    }
}
