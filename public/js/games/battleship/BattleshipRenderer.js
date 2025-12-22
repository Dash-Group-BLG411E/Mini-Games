class BattleshipRenderer {
    constructor(battleshipGame) {
        this.battleshipGame = battleshipGame;
        this.app = battleshipGame.app;
    }

    renderBoards() {
        if (!this.battleshipGame.ownBoard || !this.battleshipGame.opponentBoard || !this.app.gameState || !this.app.gameState.battleshipState) return;

        const state = this.app.gameState.battleshipState;
        const role = this.app.myRole;
        
        const myBoardData = state.boards[role] || Array(64).fill('');
        const opponentRole = role === 'X' ? 'O' : 'X';
        const opponentBoardData = state.boards[opponentRole] || Array(64).fill('');
        
        const opponentBoardView = opponentBoardData.map(cell => {
            if (state.phase === 'placement') {
                return '';
            }
            return (cell === 'ship' ? '' : cell);
        });

        this.renderBoard(this.battleshipGame.ownBoard, myBoardData, true);
        this.renderBoard(this.battleshipGame.opponentBoard, opponentBoardView, false);
    }

    renderBoard(container, boardData, isOwnBoard) {
        if (!container || !this.app.gameState || !this.app.gameState.battleshipState) return;
        
        container.innerHTML = '';
        
        const state = this.app.gameState.battleshipState;
        const role = this.app.myRole;
        
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 7; col++) {
                const index = row * 7 + col;
                const cell = document.createElement('div');
                cell.className = 'battleship-cell';
                cell.dataset.index = index;
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const cellState = boardData[index] || '';
                
                if (cellState === 'ship') {
                    cell.classList.add('battleship-ship');
                    cell.textContent = '🚢';
                    cell.style.backgroundColor = 'white';
                    cell.style.border = '2px solid #9ca3af';
                    cell.style.boxShadow = 'none';
                    cell.style.fontWeight = 'bold';
                    cell.style.fontSize = '1.8rem';
                    cell.style.color = '#333';
                } else if (cellState === 'hit') {
                    cell.classList.add('battleship-hit');
                    cell.textContent = '💥';
                    cell.style.backgroundColor = 'white';
                    cell.style.borderColor = '#dc2626';
                    cell.style.boxShadow = 'none';
                } else if (cellState === 'miss') {
                    cell.classList.add('battleship-miss');
                    cell.textContent = '🌊';
                    cell.style.backgroundColor = 'white';
                    cell.style.borderColor = '#60a5fa';
                } else {
                    cell.classList.add('battleship-empty');
                    cell.textContent = '';
                    cell.style.background = 'white';
                }

                const players = this.app.gameState.players || [];
                const hasTwoPlayers = players.length === 2;
                
                if (!isOwnBoard && state.phase === 'playing' && hasTwoPlayers &&
                    state.currentPlayer === role &&
                    cellState !== 'hit' && cellState !== 'miss') {
                    cell.classList.add('battleship-clickable');
                    cell.addEventListener('click', () => this.battleshipGame.battlePhase.makeGuess(index));
                } else if (isOwnBoard && state.phase === 'placement' && hasTwoPlayers) {
                    const placementFinished = state.placementFinished && state.placementFinished[role];
                    if (!placementFinished) {
                        const selectedShip = this.battleshipGame.selectedShip || this.app.battleshipSelectedShip;
                        
                        if (cellState !== 'ship') {
                            cell.classList.add('battleship-clickable');
                            cell.addEventListener('click', () => {
                                const currentSelectedShip = this.battleshipGame.selectedShip || this.app.battleshipSelectedShip;
                                if (currentSelectedShip) {
                                    this.battleshipGame.placementPhase.handlePlacementClick(index);
                                } else {
                                    if (this.app.modalManager) {
                                        this.app.modalManager.showNotification('Please select a ship to place first.');
                                    }
                                }
                            });
                            cell.addEventListener('mouseenter', () => {
                                const currentSelectedShip = this.battleshipGame.selectedShip || this.app.battleshipSelectedShip;
                                if (currentSelectedShip) {
                                    this.showShipPreview(cell, index, isOwnBoard);
                                }
                            });
                            cell.addEventListener('mouseleave', () => {
                                this.battleshipGame.hideShipPreview();
                            });
                        }
                    }
                }

                container.appendChild(cell);
            }
        }
    }

    getShipPreviewPositions(startPos, shipSize, isHorizontal) {
        const row = Math.floor(startPos / 7);
        const col = startPos % 7;
        const positions = [];
        
        for (let i = 0; i < shipSize; i++) {
            if (isHorizontal) {
                if (col + i >= 7) return null;
                positions.push(row * 7 + col + i);
            } else {
                if (row + i >= 7) return null;
                positions.push((row + i) * 7 + col);
            }
        }
        return positions;
    }

    showShipPreview(cell, startPos, isOwnBoard) {
        const selectedShip = this.battleshipGame.selectedShip || this.app.battleshipSelectedShip;
        if (!selectedShip || !this.app.gameState || !this.app.gameState.battleshipState || !isOwnBoard) return;
        
        const shipType = this.app.gameState.battleshipState.shipTypes.find(s => s.id === selectedShip);
        if (!shipType) return;
        
        const previewPositions = this.getShipPreviewPositions(startPos, shipType.size, this.battleshipGame.isHorizontal);
        if (!previewPositions) return;
        
        const container = isOwnBoard ? this.battleshipGame.ownBoard : this.battleshipGame.opponentBoard;
        if (!container) return;
        
        previewPositions.forEach(pos => {
            const previewCell = container.querySelector(`[data-index="${pos}"]`);
            if (previewCell && !previewCell.classList.contains('battleship-ship')) {
                previewCell.classList.add('battleship-preview-hover');
                previewCell.style.backgroundColor = 'white';
                previewCell.style.borderColor = '#7c3aed';
            }
        });
    }

    async updatePlayerInfo() {
        if (!this.app.gameState) return;

        let players = this.app.gameState.players || [];
        
        if (this.app.gameState.gameStatus === 'finished' && players.length === 1 && this.app.lastKnownPlayers && this.app.lastKnownPlayers.length === 2) {
            players = this.app.lastKnownPlayers;
        }

        const currentUserPlayer = players.find(p => p.username === this.app.currentUser);
        const myRole = currentUserPlayer ? currentUserPlayer.role : null;
        const opponentRole = myRole === 'X' ? 'O' : 'X';
        const myPlayer = currentUserPlayer;
        const opponentPlayer = players.find(p => p.role === opponentRole);

        if (myPlayer) {
            const myAvatar = this.app.avatarManager ? await this.app.avatarManager.getPlayerAvatar(myPlayer.username, myPlayer.avatar) : '👤';
            if (this.battleshipGame.player1Avatar) {
                this.battleshipGame.player1Avatar.textContent = myAvatar;
            }
            if (this.battleshipGame.player1Name) {
                this.battleshipGame.player1Name.textContent = 'You';
            }
            if (this.battleshipGame.player1Role) {
                this.battleshipGame.player1Role.textContent = '';
                this.battleshipGame.player1Role.style.display = 'none';
            }
        }

        const hasTwoPlayers = players.length === 2;
        
        if (opponentPlayer) {
            const opponentAvatar = this.app.avatarManager ? await this.app.avatarManager.getPlayerAvatar(opponentPlayer.username, opponentPlayer.avatar) : '👤';
            if (this.battleshipGame.player2Avatar) {
                this.battleshipGame.player2Avatar.textContent = opponentAvatar;
            }
            if (this.battleshipGame.player2Name) {
                this.battleshipGame.player2Name.textContent = hasTwoPlayers ? 'Opponent' : 'Waiting...';
            }
            if (this.battleshipGame.player2Role) {
                this.battleshipGame.player2Role.textContent = '';
                this.battleshipGame.player2Role.style.display = 'none';
            }
        } else {
            if (this.battleshipGame.player2Avatar) {
                this.battleshipGame.player2Avatar.textContent = '👤';
            }
            if (this.battleshipGame.player2Name) {
                this.battleshipGame.player2Name.textContent = 'Waiting...';
            }
            if (this.battleshipGame.player2Role) {
                this.battleshipGame.player2Role.textContent = '';
                this.battleshipGame.player2Role.style.display = 'none';
            }
        }
    }
}
