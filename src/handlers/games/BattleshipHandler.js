

class BattleshipHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }

    

    registerHandlers(socket) {
        socket.on('battleshipPlaceShip', async ({ roomId, shipTypeId, startPos, isHorizontal }) => {
            const room = this.handlers.rooms.get(roomId);
            if (!room || room.gameType !== 'battleship') {
                socket.emit('moveError', 'Room is not running Battleship.');
                return;
            }
            
            const result = room.placeBattleshipShip(socket.id, shipTypeId, startPos, isHorizontal);
            if (result.error) {
                socket.emit('moveError', result.error);
                return;
            }
            
            await this.handlers.broadcastGameState(roomId);
            
            if (result.allShipsPlaced) {
                this.handlers.io.to(roomId).emit('battleshipAllShipsPlaced', {
                    message: 'All ships placed! Game starting...',
                    phase: 'playing'
                });
            }
            
            if (result.playerFinished) {
                this.handlers.io.to(roomId).emit('battleshipPlayerFinishedPlacement', {
                    role: result.role || socket.user.username
                });
            }
        });

        socket.on('battleshipRemoveShip', async ({ roomId, shipTypeId }) => {
            const room = this.handlers.rooms.get(roomId);
            if (!room || room.gameType !== 'battleship') {
                socket.emit('moveError', 'Room is not running Battleship.');
                return;
            }

            const result = room.removeBattleshipShip(socket.id, shipTypeId);
            if (result.error) {
                socket.emit('moveError', result.error);
                return;
            }

            await this.handlers.broadcastGameState(roomId);
        });

        socket.on('battleshipFinishPlacement', async ({ roomId }) => {
            const room = this.handlers.rooms.get(roomId);
            if (!room || room.gameType !== 'battleship') {
                socket.emit('moveError', 'Room is not running Battleship.');
                return;
            }

            const result = room.finishBattleshipPlacement(socket.id);
            if (result.error) {
                socket.emit('moveError', result.error);
                return;
            }

            await this.handlers.broadcastGameState(roomId);

            if (result.allFinished) {
                this.handlers.io.to(roomId).emit('battleshipAllShipsPlaced', {
                    message: 'All ships placed! Game starting...',
                    phase: 'playing'
                });
            }
        });

        socket.on('battleshipUnlockPlacement', async ({ roomId }) => {
            const room = this.handlers.rooms.get(roomId);
            if (!room || room.gameType !== 'battleship') {
                socket.emit('moveError', 'Room is not running Battleship.');
                return;
            }

            const result = room.unlockBattleshipPlacement(socket.id);
            if (result.error) {
                socket.emit('moveError', result.error);
                return;
            }

            await this.handlers.broadcastGameState(roomId);
        });

        socket.on('battleshipHandleTimeout', async ({ roomId }) => {
            const room = this.handlers.rooms.get(roomId);
            if (!room || room.gameType !== 'battleship') {
                return;
            }

            const result = room.handleBattleshipPlacementTimeout();
            if (result && result.success) {
                await this.handlers.broadcastGameState(roomId);
                this.handlers.io.to(roomId).emit('battleshipAllShipsPlaced', {
                    message: 'Time\'s up! Remaining ships placed randomly. Game starting...',
                    phase: 'playing'
                });
            }
        });

        socket.on('battleshipGuess', async ({ roomId, position }) => {
            const room = this.handlers.rooms.get(roomId);
            if (!room || room.gameType !== 'battleship') return;
            
            const result = room.makeBattleshipGuess(socket.id, position);
            if (result.error) {
                socket.emit('moveError', result.error);
                return;
            }
            
            await this.handlers.broadcastGameState(roomId);
            
            this.handlers.io.to(roomId).emit('battleshipGuessResult', result);
            
            if (result.gameOver) {
                const winnerPlayer = room.players.find(p => p.role === result.winner);
                if (winnerPlayer) {
                    this.handlers.scoreboard.recordGameResult(winnerPlayer.role, room.players, room.gameType, this.handlers.userRoles).catch(err => {
                        console.error('Error recording game result:', err);
                    });
                }
                this.handlers.broadcastRoomsList();
                this.handlers.handleGameFinished(roomId, room);
            }
        });
    }
}

module.exports = BattleshipHandler;
