import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  app,
  connectDB,
  getMissingEnvironment,
  seedConfiguredAccounts
} = require('../server/app');

let accountsSeeded = false;

export default async function handler(req, res) {
  const missingEnvironment = getMissingEnvironment();

  if (missingEnvironment.length > 0) {
    return res.status(503).json({
      success: false,
      message: 'The backend deployment is missing required configuration.',
      missingEnvironment
    });
  }

  try {
    await connectDB();
    if (!accountsSeeded) {
      await seedConfiguredAccounts({ connect: false, required: false });
      accountsSeeded = true;
    }
    return app(req, res);
  } catch (error) {
    console.error('Serverless backend connection failed:', error);
    return res.status(503).json({
      success: false,
      message: 'The backend could not connect to its database. Check MONGODB_URI and network access.'
    });
  }
}
