class InvitationSocketHandler {
    constructor(app) {
        this.app = app;
    }

    registerHandlers(socket) {
        socket.on('gameInvitation', (data) => {
            this.handleGameInvitation(data);
        });

        socket.on('invitationAccepted', (data) => {
            this.handleInvitationAccepted(data);
        });

        socket.on('invitationDeclined', (data) => {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification(`${data.to} declined your invitation.`);
            }
        });

        socket.on('invitationError', (error) => {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification(error);
            }
        });
    }

    handleGameInvitation(data) {
        if (this.app.userRole === 'guest') {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('Guests cannot receive invitations. Please register or log in to play games.');
            }
            return;
        }
        
        const { from, gameType } = data;
        this.app.pendingInvitation = { from, gameType };
        const gameTypeName = this.app.viewManager ? this.app.viewManager.formatGameType(gameType || 'three-mens-morris') : (gameType || 'three-mens-morris');
        const message = `${from} invited you to play ${gameTypeName}.`;
        if (this.app.modalManager) {
            this.app.modalManager.showInvitationModal(message);
        }
    }

    handleInvitationAccepted(data) {
        const { roomId, roomName, gameType } = data;
        this.app.currentRoom = roomId;
        this.app.currentRoomName = roomName;
        if (this.app.viewManager) {
            this.app.viewManager.setCurrentGameType(gameType);
        }
        this.app.myRole = null;
        this.app.isSpectator = false;
        this.app.roomMessages = [];
        if (this.app.chatRenderer) {
            this.app.chatRenderer.renderRoomMessages();
        }
        if (this.app.roomManager) {
            this.app.roomManager.updateLeaveButtonVisibility();
            this.app.roomManager.updateRoomInfoBox();
        }
        this.app.enableBeforeUnloadWarning();
        if (this.app.viewManager) {
            this.app.viewManager.showGame();
        }
    }
}
