class DOMManager {
    constructor(app) {
        this.app = app;
        this.bindAllElements();
    }

    bindAllElements() {
        this.bindNavigationElements();
        this.bindAuthElements();
        this.bindLobbyElements();
        this.bindGameElements();
        this.bindChatElements();
        this.bindModalElements();
        this.bindProfileElements();
        this.bindRoomElements();
    }

    bindNavigationElements() {
        this.app.navContainer = document.getElementById('nav-container');
        this.app.lobbyNavBtn = document.getElementById('lobby-nav-btn');
        this.app.roomsNavBtn = document.getElementById('rooms-nav-btn');
        this.app.leaderboardNavBtn = document.getElementById('leaderboard-nav-btn');
        this.app.tournamentsNavBtn = document.getElementById('tournaments-nav-btn');
        this.app.userAvatarBtn = document.getElementById('user-avatar-btn');
        this.app.userAvatarDisplay = document.getElementById('user-avatar-display');
        this.app.userUsernameDisplay = document.getElementById('user-username-display');
        this.app.userRoleBadge = document.getElementById('user-role-badge');
        this.app.userMenuDropdown = document.getElementById('user-menu-dropdown');
        this.app.profileNavBtn = document.getElementById('profile-nav-btn');
        this.app.adminReportsBtn = document.getElementById('admin-reports-btn');
        this.app.logoutBtn = document.getElementById('logout-btn');
        this.app.backToLobbyBtn = document.getElementById('back-to-lobby-btn');
        this.app.tournamentsBackBtn = document.getElementById('tournaments-back-btn');
    }

    bindAuthElements() {
        this.app.authContainer = document.getElementById('auth-container');
    }

    bindLobbyElements() {
        this.app.lobbyContainer = document.getElementById('lobby-container');
        this.app.roomsContainer = document.getElementById('rooms-container');
        this.app.lobbyChatList = document.querySelector('#lobby-chat-drawer #lobby-chat-list');
        this.app.lobbyChatForm = document.querySelector('#lobby-chat-drawer #lobby-chat-form');
        this.app.lobbyChatInput = document.querySelector('#lobby-chat-drawer #lobby-chat-input');
        this.app.onlinePlayersToggle = document.getElementById('online-players-toggle');
        this.app.onlinePlayersPopup = document.getElementById('online-players-popup');
        this.app.lobbyChatTab = document.getElementById('lobby-chat-tab');
        this.app.lobbyChatDrawer = document.getElementById('lobby-chat-drawer');
        this.app.lobbyChatDrawerContent = document.getElementById('lobby-chat-drawer-content');
        this.app.cardActionButtons = document.querySelectorAll('.game-card__action');
        this.app.onlinePlayersWidget = document.getElementById('online-players-widget');
        this.app.leaderboardContainer = document.getElementById('leaderboard-container');
        this.app.tournamentsContainer = document.getElementById('tournaments-container');

        if (!this.app.lobbyChatForm || !this.app.lobbyChatInput || !this.app.lobbyChatList) {
            console.warn('Lobby chat drawer elements not found');
        }
    }

    bindGameElements() {
        this.app.gameContainer = document.getElementById('game-container');
        this.app.roomGameTypeDisplay = document.getElementById('room-game-type');
        this.app.gameModeMessage = document.getElementById('game-mode-message');
        this.app.infoText = document.querySelector('.info .class-text');
        this.app.gameInfoBtn = document.getElementById('game-info-btn');
        this.app.gameInfoModal = document.getElementById('game-info-modal');
        this.app.gameInfoTitle = document.getElementById('game-info-title');
        this.app.gameInfoContent = document.getElementById('game-info-content');
        this.app.gameEndModal = document.getElementById('game-end-modal');
        this.app.gameEndTitle = document.getElementById('game-end-title');
        this.app.gameEndMessage = document.getElementById('game-end-message');
        this.app.gameEndRematchBtn = document.getElementById('game-end-rematch-btn');
        this.app.gameEndRematchStatus = document.getElementById('game-end-rematch-status');
        this.app.rematchBtn = document.getElementById('rematch-btn');
        this.app.gameBoard = document.getElementById('three-mens-morris-board') || document.querySelector('.game-board');
        this.app.battleshipShipsContainer = document.getElementById('battleship-ships-container');
        this.app.battleshipShipsBox = document.getElementById('battleship-ships-box');
        this.app.battleshipStatus = document.getElementById('battleship-status');
        this.app.battleshipToggleOrientation = document.getElementById('battleship-toggle-orientation');
    }

    bindChatElements() {
        this.app.roomChatForm = document.getElementById('room-chat-form');
        this.app.roomChatInput = document.getElementById('room-chat-input');
        this.app.roomChatTab = document.getElementById('room-chat-tab');
        this.app.roomChatDrawer = document.getElementById('room-chat-drawer');
        this.app.roomChatDrawerContent = document.getElementById('room-chat-drawer-content');
    }

    bindModalElements() {
        this.app.reportModal = document.getElementById('report-modal');
        this.app.reportTargetName = document.getElementById('report-target-name');
        this.app.reportSubmitBtn = document.getElementById('report-submit-btn');
        this.app.reportCancelBtn = document.getElementById('report-cancel-btn');
        this.app.inviteGameModal = document.getElementById('invite-game-modal');
        this.app.invitePlayerName = document.getElementById('invite-player-name');
        this.app.inviteConfirmBtn = document.getElementById('invite-confirm-btn');
        this.app.inviteCancelBtn = document.getElementById('invite-cancel-btn');
        this.app.navigationWarningModal = document.getElementById('navigation-warning-modal');
        this.app.closeNavWarningBtn = document.getElementById('close-nav-warning-btn');
    }

    bindProfileElements() {
        this.app.profileContainer = document.getElementById('profile-container');
        this.app.deleteAccountBtn = document.getElementById('delete-account-btn');
        this.app.confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        this.app.cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        this.app.updateAvatarBtn = document.getElementById('update-avatar-btn');
        this.app.profilePasswordForm = document.getElementById('profile-password-form');
    }

    bindRoomElements() {
        this.app.leaveRoomBtn = document.getElementById('leave-room-btn');
        this.app.leaveRoomModal = document.getElementById('leave-room-modal');
        this.app.confirmLeaveBtn = document.getElementById('confirm-leave-btn');
        this.app.cancelLeaveBtn = document.getElementById('cancel-leave-btn');
        this.app.leaveRoomMessage = document.getElementById('leave-room-message');
    }
}
