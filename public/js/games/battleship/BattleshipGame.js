class BattleshipGame {
    constructor(app) {
        this.app = app;
        this.isHorizontal = true;
        this.selectedShip = null;
        this.countdownInterval = null;
        
        this.stage = document.getElementById('battleship-stage');
        this.ownBoard = document.getElementById('battleship-own-board');
        this.opponentBoard = document.getElementById('battleship-opponent-board');
        this.ownBoardTitle = document.getElementById('battleship-own-board-title');
        this.opponentBoardTitle = document.getElementById('battleship-opponent-board-title');
        this.toggleOrientation = document.getElementById('battleship-toggle-orientation');
        this.status = document.getElementById('battleship-status');
        this.player1Avatar = document.getElementById('battleship-player-1-avatar');
        this.player1Name = document.getElementById('battleship-player-1-name');
        this.player1Role = document.getElementById('battleship-player-1-role');
        this.shipsContainer = document.getElementById('battleship-ships-container');
        this.shipsBox = document.getElementById('battleship-ships-box');
        this.player2Avatar = document.getElementById('battleship-player-2-avatar');
        this.player2Name = document.getElementById('battleship-player-2-name');
        this.player2Role = document.getElementById('battleship-player-2-role');

        this.placementPhase = new ShipPlacementPhase(this);
        this.battlePhase = new BattlePhase(this);
        this.renderer = new BattleshipRenderer(this);
    }

    init() {
        this.selectedShip = null;
        this.isHorizontal = true;
        this.clearCountdown();
    }

    renderBoards() {
        this.renderer.renderBoards();
    }

    handlePlacementClick(position) {
        this.placementPhase.handlePlacementClick(position);
    }

    makeGuess(position) {
        this.battlePhase.makeGuess(position);
    }

    removeShip(shipTypeId) {
        this.placementPhase.removeShip(shipTypeId);
    }

    finishPlacement() {
        this.placementPhase.finishPlacement();
    }

    unlockPlacement() {
        this.placementPhase.unlockPlacement();
    }

    updatePlacementStatus(gameState) {
        this.placementPhase.updatePlacementStatus(gameState);
    }

    startCountdown() {
        this.placementPhase.startCountdown();
    }

    clearCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    hideShipPreview() {
        if (!this.ownBoard) return;
        const previewCells = this.ownBoard.querySelectorAll('.battleship-preview-hover');
        previewCells.forEach(cell => {
            cell.classList.remove('battleship-preview-hover');
            cell.style.backgroundColor = 'white';
            cell.style.borderColor = '';
        });
    }

    updateControls() {
        if (!this.app.gameState || !this.app.gameState.battleshipState) return;

        const state = this.app.gameState.battleshipState;
        const role = this.app.myRole;
        const players = this.app.gameState.players || [];
        const hasTwoPlayers = players.length === 2;

        if (this.shipsContainer) {
            if (hasTwoPlayers && state.phase === 'placement' && !this.app.isSpectator && role && state.shipTypes && state.shipTypes.length > 0) {
                const placementFinished = state.placementFinished && state.placementFinished[role];
                const allShipsPlaced = state.shipsPlaced && state.shipsPlaced[role] >= state.shipTypes.length;
                
                if (this.shipsBox && this.shipsContainer) {
                    try {
                        this.shipsContainer.style.display = 'flex';
                        this.shipsContainer.classList.remove('hidden');
                        this.placementPhase.renderShipsBox(role, state);
                    } catch (e) {
                        console.error('Error rendering ships box:', e);
                    }
                } else {
                    console.warn('Ships container or box not found', {
                        shipsContainer: !!this.shipsContainer,
                        shipsBox: !!this.shipsBox,
                        role: role,
                        shipTypes: state.shipTypes?.length
                    });
                }
            } else {
                this.shipsContainer.classList.add('hidden');
                this.shipsContainer.style.display = 'none';
            }
        }

        if (this.status) {
            this.status.textContent = '';
            this.status.style.display = 'none';
            this.status.classList.add('hidden');
        }

        if (state.phase !== 'placement') {
            if (this.toggleOrientation) {
                this.toggleOrientation.classList.add('hidden');
            }
            if (this.status) {
                this.status.textContent = '';
                this.status.style.display = 'none';
                this.status.classList.add('hidden');
            }
        }
    }

    async updatePlayerInfo() {
        return this.renderer.updatePlayerInfo();
    }
}
