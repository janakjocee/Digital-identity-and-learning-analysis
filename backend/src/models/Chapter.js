/**
 * Chapter Model
 * Represents chapters within subjects
 */

const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Chapter name is required'],
    trim: true,
    maxlength: [150, 'Chapter name cannot exceed 150 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Hierarchy
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  
  // Class level
  classLevel: {
    type: Number,
    required: true,
    min: 8,
    max: 12
  },
  
  // Order within subject
  order: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Content
  learningObjectives: [{
    type: String,
    trim: true
  }],
  keyConcepts: [{
    name: String,
    description: String
  }],
  
  // Estimated time
  estimatedDuration: {
    type: Number, // in minutes
    default: 60
  },
  
  // Difficulty
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  
  // Prerequisites (other chapters)
  prerequisites: [{
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
    isRequired: { type: Boolean, default: true }
  }],
  
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
  
  // Statistics
  statistics: {
    totalModules: { type: Number, default: 0 },
    totalQuizzes: { type: Number, default: 0 },
    averageCompletionTime: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 }
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

// Virtual for modules
chapterSchema.virtual('modules', {
  ref: 'Module',
  localField: '_id',
  foreignField: 'chapter'
});

// Index for efficient queries
chapterSchema.index({ subject: 1, order: 1 });
chapterSchema.index({ classLevel: 1 });
chapterSchema.index({ isActive: 1, isPublished: 1 });

module.exports = mongoose.model('Chapter', chapterSchema);