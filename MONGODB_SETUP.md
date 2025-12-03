# MongoDB Setup Guide

This project now uses MongoDB for data persistence instead of JSON files.

## Prerequisites

1. **Install MongoDB** (if using local MongoDB):
   - Download from: https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

## Configuration

1. **Create a `.env` file** in the root directory (`Mini-Games/.env`):

```env
# For local MongoDB
MONGODB_URI=mongodb://localhost:27017/minigames

# For MongoDB Atlas (cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/minigames

# Optional: Server port (defaults to 3000)
PORT=3000
```

2. **Start MongoDB** (if using local MongoDB):
   - Windows: Start MongoDB service or run `mongod`
   - macOS/Linux: `sudo systemctl start mongod` or `mongod`

3. **Start the application**:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## Migration from JSON Files

The old JSON files (`users.json` and `scoreboard.json`) are no longer used. You can:

- **Keep them** as backup (they won't be used)
- **Delete them** if you don't need the old data
- **Migrate data** manually if needed (data will be created automatically as users play)

## Database Structure

### Users Collection
- `username` (unique, lowercase)
- `passwordHash`
- `displayName`
- `avatar`
- `createdAt`

### GameStats Collection
- `username` (unique, lowercase)
- `wins`
- `losses`
- `draws`
- `updatedAt`

## Troubleshooting

- **Connection Error**: Make sure MongoDB is running and the connection string is correct
- **Authentication Error**: Check your MongoDB Atlas credentials if using cloud
- **Port Already in Use**: Change the PORT in `.env` or stop the process using port 3000

