const mongoose = require('mongoose');

const gameStatsSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
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
  threeMensMorris: {
    wins: { type: Number, default: 0, min: 0 },
    losses: { type: Number, default: 0, min: 0 },
    draws: { type: Number, default: 0, min: 0 }
  },
  memoryMatch: {
    wins: { type: Number, default: 0, min: 0 },
    losses: { type: Number, default: 0, min: 0 },
    draws: { type: Number, default: 0, min: 0 }
  },
  battleship: {
    wins: { type: Number, default: 0, min: 0 },
    losses: { type: Number, default: 0, min: 0 },
    draws: { type: Number, default: 0, min: 0 }
  },
  badges: [{
    type: String
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

gameStatsSchema.index({ wins: -1 });

gameStatsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('GameStats', gameStatsSchema);

