const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'player', 'guest'],
    default: 'player'
  },
  verificationToken: {
    type: String,
    required: true
  },
  verificationTokenExpiry: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups
pendingRegistrationSchema.index({ verificationToken: 1 });
pendingRegistrationSchema.index({ username: 1 });
pendingRegistrationSchema.index({ email: 1 });
pendingRegistrationSchema.index({ verificationTokenExpiry: 1 });

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);

