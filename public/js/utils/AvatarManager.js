

class AvatarManager {
    constructor(app) {
        this.app = app;
        this.playerAvatarsCache = new Map();
    }

    

    getDefaultAvatar(username) {
        const emojis = ['😀', '😃', '😄', '😁', '😆', '😊', '😎', '🤓', '🧐', '😇', '🤗', '🤔', '😋', '😌', '😍', '🥰'];
        if (!username || username.length === 0) return '👤';
        const normalizedUsername = username.toLowerCase();
        const index = normalizedUsername.charCodeAt(0) % emojis.length;
        return emojis[index];
    }

    

    async getPlayerAvatar(username, avatarFromGameState = null) {
        if (!username) return '👤';
        
        const normalizedUsername = username.toLowerCase();
        
        if (avatarFromGameState) {
            this.playerAvatarsCache.set(username.toLowerCase(), avatarFromGameState);
            return avatarFromGameState || this.getDefaultAvatar(username);
        }
        
        const cachedAvatar = this.playerAvatarsCache.get(username.toLowerCase());
        if (cachedAvatar) {
            return cachedAvatar;
        }
        
        if (this.app.userProfile && this.app.userProfile.username && this.app.userProfile.username.toLowerCase() === normalizedUsername) {
            const avatar = this.app.userProfile.avatar || this.getDefaultAvatar(username);
            this.playerAvatarsCache.set(username.toLowerCase(), avatar);
            return avatar;
        }
        
        const defaultAvatar = this.getDefaultAvatar(username);
        this.playerAvatarsCache.set(username.toLowerCase(), defaultAvatar);
        return defaultAvatar;
    }

    

    clearCache() {
        this.playerAvatarsCache.clear();
    }

    

    clearUserCache(username) {
        if (username) {
            this.playerAvatarsCache.delete(username.toLowerCase());
        }
    }
}
