

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
                            isGuest
                                ? `<button disabled class="join-btn disabled">Players only</button>`
                                : canJoinAsPlayer
                                    ? `<button class="join-btn" data-room-id="${room.roomId}" data-as-spectator="false">Join as Player</button>`
                                    : `<button disabled class="join-btn disabled">Room Full</button>`
                        }
                        <button class="spectate-btn" data-room-id="${room.roomId}" data-as-spectator="true">Join as Spectator</button>
                    </div>
                `;
                
                const joinBtn = roomElement.querySelector('.join-btn:not(.disabled)');
                if (joinBtn) {
                    joinBtn.addEventListener('click', () => {
                        // Handle both integer and string room IDs (tournament rooms use strings)
                        const roomIdStr = joinBtn.dataset.roomId;
                        const roomId = isNaN(parseInt(roomIdStr)) ? roomIdStr : parseInt(roomIdStr);
                        const asSpectator = joinBtn.dataset.asSpectator === 'true';
                        if (this.app.joinRoom) {
                            this.app.joinRoom(roomId, asSpectator);
                        }
                    });
                }
                
                const spectateBtn = roomElement.querySelector('.spectate-btn');
                if (spectateBtn) {
                    spectateBtn.addEventListener('click', () => {
                        // Handle both integer and string room IDs (tournament rooms use strings)
                        const roomIdStr = spectateBtn.dataset.roomId;
                        const roomId = isNaN(parseInt(roomIdStr)) ? roomIdStr : parseInt(roomIdStr);
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
                
                const userNameSpan = document.createElement('span');
                userNameSpan.className = 'user-name';
                userNameSpan.textContent = username;
                
                const targetUserRole = this.app.userRolesMap.get(username) || 'player';
                const isGuestUser = targetUserRole === 'guest' || username.startsWith('guest-');
                
                if (this.app.userRole !== 'guest' && !isGuestUser) {
                    userNameSpan.style.cursor = 'pointer';
                    userNameSpan.title = `View ${username}'s profile`;
                    userNameSpan.addEventListener('click', (e) => {
                        e.stopPropagation();
                        console.log("USERNAME CLICKED:", username);
                        console.log("Current user role:", this.app.userRole);
                        console.log("Target user role:", targetUserRole);
                        if (this.app.showUserProfile) {
                            console.log("Calling app.showUserProfile");
                            this.app.showUserProfile(username);
                        } else {
                            console.error("app.showUserProfile is not defined!");
                        }
                    });
                } else {
                    if (this.app.userRole === 'guest') {
                        console.log("Current user is guest, skipping click handler for:", username);
                    } else if (isGuestUser) {
                        console.log("Target user is guest, skipping click handler for:", username);
                    }
                }
                
                userRow.appendChild(userNameSpan);
                if (this.app.userRole !== 'guest' && targetUserRole !== 'guest') {
                    const inviteBtn = document.createElement('button');
                    inviteBtn.className = 'invite-btn';
                    inviteBtn.textContent = 'Invite';
                    inviteBtn.title = `Invite ${username} to play`;
                    inviteBtn.onclick = () => this.app.sendGameInvitation(username);
                    userRow.appendChild(inviteBtn);

                    // Only show report button in lobby users list, not in online players list
                    if (list === this.lobbyUsersList) {
                        const reportBtn = document.createElement('button');
                        reportBtn.className = 'report-btn';
                        reportBtn.textContent = 'Report';
                        reportBtn.title = `Report ${username}`;
                        reportBtn.onclick = () => this.app.openReportModal(username);
                        userRow.appendChild(reportBtn);
                    }
                }
                
                list.appendChild(userRow);
            });
        });
    }
}
