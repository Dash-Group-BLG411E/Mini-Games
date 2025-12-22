const path = require("path")
const http = require("http")
const express = require("express")
const socketio = require("socket.io")
const SocketHandlers = require("./core/SocketHandlers")
const authRoutes = require("./auth/authRoutes")
const reportsRoutes = require("./routes/reportsRoutes")
const { requireAuth, requireRole } = require("./auth/authMiddleware")
const { verifyToken } = require("./auth/authUtils")
const connectDB = require("./db/connection")
const { normalizeGameType } = require("./utils/gameTypeUtils")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirPath = path.join(__dirname, "../public")
app.use(express.static(publicDirPath))
app.use(express.json());
app.use("/api/auth", authRoutes)
app.use(reportsRoutes)

const socketHandlers = new SocketHandlers(io)

io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) {
        return next(new Error("Authentication error"))
    }

    try {
        const payload = verifyToken(token)
        socket.user = {
            username: payload.username,
            role: payload.role || 'player'
        }
        next()
    } catch (err) {
        next(new Error("Authentication error"))
    }
})

io.on("connection", (socket) => {
    socketHandlers.handleConnection(socket)
})

app.get('/api/scoreboard', requireAuth, requireRole('admin', 'player', 'guest'), async (req, res) => {
    try {
        const gameType = req.query.gameType || null;
        const normalizedGameType = gameType ? normalizeGameType(gameType) : null;
        const scoreboardData = await socketHandlers.getScoreboardData(normalizedGameType);
        res.json(scoreboardData);
    } catch (error) {
        console.error('Error getting scoreboard:', error);
        res.status(500).json({ error: 'Failed to load scoreboard' });
    }
});

app.get('/api/profile', requireAuth, requireRole('admin', 'player', 'guest'), (req, res) => {
    res.json({ username: req.user.username, role: req.user.role || 'player' })
})

app.get('/admin/reports', (req, res) => {
    res.sendFile(path.join(publicDirPath, 'admin', 'reports.html'));
})

connectDB().then(() => {
    server.listen(port, () => {
        console.log("Server is up on " + port)
    })
}).catch((error) => {
    console.error("Failed to start server:", error)
    process.exit(1)
})