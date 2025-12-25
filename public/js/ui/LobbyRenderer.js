

class LobbyRenderer {
    constructor(app) {
        this.app = app;
        
        this.roomsList = document.getElementById('rooms-list');
        this.lobbyUsersList = document.getElementById('lobby-users-list');
        this.onlinePlayersList = document.getElementById('online-players-list');
    }
    
    formatGameType(type) {
        if (this.app.viewManager && this.app.viewManager.formatGameType) {
            return this.app.viewManager.formatGameType(type);
        }
        const normalized = (type || 'three-mens-morris').toLowerCase().replace(/_/g, '-');
        const mapping = {
            'three-mens-morris': 'Three Men\'s Morris',
            'threemensmorris': 'Three Men\'s Morris',
            'memory-match': 'Memory Match',
            'memorymatch': 'Memory Match',
            'battleship': 'Battleship'
        };
        return mapping[normalized] || 'Three Men\'s Morris';
    }

    

    updateRoomsList() {
        const roomsLists = document.querySelectorAll('#rooms-list');
        
        roomsLists.forEach(roomsList => {
            roomsList.innerHTML = '';

            if (!this.app.rooms || this.app.rooms.length === 0) {
                roomsList.innerHTML = '<div class="no-rooms">No active rooms. Create one to get started!</div>';
                return;
            }

            this.app.rooms.forEach(room => {
                const roomElement = document.createElement('div');
                roomElement.className = 'room-item';
                const canJoinAsPlayer = room.playerCount < 2 && room.gameStatus === 'waiting';
                const isGuest = this.app.userRole === 'guest';

                roomElement.innerHTML = `
                    <div class="room-info">
                        <h3>${room.roomName}</h3>
                        <p>Game: ${this.formatGameType(room.gameType)} | Players: ${room.playerCount}/2 | Spectators: ${room.spectatorCount} | Status: ${room.gameStatus}</p>
                    </div>
                    <div class="room-actions">
                        ${
                            canJoinAsPlayer
                                ? `<button class="join-btn" data-room-id="${room.roomId}" data-as-spectator="false">Join as Player</button>`
                                : `<button disabled class="join-btn disabled">Room Full</button>`
                        }
                        <button class="spectate-btn" data-room-id="${room.roomId}" data-as-spectator="true">Join as Spectator</button>
                    </div>
                `;
                
                const joinBtn = roomElement.querySelector('.join-btn:not(.disabled)');
                if (joinBtn) {
                    joinBtn.addEventListener('click', () => {
                        const roomId = parseInt(joinBtn.dataset.roomId);
                        const asSpectator = joinBtn.dataset.asSpectator === 'true';
                        if (this.app.joinRoom) {
                            this.app.joinRoom(roomId, asSpectator);
                        }
                    });
                }
                
                const spectateBtn = roomElement.querySelector('.spectate-btn');
                if (spectateBtn) {
                    spectateBtn.addEventListener('click', () => {
                        const roomId = parseInt(spectateBtn.dataset.roomId);
                        if (this.app.joinRoom) {
                            this.app.joinRoom(roomId, true);
                        }
                    });
                }

                roomsList.appendChild(roomElement);
            });
        });
    }

    

    updateLobbyUsers() {
        const lists = [this.lobbyUsersList, this.onlinePlayersList].filter(list => list !== null);
        
        lists.forEach(list => {
            list.innerHTML = '';
            this.app.lobbyUsers.forEach(username => {
                if (username === this.app.currentUser) return;
                
                const userRow = document.createElement('div');
                userRow.className = 'user-item';
                
                const targetUserRole = this.app.userRolesMap.get(username) || 'player';
                const isGuestUser = targetUserRole === 'guest' || username.startsWith('guest-');
                const isInGame = this.app.userInGameMap.get(username) || false;
                
                // Availability indicator
                const availabilityIndicator = document.createElement('span');
                availabilityIndicator.className = 'availability-indicator';
                availabilityIndicator.textContent = isInGame ? '🔴' : '🟢';
                availabilityIndicator.title = isInGame ? 'Currently in a game' : 'Available';
                userRow.appendChild(availabilityIndicator);
                
                const userNameSpan = document.createElement('span');
                userNameSpan.className = 'user-name';
                userNameSpan.textContent = username;
                
                // Only registered users have profiles - guests can view them but guest names are not clickable
                // Show not-allowed cursor for guest names only
                if (isGuestUser) {
                    userNameSpan.style.cursor = 'not-allowed';
                    userNameSpan.title = 'Guest users do not have profiles';
                } else {
                    // Registered user - allow clicking (both guests and registered users can view profiles)
                    userNameSpan.style.cursor = 'pointer';
                    userNameSpan.title = `View ${username}'s profile`;
                    userNameSpan.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (this.app.showUserProfile) {
                            this.app.showUserProfile(username);
                        }
                    });
                }
                
                userRow.appendChild(userNameSpan);
                
                // Allow invitations: guests can invite anyone, anyone can invite guests
                const inviteBtn = document.createElement('button');
                inviteBtn.className = 'invite-btn';
                inviteBtn.textContent = 'Invite';
                inviteBtn.title = isInGame ? `${username} is currently in a game` : `Invite ${username} to play`;
                inviteBtn.onclick = () => {
                    if (isInGame) {
                        if (this.app.modalManager) {
                            this.app.modalManager.showNotification('User is already playing a game.');
                        }
                    } else {
                        this.app.sendGameInvitation(username);
                    }
                };
                userRow.appendChild(inviteBtn);

                // Only show report button in lobby users list, not in online players list (and not for guests)
                if (list === this.lobbyUsersList && this.app.userRole !== 'guest' && targetUserRole !== 'guest') {
                    const reportBtn = document.createElement('button');
                    reportBtn.className = 'report-btn';
                    reportBtn.textContent = 'Report';
                    reportBtn.title = `Report ${username}`;
                    reportBtn.onclick = () => this.app.openReportModal(username);
                    userRow.appendChild(reportBtn);
                }
                
                list.appendChild(userRow);
            });
        });
    }
}
