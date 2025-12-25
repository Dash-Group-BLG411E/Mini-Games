class NotificationManager {
    constructor(app) {
        this.app = app;
        this.notifications = [];
        this.notificationsBtn = null;
        this.notificationsDropdown = null;
        this.notificationsList = null;
        this.notificationsBadge = null;
        this.notificationsIcon = null;
        
        this.init();
    }

    init() {
        this.notificationsBtn = document.getElementById('notifications-btn');
        this.notificationsDropdown = document.getElementById('notifications-dropdown');
        this.notificationsList = document.getElementById('notifications-list');
        this.notificationsBadge = document.getElementById('notifications-badge');
        this.notificationsIcon = this.notificationsBtn?.querySelector('.notifications-icon');
        
        if (!this.notificationsBtn || !this.notificationsDropdown || !this.notificationsList) {
            console.warn('Notification elements not found. Retrying in 100ms...');
            // Retry initialization in case DOM isn't ready
            setTimeout(() => this.init(), 100);
            return;
        }
        
        this.setupEventListeners();
        console.log('✅ NotificationManager initialized');
    }

    setupEventListeners() {
        // Toggle dropdown on button click
        if (this.notificationsBtn) {
            this.notificationsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('🔔 Notification button clicked');
                this.toggleDropdown();
            });
        } else {
            console.error('❌ notificationsBtn is null');
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.notificationsDropdown && this.notificationsBtn &&
                !this.notificationsDropdown.contains(e.target) && 
                !this.notificationsBtn.contains(e.target)) {
                this.hideDropdown();
            }
        });
    }

    toggleDropdown() {
        if (!this.notificationsDropdown) {
            console.error('❌ notificationsDropdown is null');
            return;
        }
        
        const isHidden = this.notificationsDropdown.classList.contains('hidden');
        console.log('🔔 Toggling dropdown, currently hidden:', isHidden);
        
        if (isHidden) {
            this.showDropdown();
        } else {
            this.hideDropdown();
        }
    }

    showDropdown() {
        if (!this.notificationsDropdown) {
            console.error('❌ Cannot show dropdown - element is null');
            return;
        }
        
        console.log('🔔 Showing dropdown');
        this.notificationsDropdown.classList.remove('hidden');
        
        // Stop bell animation when dropdown is opened
        if (this.notificationsIcon) {
            this.notificationsIcon.classList.remove('bell-ring');
        }
    }

    hideDropdown() {
        if (!this.notificationsDropdown) {
            return;
        }
        
        console.log('🔔 Hiding dropdown');
        this.notificationsDropdown.classList.add('hidden');
    }

    addInvitation(from, gameType) {
        // Check if invitation already exists
        const exists = this.notifications.some(n => n.from === from && n.gameType === gameType);
        if (exists) {
            return;
        }
        
        const invitation = {
            id: `${from}-${gameType}-${Date.now()}`,
            from,
            gameType,
            timestamp: Date.now()
        };
        
        this.notifications.push(invitation);
        this.updateUI();
        this.animateBell();
    }

    removeInvitation(from, gameType) {
        this.notifications = this.notifications.filter(
            n => !(n.from === from && n.gameType === gameType)
        );
        this.updateUI();
    }

    updateUI() {
        if (!this.notificationsList || !this.notificationsBadge) return;
        
        // Update badge
        const count = this.notifications.length;
        if (count > 0) {
            this.notificationsBadge.textContent = count > 9 ? '9+' : count.toString();
            this.notificationsBadge.classList.remove('hidden');
        } else {
            this.notificationsBadge.classList.add('hidden');
        }
        
        // Update list
        if (this.notifications.length === 0) {
            this.notificationsList.innerHTML = '<div class="notification-empty">No pending invitations</div>';
            return;
        }
        
        const gameTypeName = (gameType) => {
            if (!this.app.viewManager) return gameType;
            return this.app.viewManager.formatGameType(gameType || 'three-mens-morris');
        };
        
        this.notificationsList.innerHTML = this.notifications.map(invitation => {
            const gameName = gameTypeName(invitation.gameType);
            return `
                <div class="notification-item" data-id="${invitation.id}">
                    <div class="notification-content">
                        <div class="notification-text">
                            <strong>${this.escapeHtml(invitation.from)}</strong> invited you to play <strong>${this.escapeHtml(gameName)}</strong>
                        </div>
                    </div>
                    <div class="notification-actions">
                        <button class="notification-accept-btn" data-from="${this.escapeHtml(invitation.from)}" data-game-type="${this.escapeHtml(invitation.gameType)}">
                            Accept
                        </button>
                        <button class="notification-decline-btn" data-from="${this.escapeHtml(invitation.from)}" data-game-type="${this.escapeHtml(invitation.gameType)}">
                            Decline
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners to buttons
        this.notificationsList.querySelectorAll('.notification-accept-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const from = btn.getAttribute('data-from');
                const gameType = btn.getAttribute('data-game-type');
                this.acceptInvitation(from, gameType);
            });
        });
        
        this.notificationsList.querySelectorAll('.notification-decline-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const from = btn.getAttribute('data-from');
                const gameType = btn.getAttribute('data-game-type');
                this.declineInvitation(from, gameType);
            });
        });
    }

    acceptInvitation(from, gameType) {
        if (this.app.socket && this.app.socket.connected) {
            this.app.socket.emit('acceptInvitation', { from });
            this.removeInvitation(from, gameType);
        }
    }

    declineInvitation(from, gameType) {
        if (this.app.socket && this.app.socket.connected) {
            this.app.socket.emit('declineInvitation', { from });
            this.removeInvitation(from, gameType);
        }
    }

    animateBell() {
        if (!this.notificationsIcon) return;
        
        // Only animate if dropdown is closed
        if (this.notificationsDropdown?.classList.contains('hidden')) {
            // Remove any existing animation first
            this.notificationsIcon.classList.remove('bell-ring');
            
            // Force reflow to restart animation
            void this.notificationsIcon.offsetWidth;
            
            // Add animation class
            this.notificationsIcon.classList.add('bell-ring');
            
            // Remove after animation completes (500ms animation + small buffer)
            setTimeout(() => {
                if (this.notificationsIcon && this.notificationsDropdown?.classList.contains('hidden')) {
                    this.notificationsIcon.classList.remove('bell-ring');
                }
            }, 600);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    clearAll() {
        this.notifications = [];
        this.updateUI();
    }
}

