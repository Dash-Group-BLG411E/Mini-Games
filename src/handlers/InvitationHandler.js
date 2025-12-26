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

            // Guests can send invitations now
            // if (fromRole === 'guest') {
            //     socket.emit('invitationError', 'Guests cannot send invitations. Please register or log in.');
            //     return;
            // }

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

            // Guests can receive invitations now
            // const targetRole = this.handlers.userRoles.get(to);
            // if (targetRole === 'guest') {
            //     socket.emit('invitationError', 'Cannot invite guest users. They can only spectate games.');
            //     return;
            // }

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

            // Check if sender already has a pending invitation sent (only one at a time)
            if (this.handlers.sentInvitations.has(from)) {
                socket.emit('invitationError', 'You already have a pending invitation. Please wait for a response or cancel it first.');
                return;
            }

            // Support multiple invitations per recipient
            if (!this.handlers.pendingInvitations.has(to)) {
                this.handlers.pendingInvitations.set(to, []);
            }
            const invitations = this.handlers.pendingInvitations.get(to);
            // Check if invitation from this user already exists
            const exists = invitations.some(inv => inv.from === from && inv.gameType === (gameType || 'three-mens-morris'));
            if (!exists) {
                invitations.push({ from, gameType: gameType || 'three-mens-morris' });
            }

            // Track the sent invitation
            this.handlers.sentInvitations.set(from, { to, gameType: gameType || 'three-mens-morris' });

            targetSocket.emit('gameInvitation', { from, gameType: gameType || 'three-mens-morris' });
        });

        socket.on('acceptInvitation', ({ from }) => {
            const to = socket.user?.username;
            const toRole = socket.user?.role;
            if (!to) {
                socket.emit('invitationError', 'Authentication failed');
                return;
            }

            // Guests can accept invitations now
            // if (toRole === 'guest') {
            //     socket.emit('invitationError', 'Guests cannot accept invitations. Please register or log in.');
            //     return;
            // }

            const invitations = this.handlers.pendingInvitations.get(to);
            if (!invitations || !Array.isArray(invitations)) {
                socket.emit('invitationError', 'Invitation not found or expired');
                return;
            }

            const invitationIndex = invitations.findIndex(inv => inv.from === from);
            if (invitationIndex === -1) {
                socket.emit('invitationError', 'Invitation not found or expired');
                return;
            }

            const invitation = invitations[invitationIndex];
            
            // Cancel all other pending invitations for this user and notify their senders
            const otherInvitations = invitations.filter((inv, idx) => idx !== invitationIndex);
            
            // Remove the accepted invitation first
            invitations.splice(invitationIndex, 1);
            if (invitations.length === 0) {
            this.handlers.pendingInvitations.delete(to);
            }
            
            // Notify other senders that their invitation was cancelled because user joined a game
            otherInvitations.forEach(otherInv => {
                let otherSenderSocket = null;
                for (const [socketId, username] of this.handlers.onlineUsers.entries()) {
                    if (username === otherInv.from) {
                        otherSenderSocket = this.handlers.io.sockets.sockets.get(socketId);
                        break;
                    }
                }
                if (otherSenderSocket) {
                    otherSenderSocket.emit('invitationCancelled', { 
                        to, 
                        reason: `${to} is already playing a game.` 
                    });
                    // Remove their sent invitation tracking
                    this.handlers.sentInvitations.delete(otherInv.from);
                }
            });
            
            // Remove sent invitation tracking for the accepted invitation
            this.handlers.sentInvitations.delete(from);

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
            
            // Notify recipient to remove all other invitations from their dropdown
            otherInvitations.forEach(otherInv => {
                let recipientSocket = null;
                for (const [socketId, username] of this.handlers.onlineUsers.entries()) {
                    if (username === to) {
                        recipientSocket = this.handlers.io.sockets.sockets.get(socketId);
                        break;
                    }
                }
                if (recipientSocket) {
                    recipientSocket.emit('invitationCancelledBySender', { from: otherInv.from });
                }
            });

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

            // Cancel all pending invitations TO the sender (from) since they're now in a game
            // For example: Joe sends to Moe, Doe sends to Joe, Moe accepts Joe's invitation
            // Now Joe is in a game, so we need to cancel Doe's invitation to Joe
            const senderInvitations = this.handlers.pendingInvitations.get(from);
            if (senderInvitations && Array.isArray(senderInvitations)) {
                const invitationsToCancel = [...senderInvitations]; // Copy array to avoid modification during iteration
                invitationsToCancel.forEach(inv => {
                    // Find the sender of this invitation to Joe
                    let invSenderSocket = null;
                    for (const [socketId, username] of this.handlers.onlineUsers.entries()) {
                        if (username === inv.from) {
                            invSenderSocket = this.handlers.io.sockets.sockets.get(socketId);
                            break;
                        }
                    }
                    if (invSenderSocket) {
                        invSenderSocket.emit('invitationCancelled', { 
                            to: from, 
                            reason: `${from} is already playing a game.` 
                        });
                        // Remove their sent invitation tracking
                        this.handlers.sentInvitations.delete(inv.from);
                    }
                });
                // Clear all pending invitations to the sender
                this.handlers.pendingInvitations.delete(from);
                
                // Notify the sender (Joe) to remove all cancelled invitations from their dropdown
                let senderSocketForNotification = null;
                for (const [socketId, username] of this.handlers.onlineUsers.entries()) {
                    if (username === from) {
                        senderSocketForNotification = this.handlers.io.sockets.sockets.get(socketId);
                        break;
                    }
                }
                if (senderSocketForNotification) {
                    invitationsToCancel.forEach(inv => {
                        senderSocketForNotification.emit('invitationCancelledBySender', { from: inv.from });
                    });
                }
            }

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

            const invitations = this.handlers.pendingInvitations.get(to);
            if (invitations && Array.isArray(invitations)) {
                const invitationIndex = invitations.findIndex(inv => inv.from === from);
                if (invitationIndex !== -1) {
                    invitations.splice(invitationIndex, 1);
                    if (invitations.length === 0) {
            this.handlers.pendingInvitations.delete(to);
                    }
                }
            }

            let senderSocket = null;
            for (const [socketId, username] of this.handlers.onlineUsers.entries()) {
                if (username === from) {
                    senderSocket = this.handlers.io.sockets.sockets.get(socketId);
                    break;
                }
            }

            if (senderSocket) {
                senderSocket.emit('invitationDeclined', { to });
                // Remove sent invitation tracking
                this.handlers.sentInvitations.delete(from);
            }
        });

        socket.on('cancelInvitation', ({ to }) => {
            const from = socket.user?.username;
            if (!from) return;

            // Check if this sender has an invitation to this user
            const sentInv = this.handlers.sentInvitations.get(from);
            if (!sentInv || sentInv.to !== to) {
                // Don't show error - just silently close the modal if invitation was already processed
                socket.emit('invitationCancelled', { to });
                return;
            }

            // Remove from recipient's pending invitations
            const invitations = this.handlers.pendingInvitations.get(to);
            if (invitations && Array.isArray(invitations)) {
                const invitationIndex = invitations.findIndex(inv => inv.from === from);
                if (invitationIndex !== -1) {
                    invitations.splice(invitationIndex, 1);
                    if (invitations.length === 0) {
                        this.handlers.pendingInvitations.delete(to);
                    }
                }
            }

            // Remove sent invitation tracking
            this.handlers.sentInvitations.delete(from);
            
            // Notify recipient to remove invitation from their notification dropdown
            let recipientSocket = null;
            for (const [socketId, username] of this.handlers.onlineUsers.entries()) {
                if (username === to) {
                    recipientSocket = this.handlers.io.sockets.sockets.get(socketId);
                    break;
                }
            }
            if (recipientSocket) {
                recipientSocket.emit('invitationCancelledBySender', { from });
            }
            
            socket.emit('invitationCancelled', { to });
        });
    }
}

module.exports = InvitationHandler;
