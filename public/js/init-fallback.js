(function() {
    function hideLoadingAndShowAuth() {
        const loadingScreen = document.getElementById('loading-screen');
        const authContainer = document.getElementById('auth-container');
        
        
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            loadingScreen.style.visibility = 'hidden';
            loadingScreen.style.opacity = '0';
            loadingScreen.classList.add('hidden');
        }
        
        if (authContainer) {
            authContainer.style.display = 'flex';
            authContainer.style.visibility = 'visible';
            authContainer.style.opacity = '1';
            authContainer.style.setProperty('display', 'flex', 'important');
            authContainer.classList.add('view-active');
            
            const navContainer = document.getElementById('nav-container');
            const onlinePlayersWidget = document.getElementById('online-players-widget');
            const lobbyChatDrawer = document.getElementById('lobby-chat-drawer');
            const gameInfoBtn = document.getElementById('game-info-btn');
            
            if (navContainer) {
                navContainer.style.display = 'none';
                navContainer.classList.add('hidden');
            }
            if (onlinePlayersWidget) {
                onlinePlayersWidget.style.display = 'none';
                onlinePlayersWidget.classList.add('hidden');
            }
            if (lobbyChatDrawer) {
                lobbyChatDrawer.style.display = 'none';
                lobbyChatDrawer.classList.add('hidden');
            }
            if (gameInfoBtn) {
                gameInfoBtn.style.display = 'none';
                gameInfoBtn.classList.add('hidden');
            }
        }
    }
    
    function checkAndInit() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(hideLoadingAndShowAuth, 300);
            });
        } else {
            setTimeout(hideLoadingAndShowAuth, 300);
        }
        
        setTimeout(() => {
            if (!window.app || !window.app.viewManager || !window.app.authManager) {
                hideLoadingAndShowAuth();
            }
        }, 1500);
    }
    
    checkAndInit();
    
    setInterval(() => {
        const battleshipStatus = document.getElementById('battleship-status');
        if (battleshipStatus) {
            battleshipStatus.style.display = 'none';
            battleshipStatus.classList.add('hidden');
            battleshipStatus.textContent = '';
            battleshipStatus.innerHTML = '';
        }
        const battleshipControls = document.querySelector('.battleship-controls');
        if (battleshipControls) {
            battleshipControls.style.display = 'none';
            battleshipControls.classList.add('hidden');
        }
    }, 100);
})();
