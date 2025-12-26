# 🎮 MiniGamesHub

A real-time multiplayer gaming platform featuring three classic games with tournament support, chat, and a comprehensive admin system.

## ✨ Features

### Games
- **Three Men's Morris** - Strategic board game with piece placement and movement phases
- **Memory Match** - Card matching game with competitive scoring
- **Battleship** - Classic naval warfare game with ship placement and strategic guessing

### Multiplayer
- **Real-time Gameplay** - Socket.io powered instant updates
- **Tournament System** - Create and join tournaments (4 or 8 players)
  - Single game mode or Mixed mode (best of 3 across all games)
  - Automatic bracket generation and round progression
- **Game Rooms** - Create/join rooms with spectator support
- **Game Invitations** - Invite players directly to games

### Social
- **Lobby Chat** - Chat with all online players
- **Room Chat** - In-game chat during matches
- **Player Profiles** - View other players' stats and badges
- **Leaderboard** - Track top players across all game types

### Account System
- **Secure Authentication** - JWT tokens with bcrypt password hashing
- **Email Verification** - Verify email before account creation
- **Guest Mode** - Play without registration (limited features)
- **Profile Customization** - Custom avatars and display names

### Admin Features
- **User Reports** - Report players for inappropriate names or bad chat behavior
- **Moderation Tools** - Mute users, change usernames, resolve reports
- **Chat History** - View reported chat messages for context

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Backend | Node.js, Express, Socket.io |
| Database | MongoDB with Mongoose |
| Frontend | Vanilla JavaScript (ES6+), HTML5, CSS3 |
| Auth | JWT tokens, bcrypt |
| Email | Resend API / SMTP (Nodemailer) |

## 📦 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd Mini-Games
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root directory:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/minigames

# Server
PORT=3000
BASE_URL=http://localhost:3000

# JWT Secret (use a strong random string in production!)
JWT_SECRET=your-super-secret-jwt-key

# Email (Option A: Resend - Recommended)
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=onboarding@resend.dev

# Email (Option B: SMTP)
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587

# Environment
NODE_ENV=development
```

### 4. Start the server
```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

## 📁 Project Structure

```
Mini-Games/
├── public/              # Frontend assets
│   ├── admin/           # Admin panel pages
│   ├── css/             # Stylesheets (organized by type)
│   │   ├── base/        # Variables, reset, typography
│   │   ├── components/  # Buttons, modals, forms, chat
│   │   ├── layouts/     # Views, auth, lobby, game, tournament
│   │   ├── games/       # Game-specific styles
│   │   └── utilities/   # Animations, responsive
│   ├── js/              # Client-side JavaScript
│   │   ├── managers/    # App managers (auth, socket, view, etc.)
│   │   ├── games/       # Game implementations
│   │   └── ui/          # UI components
│   └── index.html       # Main SPA entry point
├── src/                 # Backend source code
│   ├── auth/            # Authentication logic
│   ├── core/            # Core classes (GameRoom, Tournament)
│   ├── games/           # Game logic implementations
│   ├── handlers/        # Socket event handlers
│   ├── models/          # Mongoose models
│   └── routes/          # Express API routes
└── scripts/             # Utility scripts
```

## 🎯 Game Rules

### Three Men's Morris
1. **Placement Phase**: Place 3 pieces on the board
2. **Movement Phase**: Move pieces to adjacent positions
3. **Win**: Form a line of 3 pieces

### Memory Match
1. Flip two cards per turn to find matching pairs
2. Matched pairs stay face up
3. Player with most matches wins

### Battleship
1. Place 5 ships on a 7×7 grid
2. Take turns guessing opponent coordinates
3. First to sink all opponent ships wins

## 🏆 Tournament System

- **Player Counts**: 4 or 8 players
- **Game Types**: Single game or Mixed (best of 3)
- **Brackets**: Automatically generated based on player count
- **Progression**: Winners advance until finals

## 📱 Mobile Support

- Responsive design for all screen sizes
- Landscape orientation warning
- Touch-friendly controls
- Mobile navigation drawer

## 🔐 Security

- Password hashing with bcrypt
- JWT authentication
- Input validation and sanitization
- Rate limiting on API endpoints
- Email verification required for registration

## 📄 License

ISC License

---

Made with ❤️ for game enthusiasts
