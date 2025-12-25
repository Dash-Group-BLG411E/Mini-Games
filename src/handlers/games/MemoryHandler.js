

class MemoryHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }

    

    registerHandlers(socket) {
        socket.on('memoryFlip', ({ roomId, cardId }) => {
            const room = this.handlers.rooms.get(roomId);
            if (!room || room.gameType !== 'memory-match') return;
            const result = room.flipMemoryCard(socket.id, cardId);
            this.handlers.broadcastGameState(roomId);
            this.handlers.io.to(roomId).emit('memoryResult', {
                roomId,
                result
            });
            if (result && result.winnerRole) {
                this.handlers.scoreboard.recordGameResult(result.winnerRole, room.players, room.gameType, this.handlers.userRoles).catch(err => {
                    console.error('Error recording game result:', err);
                });
                if (room.gameState.gameStatus === 'finished') {
                    this.handlers.handleGameFinished(roomId, room);
                }
            }
            if (result && result.pendingCards) {
                setTimeout(() => {
                    room.hideMemoryCards(result.pendingCards);
                    this.handlers.broadcastGameState(roomId);
                }, 1200);
            }
        });
    }
}

module.exports = MemoryHandler;
