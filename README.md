# Mini-Games Platform

A real-time multiplayer gaming platform featuring three classic games: Three Men's Morris, Memory Match, and Battleship.

## Features

- **Three Men's Morris**: Strategic board game with piece placement and movement phases
- **Memory Match**: Card matching game with competitive scoring
- **Battleship**: Classic naval warfare game with ship placement and strategic guessing
- **Real-time Multiplayer**: Socket.io powered real-time gameplay
- **User Authentication**: Secure login/registration with email verification (pending registration system)
- **Scoreboard System**: Track wins, losses, and achievements
- **Chat System**: Lobby and room-based chat functionality
- **Admin Panel**: Report management and user administration

## Tech Stack

- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB with Mongoose
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Authentication**: JWT tokens, bcrypt password hashing
- **Email**: Resend API or SMTP (Nodemailer) with Ethereal Email fallback for development

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
Create a `.env` file in the root directory (copy from `.env.example` if available):
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/minigames

# Server Configuration
PORT=3000
BASE_URL=http://localhost:3000

# JWT Secret (Generate a random string for production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration
# Option A: Resend (Recommended - Easiest!)
# 1. Sign up at https://resend.com
# 2. Get your API key from the dashboard
# 3. For production, verify your domain in Resend
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=onboarding@resend.dev  # Use your verified domain email in production

# Option B: SMTP (Gmail, Outlook, etc.)
# For Gmail: Use App Password (not regular password)
# 1. Enable 2-Step Verification on your Google account
# 2. Go to: https://myaccount.google.com/apppasswords
# 3. Generate an app password for "Mail"
# 4. Use that app password as SMTP_PASS
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password-here
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false

# Environment
NODE_ENV=development
```

**Important Email Setup Notes:**
- **Resend (Recommended)**: 
  - Free tier: 3,000 emails/month, 100 emails/day
  - Sign up at [resend.com](https://resend.com)
  - For production: Verify your domain and use a verified email address
  - Set `RESEND_API_KEY` and `EMAIL_FROM` in your `.env`
- **SMTP (Alternative)**:
  - **Gmail**: You must use an [App Password](https://myaccount.google.com/apppasswords), not your regular password
  - **Other Email Providers**: Check your provider's SMTP settings
    - **Outlook/Hotmail**: `smtp-mail.outlook.com`, port 587
    - **Yahoo**: `smtp.mail.yahoo.com`, port 587
    - **Custom SMTP**: Use your provider's SMTP settings
- **Production**: Set `BASE_URL` to your production domain (e.g., `https://yourdomain.com`)
- **Development**: If email is not configured, the system will use Ethereal Email (test emails shown in console only)
- **Email Verification**: Users must verify their email before their account is created. Pending registrations expire after 24 hours.

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

