const getReferenceId = (reference) => {
  if (!reference) return null;
  if (reference._id) return reference._id.toString();
  return reference.toString();
};

const serializeQuizAttempt = (attempt) => ({
  quizId: getReferenceId(attempt.quiz),
  score: attempt.score?.percentage ?? 0,
  subject: getReferenceId(attempt.quiz?.subject),
  difficulty: attempt.quiz?.difficulty,
  completedAt: attempt.completedAt
});

module.exports = {
  getReferenceId,
  serializeQuizAttempt
};
