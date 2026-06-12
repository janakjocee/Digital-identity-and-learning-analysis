/**
 * Quiz Routes
 * Manages quiz taking and attempts
 */

const express = require('express');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const LearningActivity = require('../models/LearningActivity');
const { authenticate } = require('../middleware/auth.middleware');
const { requireApprovedStudent } = require('../middleware/role.middleware');
const { quizAttemptValidation } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// All routes require authentication and approved student status
router.use(authenticate, requireApprovedStudent);

/**
 * @route   GET /api/quizzes
 * @desc    Get available quizzes for student
 * @access  Private
 */
router.get('/', asyncHandler(async (req, res) => {
  const { subject, module, completed } = req.query;
  
  // Build filter
  const filter = {
    isActive: true,
    isPublished: true
  };
  
  if (subject) filter.subject = subject;
  if (module) filter.module = module;
  
  // Get quizzes
  let quizzes = await Quiz.find(filter)
    .populate('subject', 'name code color')
    .select('-questions.options.isCorrect -questions.correctAnswer -questions.explanation')
    .sort({ createdAt: -1 });
  
  // Get user's attempts for these quizzes
  const quizIds = quizzes.map(q => q._id);
  const attempts = await QuizAttempt.find({
    student: req.user._id,
    quiz: { $in: quizIds }
  }).select('quiz status score.percentage');
  
  // Map attempts to quizzes
  const quizzesWithStatus = quizzes.map(quiz => {
    const quizObj = quiz.toObject();
    const attempt = attempts.find(a => a.quiz.toString() === quiz._id.toString());
    
    quizObj.userAttempt = attempt ? {
      status: attempt.status,
      score: attempt.score?.percentage
    } : null;
    
    return quizObj;
  });
  
  // Filter by completion status if requested
  let filteredQuizzes = quizzesWithStatus;
  if (completed === 'true') {
    filteredQuizzes = quizzesWithStatus.filter(q => q.userAttempt?.status === 'completed');
  } else if (completed === 'false') {
    filteredQuizzes = quizzesWithStatus.filter(q => !q.userAttempt || q.userAttempt.status !== 'completed');
  }
  
  res.json({
    success: true,
    data: { quizzes: filteredQuizzes }
  });
}));

/**
 * @route   GET /api/quizzes/:id
 * @desc    Get quiz details (without answers)
 * @access  Private
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id)
    .populate('subject', 'name code')
    .populate('chapter', 'name')
    .populate('module', 'title');
  
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found'
    });
  }
  
  // Remove correct answers from questions
  const quizObj = quiz.toObject();
  quizObj.questions = quizObj.questions.map(q => ({
    ...q,
    options: q.options.map(o => ({
      text: o.text,
      order: o.order
      // isCorrect removed
    })),
    correctAnswer: undefined,
    explanation: undefined
  }));
  
  // Get user's previous attempts
  const attempts = await QuizAttempt.find({
    student: req.user._id,
    quiz: quiz._id
  }).sort({ attemptNumber: -1 });
  
  res.json({
    success: true,
    data: {
      quiz: quizObj,
      attempts: attempts.map(a => ({
        id: a._id,
        attemptNumber: a.attemptNumber,
        status: a.status,
        score: a.score,
        completedAt: a.completedAt
      }))
    }
  });
}));

/**
 * @route   POST /api/quizzes/:id/start
 * @desc    Start a new quiz attempt
 * @access  Private
 */
router.post('/:id/start', asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found'
    });
  }
  
  // Check if quiz is available
  if (!quiz.isPublished || !quiz.isActive) {
    return res.status(403).json({
      success: false,
      message: 'This quiz is not currently available'
    });
  }
  
  // Check availability dates
  if (!quiz.availability.alwaysAvailable) {
    const now = new Date();
    if (quiz.availability.startDate && now < quiz.availability.startDate) {
      return res.status(403).json({
        success: false,
        message: 'This quiz is not yet available'
      });
    }
    if (quiz.availability.endDate && now > quiz.availability.endDate) {
      return res.status(403).json({
        success: false,
        message: 'This quiz is no longer available'
      });
    }
  }
  
  // Check attempt limit
  const attemptCount = await QuizAttempt.countDocuments({
    student: req.user._id,
    quiz: quiz._id
  });
  
  if (attemptCount >= quiz.settings.attemptsAllowed) {
    return res.status(403).json({
      success: false,
      message: `You have reached the maximum number of attempts (${quiz.settings.attemptsAllowed}) for this quiz`
    });
  }
  
  // Check for in-progress attempt
  const inProgressAttempt = await QuizAttempt.findOne({
    student: req.user._id,
    quiz: quiz._id,
    status: 'in_progress'
  });
  
  if (inProgressAttempt) {
    return res.json({
      success: true,
      message: 'Resuming existing attempt',
      data: { attempt: inProgressAttempt }
    });
  }
  
  // Create new attempt
  const attempt = await QuizAttempt.create({
    quiz: quiz._id,
    student: req.user._id,
    module: quiz.module,
    attemptNumber: attemptCount + 1,
    status: 'in_progress',
    startedAt: new Date(),
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
      browser: req.headers['user-agent']
    }
  });
  
  // Log quiz start
  await LearningActivity.log({
    student: req.user._id,
    activityType: 'quiz_start',
    quiz: quiz._id,
    module: quiz.module,
    details: {
      title: quiz.title,
      attemptNumber: attempt.attemptNumber
    },
    ipAddress: req.ip
  });
  
  res.status(201).json({
    success: true,
    message: 'Quiz attempt started',
    data: { attempt }
  });
}));

/**
 * @route   POST /api/quizzes/attempts/:attemptId/answer
 * @desc    Submit answer for a question
 * @access  Private
 */
router.post('/attempts/:attemptId/answer', quizAttemptValidation.submitAnswer, asyncHandler(async (req, res) => {
  const { questionId, answer, timeSpent } = req.body;
  
  const attempt = await QuizAttempt.findById(req.params.attemptId);
  
  if (!attempt) {
    return res.status(404).json({
      success: false,
      message: 'Attempt not found'
    });
  }
  
  // Verify ownership
  if (attempt.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only submit answers for your own attempts'
    });
  }
  
  // Check if attempt is in progress
  if (attempt.status !== 'in_progress') {
    return res.status(403).json({
      success: false,
      message: 'This attempt has already been completed'
    });
  }
  
  // Get quiz to check answer
  const quiz = await Quiz.findById(attempt.quiz);
  const question = quiz.questions.id(questionId);
  
  if (!question) {
    return res.status(404).json({
      success: false,
      message: 'Question not found'
    });
  }
  
  // Check answer
  let isCorrect = false;
  let pointsEarned = 0;
  
  if (question.type === 'mcq' || question.type === 'true_false') {
    const selectedOption = question.options.find(o => o._id.toString() === answer);
    isCorrect = selectedOption?.isCorrect || false;
  } else if (question.type === 'fill_blank' || question.type === 'short_answer') {
    isCorrect = answer.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
  }
  
  if (isCorrect) {
    pointsEarned = question.points;
  }
  
  // Update or add answer
  const existingAnswerIndex = attempt.answers.findIndex(
    a => a.question.toString() === questionId
  );
  
  if (existingAnswerIndex >= 0) {
    attempt.answers[existingAnswerIndex] = {
      question: questionId,
      selectedOptions: Array.isArray(answer) ? answer : [answer],
      textAnswer: answer,
      isCorrect,
      pointsEarned,
      timeSpent: timeSpent || 0,
      answeredAt: new Date()
    };
  } else {
    attempt.answers.push({
      question: questionId,
      selectedOptions: Array.isArray(answer) ? answer : [answer],
      textAnswer: answer,
      isCorrect,
      pointsEarned,
      timeSpent: timeSpent || 0,
      answeredAt: new Date()
    });
  }
  
  await attempt.save();
  
  res.json({
    success: true,
    message: 'Answer submitted',
    data: {
      isCorrect,
      pointsEarned,
      totalPoints: question.points,
      explanation: quiz.settings.showExplanation ? question.explanation : undefined
    }
  });
}));

/**
 * @route   POST /api/quizzes/attempts/:attemptId/complete
 * @desc    Complete quiz attempt
 * @access  Private
 */
router.post('/attempts/:attemptId/complete', asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findById(req.params.attemptId);
  
  if (!attempt) {
    return res.status(404).json({
      success: false,
      message: 'Attempt not found'
    });
  }
  
  // Verify ownership
  if (attempt.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only complete your own attempts'
    });
  }
  
  // Check if attempt is in progress
  if (attempt.status !== 'in_progress') {
    return res.status(403).json({
      success: false,
      message: 'This attempt has already been completed'
    });
  }
  
  // Complete the attempt
  await attempt.complete();
  
  // Log quiz completion
  await LearningActivity.log({
    student: req.user._id,
    activityType: 'quiz_complete',
    quiz: attempt.quiz,
    quizAttempt: attempt._id,
    details: {
      score: attempt.score.percentage,
      passed: attempt.results.passed,
      timeSpent: attempt.timeSpent
    },
    ipAddress: req.ip
  });
  
  // Refresh attempt data
  const completedAttempt = await QuizAttempt.findById(attempt._id)
    .populate('quiz', 'title');
  
  res.json({
    success: true,
    message: 'Quiz completed successfully',
    data: {
      attempt: completedAttempt,
      results: {
        score: completedAttempt.score,
        passed: completedAttempt.results.passed,
        correctCount: completedAttempt.results.correctCount,
        incorrectCount: completedAttempt.results.incorrectCount,
        timeSpent: completedAttempt.timeSpent
      }
    }
  });
}));

/**
 * @route   GET /api/quizzes/attempts/:attemptId
 * @desc    Get attempt details with answers
 * @access  Private
 */
router.get('/attempts/:attemptId', asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findById(req.params.attemptId)
    .populate('quiz', 'title questions');
  
  if (!attempt) {
    return res.status(404).json({
      success: false,
      message: 'Attempt not found'
    });
  }
  
  // Verify ownership or admin
  if (attempt.student.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'You can only view your own attempts'
    });
  }
  
  res.json({
    success: true,
    data: { attempt }
  });
}));

/**
 * @route   GET /api/quizzes/history
 * @desc    Get user's quiz history
 * @access  Private
 */
router.get('/history/me', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  const attempts = await QuizAttempt.find({
    student: req.user._id,
    status: 'completed'
  })
    .sort({ completedAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('quiz', 'title subject');
  
  const total = await QuizAttempt.countDocuments({
    student: req.user._id,
    status: 'completed'
  });
  
  res.json({
    success: true,
    data: {
      attempts,
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