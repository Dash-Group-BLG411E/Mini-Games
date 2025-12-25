
class UserProfileManager {
    constructor(app) {
        this.app = app;
        
        this.userProfileContainer = document.getElementById('user-profile-container');
        this.avatarElement = document.getElementById('user-profile-avatar');
        this.usernameElement = document.getElementById('user-profile-username');
        this.roleElement = document.getElementById('user-profile-role');
        this.viewBadgesButton = document.getElementById('view-user-badges-btn');
        this.badgesModal = document.getElementById('user-profile-badges-modal');
        this.badgesModalTitle = document.getElementById('user-profile-badges-modal-title');
        this.badgesModalContent = document.getElementById('user-profile-badges-modal-content');
        this.closeBadgesModalBtn = document.getElementById('close-user-profile-badges-btn');
        this.reportButton = document.getElementById('user-profile-report-btn');
        
        this.viewedUsername = null;
        this.viewedUserBadges = undefined; // undefined = not loaded yet, [] = loaded but empty
        
        this.setupEventListeners();
        this.setupSocketListeners();
    }
    
    setupSocketListeners() {
        // Listener will be set up in ScoreboardSocketHandler
        // This method is kept for consistency but the actual listener is in ScoreboardSocketHandler
    }
    
    setupEventListeners() {
        if (this.reportButton) {
            this.reportButton.addEventListener('click', () => {
                if (this.viewedUsername) {
                    if (this.app.openReportModal) {
                        this.app.openReportModal(this.viewedUsername);
                    }
                }
            });
        }
        
        if (this.viewBadgesButton) {
            this.viewBadgesButton.addEventListener('click', () => {
                this.showBadgesModal();
            });
        }
        
        if (this.closeBadgesModalBtn) {
            this.closeBadgesModalBtn.addEventListener('click', () => {
                this.hideBadgesModal();
            });
        }
        
        if (this.badgesModal) {
            this.badgesModal.addEventListener('click', (e) => {
                if (e.target === this.badgesModal) {
                    this.hideBadgesModal();
                }
            });
        }
    }
    
    showBadgesModal() {
        console.log('[UserProfileManager] showBadgesModal called');
        console.log('[UserProfileManager] viewedUsername:', this.viewedUsername);
        console.log('[UserProfileManager] viewedUserBadges:', this.viewedUserBadges);
        
        if (!this.badgesModal) {
            console.warn('[UserProfileManager] Badges modal not found');
            return;
        }
        
        // Update modal title
        if (this.viewedUsername && this.badgesModalTitle) {
            this.badgesModalTitle.textContent = `${this.viewedUsername}'s Badges`;
        }
        
        this.badgesModal.classList.remove('hidden');
        
        // Always display badges (will show empty message if no badges)
        // If badges haven't been loaded yet, load them now
        if (this.viewedUserBadges === undefined || this.viewedUserBadges === null) {
            // Badges haven't been loaded yet
            console.log('[UserProfileManager] Badges not loaded yet, showing loading message');
            if (this.badgesModalContent) {
                this.badgesModalContent.innerHTML = '<div class="no-badges">Loading badges...</div>';
            }
            if (this.viewedUsername) {
                this.loadBadges(this.viewedUsername);
            }
        } else {
            // Badges have been loaded (even if empty array), display them
            console.log('[UserProfileManager] Badges already loaded, displaying them');
            this.displayBadgesInModal(this.viewedUserBadges);
        }
    }
    
    hideBadgesModal() {
        if (this.badgesModal) {
            this.badgesModal.classList.add('hidden');
        }
    }

    

    canViewProfiles() {
        // Everyone can view profiles (guests can view registered user profiles)
        return true;
    }

    

    showUserProfile(username) {
        console.log('[UserProfileManager.showUserProfile] Called with username:', username);
        
        if (!username) {
            console.log('[UserProfileManager.showUserProfile] Blocked: no username provided');
            return;
        }
        
        const targetUserRole = this.app.userRolesMap.get(username) || 'player';
        const isGuestUser = targetUserRole === 'guest' || username.startsWith('guest-');
        if (isGuestUser) {
            console.log('[UserProfileManager.showUserProfile] Blocked: cannot view guest profiles');
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('Guest profiles are not available.');
            } else {
                alert('Guest profiles are not available.');
            }
            return;
        }
        
        this.viewedUsername = username;
        console.log('[UserProfileManager.showUserProfile] Set viewedUsername to:', username);
        
        // Load and display avatar
        this.loadAvatar(username);
        
        if (this.usernameElement) {
            this.usernameElement.textContent = username;
        }
        
        const userRole = this.app.userRolesMap.get(username) || 'player';
        if (this.roleElement) {
            this.roleElement.textContent = `Role: ${userRole}`;
        }
        
        // Load badges for the viewed user
        this.loadBadges(username);
        
        if (this.app.viewManager) {
            console.log("Switching to user-profile view");
            this.app.viewManager.showView('user-profile');
        } else {
            console.warn('[UserProfileManager.showUserProfile] viewManager not available');
        }
    }
    
    async loadAvatar(username) {
        if (!this.avatarElement || !username) return;
        
        try {
            let avatar = null;
            
            // First, check avatar manager's cache (includes game state avatars)
            if (this.app.avatarManager) {
                const cachedAvatar = this.app.avatarManager.playerAvatarsCache.get(username.toLowerCase());
                if (cachedAvatar) {
                    avatar = cachedAvatar;
                }
            }
            
            // If not in cache, check userAvatarsMap (from lobby data if backend sends it)
            if (!avatar && this.app.userAvatarsMap && this.app.userAvatarsMap.has(username)) {
                avatar = this.app.userAvatarsMap.get(username);
                // Cache it in avatar manager
                if (this.app.avatarManager) {
                    this.app.avatarManager.playerAvatarsCache.set(username.toLowerCase(), avatar);
                }
            }
            
            // If still no avatar, use avatar manager which will check game state and return default
            if (!avatar) {
                avatar = await this.app.getPlayerAvatar(username);
            }
            
            // Display the avatar
            if (this.avatarElement && avatar) {
                this.avatarElement.textContent = avatar;
            } else if (this.avatarElement) {
                this.avatarElement.textContent = '👤';
            }
        } catch (error) {
            console.error('Failed to load avatar:', error);
            if (this.avatarElement) {
                this.avatarElement.textContent = '👤';
            }
        }
    }

    

    loadBadges(username) {
        if (!this.app.socket || !username) {
            console.warn('[UserProfileManager] Cannot load badges: socket or username missing');
            return;
        }
        console.log('[UserProfileManager] Loading badges for:', username);
        this.app.socket.emit('getUserBadgesFor', { username });
    }
    
    displayBadges(badges) {
        console.log('[UserProfileManager] displayBadges called with:', badges);
        // Store badges for later display (use empty array if null/undefined)
        this.viewedUserBadges = Array.isArray(badges) ? badges : [];
        console.log('[UserProfileManager] Stored badges:', this.viewedUserBadges);
        
        // If modal is open, update it immediately
        if (this.badgesModal && !this.badgesModal.classList.contains('hidden')) {
            console.log('[UserProfileManager] Modal is open, updating badges');
            this.displayBadgesInModal(this.viewedUserBadges);
        }
    }
    
    displayBadgesInModal(badges) {
        console.log('[UserProfileManager] displayBadgesInModal called with:', badges);
        console.log('[UserProfileManager] badgesModalContent:', this.badgesModalContent);
        console.log('[UserProfileManager] badgesModalTitle:', this.badgesModalTitle);
        
        if (!this.badgesModalContent) {
            console.error('[UserProfileManager] badgesModalContent not found!');
            return;
        }
        
        if (!this.badgesModalTitle) {
            console.error('[UserProfileManager] badgesModalTitle not found!');
        }
        
        // Update modal title with username
        if (this.viewedUsername && this.badgesModalTitle) {
            this.badgesModalTitle.textContent = `${this.viewedUsername}'s Badges`;
        }
        
        // Clear existing badges
        this.badgesModalContent.innerHTML = '';
        
        if (!this.app.scoreboardManager) {
            console.warn('[UserProfileManager] scoreboardManager not available');
            this.badgesModalContent.innerHTML = '<p style="color: var(--text-dark);">Badges unavailable</p>';
            return;
        }
        
        const allBadges = this.app.scoreboardManager.getAllBadges();
        console.log('[UserProfileManager] All badges:', allBadges);
        
        // Check if badges are empty or invalid
        const hasNoBadges = !badges || !Array.isArray(badges) || badges.length === 0;
        console.log('[UserProfileManager] Checking badges:', {
            badges,
            isArray: Array.isArray(badges),
            length: badges?.length,
            hasNoBadges
        });
        
        if (hasNoBadges) {
            console.log('[UserProfileManager] No badges to display');
            const username = this.viewedUsername || 'This user';
            const message = `<div class="no-badges">${username} has no badges yet.<br>Play games to win some!</div>`;
            
            if (!this.badgesModalContent) {
                console.error('[UserProfileManager] badgesModalContent element not found!');
                return;
            }
            
            console.log('[UserProfileManager] Setting empty badges message');
            this.badgesModalContent.innerHTML = message;
            console.log('[UserProfileManager] Message set. Content:', this.badgesModalContent.innerHTML);
            return;
        }
        
        console.log('[UserProfileManager] Displaying', badges.length, 'badges');
        badges.forEach(badgeId => {
            const badge = allBadges[badgeId];
            if (badge) {
                const badgeElement = this.app.scoreboardManager.createBadgeElement(badge, true);
                this.badgesModalContent.appendChild(badgeElement);
            } else {
                console.warn('[UserProfileManager] Badge not found:', badgeId);
            }
        });
        
        console.log('[UserProfileManager] Modal content after update:', this.badgesModalContent.innerHTML);
    }

    hideProfile() {
        this.viewedUsername = null;
        this.viewedUserBadges = undefined; // Reset to undefined so we know badges haven't been loaded
        
        if (this.avatarElement) {
            this.avatarElement.textContent = '👤';
        }
        
        if (this.usernameElement) {
            this.usernameElement.textContent = 'Username';
        }
        
        if (this.roleElement) {
            this.roleElement.textContent = 'Role';
        }
        
        if (this.viewBadgesButton) {
            this.viewBadgesButton.textContent = 'View Badges';
        }
        
        // Hide modal if it's open
        if (this.badgesModal) {
            this.badgesModal.classList.add('hidden');
        }
    }
}

