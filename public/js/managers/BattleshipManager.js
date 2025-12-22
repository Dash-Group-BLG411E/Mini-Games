

class BattleshipManager {
    constructor(app) {
        this.app = app;
        
        this.infoText = app.infoText;
        this.battleshipShipsContainer = app.battleshipShipsContainer;
        this.battleshipShipsBox = app.battleshipShipsBox;
        this.battleshipStatus = app.battleshipStatus;
        this.battleshipToggleOrientation = app.battleshipToggleOrientation;
        this.battleshipOwnBoard = app.battleshipOwnBoard;
        
        this.battleshipCountdownInterval = null;
    }

    

    hideShipPreview() {
        if (!this.battleshipOwnBoard) return;
        const previewCells = this.battleshipOwnBoard.querySelectorAll('.battleship-preview-hover');
        previewCells.forEach(cell => {
            cell.classList.remove('battleship-preview-hover');
            cell.style.backgroundColor = '';
            cell.style.borderColor = '';
        });
    }

    

    handleBattleshipPlacementClick(position) {
        if (!this.app.battleshipSelectedShip) {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('Please select a ship to place first.');
            }
            return;
        }

        if (!this.app.socket || !this.app.currentRoom || !this.app.gameState || !this.app.gameState.battleshipState) return;

        const shipType = this.app.gameState.battleshipState.shipTypes.find(s => s.id === this.app.battleshipSelectedShip);
        if (!shipType) return;

        const row = Math.floor(position / 7);
        const col = position % 7;
        
        const isHorizontal = this.app.battleshipIsHorizontal !== undefined ? this.app.battleshipIsHorizontal : (this.app.battleshipGame && this.app.battleshipGame.isHorizontal !== undefined ? this.app.battleshipGame.isHorizontal : true);
        
        if (isHorizontal && col + shipType.size > 7) {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('Ship goes out of bounds.');
            }
            return;
        }
        if (!isHorizontal && row + shipType.size > 7) {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('Ship goes out of bounds.');
            }
            return;
        }
        
        this.app.socket.emit('battleshipPlaceShip', {
            roomId: this.app.currentRoom,
            shipTypeId: this.app.battleshipSelectedShip,
            startPos: position,
            isHorizontal: isHorizontal
        });
        
        this.app.battleshipSelectedShip = null;
        this.hideShipPreview();
    }

    

    makeBattleshipGuess(position) {
        if (!this.app.socket || !this.app.currentRoom) return;
        this.app.socket.emit('battleshipGuess', { roomId: this.app.currentRoom, position });
    }

    

    removeBattleshipShip(shipTypeId) {
        if (!this.app.socket || !this.app.currentRoom) return;
        this.app.socket.emit('battleshipRemoveShip', { roomId: this.app.currentRoom, shipTypeId });
    }

    

    finishBattleshipPlacement() {
        if (!this.app.socket || !this.app.currentRoom) return;
        this.app.socket.emit('battleshipFinishPlacement', { roomId: this.app.currentRoom });
    }

    

    unlockBattleshipPlacement() {
        if (!this.app.socket || !this.app.currentRoom) return;
        this.app.socket.emit('battleshipUnlockPlacement', { roomId: this.app.currentRoom });
    }

    

    updateBattleshipPlacementStatus(gameState) {
        if (!this.infoText || !gameState.battleshipState) return;
        
        if (this.app.isSpectator) {
            this.infoText.textContent = 'Watching game';
            if (this.infoText && this.infoText.parentElement) {
                this.infoText.parentElement.classList.remove('your-turn-active');
            }
            return;
        }
        
        const battleshipStatus = document.getElementById('battleship-status');
        if (battleshipStatus) {
            battleshipStatus.style.display = 'none';
            battleshipStatus.classList.add('hidden');
            battleshipStatus.textContent = '';
            battleshipStatus.innerHTML = '';
        }
        
        const state = gameState.battleshipState;
        const role = this.app.myRole;
        const players = gameState.players || [];
        const hasTwoPlayers = players.length === 2;
        
        if (!hasTwoPlayers) {
            this.infoText.textContent = 'Waiting for opponent...';
            return;
        }

        const myShipsPlaced = state.shipsPlaced[role] || 0;
        const totalShips = state.shipTypes ? state.shipTypes.length : 0;
        const myFinished = myShipsPlaced >= totalShips;
        const placementFinished = state.placementFinished && state.placementFinished[role];
        
        const opponentRole = role === 'X' ? 'O' : 'X';
        const opponentShipsPlaced = state.shipsPlaced[opponentRole] || 0;
        const opponentFinished = opponentShipsPlaced >= totalShips;
        
        let remainingTime = state.placementTimeout || 60;
        if (state.placementStartTime) {
            const elapsed = Math.floor((Date.now() - state.placementStartTime) / 1000);
            remainingTime = Math.max(0, state.placementTimeout - elapsed);
        }
        
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (myFinished && opponentFinished) {
            this.infoText.innerHTML = 'All ships placed! Game starting';
            if (this.infoText && this.infoText.parentElement) {
                this.infoText.parentElement.classList.remove('your-turn-active');
            }
        } else if (myFinished) {
            this.infoText.innerHTML = `Waiting for opponent<br>Remaining time: ${timeString}`;
            if (this.infoText && this.infoText.parentElement) {
                this.infoText.parentElement.classList.remove('your-turn-active');
            }
        } else {
            this.infoText.innerHTML = `Place your ships<br>Remaining time: ${timeString}`;
            if (this.infoText && this.infoText.parentElement) {
                this.infoText.parentElement.classList.add('your-turn-active');
            }
        }
        
        if (remainingTime <= 0 && !(myFinished && opponentFinished)) {
            this.infoText.innerHTML = 'Time\'s up! Game starting';
            if (this.app.socket && this.app.currentRoom && !this.app.battleshipTimeoutHandled) {
                this.app.battleshipTimeoutHandled = true;
                this.app.socket.emit('battleshipHandleTimeout', { roomId: this.app.currentRoom });
            }
        }
    }

    

    startBattleshipCountdown() {
        if (this.battleshipCountdownInterval) {
            clearInterval(this.battleshipCountdownInterval);
            this.battleshipCountdownInterval = null;
        }
        
        const battleshipStatus = document.getElementById('battleship-status');
        if (battleshipStatus) {
            battleshipStatus.style.display = 'none';
            battleshipStatus.classList.add('hidden');
            battleshipStatus.textContent = '';
            battleshipStatus.innerHTML = '';
        }
        
        this.battleshipCountdownInterval = setInterval(() => {
            const status = document.getElementById('battleship-status');
            if (status) {
                status.style.display = 'none';
                status.classList.add('hidden');
                status.textContent = '';
                status.innerHTML = '';
            }
            
            if (this.app.gameState && this.app.gameState.battleshipState && 
                this.app.gameState.battleshipState.phase === 'placement' &&
                this.app.gameState.players && this.app.gameState.players.length === 2 &&
                !this.app.isSpectator && this.app.myRole) {
                this.updateBattleshipPlacementStatus(this.app.gameState);
            } else {
                if (this.battleshipCountdownInterval) {
                    clearInterval(this.battleshipCountdownInterval);
                    this.battleshipCountdownInterval = null;
                }
            }
        }, 1000);
    }

    

    clearCountdown() {
        if (this.battleshipCountdownInterval) {
            clearInterval(this.battleshipCountdownInterval);
            this.battleshipCountdownInterval = null;
        }
    }

    

    updateBattleshipControls() {
        if (!this.app.gameState || !this.app.gameState.battleshipState) return;

        const state = this.app.gameState.battleshipState;
        const role = this.app.myRole;
        const players = this.app.gameState.players || [];
        const hasTwoPlayers = players.length === 2;

        if (this.battleshipShipsContainer) {
            if (hasTwoPlayers && state.phase === 'placement' && !this.app.isSpectator && role && state.shipTypes && state.shipTypes.length > 0) {
                const placementFinished = state.placementFinished && state.placementFinished[role];
                const allShipsPlaced = state.shipsPlaced && state.shipsPlaced[role] >= state.shipTypes.length;
                
                if (this.battleshipShipsBox && this.battleshipShipsContainer) {
                    try {
                        if (allShipsPlaced || placementFinished) {
                            this.battleshipShipsContainer.style.display = 'none';
                            this.battleshipShipsContainer.classList.add('hidden');
                            if (this.battleshipShipsBox) {
                                this.battleshipShipsBox.innerHTML = '';
                            }
                        } else {
                            this.battleshipShipsContainer.style.display = 'flex';
                            this.battleshipShipsContainer.classList.remove('hidden');
                            this.renderPlayerShipsBox(role, state);
                        }
                    } catch (e) {
                        console.error('Error rendering player ships box:', e);
                    }
                } else {
                    console.warn('Battleship ships container or box not found', {
                        shipsContainer: !!this.battleshipShipsContainer,
                        shipsBox: !!this.battleshipShipsBox,
                        role: role,
                        shipTypes: state.shipTypes?.length
                    });
                }
            } else {
                this.battleshipShipsContainer.classList.add('hidden');
            }
        }

        if (this.battleshipStatus) {
            this.battleshipStatus.textContent = '';
            this.battleshipStatus.style.display = 'none';
            this.battleshipStatus.classList.add('hidden');
        }

        if (state.phase !== 'placement') {
            if (this.battleshipToggleOrientation) {
                this.battleshipToggleOrientation.classList.add('hidden');
            }

            if (this.battleshipStatus) {
                this.battleshipStatus.textContent = '';
                this.battleshipStatus.style.display = 'none';
                this.battleshipStatus.classList.add('hidden');
            }
        }
    }

    

    renderPlayerShipsBox(role, state) {
        if (!this.battleshipShipsBox || !state || !state.shipTypes || !state.shipTypes.length) {
            console.warn('renderPlayerShipsBox: Missing requirements', {
                shipsBox: !!this.battleshipShipsBox,
                state: !!state,
                shipTypes: state?.shipTypes,
                shipTypesLength: state?.shipTypes?.length,
                role: role,
                isSpectator: this.app.isSpectator
            });
            return;
        }

        this.battleshipShipsBox.innerHTML = '';
        
        if (this.battleshipShipsContainer) {
            this.battleshipShipsContainer.style.display = 'flex';
            this.battleshipShipsContainer.classList.remove('hidden');
        }
        
        const placedShips = state.ships && state.ships[role] ? state.ships[role] : [];
        const placedShipIds = placedShips.map(s => s.ship ? s.ship.id : s.id);
        const isCurrentPlayer = role === this.app.myRole;
        const isPlacementPhase = state.phase === 'placement';
        const placementFinished = state.placementFinished && state.placementFinished[role];
        const allShipsPlaced = state.shipsPlaced && state.shipsPlaced[role] >= state.shipTypes.length;
        const canPlaceShips = isCurrentPlayer && isPlacementPhase && !placementFinished;
        
        const mainContainer = document.createElement('div');
        mainContainer.className = 'battleship-ships-main-container';
        
        if (canPlaceShips && !placementFinished && !allShipsPlaced) {
            const orientationContainer = document.createElement('div');
            orientationContainer.className = 'battleship-orientation-toggle-container';
            
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'battleship-orientation-btn';
            toggleBtn.textContent = this.app.battleshipIsHorizontal ? 'Horizontal' : 'Vertical';
            toggleBtn.addEventListener('click', () => {
                this.app.battleshipIsHorizontal = !this.app.battleshipIsHorizontal;
                if (this.app.battleshipGame) {
                    this.app.battleshipGame.isHorizontal = this.app.battleshipIsHorizontal;
                }
                toggleBtn.textContent = this.app.battleshipIsHorizontal ? 'Horizontal' : 'Vertical';
            });
            
            orientationContainer.appendChild(toggleBtn);
            mainContainer.appendChild(orientationContainer);
        }
        
        const shipsList = document.createElement('div');
        shipsList.className = 'battleship-ships-list';
        
        state.shipTypes.forEach(shipType => {
            const isPlaced = placedShipIds.includes(shipType.id);
            const shipItem = document.createElement('div');
            const selectedShip = this.app.battleshipSelectedShip || (this.app.battleshipGame ? this.app.battleshipGame.selectedShip : null);
            const isSelected = selectedShip === shipType.id && isCurrentPlayer && canPlaceShips && !placementFinished;
            shipItem.className = `battleship-ship-item ${isPlaced ? 'placed' : ''} ${isSelected ? 'selected' : ''}`;
            
            shipItem.style.width = '120px';
            shipItem.style.minWidth = '120px';
            
            const icon = document.createElement('div');
            icon.className = 'battleship-ship-icon';
            icon.textContent = '🚢'.repeat(shipType.size);
            
            const name = document.createElement('div');
            name.className = 'battleship-ship-name';
            name.textContent = shipType.name;
            
            shipItem.appendChild(icon);
            shipItem.appendChild(name);
            
            if (canPlaceShips && !placementFinished) {
                shipItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (isPlaced) {
                        this.removeBattleshipShip(shipType.id);
                        this.app.battleshipSelectedShip = null;
                        if (this.app.battleshipGame) {
                            this.app.battleshipGame.selectedShip = null;
                        }
                        document.querySelectorAll('.battleship-ship-item').forEach(item => item.classList.remove('selected'));
                    } else {
                        this.app.battleshipSelectedShip = shipType.id;
                        if (this.app.battleshipGame) {
                            this.app.battleshipGame.selectedShip = shipType.id;
                        }
                        document.querySelectorAll('.battleship-ship-item').forEach(item => item.classList.remove('selected'));
                        shipItem.classList.add('selected');
                    }
                });
            } else if (isPlaced && canPlaceShips) {
                shipItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeBattleshipShip(shipType.id);
                    this.app.battleshipSelectedShip = null;
                    if (this.app.battleshipGame) {
                        this.app.battleshipGame.selectedShip = null;
                    }
                    document.querySelectorAll('.battleship-ship-item').forEach(item => item.classList.remove('selected'));
                });
            }
            
            shipsList.appendChild(shipItem);
        });
        
        if (allShipsPlaced && !placementFinished && isCurrentPlayer) {
            this.finishBattleshipPlacement();
        }
        
        if (allShipsPlaced || placementFinished) {
            if (this.battleshipShipsContainer) {
                this.battleshipShipsContainer.style.display = 'none';
                this.battleshipShipsContainer.classList.add('hidden');
            }
            if (this.battleshipShipsBox) {
                this.battleshipShipsBox.innerHTML = '';
            }
        } else {
            mainContainer.appendChild(shipsList);
            this.battleshipShipsBox.appendChild(mainContainer);
        }
    }

    

    renderBattleshipBoards() {
        if (this.app.battleshipGame) {
            return this.app.battleshipGame.renderBoards();
        }
    }

    

    async updateBattleshipPlayerInfo() {
        if (this.app.battleshipGame) {
            return this.app.battleshipGame.updatePlayerInfo();
        }
    }
}
