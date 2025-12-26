const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reportedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    enum: ['inappropriate_name', 'bad_words'],
    required: true,
  },
  chatHistory: [{
    username: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['open', 'in_review', 'resolved', 'rejected'],
    default: 'open',
  },
  actionTaken: {
    type: String,
    enum: ['none', 'warning', 'muted', 'username_changed'],
    default: null,
  },
  adminNotes: {
    type: String,
    default: null,
  },
  resolvedBy: {
    type: String,
    default: null,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Report', reportSchema);



