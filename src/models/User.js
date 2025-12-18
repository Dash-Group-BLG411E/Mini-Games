const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  email: {
    type: String,
    required: function() {
      // Email not required for guest accounts
      return this.role !== 'guest';
    },
    lowercase: true,
    trim: true
    // Email format validation is handled in the route (authRoutes.js)
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
    enum: ['admin', 'user', 'player', 'guest'], // 'user' is default, 'player' kept for backward compatibility
    default: 'user'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  verificationTokenExpiry: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create partial unique index on email - only indexes documents where email exists
// This allows multiple null/undefined emails (for guests) while ensuring uniqueness for non-null emails
userSchema.index(
  { email: 1 },
  { 
    unique: true, 
    partialFilterExpression: { email: { $exists: true, $ne: null } },
    sparse: true // Also add sparse for compatibility
  }
);

module.exports = mongoose.model('User', userSchema);

