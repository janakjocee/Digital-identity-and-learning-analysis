/**
 * User Model
 * Supports both Student and Admin roles with comprehensive profile data
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },
  
  // Role & Status
  role: {
    type: String,
    enum: ['student', 'admin', 'superadmin'],
    default: 'student'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  
  // Student-specific fields
  assignedClass: {
    type: Number,
    min: 8,
    max: 12,
    required: function() {
      return this.role === 'student';
    }
  },
  dateOfBirth: {
    type: Date
  },
  
  // Profile Information
  avatar: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'UK' }
  },
  
  // Learning Profile (for AI recommendations)
  learningProfile: {
    style: {
      type: String,
      enum: ['visual', 'auditory', 'kinesthetic', 'reading', 'mixed'],
      default: 'mixed'
    },
    pace: {
      type: String,
      enum: ['slow', 'moderate', 'fast', 'adaptive'],
      default: 'adaptive'
    },
    preferredSubjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    }],
    strengths: [String],
    weaknesses: [String],
    interests: [String]
  },
  
  // Performance Metrics
  performanceMetrics: {
    overallScore: { type: Number, default: 0, min: 0, max: 100 },
    totalQuizzesTaken: { type: Number, default: 0 },
    averageQuizScore: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 }, // in minutes
    completionRate: { type: Number, default: 0 }, // percentage
    streakDays: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
  },
  
  // AI Insights
  aiInsights: {
    predictedPerformance: { type: Number, default: null },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    learningCluster: {
      type: String,
      enum: ['high_performer', 'consistent_learner', 'irregular_learner', 'at_risk', 'new'],
      default: 'new'
    },
    weakTopics: [{
      subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
      chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
      score: Number,
      lastAssessed: Date
    }],
    recommendations: [{
      type: { type: String, enum: ['module', 'quiz', 'revision', 'practice'] },
      item: { type: mongoose.Schema.Types.ObjectId, refPath: 'recommendations.type' },
      reason: String,
      priority: { type: Number, min: 1, max: 10 },
      generatedAt: { type: Date, default: Date.now }
    }]
  },
  
  // Security
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpire: Date,
  
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Login tracking
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  lastLogin: Date,
  lastLoginIp: String,
  
  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ assignedClass: 1 });
userSchema.index({ 'performanceMetrics.lastActive': -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  // Reset if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Update performance metrics
userSchema.methods.updatePerformanceMetrics = async function() {
  const QuizAttempt = mongoose.model('QuizAttempt');
  const LearningActivity = mongoose.model('LearningActivity');
  
  // Calculate quiz statistics
  const quizStats = await QuizAttempt.aggregate([
    { $match: { student: this._id, status: 'completed' } },
    { 
      $group: {
        _id: null,
        totalQuizzes: { $sum: 1 },
        averageScore: { $avg: '$score.percentage' },
        totalTime: { $sum: '$timeSpent' }
      }
    }
  ]);
  
  // Calculate completion rate
  const totalModules = await mongoose.model('Module').countDocuments({
    classLevel: { $lte: this.assignedClass }
  });
  
  const completedModules = await LearningActivity.distinct('module', {
    student: this._id,
    activityType: 'module_complete'
  });
  
  this.performanceMetrics = {
    ...this.performanceMetrics,
    totalQuizzesTaken: quizStats[0]?.totalQuizzes || 0,
    averageQuizScore: Math.round(quizStats[0]?.averageScore || 0),
    totalTimeSpent: Math.round((quizStats[0]?.totalTime || 0) / 60),
    completionRate: totalModules > 0 ? Math.round((completedModules.length / totalModules) * 100) : 0,
    lastActive: new Date()
  };
  
  await this.save();
};

// Get public profile (remove sensitive data)
userSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationToken;
  delete user.verificationTokenExpire;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  delete user.loginAttempts;
  delete user.lockUntil;
  delete user.lastLoginIp;
  return user;
};

module.exports = mongoose.model('User', userSchema);