/**
 * AI Routes
 * Interfaces with AI microservice for predictions and recommendations
 */

const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const QuizAttempt = require('../models/QuizAttempt');
const LearningActivity = require('../models/LearningActivity');
const { authenticate } = require('../middleware/auth.middleware');
const { roles, requireApprovedStudent } = require('../middleware/role.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/ai/recommendations
 * @desc    Get personalized recommendations for student
 * @access  Private
 */
router.get('/recommendations', requireApprovedStudent, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get user's learning data
  const user = await User.findById(userId);
  const recentAttempts = await QuizAttempt.find({
    student: userId,
    status: 'completed'
  })
    .sort({ completedAt: -1 })
    .limit(10)
    .populate('quiz', 'subject');
  
  const recentActivity = await LearningActivity.find({
    student: userId
  })
    .sort({ timestamp: -1 })
    .limit(50);
  
  // Prepare data for AI service
  const studentData = {
    studentId: userId.toString(),
    assignedClass: user.assignedClass,
    learningProfile: user.learningProfile,
    performanceMetrics: user.performanceMetrics,
    recentAttempts: recentAttempts.map(a => ({
      quizId: a.quiz._id.toString(),
      score: a.score.percentage,
      subject: a.quiz.subject?.toString(),
      completedAt: a.completedAt
    })),
    recentActivity: recentActivity.map(a => ({
      type: a.activityType,
      timestamp: a.timestamp,
      duration: a.details?.duration
    }))
  };
  
  try {
    // Call AI service
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/recommendations`,
      studentData,
      { timeout: 5000 }
    );
    
    res.json({
      success: true,
      data: aiResponse.data
    });
  } catch (error) {
    console.error('AI service error:', error.message);
    
    // Return fallback recommendations
    res.json({
      success: true,
      data: {
        recommendations: user.aiInsights.recommendations || [],
        weakTopics: user.aiInsights.weakTopics || [],
        fallback: true
      }
    });
  }
}));

/**
 * @route   GET /api/ai/predict-performance
 * @desc    Get performance prediction for student
 * @access  Private
 */
router.get('/predict-performance', requireApprovedStudent, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get user's quiz history
  const quizHistory = await QuizAttempt.find({
    student: userId,
    status: 'completed'
  })
    .sort({ completedAt: -1 })
    .limit(20)
    .populate('quiz', 'subject difficulty');
  
  // Prepare data for AI service
  const predictionData = {
    studentId: userId.toString(),
    quizHistory: quizHistory.map(q => ({
      score: q.score.percentage,
      subject: q.quiz.subject?.toString(),
      difficulty: q.quiz.difficulty,
      completedAt: q.completedAt
    })),
    currentMetrics: req.user.performanceMetrics
  };
  
  try {
    // Call AI service
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/predict-performance`,
      predictionData,
      { timeout: 5000 }
    );
    
    // Update user's predicted performance
    await User.findByIdAndUpdate(userId, {
      'aiInsights.predictedPerformance': aiResponse.data.predictedScore
    });
    
    res.json({
      success: true,
      data: aiResponse.data
    });
  } catch (error) {
    console.error('AI service error:', error.message);
    
    // Return fallback prediction
    const avgScore = quizHistory.length > 0
      ? quizHistory.reduce((sum, q) => sum + q.score.percentage, 0) / quizHistory.length
      : 0;
    
    res.json({
      success: true,
      data: {
        predictedScore: Math.round(avgScore),
        confidence: 0.5,
        trend: 'stable',
        fallback: true
      }
    });
  }
}));

/**
 * @route   GET /api/ai/risk-assessment
 * @desc    Get dropout risk assessment
 * @access  Private
 */
router.get('/risk-assessment', requireApprovedStudent, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get user's activity data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activityData = await LearningActivity.aggregate([
    {
      $match: {
        student: userId,
        timestamp: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: null,
        totalActivities: { $sum: 1 },
        totalDuration: { $sum: '$details.duration' },
        uniqueDays: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } } }
      }
    }
  ]);
  
  const quizData = await QuizAttempt.aggregate([
    {
      $match: {
        student: userId,
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: '$score.percentage' },
        completedAttempts: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    }
  ]);
  
  // Prepare data for AI service
  const riskData = {
    studentId: userId.toString(),
    activitySummary: activityData[0] || {
      totalActivities: 0,
      totalDuration: 0,
      uniqueDays: []
    },
    quizSummary: quizData[0] || {
      totalAttempts: 0,
      averageScore: 0,
      completedAttempts: 0
    },
    lastActive: req.user.performanceMetrics.lastActive,
    streakDays: req.user.performanceMetrics.streakDays
  };
  
  try {
    // Call AI service
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/risk-assessment`,
      riskData,
      { timeout: 5000 }
    );
    
    // Update user's risk level
    await User.findByIdAndUpdate(userId, {
      'aiInsights.riskLevel': aiResponse.data.riskLevel
    });
    
    res.json({
      success: true,
      data: aiResponse.data
    });
  } catch (error) {
    console.error('AI service error:', error.message);
    
    // Calculate basic risk assessment
    const activity = activityData[0];
    let riskLevel = 'low';
    
    if (!activity || activity.uniqueDays.length < 3) {
      riskLevel = 'high';
    } else if (activity.uniqueDays.length < 7) {
      riskLevel = 'medium';
    }
    
    res.json({
      success: true,
      data: {
        riskLevel,
        riskScore: riskLevel === 'high' ? 0.8 : riskLevel === 'medium' ? 0.5 : 0.2,
        factors: ['activity_frequency'],
        fallback: true
      }
    });
  }
}));

/**
 * @route   GET /api/ai/learning-cluster
 * @desc    Get student's learning cluster classification
 * @access  Private
 */
router.get('/learning-cluster', requireApprovedStudent, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get comprehensive learning data
  const user = await User.findById(userId);
  
  const quizHistory = await QuizAttempt.find({
    student: userId,
    status: 'completed'
  }).sort({ completedAt: -1 });
  
  const activityPattern = await LearningActivity.aggregate([
    {
      $match: { student: userId }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        activityCount: { $sum: 1 },
        totalDuration: { $sum: '$details.duration' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Prepare data for AI service
  const clusterData = {
    studentId: userId.toString(),
    performanceMetrics: user.performanceMetrics,
    quizHistory: quizHistory.map(q => ({
      score: q.score.percentage,
      completedAt: q.completedAt
    })),
    activityPattern
  };
  
  try {
    // Call AI service
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/learning-cluster`,
      clusterData,
      { timeout: 5000 }
    );
    
    // Update user's learning cluster
    await User.findByIdAndUpdate(userId, {
      'aiInsights.learningCluster': aiResponse.data.cluster
    });
    
    res.json({
      success: true,
      data: aiResponse.data
    });
  } catch (error) {
    console.error('AI service error:', error.message);
    
    // Classify based on simple rules
    const avgScore = user.performanceMetrics.averageQuizScore;
    const completionRate = user.performanceMetrics.completionRate;
    
    let cluster = 'new';
    if (quizHistory.length >= 5) {
      if (avgScore >= 80 && completionRate >= 70) {
        cluster = 'high_performer';
      } else if (avgScore >= 60 && completionRate >= 50) {
        cluster = 'consistent_learner';
      } else if (completionRate < 30) {
        cluster = 'at_risk';
      } else {
        cluster = 'irregular_learner';
      }
    }
    
    res.json({
      success: true,
      data: {
        cluster,
        confidence: 0.6,
        characteristics: [cluster],
        fallback: true
      }
    });
  }
}));

/**
 * @route   POST /api/ai/analyze-all
 * @desc    Run complete AI analysis on a student (Admin only)
 * @access  Admin
 */
router.post('/analyze-all/:studentId', roles.admin, asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  
  const student = await User.findById(studentId);
  
  if (!student || student.role !== 'student') {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }
  
  // Gather all student data
  const quizHistory = await QuizAttempt.find({
    student: studentId,
    status: 'completed'
  }).sort({ completedAt: -1 });
  
  const activityData = await LearningActivity.find({
    student: studentId
  }).sort({ timestamp: -1 }).limit(100);
  
  const analysisData = {
    studentId: studentId.toString(),
    assignedClass: student.assignedClass,
    performanceMetrics: student.performanceMetrics,
    quizHistory: quizHistory.map(q => ({
      score: q.score.percentage,
      completedAt: q.completedAt
    })),
    activityData: activityData.map(a => ({
      type: a.activityType,
      timestamp: a.timestamp,
      duration: a.details?.duration
    }))
  };
  
  try {
    // Call AI service for comprehensive analysis
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/comprehensive-analysis`,
      analysisData,
      { timeout: 10000 }
    );
    
    // Update student with AI insights
    await User.findByIdAndUpdate(studentId, {
      'aiInsights.predictedPerformance': aiResponse.data.predictedPerformance,
      'aiInsights.riskLevel': aiResponse.data.riskLevel,
      'aiInsights.learningCluster': aiResponse.data.learningCluster,
      'aiInsights.weakTopics': aiResponse.data.weakTopics,
      'aiInsights.recommendations': aiResponse.data.recommendations
    });
    
    res.json({
      success: true,
      message: 'AI analysis completed successfully',
      data: aiResponse.data
    });
  } catch (error) {
    console.error('AI service error:', error.message);
    
    res.status(503).json({
      success: false,
      message: 'AI service unavailable',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/ai/batch-analyze
 * @desc    Run AI analysis on all students (Admin only)
 * @access  Admin
 */
router.post('/batch-analyze', roles.admin, asyncHandler(async (req, res) => {
  const students = await User.find({
    role: 'student',
    status: 'approved'
  }).select('_id');
  
  const results = {
    processed: 0,
    failed: 0,
    errors: []
  };
  
  // Process students in batches
  const batchSize = 10;
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (student) => {
      try {
        const quizHistory = await QuizAttempt.find({
          student: student._id,
          status: 'completed'
        }).sort({ completedAt: -1 }).limit(20);
        
        const analysisData = {
          studentId: student._id.toString(),
          quizHistory: quizHistory.map(q => ({
            score: q.score.percentage,
            completedAt: q.completedAt
          }))
        };
        
        const aiResponse = await axios.post(
          `${AI_SERVICE_URL}/quick-analysis`,
          analysisData,
          { timeout: 5000 }
        );
        
        await User.findByIdAndUpdate(student._id, {
          'aiInsights.predictedPerformance': aiResponse.data.predictedPerformance,
          'aiInsights.riskLevel': aiResponse.data.riskLevel,
          'aiInsights.learningCluster': aiResponse.data.learningCluster
        });
        
        results.processed++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          studentId: student._id,
          error: error.message
        });
      }
    }));
  }
  
  res.json({
    success: true,
    message: `Batch analysis completed. Processed: ${results.processed}, Failed: ${results.failed}`,
    data: results
  });
}));

module.exports = router;