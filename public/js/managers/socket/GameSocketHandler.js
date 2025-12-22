class GameSocketHandler {
    constructor(app) {
        this.app = app;
        this.gameStateHandler = new GameStateHandler(app);
        this.rematchHandler = new RematchHandler(app);
        this.gameLifecycleHandler = new GameLifecycleHandler(app);
    }

    registerHandlers(socket) {
        this.gameStateHandler.registerHandlers(socket);
        this.rematchHandler.registerHandlers(socket);
        this.gameLifecycleHandler.registerHandlers(socket);
    }
}
