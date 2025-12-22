class MemorySocketHandler {
    constructor(app) {
        this.app = app;
    }

    registerHandlers(socket) {
        socket.on('memoryResult', ({ result }) => {
            this.handleMemoryResult(result);
        });
    }

    handleMemoryResult(result) {
        if (!result || !this.app.memoryGame) return;
        if (this.app.memoryGame.grid) {
            this.app.memoryGame.grid.querySelectorAll('.memory-card.disabled').forEach(card => {
                card.classList.remove('disabled');
            });
        }
        if (result.error) {
            return;
        }
        if (result.winnerRole) {
            if (this.app.memoryGame.status) {
                this.app.memoryGame.status.style.display = 'none';
            }
            this.app.memoryGame.hideMatchMessage();
        } else if (result.match) {
            this.app.memoryGame.showMatchMessage('Match found! Keep going.');
        } else if (result.flip) {
            this.app.memoryGame.hideMatchMessage();
        }
    }
}
