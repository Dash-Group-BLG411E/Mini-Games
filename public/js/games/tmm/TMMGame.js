

class TMMGame {
    constructor(app) {
        this.app = app;
        this.gridInitialized = false;
        
        this.stage = document.getElementById('tmm-stage');
        this.player1 = document.getElementById('tmm-player-1');
        this.player1Role = document.getElementById('tmm-player-1-role');
        this.player1Avatar = document.getElementById('tmm-player-1-avatar');
        this.player1Name = document.getElementById('tmm-player-1-name');
        this.player1Score = document.getElementById('tmm-player-1-score');
        this.player2 = document.getElementById('tmm-player-2');
        this.player2Role = document.getElementById('tmm-player-2-role');
        this.player2Avatar = document.getElementById('tmm-player-2-avatar');
        this.player2Name = document.getElementById('tmm-player-2-name');
        this.player2Score = document.getElementById('tmm-player-2-score');
        this.gameBoard = document.getElementById('three-mens-morris-board');
    }

    init() {
        this.gridInitialized = false;
    }

    renderGrid() {
        if (!this.gameBoard) return;
        this.gameBoard.innerHTML = '';
        this.gridInitialized = false;
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'tmm-board-svg');
        svg.setAttribute('viewBox', '0 0 400 400');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        
        const points = [
            { x: '12.5%', y: '12.5%' },
            { x: '50%', y: '12.5%' },
            { x: '87.5%', y: '12.5%' },
            { x: '12.5%', y: '50%' },
            { x: '50%', y: '50%' },
            { x: '87.5%', y: '50%' },
            { x: '12.5%', y: '87.5%' },
            { x: '50%', y: '87.5%' },
            { x: '87.5%', y: '87.5%' }
        ];
        
        const svgPoints = [
            { x: 50, y: 50 },
            { x: 200, y: 50 },
            { x: 350, y: 50 },
            { x: 50, y: 200 },
            { x: 200, y: 200 },
            { x: 350, y: 200 },
            { x: 50, y: 350 },
            { x: 200, y: 350 },
            { x: 350, y: 350 }
        ];
        
        const lines = [
            [0, 1], [1, 2], [2, 5], [5, 8], [8, 7], [7, 6], [6, 3], [3, 0],
            [0, 4], [4, 8], [2, 4], [4, 6],
            [1, 4], [4, 7], [3, 4], [4, 5]
        ];
        
        lines.forEach(([start, end]) => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', svgPoints[start].x);
            line.setAttribute('y1', svgPoints[start].y);
            line.setAttribute('x2', svgPoints[end].x);
            line.setAttribute('y2', svgPoints[end].y);
            line.setAttribute('stroke', 'rgba(124, 58, 237, 0.4)');
            line.setAttribute('stroke-width', '3');
            svg.appendChild(line);
        });
        
        this.gameBoard.appendChild(svg);
        
        points.forEach((point, index) => {
            const cellEl = document.createElement('div');
            cellEl.className = 'tmm-intersection';
            cellEl.id = `${index}`;
            cellEl.style.left = point.x;
            cellEl.style.top = point.y;
            cellEl.addEventListener('click', () => this.app.makeMove(index));
            this.gameBoard.appendChild(cellEl);
        });
        
        this.gridInitialized = true;
        this.app.updateGameBoard();
    }

    async updatePlayerInfo() {
        if (!this.app.gameState) return;
        
        let players = this.app.gameState.players || [];
        
        if (this.app.gameState.gameStatus === 'finished' && players.length === 1 && this.app.lastKnownPlayers && this.app.lastKnownPlayers.length === 2) {
            players = this.app.lastKnownPlayers;
        }
        
        const player1 = players.find(p => p.role === 'X');
        const player2 = players.find(p => p.role === 'O');

        const pieces1 = this.app.gameState.piecesPlaced?.X || 0;
        const pieces2 = this.app.gameState.piecesPlaced?.O || 0;
        
        const isSpectator = this.app.isSpectator;
        const hasTwoPlayers = players.length === 2;
        
        // For spectators, show both player names
        if (isSpectator) {
            if (player1) {
                if (this.player1Role) {
                    this.player1Role.textContent = 'Red';
                }
                const avatar1 = this.app.avatarManager ? await this.app.avatarManager.getPlayerAvatar(player1.username, player1.avatar) : '👤';
                if (this.player1Avatar) {
                    this.player1Avatar.textContent = avatar1;
                }
                if (this.player1Name) {
                    this.player1Name.textContent = player1.username;
                }
                if (this.player1Score && this.app.gameState.phase === 'placement') {
                    this.player1Score.textContent = `${pieces1}/3`;
                } else if (this.player1Score) {
                    this.player1Score.textContent = '';
                }
            }
            
            if (player2) {
                if (this.player2Role) {
                    this.player2Role.textContent = 'Blue';
                }
                const avatar2 = this.app.avatarManager ? await this.app.avatarManager.getPlayerAvatar(player2.username, player2.avatar) : '👤';
                if (this.player2Avatar) {
                    this.player2Avatar.textContent = avatar2;
                }
                if (this.player2Name) {
                    this.player2Name.textContent = player2.username;
                }
                if (this.player2Score && this.app.gameState.phase === 'placement') {
                    this.player2Score.textContent = `${pieces2}/3`;
                } else if (this.player2Score) {
                    this.player2Score.textContent = '';
                }
            }
            return;
        }
        
        // For players, show "You" on left and "Opponent" on right with correct scores
        const myRole = this.app.myRole;
        const myPlayer = players.find(p => p.role === myRole);
        const opponentRole = myRole === 'X' ? 'O' : 'X';
        const opponentPlayer = players.find(p => p.role === opponentRole);
        
        // Left side always shows current user (You), right side shows opponent
        const leftPlayer = myPlayer;
        const rightPlayer = opponentPlayer;
        const leftPieces = myRole === 'X' ? pieces1 : pieces2;
        const rightPieces = opponentRole === 'X' ? pieces1 : pieces2;
        
        if (leftPlayer) {
            if (this.player1Role) {
                if (hasTwoPlayers) {
                    this.player1Role.textContent = myRole === 'X' ? 'Red' : 'Blue';
                } else {
                    this.player1Role.textContent = '';
                }
            }
            const avatar1 = this.app.avatarManager ? await this.app.avatarManager.getPlayerAvatar(leftPlayer.username, leftPlayer.avatar) : '👤';
            if (this.player1Avatar) {
                this.player1Avatar.textContent = avatar1;
            }
            if (this.player1Name) {
                this.player1Name.textContent = 'You';
            }
            if (this.player1Score) {
                if (hasTwoPlayers && this.app.gameState.phase === 'placement') {
                    this.player1Score.textContent = `${leftPieces}/3`;
                } else {
                    this.player1Score.textContent = '';
                }
            }
        } else {
            if (this.player1Role) {
                this.player1Role.textContent = '';
            }
        }
        
        if (rightPlayer) {
            if (this.player2Role) {
                if (hasTwoPlayers) {
                    this.player2Role.textContent = opponentRole === 'X' ? 'Red' : 'Blue';
                } else {
                    this.player2Role.textContent = '';
                }
            }
            const avatar2 = this.app.avatarManager ? await this.app.avatarManager.getPlayerAvatar(rightPlayer.username, rightPlayer.avatar) : '👤';
            if (this.player2Avatar) {
                this.player2Avatar.textContent = avatar2;
            }
            if (this.player2Name) {
                this.player2Name.textContent = 'Opponent';
            }
            if (this.player2Score) {
                if (hasTwoPlayers && this.app.gameState.phase === 'placement') {
                    this.player2Score.textContent = `${rightPieces}/3`;
                } else {
                    this.player2Score.textContent = '';
                }
            }
        } else {
            if (this.app.gameState.gameStatus === 'finished' && this.app.lastKnownPlayers && this.app.lastKnownPlayers.length === 2) {
                const lastKnownOpponent = this.app.lastKnownPlayers.find(p => p.username !== this.app.currentUser);
                if (lastKnownOpponent) {
                    const lastRightRole = lastKnownOpponent.role;
                    const lastRightPieces = lastKnownOpponent.role === 'X' ? pieces1 : pieces2;
                    
                    if (this.player2Role) {
                        this.player2Role.textContent = lastRightRole === 'X' ? 'Red' : 'Blue';
                    }
                    const lastAvatar2 = this.app.avatarManager ? await this.app.avatarManager.getPlayerAvatar(lastKnownOpponent.username, lastKnownOpponent.avatar) : '👤';
                    if (this.player2Avatar) {
                        this.player2Avatar.textContent = lastAvatar2;
                    }
                    if (this.player2Name) {
                        this.player2Name.textContent = 'Opponent';
                    }
                    if (this.player2Score && this.app.gameState.phase === 'placement') {
                        this.player2Score.textContent = `${lastRightPieces}/3`;
                    } else if (this.player2Score) {
                        this.player2Score.textContent = '';
                    }
                }
            } else {
                if (this.player2Role) {
                    this.player2Role.textContent = '';
                }
                if (this.player2Name) {
                    this.player2Name.textContent = 'Waiting...';
                    if (this.player2Avatar) {
                        this.player2Avatar.textContent = '👤';
                    }
                }
                if (this.player2Score) {
                    this.player2Score.textContent = '';
                }
            }
        }
    }

    

    handleCellClick(cellIndex) {
        const app = this.app;
        if (
            !app.socket ||
            !app.currentRoom ||
            !app.gameState ||
            app.gameState.gameStatus !== 'in-progress' ||
            app.gameState.currentPlayer !== app.myRole ||
            app.isSpectator
        ) {
            return;
        }

        const currentGameType = app.viewManager ? app.viewManager.currentGameType : 'three-mens-morris';
        if (currentGameType !== 'three-mens-morris') {
            return;
        }

        if (app.canRemovePiece) {
            if (app.gameState.board[cellIndex] && app.gameState.board[cellIndex] !== app.myRole) {
                app.socket.emit('makeMove', {
                    roomId: app.currentRoom,
                    cellId: cellIndex,
                    move: app.myRole
                });
            }
            return;
        }

        if (app.gameState.phase === 'movement') {
            if (app.gameState.board[cellIndex] === app.myRole) {
                if (app.selectedPiece === cellIndex) {
                    app.socket.emit('makeMove', {
                        roomId: app.currentRoom,
                        cellId: cellIndex,
                        move: app.myRole,
                        fromCellId: null
                    });
                } else {
                    app.socket.emit('makeMove', {
                        roomId: app.currentRoom,
                        cellId: cellIndex,
                        move: app.myRole,
                        fromCellId: null
                    });
                }
                return;
            } else if (app.selectedPiece !== null && app.gameState.board[cellIndex] === '') {
                app.socket.emit('makeMove', {
                    roomId: app.currentRoom,
                    cellId: cellIndex,
                    move: app.myRole,
                    fromCellId: app.selectedPiece
                });
                return;
            } else if (app.selectedPiece !== null) {
                app.selectedPiece = null;
                if (app.gameStateManager) {
                    app.gameStateManager.updateGameBoard();
                }
                return;
            }
            return;
        }

        if (app.gameState.phase === 'placement') {
            if (app.gameState.board[cellIndex]) {
                return;
            }
        }

        app.socket.emit('makeMove', {
            roomId: app.currentRoom,
            cellId: cellIndex,
            move: app.myRole
        });
    }
}
