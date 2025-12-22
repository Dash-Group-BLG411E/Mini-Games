class WarningManager {
    constructor(app) {
        this.app = app;
        this.beforeUnloadHandler = null;
        this.setupBeforeUnloadWarning();
    }

    setupBeforeUnloadWarning() {
        this.beforeUnloadHandler = (e) => {
            if (this.app.currentRoom && !this.app.isSpectator && 
                this.app.gameState && this.app.gameState.gameStatus !== 'finished') {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
    }

    enableBeforeUnloadWarning() {
        window.addEventListener('beforeunload', this.beforeUnloadHandler);
    }

    disableBeforeUnloadWarning() {
        window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    }

    showNavigationWarning() {
        if (this.app.navigationWarningModal) {
            this.app.navigationWarningModal.classList.remove('hidden');
        }
    }

    hideNavigationWarning() {
        if (this.app.navigationWarningModal) {
            this.app.navigationWarningModal.classList.add('hidden');
        }
    }
}
