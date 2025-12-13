const mongoose = require('mongoose');

const gameStatsSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  // Overall stats (for backward compatibility)
  wins: {
    type: Number,
    default: 0,
    min: 0
  },
  losses: {
    type: Number,
    default: 0,
    min: 0
  },
  draws: {
    type: Number,
    default: 0,
    min: 0
  },
  // Game-specific stats
  ticTacToe: {
    wins: { type: Number, default: 0, min: 0 },
    losses: { type: Number, default: 0, min: 0 },
    draws: { type: Number, default: 0, min: 0 }
  },
  rockPaperScissors: {
    wins: { type: Number, default: 0, min: 0 },
    losses: { type: Number, default: 0, min: 0 },
    draws: { type: Number, default: 0, min: 0 }
  },
  memoryMatch: {
    wins: { type: Number, default: 0, min: 0 },
    losses: { type: Number, default: 0, min: 0 },
    draws: { type: Number, default: 0, min: 0 }
  },
  // Badges earned
  badges: [{
    type: String
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// unique: true already creates an index on username
// Add index for sorting by wins
gameStatsSchema.index({ wins: -1 });

// Update the updatedAt field before saving
gameStatsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('GameStats', gameStatsSchema);

