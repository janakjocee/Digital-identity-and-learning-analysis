/**
 * User Routes
 * Student profile and learning management
 */

const express = require('express');
const User = require('../models/User');
const QuizAttempt = require('../models/QuizAttempt');
const LearningActivity = require('../models/LearningActivity');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeOwnerOrAdmin, requireApprovedStudent } = require('../middleware/role.middleware');
const { userValidation } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('learningProfile.preferredSubjects', 'name code icon');
  
  res.json({
    success: true,
    data: { user: user.getPublicProfile() }
  });
}));

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', userValidation.updateProfile, asyncHandler(async (req, res) => {
  const allowedUpdates = ['firstName', 'lastName', 'phone', 'address', 'dateOfBirth'];
  const updates = {};
  
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: user.getPublicProfile() }
  });
}));

/**
 * @route   PUT /api/users/learning-profile
 * @desc    Update learning profile
 * @access  Private
 */
router.put('/learning-profile', userValidation.updateLearningProfile, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (req.body.learningProfile) {
    Object.assign(user.learningProfile, req.body.learningProfile);
  }
  
  await user.save();
  
  res.json({
    success: true,
    message: 'Learning profile updated successfully',
    data: { learningProfile: user.learningProfile }
  });
}));

/**
 * @route   GET /api/users/dashboard
 * @desc    Get student dashboard data
 * @access  Private (Students only)
 */
router.get('/dashboard', requireApprovedStudent, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get user with populated data
  const user = await User.findById(userId)
    .populate('learningProfile.preferredSubjects', 'name code color');
  
  // Get recent quiz attempts
  const recentQuizzes = await QuizAttempt.find({ 
    student: userId,
    status: 'completed'
  })
    .sort({ completedAt: -1 })
    .limit(5)
    .populate('quiz', 'title subject');
  
  // Get quiz statistics
  const quizStats = await QuizAttempt.aggregate([
    { $match: { student: userId, status: 'completed' } },
    {
      $group: {
        _id: null,
        totalQuizzes: { $sum: 1 },
        averageScore: { $avg: '$score.percentage' },
        highestScore: { $max: '$score.percentage' },
        totalTimeSpent: { $sum: '$timeSpent' }
      }
    }
  ]);
  
  // Get weekly activity
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const weeklyActivity = await LearningActivity.aggregate([
    {
      $match: {
        student: userId,
        timestamp: { $gte: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        activities: { $sum: 1 },
        timeSpent: { $sum: '$details.duration' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Get subject-wise performance
  const subjectPerformance = await QuizAttempt.aggregate([
    { $match: { student: userId, status: 'completed' } },
    {
      $lookup: {
        from: 'quizzes',
        localField: 'quiz',
        foreignField: '_id',
        as: 'quizData'
      }
    },
    { $unwind: '$quizData' },
    {
      $lookup: {
        from: 'subjects',
        localField: 'quizData.subject',
        foreignField: '_id',
        as: 'subjectData'
      }
    },
    { $unwind: '$subjectData' },
    {
      $group: {
        _id: '$subjectData._id',
        subjectName: { $first: '$subjectData.name' },
        subjectCode: { $first: '$subjectData.code' },
        averageScore: { $avg: '$score.percentage' },
        quizzesTaken: { $sum: 1 }
      }
    },
    { $sort: { averageScore: -1 } }
  ]);
  
  // Get AI recommendations
  const aiRecommendations = user.aiInsights.recommendations.slice(0, 5);
  
  res.json({
    success: true,
    data: {
      user: user.getPublicProfile(),
      performance: {
        quizStats: quizStats[0] || {
          totalQuizzes: 0,
          averageScore: 0,
          highestScore: 0,
          totalTimeSpent: 0
        },
        weeklyActivity,
        subjectPerformance,
        recentQuizzes
      },
      aiInsights: {
        predictedPerformance: user.aiInsights.predictedPerformance,
        riskLevel: user.aiInsights.riskLevel,
        learningCluster: user.aiInsights.learningCluster,
        weakTopics: user.aiInsights.weakTopics,
        recommendations: aiRecommendations
      }
    }
  });
}));

/**
 * @route   GET /api/users/progress
 * @desc    Get learning progress
 * @access  Private (Students only)
 */
router.get('/progress', requireApprovedStudent, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get completed modules
  const completedModules = await LearningActivity.distinct('module', {
    student: userId,
    activityType: 'module_complete'
  });
  
  // Get quiz scores over time
  const scoreTrend = await QuizAttempt.find({
    student: userId,
    status: 'completed'
  })
    .sort({ completedAt: 1 })
    .select('score.percentage completedAt')
    .limit(20);
  
  // Get time spent per day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const timeSpent = await LearningActivity.aggregate([
    {
      $match: {
        student: userId,
        timestamp: { $gte: thirtyDaysAgo },
        'details.duration': { $exists: true }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        totalMinutes: { $sum: { $divide: ['$details.duration', 60] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  res.json({
    success: true,
    data: {
      completedModules: completedModules.length,
      scoreTrend: scoreTrend.map(s => ({
        date: s.completedAt,
        score: Math.round(s.score.percentage)
      })),
      timeSpent
    }
  });
}));

/**
 * @route   GET /api/users/activity
 * @desc    Get user activity log
 * @access  Private
 */
router.get('/activity', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, days = 30 } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  
  const activities = await LearningActivity.find({
    student: req.user._id,
    timestamp: { $gte: startDate }
  })
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await LearningActivity.countDocuments({
    student: req.user._id,
    timestamp: { $gte: startDate }
  });
  
  res.json({
    success: true,
    data: {
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (admin or owner only)
 * @access  Private
 */
router.get('/:id', authorizeOwnerOrAdmin(), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    data: { user: user.getPublicProfile() }
  });
}));

module.exports = router;