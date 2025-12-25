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
            // Hide waiting modal when invitation is declined
            if (this.app.invitationManager) {
                this.app.invitationManager.hideWaitingInvitationModal();
            }
        });

        socket.on('invitationError', (error) => {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification(error);
            }
            // Hide waiting modal if there's an error
            if (this.app.invitationManager) {
                this.app.invitationManager.hideWaitingInvitationModal();
            }
        });

        socket.on('invitationCancelled', (data) => {
            // Hide waiting modal when invitation is cancelled (sender cancels or recipient joins game)
            if (this.app.invitationManager) {
                this.app.invitationManager.hideWaitingInvitationModal();
            }
            
            // Show notification only if cancelled because recipient joined a game
            if (data.reason && this.app.modalManager) {
                this.app.modalManager.showNotification(data.reason);
            }
        });

        socket.on('invitationCancelledBySender', (data) => {
            // Remove invitation from notification dropdown when sender cancels
            // No modal should be shown - just remove from dropdown silently
            if (this.app.notificationManager && data.from) {
                // Remove all invitations from this sender (gameType might not be provided)
                const notificationsToRemove = this.app.notificationManager.notifications.filter(n => n.from === data.from);
                notificationsToRemove.forEach(notif => {
                    this.app.notificationManager.removeInvitation(notif.from, notif.gameType);
                });
            }
        });
    }

    handleGameInvitation(data) {
        // Guests can receive invitations now
        // if (this.app.userRole === 'guest') {
        //     if (this.app.modalManager) {
        //         this.app.modalManager.showNotification('Guests cannot receive invitations. Please register or log in to play games.');
        //     }
        //     return;
        // }
        
        const { from, gameType } = data;
        
        // Always use notification system - never show modal
        if (this.app.notificationManager) {
            this.app.notificationManager.addInvitation(from, gameType || 'three-mens-morris');
        } else {
            console.warn('NotificationManager not available, invitation from', from, 'will be ignored');
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
        
        // Remove all invitations from notification dropdown (user accepted one, others are cancelled)
        if (this.app.notificationManager) {
            this.app.notificationManager.clearAll();
            // Hide dropdown if it's open
            this.app.notificationManager.hideDropdown();
        }
        
        // Hide waiting invitation modal if we sent an invitation that was accepted
        if (this.app.invitationManager) {
            this.app.invitationManager.hideWaitingInvitationModal();
        }
        
        // Update notification button visibility
        if (this.app.viewManager) {
            this.app.viewManager.updateNotificationButtonVisibility();
        }
    }
}
