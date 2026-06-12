/**
 * LearnSync AI - Backend Server
 * AI-Powered Learning Analytics Platform
 */

require('dotenv').config();

const { app, connectDB } = require('./app');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`LearnSync AI backend running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error(`Backend startup failed: ${error.message}`);
    process.exit(1);
  });

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error.message);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  process.exit(1);
});
