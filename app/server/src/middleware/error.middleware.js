/**
 * Global Error Handling Middleware
 * Centralized error handling for the application
 */

const mongoose = require('mongoose');

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle Mongoose validation errors
 */
const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map(val => val.message);
  return {
    statusCode: 400,
    message: 'Validation Error',
    errors: messages
  };
};

/**
 * Handle Mongoose duplicate key errors
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return {
    statusCode: 409,
    message: `Duplicate field value: ${field} = ${value}. Please use another value.`
  };
};

/**
 * Handle Mongoose cast errors (invalid ObjectId)
 */
const handleCastError = (err) => {
  return {
    statusCode: 400,
    message: `Invalid ${err.path}: ${err.value}`
  };
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => ({
  statusCode: 401,
  message: 'Invalid token. Please log in again.'
});

/**
 * Handle JWT expiration
 */
const handleJWTExpired = () => ({
  statusCode: 401,
  message: 'Your token has expired. Please log in again.'
});

/**
 * Main error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
    code: err.code
  });
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const validationError = handleValidationError(err);
    error.statusCode = validationError.statusCode;
    error.message = validationError.message;
    error.errors = validationError.errors;
  }
  
  // Mongoose duplicate key error
  else if (err.code === 11000) {
    const duplicateError = handleDuplicateKeyError(err);
    error.statusCode = duplicateError.statusCode;
    error.message = duplicateError.message;
  }
  
  // Mongoose cast error (invalid ObjectId)
  else if (err.name === 'CastError') {
    const castError = handleCastError(err);
    error.statusCode = castError.statusCode;
    error.message = castError.message;
  }
  
  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    const jwtError = handleJWTError();
    error.statusCode = jwtError.statusCode;
    error.message = jwtError.message;
  }
  
  // JWT expired
  else if (err.name === 'TokenExpiredError') {
    const jwtExpired = handleJWTExpired();
    error.statusCode = jwtExpired.statusCode;
    error.message = jwtExpired.message;
  }
  
  // Default error
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || err.message || 'Internal Server Error';
  
  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    errors: error.errors || undefined,
    code: err.code || undefined,
    // Only include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Async handler wrapper - eliminates need for try-catch in controllers
 * @param {Function} fn - Async function to wrap
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found handler for undefined routes
 */
const notFound = (req, res, next) => {
  const error = new APIError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

module.exports = {
  APIError,
  errorHandler,
  asyncHandler,
  notFound
};