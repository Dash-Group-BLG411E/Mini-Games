

class RoomManager {
    constructor(app) {
        this.app = app;
        
        this.roomNameModal = document.getElementById('room-name-modal');
        this.modalRoomNameInput = document.getElementById('modal-room-name-input');
        this.modalCreateBtn = document.getElementById('modal-create-btn');
        this.modalCancelBtn = document.getElementById('modal-cancel-btn');
        this.roomInfoBox = document.getElementById('room-info-box');
        this.roomInfoName = document.getElementById('room-info-name');
        this.roomInfoPlayers = document.getElementById('room-info-players');
        this.roomInfoSpectators = document.getElementById('room-info-spectators');
        this.leaveRoomBtn = document.getElementById('leave-room-btn');
        this.leaveRoomModal = document.getElementById('leave-room-modal');
        this.confirmLeaveBtn = document.getElementById('confirm-leave-btn');
        this.cancelLeaveBtn = document.getElementById('cancel-leave-btn');
        this.leaveRoomMessage = document.getElementById('leave-room-message');
        
        this.pendingGameType = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.leaveRoomBtn?.addEventListener('click', () => {
            if (this.app.gameState && this.app.gameState.gameStatus === 'finished') {
                this.leaveRoom();
            } else if (this.app.gameState && this.app.gameState.players && this.app.gameState.players.length === 1) {
                this.leaveRoom();
            } else if (this.app.gameState && this.app.gameState.gameStatus === 'in-progress') {
                this.showLeaveRoomModal();
            } else {
                this.leaveRoom();
            }
        });
        
        this.confirmLeaveBtn?.addEventListener('click', () => this.leaveRoom());
        this.cancelLeaveBtn?.addEventListener('click', () => this.hideLeaveRoomModal());
        
        this.modalCreateBtn?.addEventListener('click', () => {
            if (this.pendingGameType) {
                this.createRoom(this.pendingGameType);
                this.hideRoomNameModal();
            }
        });
        
        this.modalCancelBtn?.addEventListener('click', () => {
            this.hideRoomNameModal();
        });
        
        this.roomNameModal?.addEventListener('click', (e) => {
            if (e.target === this.roomNameModal) {
                this.hideRoomNameModal();
            }
        });
        
        this.modalRoomNameInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.pendingGameType) {
                this.createRoom(this.pendingGameType);
                this.hideRoomNameModal();
            }
        });
    }

    

    showRoomNameModal(gameType) {
        if (this.app.userRole === 'guest') {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('Guests can spectate and chat. Please register or log in to create rooms.');
            }
            return;
        }
        this.pendingGameType = gameType;
        if (this.modalRoomNameInput) {
            this.modalRoomNameInput.value = '';
        }
        if (this.roomNameModal) {
            this.roomNameModal.classList.remove('hidden');
        }
        if (this.modalRoomNameInput) {
            this.modalRoomNameInput.focus();
        }
    }

    

    hideRoomNameModal() {
        if (this.roomNameModal) {
            this.roomNameModal.classList.add('hidden');
        }
        this.pendingGameType = null;
    }

    

    createRoom(gameType) {
        if (this.app.userRole === 'guest') {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('Guests can spectate and chat. Please register or log in to create rooms.');
            }
            return;
        }
        
        if (!this.app.socket || !this.app.socket.connected) {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('Connecting to server... Please wait.');
            }
            if (this.app.initializeSocket) {
                this.app.initializeSocket();
            }
            setTimeout(() => {
                if (this.app.socket && this.app.socket.connected) {
                    this.createRoom(gameType);
                } else {
                    if (this.app.modalManager) {
                        this.app.modalManager.showNotification('Connection failed. Please refresh the page.');
                    }
                }
            }, 1500);
            return;
        }
        
        const roomName = this.modalRoomNameInput ? this.modalRoomNameInput.value.trim() : '';
        const finalRoomName = roomName || `Room ${Math.floor(Math.random() * 1000)}`;
        const normalizedType = (gameType || (this.app.viewManager ? this.app.viewManager.selectedLobbyGameType : 'three-mens-morris') || 'three-mens-morris')
            .toLowerCase()
            .replace(/_/g, '-');
        
        this.app.socket.emit('createRoom', { roomName: finalRoomName, gameType: normalizedType });
        
        if (this.modalRoomNameInput) {
            this.modalRoomNameInput.value = '';
        }
    }

    

    joinRoom(roomId, asSpectator = false) {
        if (this.app.userRole === 'guest' && !asSpectator) {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('Guests can only join as spectators. Please register or log in to play.');
            }
            return;
        }
        if (!roomId) return;
        
        if (!this.app.socket || !this.app.socket.connected) {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('Connecting to server... Please wait.');
            }
            if (this.app.initializeSocket) {
                this.app.initializeSocket();
            }
            setTimeout(() => {
                if (this.app.socket && this.app.socket.connected) {
                    this.joinRoom(roomId, asSpectator);
                } else {
                    if (this.app.modalManager) {
                        this.app.modalManager.showNotification('Connection failed. Please refresh the page.');
                    }
                }
            }, 1500);
            return;
        }
        
        this.app.currentRoom = roomId;
        this.app.socket.emit('joinRoom', { roomId, asSpectator }, (error) => {
            if (error) {
                if (this.app.modalManager) {
                    this.app.modalManager.showNotification(`Failed to join room: ${error}`);
                }
                this.app.currentRoom = null;
                if (this.app.updateChatWidgets) {
                    this.app.updateChatWidgets();
                }
            } else {
                if (this.app.updateChatWidgets) {
                    this.app.updateChatWidgets();
                }
            }
        });
    }

    

    leaveRoom() {
        if (!this.app.currentRoom || !this.app.socket) {
            this.hideLeaveRoomModal();
            if (this.app.modalManager) {
                this.app.modalManager.hideGameEndModal();
            }
            return;
        }

        this.app.socket.emit('leaveRoom', { roomId: this.app.currentRoom });
        
        this.hideLeaveRoomModal();
        if (this.app.modalManager) {
            this.app.modalManager.hideGameEndModal();
        }
        if (this.app.rematchBtn) {
            this.app.rematchBtn.classList.add('hidden');
        }
        this.app.rematchRequestFrom = null;
        this.app.hasRequestedRematch = false;
        
        this.app.currentRoom = null;
        this.app.currentRoomName = null;
        this.app.gameState = null;
        this.app.myRole = null;
        this.app.isSpectator = false;
        this.app.disableBeforeUnloadWarning();
        this.app.updateChatWidgets();
        this.updateLeaveButtonVisibility();
        this.updateRoomInfoBox();
        
        if (this.app.viewManager) {
            this.app.viewManager.showLobby();
        }
    }

    

    leaveRoomAsSpectator() {
        if (!this.app.currentRoom || !this.app.socket || !this.app.isSpectator) {
            return;
        }
        this.app.socket.emit('leaveRoom', { roomId: this.app.currentRoom });
        this.app.currentRoom = null;
        this.app.currentRoomName = null;
        this.app.gameState = null;
        this.app.myRole = null;
        this.app.isSpectator = false;
        this.app.disableBeforeUnloadWarning();
        this.app.updateChatWidgets();
        this.updateRoomInfoBox();
    }

    

    showLeaveRoomModal() {
        if (!this.leaveRoomModal) return;
        
        if (this.app.gameState && this.app.gameState.gameStatus === 'finished') {
            this.leaveRoom();
            return;
        }
        
        if (this.app.gameState && this.app.gameState.players && this.app.gameState.players.length === 1) {
            this.leaveRoom();
            return;
        }
        
        if (this.leaveRoomMessage) {
            if (this.app.gameState && this.app.gameState.gameStatus === 'in-progress') {
                this.leaveRoomMessage.textContent = 'Your opponent will win and your stats will be updated.';
                this.leaveRoomMessage.style.display = 'block';
            } else {
                this.leaveRoomMessage.textContent = '';
                this.leaveRoomMessage.style.display = 'none';
            }
        }
        
        this.leaveRoomModal.classList.remove('hidden');
    }

    

    hideLeaveRoomModal() {
        if (this.leaveRoomModal) {
            this.leaveRoomModal.classList.add('hidden');
        }
    }

    

    updateLeaveButtonVisibility() {
        if (this.leaveRoomBtn) {
            if (this.app.isSpectator) {
                this.leaveRoomBtn.style.display = 'none';
            } else {
                this.leaveRoomBtn.style.display = 'block';
            }
        }
    }

    

    updateRoomInfoBox() {
        if (!this.roomInfoBox) return;

        if (this.app.currentRoom) {
            this.roomInfoBox.classList.remove('hidden');
            
            if (this.roomInfoName) {
                const roomName = this.app.currentRoomName || `Room ${this.app.currentRoom}`;
                this.roomInfoName.textContent = roomName;
                this.roomInfoName.title = roomName;
            }
            
            if (this.roomInfoPlayers) {
                if (this.app.gameState && this.app.gameState.players && this.app.gameState.players.length > 0) {
                    const playerNames = this.app.gameState.players.map(p => p.username).join(', ');
                    const playersText = `Players: ${playerNames}`;
                    this.roomInfoPlayers.textContent = playersText;
                    this.roomInfoPlayers.title = playersText;
                } else {
                    this.roomInfoPlayers.textContent = 'Players: -';
                    this.roomInfoPlayers.title = '';
                }
            }
            
            if (this.roomInfoSpectators) {
                let spectatorCount = 0;
                if (this.app.rooms && this.app.currentRoom) {
                    const room = this.app.rooms.find(r => r.roomId === this.app.currentRoom);
                    if (room) {
                        spectatorCount = room.spectatorCount || 0;
                    }
                }
                this.roomInfoSpectators.textContent = `Spectators: ${spectatorCount}`;
            }
        } else {
            this.roomInfoBox.classList.add('hidden');
        }
    }
}

