

class NavigationManager {
    constructor(app) {
        this.app = app;
        
        this.navContainer = app.navContainer;
        this.onlinePlayersToggle = app.onlinePlayersToggle;
        this.onlinePlayersPopup = app.onlinePlayersPopup;
        this.onlinePlayersWidget = app.onlinePlayersWidget;
        this.lobbyChatTab = app.lobbyChatTab;
        this.lobbyChatDrawer = app.lobbyChatDrawer;
        this.roomChatTab = app.roomChatTab;
        this.roomChatDrawer = app.roomChatDrawer;
        
        this.lobbyNavBtn = app.lobbyNavBtn;
        this.roomsNavBtn = app.roomsNavBtn;
        this.leaderboardNavBtn = app.leaderboardNavBtn;
        this.tournamentsNavBtn = app.tournamentsNavBtn;
        this.backToLobbyBtn = app.backToLobbyBtn;
        this.tournamentsBackBtn = app.tournamentsBackBtn;
        
        this.userAvatarBtn = app.userAvatarBtn;
        this.userMenuDropdown = app.userMenuDropdown;
        this.profileNavBtn = app.profileNavBtn;
        this.adminReportsBtn = app.adminReportsBtn;
        this.logoutBtn = app.logoutBtn;
        
        this.onlinePlayersOpen = false;
        this.lobbyChatOpen = false;
        this.roomChatOpen = false;
    }

    

    updateNavigation() {
        if (this.app.viewManager && this.app.viewManager.currentView === 'auth') {
            this.navContainer.style.display = 'none';
        } else {
            this.navContainer.style.display = 'flex';
        }
    }

    

    toggleOnlinePlayers() {
        this.onlinePlayersOpen = !this.onlinePlayersOpen;
        if (this.onlinePlayersOpen) {
            this.onlinePlayersPopup.classList.remove('hidden');
            this.closeLobbyChatDrawer();
        } else {
            this.onlinePlayersPopup.classList.add('hidden');
        }
    }

    

    closeOnlinePlayers() {
        this.onlinePlayersOpen = false;
        if (this.onlinePlayersPopup) {
            this.onlinePlayersPopup.classList.add('hidden');
        }
    }

    

    openLobbyChatDrawer() {
        this.lobbyChatOpen = true;
        if (this.lobbyChatDrawer) {
            this.lobbyChatDrawer.classList.add('drawer-open');
        }
        this.closeOnlinePlayers();
    }

    

    closeLobbyChatDrawer() {
        this.lobbyChatOpen = false;
        if (this.lobbyChatDrawer) {
            this.lobbyChatDrawer.classList.remove('drawer-open');
        }
    }

    

    openRoomChatDrawer() {
        this.roomChatOpen = true;
        if (this.roomChatDrawer) {
            this.roomChatDrawer.classList.add('drawer-open');
        }
    }

    

    closeRoomChatDrawer() {
        this.roomChatOpen = false;
        if (this.roomChatDrawer) {
            this.roomChatDrawer.classList.remove('drawer-open');
        }
    }

    

    updateChatWidgets() {
        if (this.app.viewManager && this.app.viewManager.currentView === 'auth') {
            if (this.lobbyChatDrawer) {
                this.lobbyChatDrawer.classList.add('hidden');
            }
            if (this.roomChatDrawer) {
                this.roomChatDrawer.classList.add('hidden');
            }
            if (this.onlinePlayersWidget) {
                this.onlinePlayersWidget.classList.add('hidden');
            }
            this.closeLobbyChatDrawer();
            this.closeOnlinePlayers();
            this.closeRoomChatDrawer();
            return;
        }

        if (this.app.currentRoom) {
            if (this.lobbyChatDrawer) {
                this.lobbyChatDrawer.classList.add('hidden');
            }
            if (this.roomChatDrawer) {
                this.roomChatDrawer.classList.remove('hidden');
            }
            if (this.onlinePlayersWidget) {
                this.onlinePlayersWidget.classList.add('hidden');
            }
            this.closeLobbyChatDrawer();
            this.closeOnlinePlayers();
        } else {
            if (this.lobbyChatDrawer) {
                this.lobbyChatDrawer.classList.remove('hidden');
            }
            if (this.roomChatDrawer) {
                this.roomChatDrawer.classList.add('hidden');
            }
            if (this.onlinePlayersWidget) {
                this.onlinePlayersWidget.classList.remove('hidden');
            }
            this.closeRoomChatDrawer();
        }
    }

    

    registerEventListeners() {
        this.lobbyNavBtn = document.getElementById('lobby-nav-btn');
        this.roomsNavBtn = document.getElementById('rooms-nav-btn');
        this.leaderboardNavBtn = document.getElementById('leaderboard-nav-btn');
        this.tournamentsNavBtn = document.getElementById('tournaments-nav-btn');
        this.onlinePlayersToggle = document.getElementById('online-players-toggle');
        this.onlinePlayersPopup = document.getElementById('online-players-popup');
        this.onlinePlayersWidget = document.getElementById('online-players-widget');
        this.lobbyChatTab = document.getElementById('lobby-chat-tab');
        this.lobbyChatDrawer = document.getElementById('lobby-chat-drawer');
        this.roomChatTab = document.getElementById('room-chat-tab');
        this.roomChatDrawer = document.getElementById('room-chat-drawer');
        this.backToLobbyBtn = document.getElementById('back-to-lobby-btn');
        this.tournamentsBackBtn = document.getElementById('tournaments-back-btn');
        this.userAvatarBtn = document.getElementById('user-avatar-btn');
        this.userMenuDropdown = document.getElementById('user-menu-dropdown');
        this.profileNavBtn = document.getElementById('profile-nav-btn');
        this.adminReportsBtn = document.getElementById('admin-reports-btn');
        this.logoutBtn = document.getElementById('logout-btn');

        if (this.lobbyNavBtn) {
            this.lobbyNavBtn.addEventListener('click', () => {
                if (this.app.gameState && this.app.gameState.gameStatus === 'finished') {
                    if (this.app.viewManager) {
                        this.app.viewManager.showLobby();
                    }
                    return;
                }
                if (this.app.currentRoom && !this.app.isSpectator) {
                    if (this.app.warningManager) {
                        this.app.warningManager.showNavigationWarning();
                    } else {
                        this.app.showNavigationWarning();
                    }
                    return;
                }
                if (this.app.currentRoom && this.app.isSpectator) {
                    if (this.app.roomManager) {
                        this.app.roomManager.leaveRoomAsSpectator();
                    }
                }
                if (this.app.viewManager) {
                    this.app.viewManager.showLobby();
                }
            });
        }

        if (this.roomsNavBtn) {
            this.roomsNavBtn.addEventListener('click', () => {
                if (this.app.currentRoom && !this.app.isSpectator) {
                    if (this.app.gameState && this.app.gameState.gameStatus === 'finished') {
                        if (this.app.roomManager) {
                            this.app.roomManager.leaveRoom();
                        }
                        if (this.app.viewManager) {
                            this.app.viewManager.showView('rooms');
                        }
                        return;
                    }
                    if (this.app.warningManager) {
                        this.app.warningManager.showNavigationWarning();
                    } else {
                        this.app.showNavigationWarning();
                    }
                    return;
                }
                if (this.app.currentRoom && this.app.isSpectator) {
                    if (this.app.roomManager) {
                        this.app.roomManager.leaveRoomAsSpectator();
                    }
                }
                if (this.app.viewManager) {
                    this.app.viewManager.showView('rooms');
                }
            });
        }

        if (this.leaderboardNavBtn) {
            this.leaderboardNavBtn.addEventListener('click', () => {
                if (this.app.currentRoom && !this.app.isSpectator) {
                    if (this.app.gameState && this.app.gameState.gameStatus === 'finished') {
                        if (this.app.roomManager) {
                            this.app.roomManager.leaveRoom();
                        }
                        if (this.app.viewManager) {
                            this.app.viewManager.showView('leaderboard');
                        }
                        return;
                    }
                    if (this.app.warningManager) {
                        this.app.warningManager.showNavigationWarning();
                    } else {
                        this.app.showNavigationWarning();
                    }
                    return;
                }
                if (this.app.currentRoom && this.app.isSpectator) {
                    if (this.app.roomManager) {
                        this.app.roomManager.leaveRoomAsSpectator();
                    }
                }
                if (this.app.viewManager) {
                    this.app.viewManager.showView('leaderboard');
                }
            });
        }

        if (this.tournamentsNavBtn) {
            this.tournamentsNavBtn.addEventListener('click', () => {
                if (this.app.viewManager) {
                    this.app.viewManager.showView('tournaments');
                }
            });
        }

        if (this.onlinePlayersToggle) {
            this.onlinePlayersToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.onlinePlayersOpen) {
                    this.closeOnlinePlayers();
                } else {
                    this.toggleOnlinePlayers();
                }
            });
        }

        document.addEventListener('click', (e) => {
            if (this.onlinePlayersOpen && 
                this.onlinePlayersPopup &&
                !this.onlinePlayersPopup.contains(e.target) && 
                this.onlinePlayersToggle &&
                !this.onlinePlayersToggle.contains(e.target)) {
                this.closeOnlinePlayers();
            }
        });

        if (this.lobbyChatTab) {
            this.lobbyChatTab.addEventListener('click', () => {
                if (this.lobbyChatOpen) {
                    this.closeLobbyChatDrawer();
                } else {
                    this.openLobbyChatDrawer();
                }
            });
        }

        if (this.roomChatTab) {
            this.roomChatTab.addEventListener('click', () => {
                if (this.roomChatOpen) {
                    this.closeRoomChatDrawer();
                } else {
                    this.openRoomChatDrawer();
                }
            });
        }

        if (this.backToLobbyBtn) {
            this.backToLobbyBtn.addEventListener('click', () => {
                if (this.app.viewManager) {
                    this.app.viewManager.showLobby();
                }
            });
        }
        
        if (this.tournamentsBackBtn) {
            this.tournamentsBackBtn.addEventListener('click', () => {
                if (this.app.viewManager) {
                    this.app.viewManager.showLobby();
                }
            });
        }

        if (this.userAvatarBtn) {
            this.userAvatarBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserMenu();
            });
        }
        
        if (this.profileNavBtn) {
            this.profileNavBtn.addEventListener('click', () => {
                this.closeUserMenu();
                if (this.app.currentRoom && !this.app.isSpectator) {
                    if (this.app.gameState && this.app.gameState.gameStatus === 'finished') {
                        if (this.app.roomManager) {
                            this.app.roomManager.leaveRoom();
                        }
                        this.app.showProfile();
                        return;
                    }
                    if (this.app.warningManager) {
                        this.app.warningManager.showNavigationWarning();
                    } else {
                        this.app.showNavigationWarning();
                    }
                    return;
                }
                this.app.showProfile();
            });
        }
        
        if (this.adminReportsBtn) {
            this.adminReportsBtn.addEventListener('click', () => {
                this.closeUserMenu();
                window.location.href = '/admin/reports';
            });
        }
        
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => {
                this.closeUserMenu();
                if (this.app.currentRoom && !this.app.isSpectator) {
                    if (this.app.warningManager) {
                        this.app.warningManager.showNavigationWarning();
                    } else {
                        this.app.showNavigationWarning();
                    }
                    return;
                }
                this.app.logout();
            });
        }

        document.addEventListener('click', (e) => {
            if (this.userAvatarBtn && this.userMenuDropdown) {
                if (!this.userAvatarBtn.contains(e.target) && !this.userMenuDropdown.contains(e.target)) {
                    this.closeUserMenu();
                }
            }
        });
    }

    toggleUserMenu() {
        this.app.userMenuOpen = !this.app.userMenuOpen;
        if (this.userMenuDropdown) {
            this.userMenuDropdown.classList.toggle('hidden', !this.app.userMenuOpen);
        }
    }

    closeUserMenu() {
        this.app.userMenuOpen = false;
        if (this.userMenuDropdown) {
            this.userMenuDropdown.classList.add('hidden');
        }
    }
}
