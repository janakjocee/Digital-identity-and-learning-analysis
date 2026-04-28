/**
 * LearnSync AI - Backend Server
 * AI-Powered Learning Analytics Platform
 * 
 * @author Janak Raj Joshi
 * @license MIT
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Validate required environment variables at startup
const REQUIRED_ENV_VARS = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI'];
const missingEnvVars = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please set these variables in your .env file or deployment environment.');
  process.exit(1);
}
// In production, CORS_ORIGINS or FRONTEND_URL must be set so the frontend can reach the API
if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGINS && !process.env.FRONTEND_URL) {
  console.error('FATAL: In production, set CORS_ORIGINS (comma-separated list of allowed frontend URLs)');
  console.error('       or FRONTEND_URL to the URL of your deployed frontend (e.g. https://your-app.vercel.app).');
  process.exit(1);
}

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const adminRoutes = require('./src/routes/admin.routes');
const contentRoutes = require('./src/routes/content.routes');
const quizRoutes = require('./src/routes/quiz.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');
const aiRoutes = require('./src/routes/ai.routes');

// Import middleware
// error.middleware.js exports an object: { errorHandler, asyncHandler, notFound, ... }
const { errorHandler } = require('./src/middleware/error.middleware');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS configuration
// In production set CORS_ORIGINS (comma-separated) or FRONTEND_URL to your deployed frontend URL
// e.g. CORS_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
const getAllowedOrigins = () => {
  if (process.env.CORS_ORIGINS) {
    return process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
  }
  if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
    return [process.env.FRONTEND_URL];
  }
  // Development fallback
  return ['http://localhost:5173', 'http://localhost:3000'];
};

app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to LearnSync AI API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnsync_ai', {
      // These options are no longer needed in Mongoose 6+, but kept for clarity
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Create indexes
    await createIndexes();
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

// Create database indexes
const createIndexes = async () => {
  try {
    const User = require('./src/models/User');
    const QuizAttempt = require('./src/models/QuizAttempt');
    const LearningActivity = require('./src/models/LearningActivity');

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ status: 1 });
    await User.collection.createIndex({ assignedClass: 1 });

    // Quiz attempt indexes
    await QuizAttempt.collection.createIndex({ student: 1, createdAt: -1 });
    await QuizAttempt.collection.createIndex({ quiz: 1, student: 1 });

    // Learning activity indexes
    await LearningActivity.collection.createIndex({ student: 1, createdAt: -1 });
    await LearningActivity.collection.createIndex({ module: 1, student: 1 });

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error.message);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║           LearnSync AI - Backend Server                    ║
║           AI-Powered Learning Analytics Platform           ║
║                                                            ║
║   Server running on port: ${PORT}                          ║
║   Environment: ${process.env.NODE_ENV || 'development'}    ║
║   API Base: http://localhost:${PORT}/api                   ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = app;
