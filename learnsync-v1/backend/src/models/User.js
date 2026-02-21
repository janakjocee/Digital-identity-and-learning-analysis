/**
 * LearnSync AI v1.0 - User Model
 * Enterprise-grade user schema with AI insights
 * 
 * Features:
 * - Secure password hashing with bcrypt
 * - Role-based access control
 * - AI-powered learning analytics
 * - Account lockout protection
 * - Refresh token management
 * - Audit trail integration
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============================================
// AI INSIGHTS SUB-SCHEMA
// ============================================
const AIInsightsSchema = new mongoose.Schema({
  predictedScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  weakTopics: [{
    topic: String,
    score: Number,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    }
  }],
  strongTopics: [{
    topic: String,
    score: Number
  }],
  recommendedActions: [{
    action: String,
    priority: String,
    estimatedImpact: Number
  }],
  learningCluster: {
    type: String,
    enum: ['high_performer', 'consistent_learner', 'irregular_learner', 'at_risk', 'new_student'],
    default: 'new_student'
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  riskFactors: [String],
  engagementScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  performanceIndex: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  lastAnalysisDate: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// ============================================
// PERFORMANCE METRICS SUB-SCHEMA
// ============================================
const PerformanceMetricsSchema = new mongoose.Schema({
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  quizzesTaken: {
    type: Number,
    default: 0
  },
  quizzesPassed: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  highestScore: {
    type: Number,
    default: 0
  },
  lowestScore: {
    type: Number,
    default: 0
  },
  totalTimeSpent: {
    type: Number, // in minutes
    default: 0
  },
  streakDays: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date,
    default: Date.now
  },
  subjectScores: [{
    subject: String,
    score: Number,
    quizzesTaken: Number,
    lastAttempt: Date
  }],
  monthlyProgress: [{
    month: String,
    averageScore: Number,
    quizzesTaken: Number,
    timeSpent: Number
  }]
}, { _id: false });

// ============================================
# MAIN USER SCHEMA
# ============================================
const UserSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  
  // Role & Status
  role: {
    type: String,
    enum: ['student', 'admin', 'superadmin'],
    default: 'student'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'inactive'],
    default: 'pending'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Student-specific fields
  studentInfo: {
    grade: {
      type: Number,
      min: 8,
      max: 12
    },
    school: String,
    board: {
      type: String,
      enum: ['CBSE', 'ICSE', 'State Board', 'IB', 'Other']
    },
    rollNumber: String,
    parentEmail: String,
    parentPhone: String
  },
  
  // Profile Information
  profile: {
    avatar: String,
    bio: {
      type: String,
      maxlength: 500
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'India' }
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  
  // AI & Analytics
  aiInsights: {
    type: AIInsightsSchema,
    default: () => ({})
  },
  performanceMetrics: {
    type: PerformanceMetricsSchema,
    default: () => ({})
  },
  
  // Learning Preferences
  learningPreferences: {
    subjects: [String],
    difficultyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    studyReminders: {
      type: Boolean,
      default: true
    },
    reminderTime: {
      type: String,
      default: '09:00'
    },
    weeklyGoal: {
      type: Number,
      default: 5 // quizzes per week
    }
  },
  
  // Security
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  lastLoginIp: String,
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  
  // Refresh Tokens
  refreshTokens: [{
    token: String,
    device: String,
    ip: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date
  }],
  
  // Activity Log
  activityLog: [{
    action: String,
    details: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Notifications
  notifications: [{
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'error']
    },
    title: String,
    message: String,
    read: {
      type: Boolean,
      default: false
    },
    link: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================
# INDEXES
# ============================================
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ 'studentInfo.grade': 1 });
UserSchema.index({ 'aiInsights.learningCluster': 1 });
UserSchema.index({ 'aiInsights.riskLevel': 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ status: 1, createdAt: -1 });

// ============================================
# VIRTUALS
# ============================================
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.virtual('accountAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// ============================================
# MIDDLEWARE
# ============================================

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update passwordChangedAt when password is modified
UserSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after
  next();
});

// ============================================
# METHODS
# ============================================

// Compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Increment login attempts
UserSchema.methods.incrementLoginAttempts = async function() {
  // Reset if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account if max attempts reached
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    const lockDuration = (parseInt(process.env.LOCKOUT_DURATION_MINUTES) || 30) * 60 * 1000;
    updates.$set = { lockUntil: Date.now() + lockDuration };
  }
  
  return this.updateOne(updates);
};

// Add activity log entry
UserSchema.methods.logActivity = async function(action, details = {}, req = null) {
  const entry = {
    action,
    details,
    timestamp: new Date()
  };
  
  if (req) {
    entry.ip = req.ip;
    entry.userAgent = req.get('user-agent');
  }
  
  this.activityLog.push(entry);
  
  // Keep only last 100 activities
  if (this.activityLog.length > 100) {
    this.activityLog = this.activityLog.slice(-100);
  }
  
  return this.save({ validateBeforeSave: false });
};

// Add notification
UserSchema.methods.addNotification = async function(type, title, message, link = null) {
  this.notifications.push({
    type,
    title,
    message,
    link,
    createdAt: new Date()
  });
  
  // Keep only last 50 notifications
  if (this.notifications.length > 50) {
    this.notifications = this.notifications.slice(-50);
  }
  
  return this.save({ validateBeforeSave: false });
};

// Update performance metrics
UserSchema.methods.updatePerformanceMetrics = async function(quizScore, timeSpent, subject) {
  const metrics = this.performanceMetrics;
  
  // Update basic stats
  metrics.quizzesTaken += 1;
  metrics.totalTimeSpent += timeSpent;
  metrics.lastActiveDate = new Date();
  
  // Update average score
  const totalScore = metrics.averageScore * (metrics.quizzesTaken - 1) + quizScore;
  metrics.averageScore = totalScore / metrics.quizzesTaken;
  
  // Update highest/lowest scores
  if (quizScore > metrics.highestScore) metrics.highestScore = quizScore;
  if (metrics.lowestScore === 0 || quizScore < metrics.lowestScore) {
    metrics.lowestScore = quizScore;
  }
  
  // Update pass count
  if (quizScore >= 60) metrics.quizzesPassed += 1;
  
  // Update subject scores
  const subjectIndex = metrics.subjectScores.findIndex(s => s.subject === subject);
  if (subjectIndex >= 0) {
    const sub = metrics.subjectScores[subjectIndex];
    const newAvg = (sub.score * sub.quizzesTaken + quizScore) / (sub.quizzesTaken + 1);
    sub.score = newAvg;
    sub.quizzesTaken += 1;
    sub.lastAttempt = new Date();
  } else {
    metrics.subjectScores.push({
      subject,
      score: quizScore,
      quizzesTaken: 1,
      lastAttempt: new Date()
    });
  }
  
  // Update overall score
  metrics.overallScore = Math.round(metrics.averageScore);
  
  return this.save({ validateBeforeSave: false });
};

// Check if password was changed after token was issued
UserSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Generate password reset token
UserSchema.methods.createPasswordResetToken = function() {
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  
  this.passwordResetToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// ============================================
# STATIC METHODS
# ============================================

// Get students by risk level
UserSchema.statics.getByRiskLevel = function(riskLevel) {
  return this.find({
    role: 'student',
    'aiInsights.riskLevel': riskLevel
  }).select('firstName lastName email aiInsights performanceMetrics');
};

// Get students by cluster
UserSchema.statics.getByCluster = function(cluster) {
  return this.find({
    role: 'student',
    'aiInsights.learningCluster': cluster
  }).select('firstName lastName email aiInsights performanceMetrics');
};

// Get leaderboard
UserSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find({ role: 'student', status: 'active' })
    .sort({ 'performanceMetrics.overallScore': -1 })
    .limit(limit)
    .select('firstName lastName profile.avatar performanceMetrics.overallScore aiInsights.learningCluster');
};

// ============================================
# EXPORTS
# ============================================
module.exports = mongoose.model('User', UserSchema);