const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['admin', 'player', 'guest'],
    default: 'player'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// unique: true already creates an index, so no need for explicit index

module.exports = mongoose.model('User', userSchema);

