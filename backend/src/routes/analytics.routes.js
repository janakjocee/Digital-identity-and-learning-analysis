/**
 * Analytics Routes
 * Provides learning analytics and reporting
 */

const express = require('express');
const User = require('../models/User');
const QuizAttempt = require('../models/QuizAttempt');
const LearningActivity = require('../models/LearningActivity');
const { authenticate } = require('../middleware/auth.middleware');
const { roles, requireApprovedStudent } = require('../middleware/role.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/analytics/overview
 * @desc    Get user's learning analytics overview
 * @access  Private
 */
router.get('/overview', requireApprovedStudent, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Overall statistics
  const overallStats = await QuizAttempt.aggregate([
    { $match: { student: userId, status: 'completed' } },
    {
      $group: {
        _id: null,
        totalQuizzes: { $sum: 1 },
        averageScore: { $avg: '$score.percentage' },
        highestScore: { $max: '$score.percentage' },
        lowestScore: { $min: '$score.percentage' },
        totalTimeSpent: { $sum: '$timeSpent' },
        passCount: {
          $sum: { $cond: [{ $eq: ['$results.passed', true] }, 1, 0] }
        }
      }
    }
  ]);
  
  // Recent activity (last 30 days)
  const recentActivity = await LearningActivity.aggregate([
    {
      $match: {
        student: userId,
        timestamp: { $gte: thirtyDaysAgo }
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
  
  // Daily activity for chart
  const dailyActivity = await LearningActivity.aggregate([
    {
      $match: {
        student: userId,
        timestamp: { $gte: thirtyDaysAgo }
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
  
  // Score trend
  const scoreTrend = await QuizAttempt.find({
    student: userId,
    status: 'completed'
  })
    .sort({ completedAt: 1 })
    .select('score.percentage completedAt')
    .limit(20);
  
  res.json({
    success: true,
    data: {
      overall: overallStats[0] || {
        totalQuizzes: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        totalTimeSpent: 0,
        passCount: 0
      },
      recentActivity,
      dailyActivity,
      scoreTrend: scoreTrend.map(s => ({
        date: s.completedAt,
        score: Math.round(s.score.percentage)
      }))
    }
  });
}));

/**
 * @route   GET /api/analytics/subjects
 * @desc    Get subject-wise performance
 * @access  Private
 */
router.get('/subjects', requireApprovedStudent, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
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
        subjectColor: { $first: '$subjectData.color' },
        averageScore: { $avg: '$score.percentage' },
        quizzesTaken: { $sum: 1 },
        highestScore: { $max: '$score.percentage' },
        lowestScore: { $min: '$score.percentage' },
        totalTimeSpent: { $sum: '$timeSpent' }
      }
    },
    { $sort: { averageScore: -1 } }
  ]);
  
  res.json({
    success: true,
    data: { subjects: subjectPerformance }
  });
}));

/**
 * @route   GET /api/analytics/performance
 * @desc    Get detailed performance metrics
 * @access  Private
 */
router.get('/performance', requireApprovedStudent, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { days = 30 } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  
  // Performance over time
  const performanceOverTime = await QuizAttempt.aggregate([
    {
      $match: {
        student: userId,
        status: 'completed',
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          week: { $week: '$completedAt' },
          year: { $year: '$completedAt' }
        },
        averageScore: { $avg: '$score.percentage' },
        quizzesTaken: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } }
  ]);
  
  // Difficulty analysis
  const difficultyAnalysis = await QuizAttempt.aggregate([
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
      $unwind: '$quizData.questions'
    },
    {
      $lookup: {
        from: 'quizattempts',
        localField: 'answers.question',
        foreignField: 'answers.question',
        as: 'questionAttempts'
      }
    },
    {
      $group: {
        _id: '$quizData.questions.difficulty',
        averageScore: { $avg: '$score.percentage' },
        totalAttempts: { $sum: 1 }
      }
    }
  ]);
  
  // Time analysis
  const timeAnalysis = await QuizAttempt.aggregate([
    { $match: { student: userId, status: 'completed' } },
    {
      $group: {
        _id: null,
        averageTime: { $avg: '$timeSpent' },
        totalTime: { $sum: '$timeSpent' },
        fastestQuiz: { $min: '$timeSpent' },
        slowestQuiz: { $max: '$timeSpent' }
      }
    }
  ]);
  
  res.json({
    success: true,
    data: {
      performanceOverTime,
      difficultyAnalysis,
      timeAnalysis: timeAnalysis[0] || {
        averageTime: 0,
        totalTime: 0,
        fastestQuiz: 0,
        slowestQuiz: 0
      }
    }
  });
}));

/**
 * @route   GET /api/analytics/engagement
 * @desc    Get engagement metrics
 * @access  Private
 */
router.get('/engagement', requireApprovedStudent, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { days = 30 } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  
  // Daily engagement
  const dailyEngagement = await LearningActivity.aggregate([
    {
      $match: {
        student: userId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        sessions: { $sum: 1 },
        totalDuration: { $sum: '$details.duration' },
        modulesCompleted: {
          $sum: { $cond: [{ $eq: ['$activityType', 'module_complete'] }, 1, 0] }
        },
        quizzesTaken: {
          $sum: { $cond: [{ $eq: ['$activityType', 'quiz_complete'] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Activity distribution
  const activityDistribution = await LearningActivity.aggregate([
    {
      $match: {
        student: userId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$activityType',
        count: { $sum: 1 },
        totalDuration: { $sum: '$details.duration' }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  // Peak activity hours
  const peakHours = await LearningActivity.aggregate([
    {
      $match: {
        student: userId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $hour: '$timestamp' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
  
  res.json({
    success: true,
    data: {
      dailyEngagement,
      activityDistribution,
      peakHours
    }
  });
}));

/**
 * @route   GET /api/analytics/compare
 * @desc    Compare performance with class average
 * @access  Private
 */
router.get('/compare', requireApprovedStudent, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userClass = req.user.assignedClass;
  
  // Get user's performance
  const userPerformance = await QuizAttempt.aggregate([
    { $match: { student: userId, status: 'completed' } },
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$score.percentage' },
        totalQuizzes: { $sum: 1 },
        averageTime: { $avg: '$timeSpent' }
      }
    }
  ]);
  
  // Get classmates' IDs
  const classmates = await User.find({
    role: 'student',
    assignedClass: userClass,
    status: 'approved',
    _id: { $ne: userId }
  }).select('_id');
  
  const classmateIds = classmates.map(c => c._id);
  
  // Get class average
  const classAverage = await QuizAttempt.aggregate([
    {
      $match: {
        student: { $in: classmateIds },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$score.percentage' },
        totalQuizzes: { $avg: '$score.percentage' },
        averageTime: { $avg: '$timeSpent' }
      }
    }
  ]);
  
  res.json({
    success: true,
    data: {
      user: userPerformance[0] || {
        averageScore: 0,
        totalQuizzes: 0,
        averageTime: 0
      },
      classAverage: classAverage[0] || {
        averageScore: 0,
        totalQuizzes: 0,
        averageTime: 0
      }
    }
  });
}));

/**
 * @route   GET /api/analytics/admin/overview
 * @desc    Get platform-wide analytics (Admin only)
 * @access  Admin
 */
router.get('/admin/overview', roles.admin, asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  
  // User growth
  const userGrowth = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        newUsers: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Quiz performance trends
  const quizTrends = await QuizAttempt.aggregate([
    {
      $match: {
        status: 'completed',
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: '$score.percentage' },
        passCount: {
          $sum: { $cond: [{ $eq: ['$results.passed', true] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Top performing students
  const topStudents = await QuizAttempt.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: '$student',
        averageScore: { $avg: '$score.percentage' },
        totalQuizzes: { $sum: 1 }
      }
    },
    { $match: { totalQuizzes: { $gte: 5 } } },
    { $sort: { averageScore: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'studentData'
      }
    },
    { $unwind: '$studentData' },
    {
      $project: {
        studentName: { $concat: ['$studentData.firstName', ' ', '$studentData.lastName'] },
        averageScore: 1,
        totalQuizzes: 1
      }
    }
  ]);
  
  res.json({
    success: true,
    data: {
      userGrowth,
      quizTrends,
      topStudents
    }
  });
}));

module.exports = router;