

class TMMHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }

    

    registerHandlers(socket) {
        socket.on('makeMove', ({ roomId, cellId, move, fromCellId }) => {
            const room = this.handlers.rooms.get(roomId);
            if (!room || room.gameType !== 'three-mens-morris') return;

            const result = room.makeMove(cellId, move, socket.id, fromCellId);
            
            if (result.success) {
                if (result.pieceSelected) {
                    this.handlers.broadcastGameState(roomId);
                    return;
                }
                
                this.handlers.broadcastGameState(roomId).catch(err => console.error('Error broadcasting game state:', err));
                
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
                    
                    this.handlers.broadcastGameState(roomId);
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
