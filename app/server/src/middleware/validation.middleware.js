/**
 * Validation Middleware
 * Input validation using express-validator
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

/**
 * Auth validation rules
 */
const authValidation = {
  register: [
    body('firstName')
      .trim()
      .notEmpty().withMessage('First name is required')
      .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    body('lastName')
      .trim()
      .notEmpty().withMessage('Last name is required')
      .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please enter a valid email'),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('assignedClass')
      .notEmpty().withMessage('Class is required')
      .isInt({ min: 8, max: 12 }).withMessage('Class must be between 8 and 12'),
    body('dateOfBirth')
      .optional()
      .isISO8601().withMessage('Please enter a valid date of birth'),
    handleValidationErrors
  ],
  
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please enter a valid email'),
    body('password')
      .notEmpty().withMessage('Password is required'),
    handleValidationErrors
  ],
  
  forgotPassword: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please enter a valid email'),
    handleValidationErrors
  ],
  
  resetPassword: [
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('confirmPassword')
      .notEmpty().withMessage('Confirm password is required')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      }),
    handleValidationErrors
  ]
};

/**
 * User validation rules
 */
const userValidation = {
  updateProfile: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    body('phone')
      .optional()
      .trim()
      .matches(/^\+?[\d\s-()]+$/).withMessage('Please enter a valid phone number'),
    handleValidationErrors
  ],
  
  updateLearningProfile: [
    body('learningProfile.style')
      .optional()
      .isIn(['visual', 'auditory', 'kinesthetic', 'reading', 'mixed'])
      .withMessage('Invalid learning style'),
    body('learningProfile.pace')
      .optional()
      .isIn(['slow', 'moderate', 'fast', 'adaptive'])
      .withMessage('Invalid learning pace'),
    handleValidationErrors
  ]
};

/**
 * Content validation rules
 */
const contentValidation = {
  createSubject: [
    body('name')
      .trim()
      .notEmpty().withMessage('Subject name is required')
      .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('code')
      .trim()
      .notEmpty().withMessage('Subject code is required')
      .isLength({ max: 20 }).withMessage('Code cannot exceed 20 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('classLevels')
      .isArray({ min: 1 }).withMessage('At least one class level is required'),
    body('classLevels.*')
      .isInt({ min: 8, max: 12 }).withMessage('Class level must be between 8 and 12'),
    handleValidationErrors
  ],
  
  createChapter: [
    body('name')
      .trim()
      .notEmpty().withMessage('Chapter name is required'),
    body('subject')
      .notEmpty().withMessage('Subject ID is required')
      .isMongoId().withMessage('Invalid subject ID'),
    body('classLevel')
      .notEmpty().withMessage('Class level is required')
      .isInt({ min: 8, max: 12 }).withMessage('Class level must be between 8 and 12'),
    handleValidationErrors
  ],
  
  createModule: [
    body('title')
      .trim()
      .notEmpty().withMessage('Module title is required'),
    body('chapter')
      .notEmpty().withMessage('Chapter ID is required')
      .isMongoId().withMessage('Invalid chapter ID'),
    handleValidationErrors
  ],
  
  createQuiz: [
    body('title')
      .trim()
      .notEmpty().withMessage('Quiz title is required'),
    body('subject')
      .notEmpty().withMessage('Subject ID is required')
      .isMongoId().withMessage('Invalid subject ID'),
    body('questions')
      .isArray({ min: 1 }).withMessage('At least one question is required'),
    handleValidationErrors
  ]
};

/**
 * Quiz attempt validation
 */
const quizAttemptValidation = {
  submitAnswer: [
    body('questionId')
      .notEmpty().withMessage('Question ID is required')
      .isMongoId().withMessage('Invalid question ID'),
    body('answer')
      .notEmpty().withMessage('Answer is required'),
    handleValidationErrors
  ],
  
  completeQuiz: [
    body('answers')
      .isArray().withMessage('Answers must be an array'),
    handleValidationErrors
  ]
};

/**
 * Admin validation rules
 */
const adminValidation = {
  approveStudent: [
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
    body('assignedClass')
      .optional()
      .isInt({ min: 8, max: 12 }).withMessage('Class must be between 8 and 12'),
    handleValidationErrors
  ],
  
  bulkAction: [
    body('userIds')
      .isArray({ min: 1 }).withMessage('At least one user ID is required'),
    body('userIds.*')
      .isMongoId().withMessage('Invalid user ID'),
    body('action')
      .notEmpty().withMessage('Action is required')
      .isIn(['approve', 'reject', 'suspend', 'delete']).withMessage('Invalid action'),
    handleValidationErrors
  ]
};

/**
 * Pagination validation
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .trim(),
  query('order')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  authValidation,
  userValidation,
  contentValidation,
  quizAttemptValidation,
  adminValidation,
  paginationValidation
};