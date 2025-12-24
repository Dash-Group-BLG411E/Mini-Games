

class MemoryHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }

    

    registerHandlers(socket) {
        socket.on('memoryFlip', async ({ roomId, cardId }) => {
            const room = this.handlers.rooms.get(roomId);
            if (!room || room.gameType !== 'memory-match') {
                socket.emit('moveError', 'Invalid room or game type');
                return;
            }
            
            const result = room.flipMemoryCard(socket.id, cardId);
            
            // Always broadcast game state after a card flip
            try {
                await this.handlers.broadcastGameState(roomId);
            } catch (err) {
                console.error('Error broadcasting game state:', err);
                // Retry broadcast
                try {
                    await this.handlers.broadcastGameState(roomId);
                } catch (retryErr) {
                    console.error('Retry broadcast also failed:', retryErr);
                }
            }
            
            this.handlers.io.to(roomId).emit('memoryResult', {
                roomId,
                result
            });
            
            if (result && result.winnerRole) {
                this.handlers.scoreboard.recordGameResult(result.winnerRole, room.players, room.gameType).catch(err => {
                    console.error('Error recording game result:', err);
                });
                if (room.gameState.gameStatus === 'finished') {
                    // Broadcast final state before handling game finished
                    try {
                        await this.handlers.broadcastGameState(roomId);
                    } catch (err) {
                        console.error('Error broadcasting final game state:', err);
                    }
                    this.handlers.handleGameFinished(roomId, room);
                }
            }
            
            if (result && result.pendingCards) {
                setTimeout(async () => {
                    room.hideMemoryCards(result.pendingCards);
                    try {
                        await this.handlers.broadcastGameState(roomId);
                    } catch (err) {
                        console.error('Error broadcasting after hiding cards:', err);
                        // Retry
                        try {
                            await this.handlers.broadcastGameState(roomId);
                        } catch (retryErr) {
                            console.error('Retry broadcast also failed:', retryErr);
                        }
                    }
                }, 1200);
            }
        });
    }
}

module.exports = MemoryHandler;
