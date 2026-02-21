/**
 * Authentication Routes
 * Handles user registration, login, and token management
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { authenticate, validateRefreshToken } = require('../middleware/auth.middleware');
const { authValidation } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

/**
 * Generate JWT tokens
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
  
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
  
  return { accessToken, refreshToken };
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new student
 * @access  Public
 */
router.post('/register', authValidation.register, asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, assignedClass, dateOfBirth, phone } = req.body;
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists. Please login or use a different email.'
    });
  }
  
  // Create new user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    assignedClass,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    phone,
    role: 'student',
    status: 'pending'
  });
  
  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);
  
  // Log registration
  await AuditLog.log({
    user: user._id,
    userRole: user.role,
    action: 'user_create',
    entityType: 'user',
    entityId: user._id,
    entityName: user.fullName,
    description: `New student registered: ${user.fullName}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  res.status(201).json({
    success: true,
    message: 'Registration successful! Your account is pending admin approval.',
    data: {
      user: user.getPublicProfile(),
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authValidation.login, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Find user with password
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.'
    });
  }
  
  // Check if account is locked
  if (user.isLocked) {
    return res.status(403).json({
      success: false,
      message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
    });
  }
  
  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    // Increment login attempts
    await user.incrementLoginAttempts();
    
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.'
    });
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.updateOne({
      $set: { loginAttempts: 0 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Update last login
  user.lastLogin = new Date();
  user.lastLoginIp = req.ip;
  await user.save();
  
  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);
  
  // Log login
  await AuditLog.log({
    user: user._id,
    userRole: user.role,
    action: 'login',
    entityType: 'user',
    entityId: user._id,
    description: `User logged in: ${user.fullName}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  res.json({
    success: true,
    message: 'Login successful!',
    data: {
      user: user.getPublicProfile(),
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
}));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public (requires refresh token)
 */
router.post('/refresh', validateRefreshToken, asyncHandler(async (req, res) => {
  const { id } = req.tokenData;
  
  // Verify user still exists
  const user = await User.findById(id);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User not found. Please login again.'
    });
  }
  
  // Generate new tokens
  const { accessToken, refreshToken } = generateTokens(user._id);
  
  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  // Log logout
  await AuditLog.log({
    user: req.user._id,
    userRole: req.user.role,
    action: 'logout',
    entityType: 'user',
    entityId: req.user._id,
    description: `User logged out: ${req.user.fullName}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  // Refresh user data
  const user = await User.findById(req.user._id);
  
  res.json({
    success: true,
    data: {
      user: user.getPublicProfile()
    }
  });
}));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', authValidation.forgotPassword, asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  const user = await User.findOne({ email });
  
  // Don't reveal if email exists
  if (!user) {
    return res.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions.'
    });
  }
  
  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Save hashed token to user
  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  await user.save();
  
  // TODO: Send email with reset token
  // For now, return token in response (development only)
  
  res.json({
    success: true,
    message: 'If an account exists with this email, you will receive password reset instructions.',
    // Development only - remove in production
    ...(process.env.NODE_ENV !== 'production' && {
      devInfo: {
        resetToken,
        resetUrl: `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`
      }
    })
  });
}));

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', authValidation.resetPassword, asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  
  // Hash token for comparison
  const resetTokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Find user with valid token
  const user = await User.findOne({
    resetPasswordToken: resetTokenHash,
    resetPasswordExpire: { $gt: Date.now() }
  });
  
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token. Please request a new password reset.'
    });
  }
  
  // Update password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  
  // Log password change
  await AuditLog.log({
    user: user._id,
    userRole: user.role,
    action: 'password_change',
    entityType: 'user',
    entityId: user._id,
    description: `Password reset for user: ${user.fullName}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  res.json({
    success: true,
    message: 'Password reset successful. Please login with your new password.'
  });
}));

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (authenticated)
 * @access  Private
 */
router.post('/change-password', authenticate, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  // Get user with password
  const user = await User.findById(req.user._id).select('+password');
  
  // Verify current password
  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect.'
    });
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  // Log password change
  await AuditLog.log({
    user: user._id,
    userRole: user.role,
    action: 'password_change',
    entityType: 'user',
    entityId: user._id,
    description: `Password changed by user: ${user.fullName}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  res.json({
    success: true,
    message: 'Password changed successfully.'
  });
}));

module.exports = router;