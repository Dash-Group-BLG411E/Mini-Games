class ShipPlacementPhase {
    constructor(battleshipGame) {
        this.battleshipGame = battleshipGame;
        this.app = battleshipGame.app;
    }

    handlePlacementClick(position) {
        const selectedShip = this.battleshipGame.selectedShip || this.app.battleshipSelectedShip;
        
        if (!selectedShip) {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('Please select a ship to place first.');
            }
            return;
        }

        if (!this.app.socket || !this.app.currentRoom || !this.app.gameState || !this.app.gameState.battleshipState) return;

        const shipType = this.app.gameState.battleshipState.shipTypes.find(s => s.id === selectedShip);
        if (!shipType) return;

        const row = Math.floor(position / 7);
        const col = position % 7;
        
        if (this.battleshipGame.isHorizontal && col + shipType.size > 7) {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('Ship goes out of bounds.');
            }
            return;
        }
        if (!this.battleshipGame.isHorizontal && row + shipType.size > 7) {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('Ship goes out of bounds.');
            }
            return;
        }

        const isHorizontal = this.battleshipGame.isHorizontal !== undefined ? this.battleshipGame.isHorizontal : (this.app.battleshipIsHorizontal !== undefined ? this.app.battleshipIsHorizontal : true);
        
        this.app.socket.emit('battleshipPlaceShip', {
            roomId: this.app.currentRoom,
            shipTypeId: selectedShip,
            startPos: position,
            isHorizontal: isHorizontal
        });
        
        this.battleshipGame.selectedShip = null;
        this.battleshipGame.hideShipPreview();
    }

    removeShip(shipTypeId) {
        if (!this.app.socket || !this.app.currentRoom) return;
        this.app.socket.emit('battleshipRemoveShip', { roomId: this.app.currentRoom, shipTypeId });
    }

    finishPlacement() {
        if (!this.app.socket || !this.app.currentRoom) return;
        this.app.socket.emit('battleshipFinishPlacement', { roomId: this.app.currentRoom });
    }

    unlockPlacement() {
        if (!this.app.socket || !this.app.currentRoom) return;
        this.app.socket.emit('battleshipUnlockPlacement', { roomId: this.app.currentRoom });
    }

    updatePlacementStatus(gameState) {
        if (!this.app.infoText || !gameState.battleshipState) return;
        
        if (this.app.isSpectator) {
            this.app.infoText.textContent = 'Watching game';
            if (this.app.infoText && this.app.infoText.parentElement) {
                this.app.infoText.parentElement.classList.remove('your-turn-active');
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
            this.app.infoText.textContent = 'Waiting for opponent...';
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
            this.app.infoText.innerHTML = 'All ships placed! Game starting';
            if (this.app.infoText && this.app.infoText.parentElement) {
                this.app.infoText.parentElement.classList.remove('your-turn-active');
            }
        } else if (myFinished) {
            this.app.infoText.innerHTML = `Waiting for opponent<br>Remaining time: ${timeString}`;
            if (this.app.infoText && this.app.infoText.parentElement) {
                this.app.infoText.parentElement.classList.remove('your-turn-active');
            }
        } else {
            this.app.infoText.innerHTML = `Place your ships<br>Remaining time: ${timeString}`;
            if (this.app.infoText && this.app.infoText.parentElement) {
                this.app.infoText.parentElement.classList.add('your-turn-active');
            }
        }
        
        if (remainingTime <= 0 && !(myFinished && opponentFinished)) {
            this.app.infoText.innerHTML = 'Time\'s up! Game starting';
            if (this.app.socket && this.app.currentRoom && !this.app.battleshipTimeoutHandled) {
                this.app.battleshipTimeoutHandled = true;
                this.app.socket.emit('battleshipHandleTimeout', { roomId: this.app.currentRoom });
            }
        }
    }

    getPlacementState(role, state, allShipsPlaced, placementFinished, canPlaceShips) {
        if (state.phase !== 'placement') {
            return 'done';
        }
        
        if (placementFinished) {
            return 'done';
        }
        
        if (allShipsPlaced) {
            return 'done';
        }
        
        if (canPlaceShips) {
            return 'placing';
        }
        
        return 'before';
    }

    startCountdown() {
        const battleshipStatus = document.getElementById('battleship-status');
        if (battleshipStatus) {
            battleshipStatus.style.display = 'none';
            battleshipStatus.classList.add('hidden');
            battleshipStatus.textContent = '';
            battleshipStatus.innerHTML = '';
        }
        
        this.battleshipGame.clearCountdown();
        
        this.battleshipGame.countdownInterval = setInterval(() => {
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
                this.updatePlacementStatus(this.app.gameState);
            } else {
                this.battleshipGame.clearCountdown();
            }
        }, 1000);
    }

    renderShipsBox(role, state) {
        if (!this.battleshipGame.shipsBox || !state || !state.shipTypes || !state.shipTypes.length) {
            console.warn('renderShipsBox: Missing requirements', {
                shipsBox: !!this.battleshipGame.shipsBox,
                state: !!state,
                shipTypes: state?.shipTypes,
                shipTypesLength: state?.shipTypes?.length
            });
            return;
        }

        this.battleshipGame.shipsBox.innerHTML = '';
        
        if (this.battleshipGame.shipsContainer) {
            this.battleshipGame.shipsContainer.style.display = 'flex';
            this.battleshipGame.shipsContainer.classList.remove('hidden');
        }
        
        const placedShips = state.ships && state.ships[role] ? state.ships[role] : [];
        const placedShipIds = placedShips.map(s => s.ship ? s.ship.id : s.id);
        const isCurrentPlayer = role === this.app.myRole;
        const isPlacementPhase = state.phase === 'placement';
        const placementFinished = state.placementFinished && state.placementFinished[role];
        const allShipsPlaced = state.shipsPlaced && state.shipsPlaced[role] >= state.shipTypes.length;
        const canPlaceShips = isCurrentPlayer && isPlacementPhase && !placementFinished;
        
        const placementState = this.getPlacementState(role, state, allShipsPlaced, placementFinished, canPlaceShips);
        
        const mainContainer = document.createElement('div');
        mainContainer.className = 'battleship-ships-main-container';
        
        if (placementState === 'placing' || placementState === 'before') {
            const orientationContainer = document.createElement('div');
            orientationContainer.className = 'battleship-orientation-toggle-container';
            
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'battleship-orientation-btn';
            toggleBtn.disabled = placementState === 'before';
            toggleBtn.textContent = this.battleshipGame.isHorizontal ? 'Horizontal' : 'Vertical';
            if (placementState === 'placing') {
                toggleBtn.addEventListener('click', () => {
                    this.battleshipGame.isHorizontal = !this.battleshipGame.isHorizontal;
                    if (this.app.battleshipIsHorizontal !== undefined) {
                        this.app.battleshipIsHorizontal = this.battleshipGame.isHorizontal;
                    }
                    toggleBtn.textContent = this.battleshipGame.isHorizontal ? 'Horizontal' : 'Vertical';
                });
            }
            
            orientationContainer.appendChild(toggleBtn);
            mainContainer.appendChild(orientationContainer);
        }
        
        const shipsList = document.createElement('div');
        shipsList.className = 'battleship-ships-list';
        
        state.shipTypes.forEach(shipType => {
            const isPlaced = placedShipIds.includes(shipType.id);
            const shipItem = document.createElement('div');
            const selectedShip = this.battleshipGame.selectedShip || this.app.battleshipSelectedShip;
            const isSelected = selectedShip === shipType.id && placementState === 'placing';
            const isDisabled = placementState === 'before' || placementState === 'done';
            
            shipItem.className = `battleship-ship-item ${isPlaced ? 'placed' : ''} ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`;
            
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
            
            if (placementState === 'placing') {
                shipItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (isPlaced) {
                        this.removeShip(shipType.id);
                        this.battleshipGame.selectedShip = null;
                        this.app.battleshipSelectedShip = null;
                        document.querySelectorAll('.battleship-ship-item').forEach(item => item.classList.remove('selected'));
                    } else {
                        this.battleshipGame.selectedShip = shipType.id;
                        this.app.battleshipSelectedShip = shipType.id;
                        document.querySelectorAll('.battleship-ship-item').forEach(item => item.classList.remove('selected'));
                        shipItem.classList.add('selected');
                    }
                });
            }
            
            shipsList.appendChild(shipItem);
        });
        
        if (allShipsPlaced && !placementFinished && isCurrentPlayer) {
            this.finishPlacement();
        }
        
        if (allShipsPlaced || placementFinished) {
            if (this.battleshipGame.shipsContainer) {
                this.battleshipGame.shipsContainer.style.display = 'none';
                this.battleshipGame.shipsContainer.classList.add('hidden');
            }
            if (this.battleshipGame.shipsBox) {
                this.battleshipGame.shipsBox.innerHTML = '';
            }
        } else {
            mainContainer.appendChild(shipsList);
            this.battleshipGame.shipsBox.appendChild(mainContainer);
        }
    }
}
