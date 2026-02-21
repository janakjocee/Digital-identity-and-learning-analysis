/**
 * Module Model
 * Represents learning modules within chapters
 */

const mongoose = require('mongoose');

const contentBlockSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['text', 'video', 'audio', 'image', 'pdf', 'quiz', 'interactive', 'code', 'embed'],
    required: true
  },
  title: String,
  content: String, // For text, HTML content
  url: String, // For video, audio, PDF
  fileName: String,
  fileSize: Number,
  duration: Number, // For video/audio in seconds
  order: Number,
  settings: {
    autoplay: { type: Boolean, default: false },
    allowDownload: { type: Boolean, default: true },
    showTranscript: { type: Boolean, default: false }
  }
}, { _id: true });

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Hierarchy
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  
  // Order within chapter
  order: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Content blocks
  contentBlocks: [contentBlockSchema],
  
  // Estimated duration
  estimatedDuration: {
    type: Number, // in minutes
    default: 15
  },
  
  // Difficulty
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  
  // Tags for AI recommendations
  tags: [{
    type: String,
    trim: true
  }],
  
  // Associated quiz
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
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
  
  // Completion criteria
  completionCriteria: {
    minTimeSpent: { type: Number, default: 0 }, // in minutes
    requireQuiz: { type: Boolean, default: false },
    minQuizScore: { type: Number, default: 0 }, // percentage
    requireAllContent: { type: Boolean, default: true }
  },
  
  // Statistics
  statistics: {
    totalViews: { type: Number, default: 0 },
    totalCompletions: { type: Number, default: 0 },
    averageTimeSpent: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 }
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

// Virtual for completion rate
moduleSchema.virtual('completionRate').get(function() {
  if (this.statistics.totalViews === 0) return 0;
  return Math.round((this.statistics.totalCompletions / this.statistics.totalViews) * 100);
});

// Index for efficient queries
moduleSchema.index({ chapter: 1, order: 1 });
moduleSchema.index({ subject: 1 });
moduleSchema.index({ tags: 1 });
moduleSchema.index({ isActive: 1, isPublished: 1 });

module.exports = mongoose.model('Module', moduleSchema);