class InvitationHandler {
    constructor(handlers) {
        this.handlers = handlers;
    }

    registerHandlers(socket) {
        socket.on('sendInvitation', ({ to, gameType }) => {
            const from = socket.user?.username;
            const fromRole = socket.user?.role;
            if (!from) {
                socket.emit('invitationError', 'Authentication failed');
                return;
            }

            if (fromRole === 'guest') {
                socket.emit('invitationError', 'Guests cannot send invitations. Please register or log in.');
                return;
            }

            let targetSocket = null;
            for (const [socketId, username] of this.handlers.onlineUsers.entries()) {
                if (username === to) {
                    targetSocket = this.handlers.io.sockets.sockets.get(socketId);
                    break;
                }
            }

            if (!targetSocket) {
                socket.emit('invitationError', `${to} is not online`);
                return;
            }

            const targetRole = this.handlers.userRoles.get(to);
            if (targetRole === 'guest') {
                socket.emit('invitationError', 'Cannot invite guest users. They can only spectate games.');
                return;
            }

            const targetRoomId = this.handlers.socketToRoom.get(targetSocket.id);
            if (targetRoomId) {
                socket.emit('invitationError', `${to} is already in a game`);
                return;
            }

            const senderRoomId = this.handlers.socketToRoom.get(socket.id);
            if (senderRoomId) {
                socket.emit('invitationError', 'You are already in a game');
                return;
            }

            this.handlers.pendingInvitations.set(to, { from, gameType: gameType || 'three-mens-morris' });

            targetSocket.emit('gameInvitation', { from, gameType: gameType || 'three-mens-morris' });
        });

        socket.on('acceptInvitation', ({ from }) => {
            const to = socket.user?.username;
            const toRole = socket.user?.role;
            if (!to) {
                socket.emit('invitationError', 'Authentication failed');
                return;
            }

            if (toRole === 'guest') {
                socket.emit('invitationError', 'Guests cannot accept invitations. Please register or log in.');
                return;
            }

            const invitation = this.handlers.pendingInvitations.get(to);
            if (!invitation || invitation.from !== from) {
                socket.emit('invitationError', 'Invitation not found or expired');
                return;
            }

            this.handlers.pendingInvitations.delete(to);

            let senderSocket = null;
            for (const [socketId, username] of this.handlers.onlineUsers.entries()) {
                if (username === from) {
                    senderSocket = this.handlers.io.sockets.sockets.get(socketId);
                    break;
                }
            }

            if (!senderSocket) {
                socket.emit('invitationError', `${from} is no longer online`);
                return;
            }

            const gameType = invitation.gameType;

            const roomId = this.handlers.generateRoomId();
            const roomName = `${from} vs ${to}`;
            const GameRoom = require('../core/GameRoom');
            const room = new GameRoom(roomId, roomName, gameType);
            
            const senderResult = room.addPlayer(senderSocket.id, from);
            if (!senderResult.success) {
                socket.emit('invitationError', 'Failed to create room');
                return;
            }

            this.handlers.rooms.set(roomId, room);
            this.handlers.socketToRoom.set(senderSocket.id, roomId);
            senderSocket.join(roomId);

            const acceptorResult = room.addPlayer(socket.id, to);
            if (!acceptorResult.success) {
                socket.emit('invitationError', 'Failed to join room');
                return;
            }

            this.handlers.socketToRoom.set(socket.id, roomId);
            socket.join(roomId);

            senderSocket.emit('roomCreated', { 
                roomId, 
                roomName: room.roomName, 
                player: senderResult.player, 
                gameType: room.gameType 
            });
            socket.emit('invitationAccepted', { 
                roomId, 
                roomName: room.roomName, 
                gameType: room.gameType 
            });
            socket.emit('playersRole', { 
                role: acceptorResult.player.role,
                roomName: room.roomName,
                players: room.players.map(p => ({ username: p.username, role: p.role })),
                gameType: room.gameType
            });

            if (room.players.length === 2) {
                room.gameState.gameStatus = 'in-progress';
                if (room.gameType === 'three-mens-morris') {
                    room.gameState.currentPlayer = 'X';
                } else if (room.gameType === 'memory-match') {
                    room.initMemoryState();
                }
                this.handlers.io.to(roomId).emit('startGame', { 
                    firstTurn: 'X',
                    players: room.players.map(p => ({ username: p.username, role: p.role })),
                    gameType: room.gameType
                });
            }

            this.handlers.broadcastGameState(roomId);
            this.handlers.broadcastRoomsList();
        });

        socket.on('declineInvitation', ({ from }) => {
            const to = socket.user?.username;
            if (!to) return;

            this.handlers.pendingInvitations.delete(to);

            let senderSocket = null;
            for (const [socketId, username] of this.handlers.onlineUsers.entries()) {
                if (username === from) {
                    senderSocket = this.handlers.io.sockets.sockets.get(socketId);
                    break;
                }
            }

            if (senderSocket) {
                senderSocket.emit('invitationDeclined', { to });
            }
        });
    }
}

module.exports = InvitationHandler;
