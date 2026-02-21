/**
 * Subject Model
 * Represents academic subjects with hierarchical structure
 */

const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Subject name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  icon: {
    type: String,
    default: 'book'
  },
  color: {
    type: String,
    default: '#2979ff',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
  },
  
  // Class levels this subject is available for
  classLevels: [{
    type: Number,
    min: 8,
    max: 12
  }],
  
  // Difficulty level
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  
  // Prerequisites (other subjects)
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  
  // Statistics
  statistics: {
    totalChapters: { type: Number, default: 0 },
    totalModules: { type: Number, default: 0 },
    totalQuizzes: { type: Number, default: 0 },
    enrolledStudents: { type: Number, default: 0 },
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

// Virtual for chapters
subjectSchema.virtual('chapters', {
  ref: 'Chapter',
  localField: '_id',
  foreignField: 'subject'
});

// Index for efficient queries
subjectSchema.index({ code: 1 });
subjectSchema.index({ classLevels: 1 });
subjectSchema.index({ isActive: 1 });

// Pre-save middleware to update statistics
subjectSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('classLevels')) {
    // Update statistics on save
    const Chapter = mongoose.model('Chapter');
    const chapterCount = await Chapter.countDocuments({ subject: this._id });
    this.statistics.totalChapters = chapterCount;
  }
  next();
});

module.exports = mongoose.model('Subject', subjectSchema);