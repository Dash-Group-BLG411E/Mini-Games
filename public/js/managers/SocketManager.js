class SocketManager {
    constructor(app) {
        this.app = app;
        this.initializeHandlers();
    }

    initializeHandlers() {
        this.lobbyHandler = new LobbySocketHandler(this.app);
        this.roomHandler = new RoomSocketHandler(this.app);
        this.gameHandler = new GameSocketHandler(this.app);
        this.battleshipHandler = new BattleshipSocketHandler(this.app);
        this.memoryHandler = new MemorySocketHandler(this.app);
        this.tmmHandler = new TMMSocketHandler(this.app);
        this.invitationHandler = new InvitationSocketHandler(this.app);
        this.scoreboardHandler = new ScoreboardSocketHandler(this.app);
    }

    registerHandlers(socket) {
        if (!socket) return;

        socket.on('connect', () => {
        });

        socket.on('connect_error', (error) => {
            this.app.handleSocketError(error);
        });

        this.lobbyHandler.registerHandlers(socket);
        this.roomHandler.registerHandlers(socket);
        this.gameHandler.registerHandlers(socket);
        this.battleshipHandler.registerHandlers(socket);
        this.memoryHandler.registerHandlers(socket);
        this.tmmHandler.registerHandlers(socket);
        this.invitationHandler.registerHandlers(socket);
        this.scoreboardHandler.registerHandlers(socket);
    }
}
