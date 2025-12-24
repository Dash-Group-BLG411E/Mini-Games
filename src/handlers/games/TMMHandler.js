

class TMMHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }

    

    registerHandlers(socket) {
        socket.on('makeMove', async ({ roomId, cellId, move, fromCellId }) => {
            const room = this.handlers.rooms.get(roomId);
            if (!room || room.gameType !== 'three-mens-morris') {
                socket.emit('moveError', 'Invalid room or game type');
                return;
            }

            const result = room.makeMove(cellId, move, socket.id, fromCellId);
            
            if (result.success) {
                // Always broadcast game state after a successful move
                try {
                    await this.handlers.broadcastGameState(roomId);
                } catch (err) {
                    console.error('Error broadcasting game state:', err);
                    // Try to broadcast again with fallback
                    try {
                        await this.handlers.broadcastGameState(roomId);
                    } catch (retryErr) {
                        console.error('Retry broadcast also failed:', retryErr);
                    }
                }
                
                if (result.pieceSelected) {
                    return;
                }
                
                if (result.pieceRemoved) {
                    this.handlers.io.to(roomId).emit('tmmPieceRemoved', {
                        message: 'Piece removed! Continue playing...',
                        scores: result.scores
                    });
                }
                
                if (result.threeInARow && result.canRemovePiece) {
                    this.handlers.io.to(roomId).emit('tmmThreeInARow', {
                        message: '3 in a row! Remove opponent piece',
                        scores: result.scores
                    });
                }
                
                if (result.roundOver && !result.gameOver) {
                    this.handlers.io.to(roomId).emit('tmmRoundResult', {
                        roundWinner: result.roundWinner,
                        scores: result.scores,
                        cellsRemoved: result.cellsRemoved || false
                    });
                }
                
                if (result.gameOver) {
                    room.gameState.gameStatus = 'finished';
                    
                    // Record game result for leaderboard and badges
                    const winnerRole = result.gameWinner || result.winner || room.gameState.winner;
                    if (winnerRole && winnerRole !== 'draw') {
                        this.handlers.scoreboard.recordGameResult(winnerRole, room.players, room.gameType).catch(err => {
                            console.error('Error recording game result:', err);
                        });
                    }
                    
                    // Broadcast final state
                    try {
                        await this.handlers.broadcastGameState(roomId);
                    } catch (err) {
                        console.error('Error broadcasting final game state:', err);
                    }
                    this.handlers.broadcastRoomsList();
                    
                    this.handlers.handleGameFinished(roomId, room);
                }
            } else {
                socket.emit('moveError', result.error);
            }
        });
    }
}

module.exports = TMMHandler;
