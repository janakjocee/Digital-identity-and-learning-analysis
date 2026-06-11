const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/User');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvironment = [
  'MONGODB_URI',
  'DEV_ADMIN_EMAIL',
  'DEV_STUDENT_EMAIL',
  'DEV_ACCOUNT_PASSWORD'
];

const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);

if (missingEnvironment.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvironment.join(', ')}`);
  console.error('Set them in backend/.env or pass them to the seed command.');
  process.exit(1);
}

if (process.env.DEV_ACCOUNT_PASSWORD.length < 8) {
  console.error('DEV_ACCOUNT_PASSWORD must be at least 8 characters.');
  process.exit(1);
}

const upsertAccount = async ({ email, firstName, lastName, role, assignedClass }) => {
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
  user.password = process.env.DEV_ACCOUNT_PASSWORD;
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.approvedAt = user.approvedAt || new Date();

  await user.save();

  const passwordValid = await user.comparePassword(process.env.DEV_ACCOUNT_PASSWORD);
  if (!passwordValid) {
    throw new Error(`Password verification failed for ${email}`);
  }

  console.log(`${action}: ${email} (${role}, approved)`);
};

const seedAccounts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    await upsertAccount({
      email: process.env.DEV_ADMIN_EMAIL.toLowerCase(),
      firstName: process.env.DEV_ADMIN_FIRST_NAME || 'Janak',
      lastName: process.env.DEV_ADMIN_LAST_NAME || 'Joshi',
      role: 'admin'
    });

    await upsertAccount({
      email: process.env.DEV_STUDENT_EMAIL.toLowerCase(),
      firstName: process.env.DEV_STUDENT_FIRST_NAME || 'Janak',
      lastName: process.env.DEV_STUDENT_LAST_NAME || 'Student',
      role: 'student',
      assignedClass: Number(process.env.DEV_STUDENT_CLASS || 8)
    });

    console.log('Development accounts are ready.');
  } catch (error) {
    console.error(`Failed to seed development accounts: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedAccounts();
