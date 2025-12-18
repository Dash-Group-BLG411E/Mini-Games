const express = require('express');
const Report = require('./models/Report');
const User = require('./models/User');
const { requireAuth, requireRole } = require('./auth/authMiddleware');

const router = express.Router();

// Create a new report (logged-in users)
router.post(
  '/api/reports',
  requireAuth,
  requireRole('admin', 'user', 'player'), // Allow 'user' role (default) and 'player' (backward compatibility)
  async (req, res) => {
    try {
      const { reportedUserId, reason, message } = req.body || {};

      if (!reportedUserId || !reason) {
        return res.status(400).json({ error: 'reportedUserId and reason are required' });
      }

      // Look up reporter user by username from JWT
      const reporterUser = await User.findOne({ username: req.user.username.toLowerCase() });
      if (!reporterUser) {
        return res.status(404).json({ error: 'Reporter user not found' });
      }

      // Look up reported user by username (frontend sends username as reportedUserId)
      const reportedUser = await User.findOne({ username: reportedUserId.toLowerCase() });
      if (!reportedUser) {
        return res.status(404).json({ error: 'Reported user not found' });
      }

      // Prevent self-reporting
      if (reporterUser._id.toString() === reportedUser._id.toString()) {
        return res.status(400).json({ error: 'Cannot report yourself' });
      }

      const report = await Report.create({
        reporterId: reporterUser._id,
        reportedUserId: reportedUser._id,
        reason,
        message: message || '',
      });

      return res.status(201).json(report);
    } catch (error) {
      console.error('Error creating report:', error);
      return res.status(500).json({ error: 'Failed to create report' });
    }
  }
);

// List all reports (admin only)
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

      // Transform the populated data to match frontend expectations
      const transformedReports = reports.map(report => ({
        _id: report._id,
        reporterId: report.reporterId?.username || 'Unknown',
        reportedUserId: report.reportedUserId?.username || 'Unknown',
        reason: report.reason,
        message: report.message,
        status: report.status,
        createdAt: report.createdAt,
      }));

      return res.json(transformedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      return res.status(500).json({ error: 'Failed to load reports' });
    }
  }
);

module.exports = router;


