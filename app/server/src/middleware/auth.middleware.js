/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user to request
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check for token in cookies (optional)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // No token found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user and attach to request
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Token may be invalid.'
        });
      }
      
      // Check if user is active
      if (user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended. Please contact support.'
        });
      }
      
      // Check if account is locked
      if (user.isLocked) {
        return res.status(403).json({
          success: false,
          message: 'Account is temporarily locked due to multiple failed login attempts.'
        });
      }
      
      // Attach user to request
      req.user = user;
      req.token = token;
      
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

/**
 * Optional authentication - attaches user if token exists, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user && !user.isLocked) {
          req.user = user;
          req.token = token;
        }
      } catch (error) {
        // Silently fail for optional auth
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

/**
 * Refresh token validation
 */
const validateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.'
      });
    }
    
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      req.tokenData = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  validateRefreshToken
};