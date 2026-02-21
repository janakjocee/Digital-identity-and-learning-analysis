/**
 * LearnSync AI v1.0 - Authentication Middleware
 * Enterprise-grade JWT authentication with refresh token rotation
 * 
 * Features:
 * - JWT token verification
 * - Refresh token rotation
 * - Token blacklisting
 * - Role-based access control
 * - Session management
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// ============================================
# CONFIGURATION
# ============================================
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  expiresIn: process.env.JWT_EXPIRE || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
};

// ============================================
# TOKEN GENERATION
# ============================================

/**
 * Generate access token
 * @param {Object} user - User document
 * @returns {String} JWT access token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      type: 'access'
    },
    JWT_CONFIG.secret,
    { expiresIn: JWT_CONFIG.expiresIn }
  );
};

/**
 * Generate refresh token
 * @param {Object} user - User document
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      type: 'refresh',
      tokenId: Math.random().toString(36).substring(2)
    },
    JWT_CONFIG.refreshSecret,
    { expiresIn: JWT_CONFIG.refreshExpiresIn }
  );
};

/**
 * Generate token pair (access + refresh)
 * @param {Object} user - User document
 * @returns {Object} Token pair with metadata
 */
const generateTokenPair = (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
    tokenType: 'Bearer'
  };
};

// ============================================
# AUTHENTICATION MIDDLEWARE
# ============================================

/**
 * Verify JWT token middleware
 * Protects routes requiring authentication
 */
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked'
      });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_CONFIG.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      throw err;
    }
    
    // Check token type
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }
    
    // Get user from database
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }
    
    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Password recently changed. Please log in again.'
      });
    }
    
    // Attach user to request
    req.user = user;
    req.token = token;
    req.tokenDecoded = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// ============================================
# ROLE-BASED ACCESS CONTROL
# ============================================

/**
 * Restrict access to specific roles
 * @param  {...String} roles - Allowed roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

/**
 * Check if user is superadmin
 */
const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Superadmin access required'
    });
  }
  next();
};

// ============================================
# REFRESH TOKEN HANDLING
# ============================================

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }
    
    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_CONFIG.refreshSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Refresh token expired. Please log in again.'
        });
      }
      throw err;
    }
    
    // Check token type
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }
    
    // Get user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    
    // Remove old refresh token (rotation)
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    
    // Generate new token pair
    const tokens = generateTokenPair(user);
    
    // Store new refresh token
    user.refreshTokens.push({
      token: tokens.refreshToken,
      device: req.headers['user-agent'] || 'unknown',
      ip: req.ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    // Limit stored refresh tokens (keep last 5)
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    
    await user.save({ validateBeforeSave: false });
    
    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: tokens.tokenType
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error refreshing token'
    });
  }
};

// ============================================
# LOGOUT & TOKEN BLACKLISTING
# ============================================

/**
 * Logout user and blacklist token
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    // Blacklist access token
    const tokenExpiry = req.tokenDecoded.exp - Math.floor(Date.now() / 1000);
    if (tokenExpiry > 0) {
      await redis.setex(`blacklist:${req.token}`, tokenExpiry, 'true');
    }
    
    // Remove refresh token from user
    if (refreshToken && req.user) {
      req.user.refreshTokens = req.user.refreshTokens.filter(
        t => t.token !== refreshToken
      );
      await req.user.save({ validateBeforeSave: false });
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging out'
    });
  }
};

/**
 * Logout from all devices
 */
const logoutAll = async (req, res) => {
  try {
    // Blacklist current token
    const tokenExpiry = req.tokenDecoded.exp - Math.floor(Date.now() / 1000);
    if (tokenExpiry > 0) {
      await redis.setex(`blacklist:${req.token}`, tokenExpiry, 'true');
    }
    
    // Clear all refresh tokens
    req.user.refreshTokens = [];
    await req.user.save({ validateBeforeSave: false });
    
    res.json({
      success: true,
      message: 'Logged out from all devices'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging out'
    });
  }
};

// ============================================
# EXPORTS
# ============================================
module.exports = {
  protect,
  restrictTo,
  isAdmin,
  isSuperAdmin,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  refreshAccessToken,
  logout,
  logoutAll
};