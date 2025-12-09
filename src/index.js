const path = require("path")
const http = require("http")
const express = require("express")
const socketio = require("socket.io")
const SocketHandlers = require("./socketHandlers")
const authRoutes = require("./auth/authRoutes")
const { requireAuth, requireRole } = require("./auth/authMiddleware")
const { verifyToken } = require("./auth/authUtils")
const connectDB = require("./db/connection")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirPath = path.join(__dirname, "../public")
app.use(express.static(publicDirPath))
app.use(express.json());
app.use("/api/auth", authRoutes)

// Initialize socket handlers
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

// Handle socket connections
io.on("connection", (socket) => {
    socketHandlers.handleConnection(socket)
})

// API endpoint for scoreboard (protected)
app.get('/api/scoreboard', requireAuth, requireRole('admin', 'player', 'guest'), async (req, res) => {
    try {
        const scoreboardData = await socketHandlers.getScoreboardData()
        res.json(scoreboardData)
    } catch (error) {
        console.error('Error getting scoreboard:', error)
        res.status(500).json({ error: 'Failed to load scoreboard' })
    }
})

// Profile route for front-end
app.get('/api/profile', requireAuth, requireRole('admin', 'player', 'guest'), (req, res) => {
    res.json({ username: req.user.username, role: req.user.role || 'player' })
})

// Initialize MongoDB connection and start server
connectDB().then(() => {
    server.listen(port, () => {
        console.log("Server is up on " + port)
    })
}).catch((error) => {
    console.error("Failed to start server:", error)
    process.exit(1)
})