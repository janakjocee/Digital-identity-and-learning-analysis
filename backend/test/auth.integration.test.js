const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const PORT = 5511;
const API_URL = `http://127.0.0.1:${PORT}/api`;
const PASSWORD = 'IntegrationPass123';

let mongo;
let server;

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, options);
  const body = await response.json();
  return { response, body };
};

const login = async (email) => {
  const { response, body } = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD })
  });

  assert.equal(response.status, 200, JSON.stringify(body));
  return body.data;
};

before(async () => {
  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri('learnsync_auth_test');

  await mongoose.connect(mongoUri);
  const User = require('../src/models/User');

  await User.create([
    {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: PASSWORD,
      role: 'admin',
      status: 'approved',
      emailVerified: true
    },
    {
      firstName: 'Student',
      lastName: 'User',
      email: 'student@test.com',
      password: PASSWORD,
      role: 'student',
      status: 'approved',
      assignedClass: 8,
      emailVerified: true
    }
  ]);
  await mongoose.disconnect();

  server = spawn(process.execPath, ['server.js'], {
    cwd: __dirname + '/..',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(PORT),
      MONGODB_URI: mongoUri,
      JWT_SECRET: 'integration-test-jwt-secret-at-least-32-chars',
      JWT_REFRESH_SECRET: 'integration-test-refresh-secret-at-least-32-chars'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let output = '';
  server.stdout.on('data', (chunk) => { output += chunk; });
  server.stderr.on('data', (chunk) => { output += chunk; });

  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/health`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Backend did not start.\n${output}`);
});

after(async () => {
  if (server && !server.killed) {
    server.kill('SIGTERM');
    await new Promise((resolve) => server.once('exit', resolve));
  }
  await mongo?.stop();
});

test('admin login returns tokens and grants admin dashboard access', async () => {
  const data = await login('admin@test.com');
  assert.equal(data.user.role, 'admin');
  assert.equal(data.user.status, 'approved');
  assert.ok(data.tokens.accessToken);

  const { response } = await request('/admin/dashboard', {
    headers: { Authorization: `Bearer ${data.tokens.accessToken}` }
  });
  assert.equal(response.status, 200);
});

test('approved student login returns tokens and grants student dashboard access', async () => {
  const data = await login('student@test.com');
  assert.equal(data.user.role, 'student');
  assert.equal(data.user.status, 'approved');

  const { response } = await request('/users/dashboard', {
    headers: { Authorization: `Bearer ${data.tokens.accessToken}` }
  });
  assert.equal(response.status, 200);
});

test('new signup succeeds and remains pending for admin approval', async () => {
  const { response, body } = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'New',
      lastName: 'Student',
      email: 'new-student@example.technology',
      password: PASSWORD,
      assignedClass: 9
    })
  });

  assert.equal(response.status, 201, JSON.stringify(body));
  assert.equal(body.data.user.role, 'student');
  assert.equal(body.data.user.status, 'pending');

  const dashboard = await request('/users/dashboard', {
    headers: { Authorization: `Bearer ${body.data.tokens.accessToken}` }
  });
  assert.equal(dashboard.response.status, 403);
});
