/**
 * AuditLog Model
 * Tracks all administrative actions for security and compliance
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Who performed the action
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  
  // Action details
  action: {
    type: String,
    required: true,
    enum: [
      'user_create',
      'user_update',
      'user_delete',
      'user_approve',
      'user_reject',
      'user_suspend',
      'content_create',
      'content_update',
      'content_delete',
      'content_publish',
      'content_unpublish',
      'quiz_create',
      'quiz_update',
      'quiz_delete',
      'settings_update',
      'export_data',
      'login',
      'logout',
      'password_change',
      'role_change'
    ]
  },
  
  // Target entity
  entityType: {
    type: String,
    enum: ['user', 'subject', 'chapter', 'module', 'quiz', 'setting', 'system']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  entityName: String,
  
  // Change details
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    fields: [String]
  },
  
  // Description
  description: {
    type: String,
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['success', 'failure', 'pending'],
    default: 'success'
  },
  errorMessage: String,
  
  // IP and device info
  ipAddress: String,
  userAgent: String,
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ timestamp: -1 });

// Static method to log action
auditLogSchema.statics.log = async function(data) {
  return await this.create({
    ...data,
    timestamp: new Date()
  });
};

// Static method to get recent activity
auditLogSchema.statics.getRecent = async function(limit = 50) {
  return await this.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'firstName lastName email role')
    .lean();
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.find({
    user: userId,
    timestamp: { $gte: startDate }
  })
    .sort({ timestamp: -1 })
    .lean();
};

module.exports = mongoose.model('AuditLog', auditLogSchema);