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

