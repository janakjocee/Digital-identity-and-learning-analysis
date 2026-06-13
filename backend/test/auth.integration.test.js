const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../app/server/src/models/User');
const Subject = require('../../app/server/src/models/Subject');
const Chapter = require('../../app/server/src/models/Chapter');
const Module = require('../../app/server/src/models/Module');
const mongoose = User.db.base;

const PORT = 5511;
const API_URL = `http://127.0.0.1:${PORT}/api`;
const PASSWORD = 'IntegrationPass123';

let mongo;
let server;
let moduleId;
let subjectId;
let publishedQuizId;

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
  const [admin] = await User.create([
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
  const subject = await Subject.create({
    name: 'Integration Mathematics',
    code: 'INT-MATH',
    classLevels: [8],
    createdBy: admin._id
  });
  subjectId = subject._id.toString();
  const chapter = await Chapter.create({
    name: 'Integration Chapter',
    subject: subject._id,
    classLevel: 8,
    order: 1,
    isPublished: true,
    isActive: true,
    createdBy: admin._id
  });
  const learningModule = await Module.create({
    title: 'Integration Lesson',
    chapter: chapter._id,
    subject: subject._id,
    order: 1,
    contentBlocks: [{ type: 'text', title: 'Lesson', content: '<p>Test lesson</p>', order: 1 }],
    isPublished: true,
    isActive: true,
    createdBy: admin._id
  });
  moduleId = learningModule._id.toString();
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

test('admin login normalizes email case and whitespace', async () => {
  const { response, body } = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '  ADMIN@TEST.COM  ', password: PASSWORD, portal: 'admin' })
  });
  assert.equal(response.status, 200, JSON.stringify(body));
  assert.equal(body.data.user.role, 'admin');
});

test('student and admin portals reject the wrong account role', async () => {
  const studentOnAdmin = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@test.com', password: PASSWORD, portal: 'admin' })
  });
  assert.equal(studentOnAdmin.response.status, 403);

  const adminOnStudent = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@test.com', password: PASSWORD, portal: 'student' })
  });
  assert.equal(adminOnStudent.response.status, 403);
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

test('student can open and complete a module with live progress metrics', async () => {
  const data = await login('student@test.com');
  const headers = {
    Authorization: `Bearer ${data.tokens.accessToken}`,
    'Content-Type': 'application/json',
    'User-Agent': 'integration-test'
  };

  const opened = await request(`/content/modules/${moduleId}`, { headers });
  assert.equal(opened.response.status, 200, JSON.stringify(opened.body));

  const completed = await request(`/content/modules/${moduleId}/complete`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ timeSpent: 60 })
  });
  assert.equal(completed.response.status, 200, JSON.stringify(completed.body));
  assert.equal(completed.body.data.performanceMetrics.completionRate, 100);

  const content = await request('/content/my-content', { headers });
  assert.equal(content.response.status, 200, JSON.stringify(content.body));
  assert.deepEqual(content.body.data.progress.completedModuleIds, [moduleId]);
});

test('admin can publish a complete learning unit', async () => {
  const data = await login('admin@test.com');
  const { response, body } = await request('/content/learning-units', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${data.tokens.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subject: subjectId,
      classLevel: 8,
      title: 'Published Integration Unit',
      description: 'Created through the admin curriculum workflow',
      lessonContent: '<p>Published lesson content</p>',
      quizQuestion: 'Which option confirms the workflow works?'
    })
  });

  assert.equal(response.status, 201, JSON.stringify(body));
  assert.equal(body.data.chapter.isPublished, true);
  assert.equal(body.data.module.isPublished, true);
  assert.equal(body.data.quiz.isPublished, true);
  publishedQuizId = body.data.quiz._id;
});

test('student can take, complete, and review a published quiz', async () => {
  const data = await login('student@test.com');
  const headers = {
    Authorization: `Bearer ${data.tokens.accessToken}`,
    'Content-Type': 'application/json'
  };
  const quizDetails = await request(`/quizzes/${publishedQuizId}`, { headers });
  assert.equal(quizDetails.response.status, 200, JSON.stringify(quizDetails.body));
  const question = quizDetails.body.data.quiz.questions[0];

  const started = await request(`/quizzes/${publishedQuizId}/start`, { method: 'POST', headers });
  assert.equal(started.response.status, 201, JSON.stringify(started.body));
  const attemptId = started.body.data.attempt._id;

  const answered = await request(`/quizzes/attempts/${attemptId}/answer`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ questionId: question._id, answer: question.options[0]._id, timeSpent: 1 })
  });
  assert.equal(answered.response.status, 200, JSON.stringify(answered.body));

  const completed = await request(`/quizzes/attempts/${attemptId}/complete`, { method: 'POST', headers });
  assert.equal(completed.response.status, 200, JSON.stringify(completed.body));
  assert.equal(completed.body.data.results.score.percentage, 100);

  const reviewed = await request(`/quizzes/attempts/${attemptId}`, { headers });
  assert.equal(reviewed.response.status, 200, JSON.stringify(reviewed.body));
  assert.equal(reviewed.body.data.attempt.status, 'completed');
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
