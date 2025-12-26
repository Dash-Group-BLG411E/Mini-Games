const express = require('express');
const Report = require('../models/Report');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../auth/authMiddleware');

const router = express.Router();

// Create a new report
router.post(
  '/api/reports',
  requireAuth,
  requireRole('admin', 'user', 'player'),
  async (req, res) => {
    try {
      const { reportedUserId, reason, chatHistory } = req.body || {};

      if (!reportedUserId || !reason) {
        return res.status(400).json({ error: 'reportedUserId and reason are required' });
      }

      // Validate reason
      const validReasons = ['inappropriate_name', 'bad_words'];
      if (!validReasons.includes(reason)) {
        return res.status(400).json({ error: 'Invalid reason. Must be inappropriate_name or bad_words' });
      }

      const reporterUser = await User.findOne({ username: req.user.username.toLowerCase() });
      if (!reporterUser) {
        return res.status(404).json({ error: 'Reporter user not found' });
      }

      const reportedUser = await User.findOne({ username: reportedUserId.toLowerCase() });
      if (!reportedUser) {
        return res.status(404).json({ error: 'Reported user not found' });
      }

      if (reporterUser._id.toString() === reportedUser._id.toString()) {
        return res.status(400).json({ error: 'Cannot report yourself' });
      }

      const reportData = {
        reporterId: reporterUser._id,
        reportedUserId: reportedUser._id,
        reason
      };

      // Include chat history for bad_words reports
      if (reason === 'bad_words' && Array.isArray(chatHistory)) {
        reportData.chatHistory = chatHistory.slice(-20).map(msg => ({
          username: msg.username || 'Unknown',
          message: msg.message || '',
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }));
      }

      const report = await Report.create(reportData);
      return res.status(201).json(report);
    } catch (error) {
      console.error('Error creating report:', error);
      return res.status(500).json({ error: 'Failed to create report' });
    }
  }
);

// Get all reports (admin only)
router.get(
  '/api/reports',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    try {
      const reports = await Report.find({})
        .populate('reporterId', 'username')
        .populate('reportedUserId', 'username')
        .sort({ createdAt: -1 })
        .lean();

      const transformedReports = reports.map(report => ({
        _id: report._id,
        reporterId: report.reporterId?.username || 'Unknown',
        reportedUserId: report.reportedUserId?.username || 'Unknown',
        reason: report.reason,
        chatHistory: report.chatHistory || [],
        status: report.status,
        actionTaken: report.actionTaken,
        adminNotes: report.adminNotes,
        resolvedBy: report.resolvedBy,
        resolvedAt: report.resolvedAt,
        createdAt: report.createdAt,
      }));

      return res.json(transformedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      return res.status(500).json({ error: 'Failed to load reports' });
    }
  }
);

// Get single report (admin only)
router.get(
  '/api/reports/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    try {
      const report = await Report.findById(req.params.id)
        .populate('reporterId', 'username')
        .populate('reportedUserId', 'username isMuted muteExpiresAt')
        .lean();

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      return res.json({
        _id: report._id,
        reporterId: report.reporterId?.username || 'Unknown',
        reportedUserId: report.reportedUserId?.username || 'Unknown',
        reportedUserDetails: {
          isMuted: report.reportedUserId?.isMuted || false,
          muteExpiresAt: report.reportedUserId?.muteExpiresAt
        },
        reason: report.reason,
        chatHistory: report.chatHistory || [],
        status: report.status,
        actionTaken: report.actionTaken,
        adminNotes: report.adminNotes,
        resolvedBy: report.resolvedBy,
        resolvedAt: report.resolvedAt,
        createdAt: report.createdAt,
      });
    } catch (error) {
      console.error('Error fetching report:', error);
      return res.status(500).json({ error: 'Failed to load report' });
    }
  }
);

// Update report status (admin only)
router.patch(
  '/api/reports/:id/status',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { status, adminNotes } = req.body;

      const validStatuses = ['open', 'in_review', 'resolved', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const updateData = {
        status,
        resolvedBy: req.user.username,
        resolvedAt: status === 'resolved' || status === 'rejected' ? new Date() : null
      };

      if (adminNotes !== undefined) {
        updateData.adminNotes = adminNotes;
      }

      const report = await Report.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      return res.json({ success: true, report });
    } catch (error) {
      console.error('Error updating report status:', error);
      return res.status(500).json({ error: 'Failed to update report' });
    }
  }
);

// Mute user (admin only)
router.post(
  '/api/reports/:id/mute',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { duration, reason } = req.body; // duration in minutes, 0 for permanent

      const report = await Report.findById(req.params.id)
        .populate('reportedUserId');

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const user = await User.findById(report.reportedUserId._id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user.isMuted = true;
      user.muteExpiresAt = duration > 0 ? new Date(Date.now() + duration * 60000) : null;
      user.muteReason = reason || 'Reported for bad behavior';
      await user.save();

      // Update report
      report.actionTaken = 'muted';
      report.status = 'resolved';
      report.resolvedBy = req.user.username;
      report.resolvedAt = new Date();
      await report.save();

      return res.json({
        success: true,
        message: `User ${user.username} has been muted${duration > 0 ? ` for ${duration} minutes` : ' permanently'}`
      });
    } catch (error) {
      console.error('Error muting user:', error);
      return res.status(500).json({ error: 'Failed to mute user' });
    }
  }
);

// Change username (admin only)
router.post(
  '/api/reports/:id/change-username',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { newUsername } = req.body;

      if (!newUsername || newUsername.trim().length < 3) {
        return res.status(400).json({ error: 'New username must be at least 3 characters' });
      }

      const report = await Report.findById(req.params.id)
        .populate('reportedUserId');

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Check if new username is taken
      const existingUser = await User.findOne({ username: newUsername.toLowerCase().trim() });
      if (existingUser) {
        return res.status(400).json({ error: 'Username is already taken' });
      }

      const user = await User.findById(report.reportedUserId._id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const oldUsername = user.username;
      user.username = newUsername.toLowerCase().trim();
      await user.save();

      // Update GameStats if exists
      const GameStats = require('../models/GameStats');
      await GameStats.updateOne(
        { username: oldUsername },
        { username: newUsername.toLowerCase().trim() }
      );

      // Update report
      report.actionTaken = 'username_changed';
      report.adminNotes = (report.adminNotes || '') + `\nUsername changed from "${oldUsername}" to "${newUsername}" by ${req.user.username}`;
      report.status = 'resolved';
      report.resolvedBy = req.user.username;
      report.resolvedAt = new Date();
      await report.save();

      return res.json({
        success: true,
        message: `Username changed from "${oldUsername}" to "${newUsername}"`
      });
    } catch (error) {
      console.error('Error changing username:', error);
      return res.status(500).json({ error: 'Failed to change username' });
    }
  }
);

// Unmute user (admin only) 
router.post(
  '/api/users/:username/unmute',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    try {
      const user = await User.findOne({ username: req.params.username.toLowerCase() });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user.isMuted = false;
      user.muteExpiresAt = null;
      user.muteReason = null;
      await user.save();

      return res.json({ success: true, message: `User ${user.username} has been unmuted` });
    } catch (error) {
      console.error('Error unmuting user:', error);
      return res.status(500).json({ error: 'Failed to unmute user' });
    }
  }
);

module.exports = router;
