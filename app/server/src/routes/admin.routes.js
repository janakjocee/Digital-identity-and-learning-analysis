/**
 * Admin Routes
 * Administrative functions for user management and platform control
 */

const express = require('express');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Module = require('../models/Module');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const LearningActivity = require('../models/LearningActivity');
const AuditLog = require('../models/AuditLog');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize, roles } = require('../middleware/role.middleware');
const { adminValidation, paginationValidation } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(roles.admin);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Admin
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // User statistics
  const userStats = await User.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        approved: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        rejected: {
          $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
        },
        students: {
          $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] }
        },
        admins: {
          $sum: { $cond: [{ $in: ['$role', ['admin', 'superadmin']] }, 1, 0] }
        }
      }
    }
  ]);
  
  // Active today
  const activeToday = await User.countDocuments({
    'performanceMetrics.lastActive': { $gte: today }
  });
  
  // New users this month
  const newThisMonth = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });
  
  // Content statistics
  const contentStats = {
    subjects: await Subject.countDocuments(),
    chapters: await Chapter.countDocuments(),
    modules: await Module.countDocuments(),
    quizzes: await Quiz.countDocuments(),
    quizAttempts: await QuizAttempt.countDocuments()
  };
  
  // Quiz statistics
  const quizStats = await QuizAttempt.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: '$score.percentage' },
        passCount: {
          $sum: { $cond: [{ $eq: ['$results.passed', true] }, 1, 0] }
        }
      }
    }
  ]);
  
  // Recent activity
  const recentActivity = await AuditLog.getRecent(10);
  
  // AI Risk alerts (students at risk)
  const atRiskStudents = await User.find({
    role: 'student',
    'aiInsights.riskLevel': { $in: ['high', 'critical'] }
  })
    .select('firstName lastName email aiInsights.riskLevel aiInsights.predictedPerformance')
    .limit(5);
  
  res.json({
    success: true,
    data: {
      users: userStats[0] || {
        total: 0, approved: 0, pending: 0, rejected: 0, students: 0, admins: 0
      },
      activeToday,
      newThisMonth,
      content: contentStats,
      quizzes: quizStats[0] || {
        totalAttempts: 0, averageScore: 0, passCount: 0
      },
      recentActivity,
      atRiskStudents
    }
  });
}));

/**
 * @route   GET /api/admin/students
 * @desc    Get all students with filtering
 * @access  Admin
 */
router.get('/students', paginationValidation, asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    sort = 'createdAt', 
    order = 'desc',
    status,
    assignedClass,
    search,
    riskLevel
  } = req.query;
  
  // Build filter
  const filter = { role: 'student' };
  
  if (status) filter.status = status;
  if (assignedClass) filter.assignedClass = parseInt(assignedClass);
  if (riskLevel) filter['aiInsights.riskLevel'] = riskLevel;
  
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Build sort
  const sortOption = {};
  sortOption[sort] = order === 'asc' ? 1 : -1;
  
  // Execute query
  const students = await User.find(filter)
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .select('-password');
  
  const total = await User.countDocuments(filter);
  
  res.json({
    success: true,
    data: {
      students,
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
 * @route   GET /api/admin/students/pending
 * @desc    Get pending students
 * @access  Admin
 */
router.get('/students/pending', asyncHandler(async (req, res) => {
  const pendingStudents = await User.find({
    role: 'student',
    status: 'pending'
  })
    .sort({ createdAt: -1 })
    .select('-password');
  
  res.json({
    success: true,
    data: { pendingStudents }
  });
}));

/**
 * @route   PATCH /api/admin/students/:id/approve
 * @desc    Approve or reject a student
 * @access  Admin
 */
router.patch('/students/:id/approve', adminValidation.approveStudent, asyncHandler(async (req, res) => {
  const { status, assignedClass } = req.body;
  
  const student = await User.findById(req.params.id);
  
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }
  
  if (student.role !== 'student') {
    return res.status(400).json({
      success: false,
      message: 'Can only approve student accounts'
    });
  }
  
  // Update status
  student.status = status;
  
  if (status === 'approved') {
    student.approvedBy = req.user._id;
    student.approvedAt = new Date();
    
    if (assignedClass) {
      student.assignedClass = assignedClass;
    }
  }
  
  await student.save();
  
  // Log action
  await AuditLog.log({
    user: req.user._id,
    userRole: req.user.role,
    action: status === 'approved' ? 'user_approve' : 'user_reject',
    entityType: 'user',
    entityId: student._id,
    entityName: student.fullName,
    description: `Student ${status}: ${student.fullName}`,
    changes: {
      before: { status: 'pending' },
      after: { status, assignedClass: student.assignedClass }
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  res.json({
    success: true,
    message: `Student ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
    data: { student: student.getPublicProfile() }
  });
}));

/**
 * @route   POST /api/admin/students/bulk-action
 * @desc    Perform bulk action on students
 * @access  Admin
 */
router.post('/students/bulk-action', adminValidation.bulkAction, asyncHandler(async (req, res) => {
  const { userIds, action } = req.body;
  
  let updateData = {};
  let actionName = '';
  
  switch (action) {
    case 'approve':
      updateData = { 
        status: 'approved', 
        approvedBy: req.user._id, 
        approvedAt: new Date() 
      };
      actionName = 'user_approve';
      break;
    case 'reject':
      updateData = { status: 'rejected' };
      actionName = 'user_reject';
      break;
    case 'suspend':
      updateData = { status: 'suspended' };
      actionName = 'user_suspend';
      break;
    case 'delete':
      updateData = { isDeleted: true, deletedAt: new Date() };
      actionName = 'user_delete';
      break;
    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
  }
  
  const result = await User.updateMany(
    { _id: { $in: userIds } },
    updateData
  );
  
  // Log bulk action
  await AuditLog.log({
    user: req.user._id,
    userRole: req.user.role,
    action: actionName,
    entityType: 'user',
    description: `Bulk ${action} on ${result.modifiedCount} students`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  res.json({
    success: true,
    message: `${result.modifiedCount} students ${action}ed successfully`
  });
}));

/**
 * @route   GET /api/admin/students/:id/details
 * @desc    Get detailed student information
 * @access  Admin
 */
router.get('/students/:id/details', asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.id)
    .select('-password')
    .populate('learningProfile.preferredSubjects', 'name code');
  
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }
  
  // Get recent quiz attempts
  const recentQuizzes = await QuizAttempt.find({ student: student._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('quiz', 'title subject');
  
  // Get learning activity
  const recentActivity = await LearningActivity.find({ student: student._id })
    .sort({ timestamp: -1 })
    .limit(20);
  
  // Get activity summary
  const activitySummary = await LearningActivity.getStudentSummary(student._id, 30);
  
  res.json({
    success: true,
    data: {
      student,
      recentQuizzes,
      recentActivity,
      activitySummary
    }
  });
}));

/**
 * @route   GET /api/admin/analytics
 * @desc    Get platform analytics
 * @access  Admin
 */
router.get('/analytics', asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  
  // Daily active users
  const dailyActiveUsers = await LearningActivity.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        activityType: 'login'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Quiz performance over time
  const quizPerformance = await QuizAttempt.aggregate([
    {
      $match: {
        status: 'completed',
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
        averageScore: { $avg: '$score.percentage' },
        totalAttempts: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Subject-wise performance
  const subjectPerformance = await QuizAttempt.aggregate([
    {
      $match: { status: 'completed' }
    },
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
        _id: '$subjectData.name',
        averageScore: { $avg: '$score.percentage' },
        totalAttempts: { $sum: 1 }
      }
    },
    { $sort: { averageScore: -1 } }
  ]);
  
  // Learning cluster distribution
  const clusterDistribution = await User.aggregate([
    { $match: { role: 'student' } },
    {
      $group: {
        _id: '$aiInsights.learningCluster',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Risk level distribution
  const riskDistribution = await User.aggregate([
    { $match: { role: 'student' } },
    {
      $group: {
        _id: '$aiInsights.riskLevel',
        count: { $sum: 1 }
      }
    }
  ]);
  
  res.json({
    success: true,
    data: {
      dailyActiveUsers,
      quizPerformance,
      subjectPerformance,
      clusterDistribution,
      riskDistribution
    }
  });
}));

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs
 * @access  Admin
 */
router.get('/audit-logs', paginationValidation, asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, user, action, startDate, endDate } = req.query;
  
  const filter = {};
  
  if (user) filter.user = user;
  if (action) filter.action = action;
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  }
  
  const logs = await AuditLog.find(filter)
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('user', 'firstName lastName email role');
  
  const total = await AuditLog.countDocuments(filter);
  
  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

module.exports = router;