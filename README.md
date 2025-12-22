# Mini-Games Platform

A real-time multiplayer gaming platform featuring three classic games: Three Men's Morris, Memory Match, and Battleship.

## Features

- **Three Men's Morris**: Strategic board game with piece placement and movement phases
- **Memory Match**: Card matching game with competitive scoring
- **Battleship**: Classic naval warfare game with ship placement and strategic guessing
- **Real-time Multiplayer**: Socket.io powered real-time gameplay
- **User Authentication**: Secure login/registration with email verification
- **Scoreboard System**: Track wins, losses, and achievements
- **Chat System**: Lobby and room-based chat functionality
- **Admin Panel**: Report management and user administration

## Tech Stack

- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB with Mongoose
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Authentication**: JWT tokens, bcrypt password hashing
- **Email**: Nodemailer with Ethereal Email for development

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd Mini-Games
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/minigames
PORT=3000
JWT_SECRET=your-secret-key-here
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
```

4. Start the server
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Project Structure

```
Mini-Games/
├── public/           # Frontend files
│   ├── css/         # Stylesheets
│   ├── js/           # Client-side JavaScript
│   └── index.html    # Main HTML file
├── src/              # Backend source code
│   ├── auth/         # Authentication logic
│   ├── core/         # Core game logic
│   ├── games/        # Game implementations
│   ├── handlers/     # Socket and route handlers
│   ├── models/       # Database models
│   └── routes/       # API routes
└── scripts/          # Utility scripts
```

## Game Rules

### Three Men's Morris
- Place 3 pieces on the board
- Form a line of 3 to win
- Remove opponent's piece after forming a line
- Move pieces to adjacent positions

### Memory Match
- Flip cards to find matching pairs
- Player with most matches wins
- Fastest matching time wins ties

### Battleship
- Place 5 ships on a 7x7 grid
- Take turns guessing opponent's ship locations
- First to sink all opponent's ships wins

## License

ISC

