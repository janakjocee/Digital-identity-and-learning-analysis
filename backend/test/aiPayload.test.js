const test = require('node:test');
const assert = require('node:assert/strict');
const { serializeQuizAttempt } = require('../src/utils/aiPayload');

test('serializes a populated quiz attempt for the AI service contract', () => {
  const completedAt = new Date('2026-06-11T10:00:00.000Z');
  const result = serializeQuizAttempt({
    quiz: {
      _id: 'quiz-123',
      subject: { _id: 'subject-456' },
      difficulty: 'medium'
    },
    score: { percentage: 84 },
    completedAt
  });

  assert.deepEqual(result, {
    quizId: 'quiz-123',
    score: 84,
    subject: 'subject-456',
    difficulty: 'medium',
    completedAt
  });
});

test('serializes an unpopulated quiz reference and safe score default', () => {
  const result = serializeQuizAttempt({
    quiz: { toString: () => 'quiz-789' },
    completedAt: null
  });

  assert.equal(result.quizId, 'quiz-789');
  assert.equal(result.score, 0);
  assert.equal(result.subject, null);
});
