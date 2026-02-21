/**
 * LearnSync AI v1.0 - Audit Log Model
 * Comprehensive audit trail for compliance and security
 */

const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'USER_REGISTERED',
      'USER_LOGIN',
      'USER_LOGOUT',
      'USER_APPROVED',
      'USER_SUSPENDED',
      'USER_REACTIVATED',
      'PASSWORD_CHANGED',
      'PASSWORD_RESET_REQUESTED',
      'PASSWORD_RESET_COMPLETED',
      'EMAIL_VERIFIED',
      'PROFILE_UPDATED',
      'QUIZ_STARTED',
      'QUIZ_COMPLETED',
      'CONTENT_ACCESSED',
      'SETTINGS_CHANGED',
      'ADMIN_ACTION',
      'DATA_EXPORTED',
      'REPORT_GENERATED'
    ]
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  }
}, {
  timestamps: false
});

// Indexes for efficient querying
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ user: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });

// Static method to get recent activity
AuditLogSchema.statics.getRecentActivity = function(limit = 50) {
  return this.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'firstName lastName email role')
    .populate('targetUser', 'firstName lastName email');
};

// Static method to get user activity
AuditLogSchema.statics.getUserActivity = function(userId, limit = 100) {
  return this.find({ user: userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get action statistics
AuditLogSchema.statics.getActionStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

module.exports = mongoose.model('AuditLog', AuditLogSchema);