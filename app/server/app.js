const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const adminRoutes = require('./src/routes/admin.routes');
const contentRoutes = require('./src/routes/content.routes');
const quizRoutes = require('./src/routes/quiz.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');
const aiRoutes = require('./src/routes/ai.routes');
const { errorHandler } = require('./src/middleware/error.middleware');
const { seedConfiguredAccounts } = require('./src/utils/seedAccounts');

const REQUIRED_ENV_VARS = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI'];

const getMissingEnvironment = () => REQUIRED_ENV_VARS.filter((name) => !process.env[name]);

const validateEnvironment = () => {
  const missing = getMissingEnvironment();
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

const getAllowedOrigins = () => {
  if (process.env.CORS_ORIGINS) {
    return process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);
  }
  if (process.env.FRONTEND_URL) {
    return [process.env.FRONTEND_URL];
  }
  return ['http://localhost:5173', 'http://localhost:3000'];
};

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  }
}));

app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api/', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const healthHandler = (req, res) => {
  const missingEnvironment = getMissingEnvironment();
  res.status(missingEnvironment.length > 0 ? 503 : 200).json({
    success: missingEnvironment.length === 0,
    message: missingEnvironment.length === 0 ? 'Server is ready' : 'Server configuration is incomplete',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    missingEnvironment,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to LearnSync AI API',
    version: '1.0.0',
    health: '/health'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use(errorHandler);

const createIndexes = async () => {
  const User = require('./src/models/User');
  const QuizAttempt = require('./src/models/QuizAttempt');
  const LearningActivity = require('./src/models/LearningActivity');

  await Promise.all([
    User.collection.createIndex({ email: 1 }, { unique: true }),
    User.collection.createIndex({ role: 1 }),
    User.collection.createIndex({ status: 1 }),
    User.collection.createIndex({ assignedClass: 1 }),
    QuizAttempt.collection.createIndex({ student: 1, createdAt: -1 }),
    QuizAttempt.collection.createIndex({ quiz: 1, student: 1 }),
    LearningActivity.collection.createIndex({ student: 1, createdAt: -1 }),
    LearningActivity.collection.createIndex({ module: 1, student: 1 })
  ]);
};

let connectionPromise;

const connectDB = async () => {
  validateEnvironment();

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI)
      .then(async (connection) => {
        console.log(`MongoDB Connected: ${connection.connection.host}`);
        await createIndexes();
        return connection.connection;
      })
      .catch((error) => {
        connectionPromise = undefined;
        throw error;
      });
  }

  return connectionPromise;
};

module.exports = {
  app,
  connectDB,
  getMissingEnvironment,
  seedConfiguredAccounts,
  validateEnvironment
};
