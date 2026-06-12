/**
 * QuizAttempt Model
 * Tracks student quiz attempts with detailed response data
 */

const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  selectedOptions: [String], // For MCQ
  textAnswer: String, // For fill_blank, short_answer
  isCorrect: {
    type: Boolean,
    default: false
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  timeSpent: { // in seconds
    type: Number,
    default: 0
  },
  answeredAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const quizAttemptSchema = new mongoose.Schema({
  // References
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  },
  
  // Attempt info
  attemptNumber: {
    type: Number,
    default: 1
  },
  
  // Status
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned', 'timed_out'],
    default: 'in_progress'
  },
  
  // Timing
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  timeSpent: { // in seconds
    type: Number,
    default: 0
  },
  
  // Answers
  answers: [answerSchema],
  
  // Score
  score: {
    raw: { type: Number, default: 0 }, // points earned
    total: { type: Number, default: 0 }, // total possible points
    percentage: { type: Number, default: 0 },
    grade: String
  },
  
  // Results
  results: {
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    unansweredCount: { type: Number, default: 0 },
    passed: { type: Boolean, default: false }
  },
  
  // AI Analysis
  aiAnalysis: {
    weakTopics: [String],
    recommendedModules: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module'
    }],
    performanceInsights: String,
    confidenceScore: { type: Number, min: 0, max: 1 }
  },
  
  // Device/Location info for security
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceType: String,
    browser: String,
    tabSwitches: { type: Number, default: 0 }
  },
  
  // Feedback
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for accuracy
quizAttemptSchema.virtual('accuracy').get(function() {
  const totalAnswered = this.results.correctCount + this.results.incorrectCount;
  if (totalAnswered === 0) return 0;
  return Math.round((this.results.correctCount / totalAnswered) * 100);
});

// Calculate score method
quizAttemptSchema.methods.calculateScore = function() {
  const correct = this.answers.filter(a => a.isCorrect).length;
  const total = this.answers.length;
  const totalPoints = this.answers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);
  const maxPoints = this.score.total || total;
  
  this.results.correctCount = correct;
  this.results.incorrectCount = this.answers.filter(a => !a.isCorrect && a.selectedOptions?.length > 0).length;
  this.results.unansweredCount = total - this.answers.length;
  
  this.score.raw = totalPoints;
  this.score.percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
  
  return this.score.percentage;
};

// Complete attempt method
quizAttemptSchema.methods.complete = async function() {
  this.status = 'completed';
  this.completedAt = new Date();
  this.timeSpent = Math.round((this.completedAt - this.startedAt) / 1000);
  
  this.calculateScore();
  
  // Determine if passed
  const Quiz = mongoose.model('Quiz');
  const quiz = await Quiz.findById(this.quiz);
  if (quiz) {
    this.results.passed = this.score.percentage >= quiz.settings.passingScore;
    
    // Assign grade
    const gradeScale = quiz.scoring.gradingScale.find(
      g => this.score.percentage >= g.minScore && this.score.percentage <= g.maxScore
    );
    this.score.grade = gradeScale?.grade || 'N/A';
  }
  
  await this.save();
  
  // Update user performance metrics
  const User = mongoose.model('User');
  const student = await User.findById(this.student);
  if (student) {
    await student.updatePerformanceMetrics();
  }
  
  // Update quiz statistics
  await this.updateQuizStats();
};

// Update quiz statistics
quizAttemptSchema.methods.updateQuizStats = async function() {
  const Quiz = mongoose.model('Quiz');
  const quiz = await Quiz.findById(this.quiz);
  
  if (quiz) {
    const stats = await this.constructor.aggregate([
      { $match: { quiz: this.quiz, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          averageScore: { $avg: '$score.percentage' },
          highestScore: { $max: '$score.percentage' },
          lowestScore: { $min: '$score.percentage' },
          passCount: {
            $sum: { $cond: [{ $eq: ['$results.passed', true] }, 1, 0] }
          },
          averageTime: { $avg: '$timeSpent' }
        }
      }
    ]);
    
    if (stats.length > 0) {
      quiz.statistics = {
        totalAttempts: stats[0].totalAttempts,
        averageScore: Math.round(stats[0].averageScore),
        highestScore: stats[0].highestScore,
        lowestScore: stats[0].lowestScore,
        passRate: Math.round((stats[0].passCount / stats[0].totalAttempts) * 100),
        averageTimeSpent: Math.round(stats[0].averageTime / 60)
      };
      await quiz.save();
    }
  }
};

// Index for efficient queries
quizAttemptSchema.index({ student: 1, createdAt: -1 });
quizAttemptSchema.index({ quiz: 1, student: 1 });
quizAttemptSchema.index({ status: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);