/**
 * LearningActivity Model
 * Tracks all student learning activities for analytics
 */

const mongoose = require('mongoose');

const learningActivitySchema = new mongoose.Schema({
  // References
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Activity type
  activityType: {
    type: String,
    enum: [
      'login',
      'logout',
      'module_start',
      'module_complete',
      'content_view',
      'video_watch',
      'quiz_start',
      'quiz_complete',
      'note_take',
      'bookmark',
      'search',
      'profile_update',
      'settings_change'
    ],
    required: true
  },
  
  // Related content
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  },
  quizAttempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizAttempt'
  },
  
  // Activity details
  details: {
    title: String,
    description: String,
    contentType: String,
    duration: Number, // in seconds
    progress: Number, // percentage
    score: Number,
    metadata: mongoose.Schema.Types.Mixed // Flexible additional data
  },
  
  // Session info
  sessionId: String,
  
  // Device info
  device: {
    type: String, // desktop, tablet, mobile
    os: String,
    browser: String
  },
  
  // IP address
  ipAddress: String,
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
learningActivitySchema.index({ student: 1, timestamp: -1 });
learningActivitySchema.index({ activityType: 1 });
learningActivitySchema.index({ module: 1, student: 1 });
learningActivitySchema.index({ timestamp: -1 });

// Static method to log activity
learningActivitySchema.statics.log = async function(data) {
  return await this.create(data);
};

// Static method to get student activity summary
learningActivitySchema.statics.getStudentSummary = async function(studentId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const summary = await this.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$activityType',
        count: { $sum: 1 },
        totalDuration: { $sum: '$details.duration' }
      }
    }
  ]);
  
  return summary;
};

// Static method to get daily activity
learningActivitySchema.statics.getDailyActivity = async function(studentId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          activityType: '$activityType'
        },
        count: { $sum: 1 },
        totalDuration: { $sum: '$details.duration' }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);
};

module.exports = mongoose.model('LearningActivity', learningActivitySchema);