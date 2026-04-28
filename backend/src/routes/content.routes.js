/**
 * Content Routes
 * Manages subjects, chapters, modules, and learning content
 */

const express = require('express');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Module = require('../models/Module');
const LearningActivity = require('../models/LearningActivity');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { authorize, roles, requireApprovedStudent, authorizeClassAccess } = require('../middleware/role.middleware');
const { contentValidation, paginationValidation } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// Public routes (with optional auth)
router.use(optionalAuth);

/**
 * @route   GET /api/content/subjects
 * @desc    Get all subjects
 * @access  Public
 */
router.get('/subjects', asyncHandler(async (req, res) => {
  const { classLevel, search } = req.query;
  
  const filter = { isActive: true };
  
  if (classLevel) {
    filter.classLevels = parseInt(classLevel);
  }
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  const subjects = await Subject.find(filter)
    .sort({ order: 1, name: 1 })
    .select('-__v');
  
  res.json({
    success: true,
    data: { subjects }
  });
}));

/**
 * @route   GET /api/content/subjects/:id
 * @desc    Get subject details with chapters
 * @access  Public
 */
router.get('/subjects/:id', asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }
  
  // Get chapters
  const chapters = await Chapter.find({
    subject: subject._id,
    isActive: true,
    isPublished: true
  })
    .sort({ order: 1 })
    .select('-__v');
  
  res.json({
    success: true,
    data: { subject, chapters }
  });
}));

/**
 * @route   POST /api/content/subjects
 * @desc    Create new subject
 * @access  Admin
 */
router.post('/subjects', authenticate, roles.admin, contentValidation.createSubject, asyncHandler(async (req, res) => {
  const subject = await Subject.create({
    ...req.body,
    createdBy: req.user._id
  });
  
  res.status(201).json({
    success: true,
    message: 'Subject created successfully',
    data: { subject }
  });
}));

/**
 * @route   GET /api/content/chapters/:id
 * @desc    Get chapter with modules
 * @access  Public
 */
router.get('/chapters/:id', asyncHandler(async (req, res) => {
  const chapter = await Chapter.findById(req.params.id);
  
  if (!chapter) {
    return res.status(404).json({
      success: false,
      message: 'Chapter not found'
    });
  }
  
  // Get modules
  const modules = await Module.find({
    chapter: chapter._id,
    isActive: true,
    isPublished: true
  })
    .sort({ order: 1 })
    .select('-contentBlocks.content -__v');
  
  res.json({
    success: true,
    data: { chapter, modules }
  });
}));

/**
 * @route   POST /api/content/chapters
 * @desc    Create new chapter
 * @access  Admin
 */
router.post('/chapters', authenticate, roles.admin, contentValidation.createChapter, asyncHandler(async (req, res) => {
  const chapter = await Chapter.create({
    ...req.body,
    createdBy: req.user._id
  });
  
  res.status(201).json({
    success: true,
    message: 'Chapter created successfully',
    data: { chapter }
  });
}));

/**
 * @route   GET /api/content/modules/:id
 * @desc    Get module details
 * @access  Private (Students need approval)
 */
router.get('/modules/:id', authenticate, requireApprovedStudent, asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.id);
  
  if (!module) {
    return res.status(404).json({
      success: false,
      message: 'Module not found'
    });
  }
  
  // Check if student can access this module's class level
  if (req.user.role === 'student' && module.chapter) {
    const chapter = await Chapter.findById(module.chapter);
    if (chapter && chapter.classLevel > req.user.assignedClass) {
      return res.status(403).json({
        success: false,
        message: 'This content is for a higher class level'
      });
    }
  }
  
  // Log module view
  await LearningActivity.log({
    student: req.user._id,
    activityType: 'module_start',
    module: module._id,
    chapter: module.chapter,
    subject: module.subject,
    details: {
      title: module.title,
      duration: 0
    },
    ipAddress: req.ip,
    device: {
      type: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
      browser: req.headers['user-agent']
    }
  });
  
  // Update view count
  await Module.findByIdAndUpdate(module._id, {
    $inc: { 'statistics.totalViews': 1 }
  });
  
  res.json({
    success: true,
    data: { module }
  });
}));

/**
 * @route   POST /api/content/modules/:id/complete
 * @desc    Mark module as completed
 * @access  Private (Students)
 */
router.post('/modules/:id/complete', authenticate, requireApprovedStudent, asyncHandler(async (req, res) => {
  const { timeSpent } = req.body;
  
  const module = await Module.findById(req.params.id);
  
  if (!module) {
    return res.status(404).json({
      success: false,
      message: 'Module not found'
    });
  }
  
  // Log completion
  await LearningActivity.log({
    student: req.user._id,
    activityType: 'module_complete',
    module: module._id,
    chapter: module.chapter,
    subject: module.subject,
    details: {
      title: module.title,
      duration: timeSpent || module.estimatedDuration * 60
    },
    ipAddress: req.ip
  });
  
  // Update completion count
  await Module.findByIdAndUpdate(module._id, {
    $inc: { 'statistics.totalCompletions': 1 }
  });
  
  res.json({
    success: true,
    message: 'Module marked as completed'
  });
}));

/**
 * @route   POST /api/content/modules
 * @desc    Create new module
 * @access  Admin
 */
router.post('/modules', authenticate, roles.admin, contentValidation.createModule, asyncHandler(async (req, res) => {
  const module = await Module.create({
    ...req.body,
    createdBy: req.user._id
  });
  
  res.status(201).json({
    success: true,
    message: 'Module created successfully',
    data: { module }
  });
}));

/**
 * @route   GET /api/content/my-content
 * @desc    Get content for student's class
 * @access  Private (Students)
 */
router.get('/my-content', authenticate, requireApprovedStudent, asyncHandler(async (req, res) => {
  const userClass = req.user.assignedClass;
  
  // Get subjects for user's class
  const subjects = await Subject.find({
    classLevels: userClass,
    isActive: true
  }).sort({ order: 1 });
  
  // Get chapters for user's class
  const chapters = await Chapter.find({
    classLevel: userClass,
    isActive: true,
    isPublished: true
  })
    .populate('subject', 'name code color')
    .sort({ order: 1 });
  
  // Get user's progress
  const completedModules = await LearningActivity.distinct('module', {
    student: req.user._id,
    activityType: 'module_complete'
  });
  
  res.json({
    success: true,
    data: {
      subjects,
      chapters,
      progress: {
        completedModules: completedModules.length
      }
    }
  });
}));

module.exports = router;