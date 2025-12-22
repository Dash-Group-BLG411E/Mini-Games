

class BattleshipGame {
    constructor(room) {
        this.room = room;
    }

    

    initGameState() {
        const shipTypes = [
            { name: 'Carrier', size: 5, id: 'C' },
            { name: 'Battleship', size: 4, id: 'B' },
            { name: 'Destroyer', size: 3, id: 'D' },
            { name: 'Submarine', size: 3, id: 'S' },
            { name: 'Patrol Boat', size: 2, id: 'P' }
        ];

        const placementTimeout = 60;
        this.room.battleshipState = {
            boards: {
                X: Array(49).fill(''),
                O: Array(49).fill('')
            },
            ships: {
                X: [],
                O: []
            },
            sunkShips: {
                X: [],
                O: []
            },
            phase: 'placement',
            currentPlayer: 'X',
            shipsPlaced: { X: 0, O: 0 },
            placementFinished: { X: false, O: false },
            shipTypes: shipTypes,
            lastGuess: null,
            placementStartTime: null,
            placementTimeout: placementTimeout
        };
    }

    

    resetGame() {
        this.initGameState();
    }

    

    placeShip(socketId, shipTypeId, startPos, isHorizontal) {
        if (!this.room.battleshipState) {
            this.initGameState();
        }

        const player = this.room.players.find(p => p.socketId === socketId);
        if (!player) {
            return { error: 'Player not found in room.' };
        }

        const role = player.role;
        const phase = this.room.battleshipState.phase;

        if (phase !== 'placement') {
            return { error: 'Ship placement phase has ended.' };
        }

        if (this.room.battleshipState.shipsPlaced[role] >= this.room.battleshipState.shipTypes.length) {
            return { error: 'All ships already placed.' };
        }

        const shipType = this.room.battleshipState.shipTypes.find(s => s.id === shipTypeId);
        if (!shipType) {
            return { error: 'Invalid ship type.' };
        }

        const existingShips = this.room.battleshipState.ships[role];
        const existingShipIndex = existingShips.findIndex(s => s.ship.id === shipTypeId);
        if (existingShipIndex !== -1) {
            const existingShip = existingShips[existingShipIndex];
            for (const pos of existingShip.positions) {
                this.room.battleshipState.boards[role][pos] = '';
            }
            existingShips.splice(existingShipIndex, 1);
            this.room.battleshipState.shipsPlaced[role]--;
        }

        const positions = [];
        const row = Math.floor(startPos / 7);
        const col = startPos % 7;

        for (let i = 0; i < shipType.size; i++) {
            if (isHorizontal) {
                if (col + i >= 7) {
                    return { error: 'Ship goes out of bounds.' };
                }
                positions.push(row * 7 + col + i);
            } else {
                if (row + i >= 7) {
                    return { error: 'Ship goes out of bounds.' };
                }
                positions.push((row + i) * 7 + col);
            }
        }

        const board = this.room.battleshipState.boards[role];
        for (const pos of positions) {
            if (board[pos] === 'ship') {
                return { error: 'Ships cannot overlap.' };
            }
        }

        for (const pos of positions) {
            board[pos] = 'ship';
        }

        this.room.battleshipState.ships[role].push({
            ship: shipType,
            positions: positions,
            hits: 0
        });

        this.room.battleshipState.shipsPlaced[role]++;

        const allShipsPlaced = 
            this.room.battleshipState.shipsPlaced.X === this.room.battleshipState.shipTypes.length &&
            this.room.battleshipState.shipsPlaced.O === this.room.battleshipState.shipTypes.length;

        if (allShipsPlaced) {
            this.room.battleshipState.phase = 'playing';
            this.room.battleshipState.currentPlayer = 'X';
            this.room.battleshipState.placementStartTime = null;
            this.room.gameState.gameStatus = 'in-progress';
        }

        return { success: true, allShipsPlaced, phase: this.room.battleshipState.phase, playerFinished: this.room.battleshipState.shipsPlaced[role] === this.room.battleshipState.shipTypes.length, role };
    }

    

    removeShip(socketId, shipTypeId) {
        if (!this.room.battleshipState) {
            return { error: 'Battleship state not initialized.' };
        }

        const player = this.room.players.find(p => p.socketId === socketId);
        if (!player) {
            return { error: 'Player not found in room.' };
        }

        const role = player.role;
        const phase = this.room.battleshipState.phase;

        if (phase !== 'placement') {
            return { error: 'Ship placement phase has ended.' };
        }

        if (this.room.battleshipState.placementFinished[role]) {
            return { error: 'Placement is locked. Cannot remove ships.' };
        }

        const shipIndex = this.room.battleshipState.ships[role].findIndex(s => s.ship.id === shipTypeId);
        if (shipIndex === -1) {
            return { error: 'Ship not found.' };
        }

        const ship = this.room.battleshipState.ships[role][shipIndex];
        
        for (const pos of ship.positions) {
            this.room.battleshipState.boards[role][pos] = '';
        }

        this.room.battleshipState.ships[role].splice(shipIndex, 1);
        this.room.battleshipState.shipsPlaced[role]--;

        return { success: true, role };
    }

    

    finishPlacement(socketId) {
        if (!this.room.battleshipState) {
            return { error: 'Battleship state not initialized.' };
        }

        const player = this.room.players.find(p => p.socketId === socketId);
        if (!player) {
            return { error: 'Player not found in room.' };
        }

        const role = player.role;
        const phase = this.room.battleshipState.phase;

        if (phase !== 'placement') {
            return { error: 'Ship placement phase has ended.' };
        }

        if (this.room.battleshipState.shipsPlaced[role] < this.room.battleshipState.shipTypes.length) {
            return { error: 'Please place all ships before finishing.' };
        }

        this.room.battleshipState.placementFinished[role] = true;

        const bothFinished = 
            this.room.battleshipState.placementFinished.X && 
            this.room.battleshipState.placementFinished.O;

        if (bothFinished) {
            this.room.battleshipState.phase = 'playing';
            this.room.battleshipState.currentPlayer = 'X';
            this.room.battleshipState.placementStartTime = null;
            this.room.gameState.gameStatus = 'in-progress';
        }

        return { success: true, allFinished: bothFinished, phase: this.room.battleshipState.phase, role };
    }

    

    unlockPlacement(socketId) {
        if (!this.room.battleshipState) {
            return { error: 'Battleship state not initialized.' };
        }

        const player = this.room.players.find(p => p.socketId === socketId);
        if (!player) {
            return { error: 'Player not found in room.' };
        }

        const role = player.role;
        const phase = this.room.battleshipState.phase;

        if (phase !== 'placement') {
            return { error: 'Ship placement phase has ended.' };
        }

        this.room.battleshipState.placementFinished[role] = false;

        return { success: true, role };
    }

    randomlyPlaceRemainingShips(role) {
        if (!this.room.battleshipState || this.room.battleshipState.phase !== 'placement') {
            return { error: 'Not in placement phase.' };
        }

        const placedShipIds = this.room.battleshipState.ships[role].map(s => s.ship.id);
        const remainingShips = this.room.battleshipState.shipTypes.filter(st => !placedShipIds.includes(st.id));

        for (const shipType of remainingShips) {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 1000;

            while (!placed && attempts < maxAttempts) {
                attempts++;
                const isHorizontal = Math.random() < 0.5;
                let startPos;

                if (isHorizontal) {
                    const row = Math.floor(Math.random() * 7);
                    const maxCol = 7 - shipType.size;
                    if (maxCol < 0) continue;
                    const col = Math.floor(Math.random() * (maxCol + 1));
                    startPos = row * 7 + col;
                } else {
                    const maxRow = 7 - shipType.size;
                    if (maxRow < 0) continue;
                    const row = Math.floor(Math.random() * (maxRow + 1));
                    const col = Math.floor(Math.random() * 7);
                    startPos = row * 7 + col;
                }

                const positions = [];
                const row = Math.floor(startPos / 7);
                const col = startPos % 7;

                for (let i = 0; i < shipType.size; i++) {
                    if (isHorizontal) {
                        positions.push(row * 7 + col + i);
                    } else {
                        positions.push((row + i) * 7 + col);
                    }
                }

                const board = this.room.battleshipState.boards[role];
                let canPlace = true;
                for (const pos of positions) {
                    if (board[pos] === 'ship') {
                        canPlace = false;
                        break;
                    }
                }

                if (canPlace) {
                    for (const pos of positions) {
                        board[pos] = 'ship';
                    }

                    this.room.battleshipState.ships[role].push({
                        ship: shipType,
                        positions: positions,
                        hits: 0
                    });

                    this.room.battleshipState.shipsPlaced[role]++;
                    placed = true;
                }
            }
        }

        return { success: true, role };
    }

    handlePlacementTimeout() {
        if (!this.room.battleshipState || this.room.battleshipState.phase !== 'placement') {
            return;
        }

        for (const role of ['X', 'O']) {
            const placedCount = this.room.battleshipState.shipsPlaced[role] || 0;
            const totalShips = this.room.battleshipState.shipTypes.length;
            
            if (placedCount < totalShips) {
                this.randomlyPlaceRemainingShips(role);
                this.room.battleshipState.placementFinished[role] = true;
            }
        }

        this.room.battleshipState.phase = 'playing';
        this.room.battleshipState.currentPlayer = 'X';
        this.room.battleshipState.placementStartTime = null;
        this.room.gameState.gameStatus = 'in-progress';

        return { success: true, phase: 'playing' };
    }

    

    makeGuess(socketId, position) {
        if (this.room.battleshipState.phase !== 'playing') {
            return { error: 'Game is not in playing phase.' };
        }

        if (this.room.gameState.gameStatus !== 'in-progress') {
            return { error: 'Game is not in progress.' };
        }

        const player = this.room.players.find(p => p.socketId === socketId);
        if (!player) {
            return { error: 'Player not found in room.' };
        }

        const role = player.role;

        if (this.room.battleshipState.currentPlayer !== role) {
            return { error: 'Not your turn.' };
        }

        const opponent = role === 'X' ? 'O' : 'X';
        const opponentBoard = this.room.battleshipState.boards[opponent];

        if (position < 0 || position >= 64) {
            return { error: 'Invalid position.' };
        }

        if (opponentBoard[position] === 'hit' || opponentBoard[position] === 'miss') {
            return { error: 'Position already guessed.' };
        }

        let result = 'miss';
        let shipSunk = null;

        if (opponentBoard[position] === 'ship') {
            opponentBoard[position] = 'hit';
            result = 'hit';

            const ships = this.room.battleshipState.ships[opponent];
            for (const shipData of ships) {
                if (shipData.positions.includes(position)) {
                    shipData.hits++;
                    if (shipData.hits === shipData.ship.size) {
                        if (!this.room.battleshipState.sunkShips[opponent].includes(shipData.ship.id)) {
                            this.room.battleshipState.sunkShips[opponent].push(shipData.ship.id);
                            shipSunk = shipData.ship;
                        }
                    }
                }
            }

            if (this.room.battleshipState.sunkShips[opponent].length === ships.length) {
                this.room.gameState.gameStatus = 'finished';
                this.room.gameState.winner = role;
                this.room.battleshipState.lastGuess = { position, result, shipSunk, gameOver: true, winner: role };
                return { success: true, position, result, shipSunk, gameOver: true, winner: role };
            }
        } else {
            opponentBoard[position] = 'miss';
            this.room.battleshipState.currentPlayer = opponent;
        }

        this.room.battleshipState.lastGuess = { position, result, shipSunk };
        return { success: true, position, result, shipSunk, currentPlayer: this.room.battleshipState.currentPlayer };
    }

    

    getBoard(role, isOwnBoard) {
        const board = this.room.battleshipState.boards[role];
        if (isOwnBoard) {
            return board.map(cell => cell);
        } else {
            return board.map(cell => (cell === 'ship' ? '' : cell));
        }
    }

    

    getGameState() {
        if (!this.room.battleshipState) return null;
        return {
            phase: this.room.battleshipState.phase,
            currentPlayer: this.room.battleshipState.currentPlayer,
            shipsPlaced: { ...this.room.battleshipState.shipsPlaced },
            placementFinished: this.room.battleshipState.placementFinished ? { ...this.room.battleshipState.placementFinished } : { X: false, O: false },
            ships: {
                X: this.room.battleshipState.ships.X ? [...this.room.battleshipState.ships.X] : [],
                O: this.room.battleshipState.ships.O ? [...this.room.battleshipState.ships.O] : []
            },
            sunkShips: {
                X: [...this.room.battleshipState.sunkShips.X],
                O: [...this.room.battleshipState.sunkShips.O]
            },
            shipTypes: this.room.battleshipState.shipTypes,
            lastGuess: this.room.battleshipState.lastGuess,
            boards: this.room.battleshipState.boards,
            placementStartTime: this.room.battleshipState.placementStartTime,
            placementTimeout: this.room.battleshipState.placementTimeout
        };
    }
}

module.exports = BattleshipGame;
