/**
 * Quiz Model
 * Represents quizzes with various question types
 */

const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  order: Number
}, { _id: true });

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mcq', 'true_false', 'fill_blank', 'matching', 'short_answer'],
    default: 'mcq'
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  description: String, // Additional context
  image: String, // URL to question image
  options: [optionSchema],
  correctAnswer: String, // For fill_blank, short_answer
  explanation: String, // Explanation shown after answering
  hint: String,
  points: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: [String],
  timeLimit: { // in seconds, 0 = no limit
    type: Number,
    default: 0
  },
  order: Number
}, { _id: true });

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  instructions: {
    type: String,
    maxlength: [2000, 'Instructions cannot exceed 2000 characters']
  },
  
  // Hierarchy
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  
  // Questions
  questions: [questionSchema],
  
  // Settings
  settings: {
    timeLimit: { // Total quiz time in minutes, 0 = no limit
      type: Number,
      default: 0
    },
    attemptsAllowed: {
      type: Number,
      default: 1
    },
    shuffleQuestions: {
      type: Boolean,
      default: true
    },
    shuffleOptions: {
      type: Boolean,
      default: true
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true
    },
    showExplanation: {
      type: Boolean,
      default: true
    },
    passingScore: {
      type: Number,
      default: 60 // percentage
    },
    allowReview: {
      type: Boolean,
      default: true
    },
    preventTabSwitch: {
      type: Boolean,
      default: false
    }
  },
  
  // Scoring
  scoring: {
    totalPoints: { type: Number, default: 0 },
    gradingScale: [{
      minScore: Number,
      maxScore: Number,
      grade: String,
      label: String
    }]
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  
  // Availability
  availability: {
    startDate: Date,
    endDate: Date,
    alwaysAvailable: {
      type: Boolean,
      default: true
    }
  },
  
  // Statistics
  statistics: {
    totalAttempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    lowestScore: { type: Number, default: 0 },
    passRate: { type: Number, default: 0 },
    averageTimeSpent: { type: Number, default: 0 }
  },
  
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for question count
quizSchema.virtual('questionCount').get(function() {
  return this.questions.length;
});

// Virtual for total possible points
quizSchema.virtual('totalPoints').get(function() {
  return this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
});

// Pre-save middleware
quizSchema.pre('save', function(next) {
  // Calculate total points
  this.scoring.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  next();
});

// Index for efficient queries
quizSchema.index({ subject: 1 });
quizSchema.index({ module: 1 });
quizSchema.index({ isActive: 1, isPublished: 1 });
quizSchema.index({ 'questions.tags': 1 });

module.exports = mongoose.model('Quiz', quizSchema);