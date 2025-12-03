# 🎮 Multiplayer Mini-Games Platform

A modern, feature-rich multiplayer gaming platform built with Node.js, Socket.IO, MongoDB, and vanilla JavaScript. Play Tic Tac Toe, Rock Paper Scissors, and Memory Match with friends in real-time!

## ✨ Features

### 🎯 Core Game Features
- **User Authentication**: Secure registration and login system with JWT tokens
- **Spectator Mode**: Watch ongoing games when rooms are full
- **Real-time Multiplayer**: Play with friends using Socket.IO
- **Game State Persistence**: All game states are synchronized across players and spectators
- **Online Users Tracking**: See who's online in the lobby

### 🔐 Authentication & User Management
- **Register & Login**: Secure account creation and authentication with password hashing
- **JWT Tokens**: Tokens are stored in `localStorage` and automatically sent with Socket.IO handshakes and protected API requests
- **Protected Views**: Lobby, game, and scoreboard views require a valid token
- **Profile Management**: Update display name and avatar
- **Password Management**: Change password with validation requirements
- **Account Deletion**: Delete your account and all associated data
- **Password Requirements**: Minimum 8 characters, must contain letters and numbers, no special characters

### 🕹️ Mini-Games
- **Tic Tac Toe**: Best-of-3 rounds format - first player to win 3 rounds wins the game. Classic 3x3 grid gameplay with alternating turns.
- **Rock Paper Scissors**: First-to-5 wins format - compete in multiple rounds until one player reaches 5 wins. Quick and exciting gameplay.
- **Memory Match**: Flip cards to find matching pairs! Turn-based multiplayer with score tracking. First player to find all matches wins.

### 🏠 Live Room Lobby
- **Room Browser**: View all active rooms with player counts, game status, and game type
- **Smart Joining**: Join as a player (if space available) or as a spectator
- **Room Creation**: Create custom-named rooms with your choice of game type (Tic Tac Toe, Rock Paper Scissors, or Memory Match)
- **Live Updates**: Real-time updates when players join/leave rooms
- **Lobby Chat**: Chat with all online players in the lobby
- **Room Chat**: Private chat within game rooms for players and spectators

### 🏆 Scoreboard System
- **Win/Loss/Draw Tracking**: Automatic tracking of all game results across all game types
- **Player Statistics**: View wins, losses, draws, total games, and win rate
- **Top Players Ranking**: See the best players ranked by wins, win rate, and total games
- **MongoDB Storage**: All scores and user data are persistently stored in MongoDB
- **Real-time Updates**: Scoreboard updates automatically as games finish

### 🎨 Modern UI/UX
- **Beautiful Design**: Modern gradient background with glassmorphism effects
- **Responsive Layout**: Works perfectly on desktop and mobile devices
- **Smooth Animations**: Hover effects and transitions for better user experience
- **Multi-view Navigation**: Easy navigation between lobby, game, and scoreboard

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas account)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Mini-Games
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MongoDB**
   - **Option A: Local MongoDB**
     - Install MongoDB from https://www.mongodb.com/try/download/community
     - Start MongoDB service
   - **Option B: MongoDB Atlas (Cloud)**
     - Sign up at https://www.mongodb.com/cloud/atlas
     - Create a cluster and get your connection string

4. **Configure environment variables**
   Create a `.env` file in the `Mini-Games` directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/minigames
   # Or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/minigames
   PORT=3000
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

### Development Mode

For development with auto-restart:
```bash
npm run dev
```
*(Requires nodemon: `npm install -g nodemon`)*

## 🎮 How to Play

### First Time Setup
1. **Register**: Create a new account with a unique username and password (minimum 8 characters, must contain letters and numbers)
2. **Login**: Use your credentials to log in (token is saved automatically for future sessions)
3. **Profile**: Optionally update your display name and avatar in your profile settings

### Playing a Game
1. **View Lobby**: See all available rooms, online users, and chat with others
2. **Create Room**: Click "Create Room" to start a new game room (choose game type: Tic Tac Toe, Rock Paper Scissors, or Memory Match)
3. **Join Room**: Click "Join as Player" on any room with available space
4. **Watch Games**: Click "Watch as Spectator" to observe ongoing games
5. **Gameplay**:
   - **Tic Tac Toe**: Click on empty cells to place your X or O. First to win 3 rounds wins the game.
   - **Rock Paper Scissors**: Select your choice each round. First to 5 wins wins the game.
   - **Memory Match**: Click cards to flip them and find matching pairs. Take turns with your opponent.
6. **Chat**: Use lobby chat or room chat to communicate with other players
7. **Play Again**: After a game ends, both players can vote to restart

### Viewing Scores
1. **In-Game**: Click "View Scoreboard" from the lobby
2. **Dedicated Page**: Visit `/scoreboard` for a full-page scoreboard view (requires login)
3. **Statistics**: See wins, losses, draws, total games, and win rate for each player
4. **Rankings**: Players are ranked by wins, then win rate, then total games

## 🏗️ Architecture

### Backend Structure
```
src/
├── index.js              # Main server file with Express and Socket.IO setup
├── GameRoom.js           # GameRoom class managing individual game instances
├── socketHandlers.js     # Modular socket event handling
├── Scoreboard.js         # Score tracking and statistics management
├── auth/
│   ├── authRoutes.js     # Authentication API routes (register, login, profile)
│   ├── authMiddleware.js # JWT authentication middleware
│   ├── authUtils.js      # JWT token generation and verification
│   └── UserStore.js      # User data management with MongoDB
├── db/
│   └── connection.js     # MongoDB connection setup
└── models/
    ├── User.js           # User MongoDB model
    └── GameStats.js      # Game statistics MongoDB model
```

### Frontend Structure
```
public/
├── index.html         # Main application with multi-view structure
├── scoreboard.html    # Dedicated scoreboard page
├── app.js            # Main application logic and socket handling
└── style.css         # Modern styling with responsive design
```

### Key Classes

#### GameRoom Class
- Manages individual game rooms
- Handles player and spectator management
- Tracks game state and validates moves
- Implements win detection and game restart logic

#### SocketHandlers Class
- Centralized socket event management
- Room creation and joining logic
- Real-time game state broadcasting
- Score tracking integration

#### Scoreboard Class
- Persistent score storage with MongoDB
- Statistics calculation and ranking
- API endpoint for scoreboard data
- Automatic win/loss/draw tracking across all game types

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the `Mini-Games` directory:
- `MONGODB_URI`: MongoDB connection string (required)
  - Local: `mongodb://localhost:27017/minigames`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/minigames`
- `PORT`: Server port (default: 3000)

### Customization
- **Room ID Generation**: Modify `generateRoomId()` in socketHandlers.js
- **Game Rules**: Adjust win conditions in GameRoom.js (e.g., TTT rounds, RPS wins needed)
- **UI Themes**: Customize colors and styling in style.css
- **Chat Limits**: Adjust `maxLobbyMessages` in socketHandlers.js

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.IO
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with bcryptjs
- **Frontend**: Vanilla JavaScript, HTML5, CSS3

---

**Enjoy playing Multiplayer Mini-Games! 🎉**


