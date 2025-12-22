class RematchHandler {
    constructor(app) {
        this.app = app;
    }

    registerHandlers(socket) {
        socket.on('rematchRequested', (data) => {
            this.handleRematchRequested(data);
        });

        socket.on('rematchAccepted', (data) => {
            this.handleRematchAccepted(data);
        });
    }

    handleRematchRequested(data) {
        if (data.waitingForYou) {
            this.app.rematchRequestFrom = data.from;
            this.app.updateRematchButtonStatus();
        } else if (data.waitingForOpponent) {
            this.app.hasRequestedRematch = true;
            this.app.updateRematchButtonStatus();
        }
    }

    handleRematchAccepted(data) {
        this.app.currentRoom = data.roomId;
        this.app.currentRoomName = data.roomName || `Room ${data.roomId}`;
        this.app.myRole = data.player.role;
        this.app.isSpectator = false;
        
        if (this.app.rematchBtn) {
            this.app.rematchBtn.classList.add('hidden');
        }
        this.app.rematchRequestFrom = null;
        this.app.hasRequestedRematch = false;
        
        if (this.app.navigationManager) {
            this.app.navigationManager.updateChatWidgets();
        }
        if (this.app.roomManager) {
            this.app.roomManager.updateLeaveButtonVisibility();
            this.app.roomManager.updateRoomInfoBox();
        }
        if (this.app.viewManager) {
            this.app.viewManager.showGame();
        }
    }
}
