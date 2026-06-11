const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvironment = [
  'DEV_ADMIN_EMAIL',
  'DEV_STUDENT_EMAIL',
  'DEV_ACCOUNT_PASSWORD'
];

const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);

if (missingEnvironment.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvironment.join(', ')}`);
  process.exit(1);
}

const apiBaseUrl = (process.env.DEV_API_URL || 'http://127.0.0.1:5000/api').replace(/\/$/, '');

const request = async (pathName, options = {}) => {
  const response = await fetch(`${apiBaseUrl}${pathName}`, options);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${pathName} returned ${response.status}: ${body.message || 'Unknown error'}`);
  }

  return body;
};

const verifyAccount = async ({ email, expectedRole, protectedPath }) => {
  const login = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: process.env.DEV_ACCOUNT_PASSWORD })
  });

  const token = login.data.tokens.accessToken;
  const headers = { Authorization: `Bearer ${token}` };
  const currentUser = await request('/auth/me', { headers });

  if (currentUser.data.user.role !== expectedRole || currentUser.data.user.status !== 'approved') {
    throw new Error(`${email} has unexpected role/status: ${currentUser.data.user.role}/${currentUser.data.user.status}`);
  }

  await request(protectedPath, { headers });
  console.log(`verified: ${email} (${expectedRole}) -> ${protectedPath}`);
};

const verifyAccounts = async () => {
  try {
    await verifyAccount({
      email: process.env.DEV_ADMIN_EMAIL,
      expectedRole: 'admin',
      protectedPath: '/admin/dashboard'
    });
    await verifyAccount({
      email: process.env.DEV_STUDENT_EMAIL,
      expectedRole: 'student',
      protectedPath: '/users/dashboard'
    });
    console.log('Authentication API verification passed.');
  } catch (error) {
    console.error(`Authentication API verification failed: ${error.message}`);
    process.exitCode = 1;
  }
};

verifyAccounts();
