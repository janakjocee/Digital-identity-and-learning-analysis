const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/User');

require('dotenv').config({ path: path.resolve(__dirname, '../../../../backend/.env') });

const requiredEnvironment = [
  'MONGODB_URI',
  'DEV_ADMIN_EMAIL',
  'DEV_STUDENT_EMAIL'
];

const getAccountPassword = (role) => (
  process.env[role === 'admin' ? 'DEV_ADMIN_PASSWORD' : 'DEV_STUDENT_PASSWORD']
  || process.env.DEV_ACCOUNT_PASSWORD
);

const getMissingEnvironment = () => [
  ...requiredEnvironment.filter((name) => !process.env[name]),
  ...(!getAccountPassword('admin') ? ['DEV_ADMIN_PASSWORD or DEV_ACCOUNT_PASSWORD'] : []),
  ...(!getAccountPassword('student') ? ['DEV_STUDENT_PASSWORD or DEV_ACCOUNT_PASSWORD'] : [])
];

const upsertAccount = async ({ email, firstName, lastName, role, assignedClass, password }) => {
  let user = await User.findOne({ email }).select('+password');
  const action = user ? 'updated' : 'created';

  if (!user) {
    user = new User({ email, firstName, lastName, role, assignedClass });
  }

  user.firstName = firstName;
  user.lastName = lastName;
  user.role = role;
  user.status = 'approved';
  user.emailVerified = true;
  user.assignedClass = role === 'student' ? assignedClass : undefined;
  user.password = password;
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.approvedAt = user.approvedAt || new Date();

  await user.save();

  const passwordValid = await user.comparePassword(password);
  if (!passwordValid) {
    throw new Error(`Password verification failed for ${email}`);
  }

  console.log(`${action}: ${email} (${role}, approved)`);
};

const seedConfiguredAccounts = async ({ connect = true, required = true } = {}) => {
  const missingEnvironment = getMissingEnvironment();
  if (missingEnvironment.length > 0) {
    if (required) {
      throw new Error(`Missing required environment variables: ${missingEnvironment.join(', ')}`);
    }
    return false;
  }

  const adminPassword = getAccountPassword('admin');
  const studentPassword = getAccountPassword('student');
  if (adminPassword.length < 8 || studentPassword.length < 8) {
    throw new Error('Configured account passwords must be at least 8 characters.');
  }

  const openedConnection = connect && mongoose.connection.readyState !== 1;
  if (openedConnection) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  try {
    await upsertAccount({
      email: process.env.DEV_ADMIN_EMAIL.toLowerCase(),
      firstName: process.env.DEV_ADMIN_FIRST_NAME || 'Janak',
      lastName: process.env.DEV_ADMIN_LAST_NAME || 'Joshi',
      role: 'admin',
      password: adminPassword
    });

    await upsertAccount({
      email: process.env.DEV_STUDENT_EMAIL.toLowerCase(),
      firstName: process.env.DEV_STUDENT_FIRST_NAME || 'Janak',
      lastName: process.env.DEV_STUDENT_LAST_NAME || 'Student',
      role: 'student',
      assignedClass: Number(process.env.DEV_STUDENT_CLASS || 8),
      password: studentPassword
    });

    console.log('Configured accounts are ready.');
    return true;
  } finally {
    if (openedConnection) {
      await mongoose.disconnect();
    }
  }
};

if (require.main === module) {
  seedConfiguredAccounts()
    .catch((error) => {
      console.error(`Failed to seed development accounts: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = { seedConfiguredAccounts };
