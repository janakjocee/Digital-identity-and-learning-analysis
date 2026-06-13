const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Module = require('../models/Module');
const Quiz = require('../models/Quiz');

require('dotenv').config({ path: path.resolve(__dirname, '../../../../backend/.env') });

const classLevels = [8, 9, 10, 11, 12];
const subjects = [
  {
    name: 'Mathematics',
    code: 'MATH',
    color: '#2563eb',
    description: 'Build confidence in numbers, algebra, geometry, statistics, and problem solving.',
    topics: ['Number Systems', 'Algebraic Thinking', 'Geometry and Measurement', 'Statistics and Probability', 'Functions and Modelling']
  },
  {
    name: 'English',
    code: 'ENG',
    color: '#7c3aed',
    description: 'Develop reading, writing, speaking, vocabulary, and critical communication skills.',
    topics: ['Reading for Meaning', 'Creative Writing', 'Grammar in Context', 'Literary Analysis', 'Academic Communication']
  },
  {
    name: 'Science',
    code: 'SCI',
    color: '#059669',
    description: 'Explore biology, chemistry, physics, investigation, and evidence-based reasoning.',
    topics: ['Cells and Living Systems', 'Matter and Reactions', 'Forces and Energy', 'Ecology and Earth Systems', 'Scientific Investigation']
  },
  {
    name: 'Computer Science',
    code: 'CS',
    color: '#0891b2',
    description: 'Learn computational thinking, programming, data, networks, and digital responsibility.',
    topics: ['Computational Thinking', 'Programming Foundations', 'Data and Information', 'Networks and Cybersecurity', 'Software Projects']
  },
  {
    name: 'History',
    code: 'HIST',
    color: '#d97706',
    description: 'Understand change over time through evidence, perspectives, and historical enquiry.',
    topics: ['Using Historical Evidence', 'Societies and Civilisations', 'Conflict and Cooperation', 'Rights and Social Change', 'Independent Historical Enquiry']
  },
  {
    name: 'Geography',
    code: 'GEO',
    color: '#16a34a',
    description: 'Study places, people, environments, sustainability, and geographic investigation.',
    topics: ['Map and Fieldwork Skills', 'Physical Landscapes', 'Population and Settlements', 'Climate and Sustainability', 'Global Connections']
  }
];

const buildQuestions = (subject, topic, classLevel) => [
  {
    type: 'mcq',
    question: `Which statement best describes the main purpose of ${topic}?`,
    options: [
      { text: `To understand and apply key ideas in ${subject.name}`, isCorrect: true, order: 1 },
      { text: 'To memorise facts without using them', isCorrect: false, order: 2 },
      { text: 'To avoid explaining your reasoning', isCorrect: false, order: 3 }
    ],
    explanation: `The topic develops understanding and practical application in ${subject.name}.`,
    points: 1,
    difficulty: 'easy',
    order: 1
  },
  {
    type: 'mcq',
    question: `What is the strongest way for a Class ${classLevel} learner to demonstrate understanding?`,
    options: [
      { text: 'Explain the idea and apply it to a new example', isCorrect: true, order: 1 },
      { text: 'Copy an answer without checking it', isCorrect: false, order: 2 },
      { text: 'Skip the evidence or working', isCorrect: false, order: 3 }
    ],
    explanation: 'Strong learning combines explanation, evidence, and application.',
    points: 1,
    difficulty: 'medium',
    order: 2
  },
  {
    type: 'mcq',
    question: `Which habit is most useful when solving a ${subject.name} challenge?`,
    options: [
      { text: 'Break the challenge into steps and review the result', isCorrect: true, order: 1 },
      { text: 'Choose the first answer without thinking', isCorrect: false, order: 2 },
      { text: 'Ignore feedback', isCorrect: false, order: 3 }
    ],
    explanation: 'A structured process and reflection improve accuracy and understanding.',
    points: 1,
    difficulty: 'medium',
    order: 3
  }
];

const seedCurriculum = async ({ connect = true } = {}) => {
  if (!process.env.MONGODB_URI || !process.env.DEV_ADMIN_EMAIL) {
    throw new Error('MONGODB_URI and DEV_ADMIN_EMAIL are required to seed curriculum.');
  }

  const openedConnection = connect && mongoose.connection.readyState !== 1;
  if (openedConnection) await mongoose.connect(process.env.MONGODB_URI);

  try {
    const admin = await User.findOne({ email: process.env.DEV_ADMIN_EMAIL.toLowerCase() });
    if (!admin) throw new Error('Configured admin account was not found. Run seed:accounts first.');

    for (const [subjectIndex, definition] of subjects.entries()) {
      const subject = await Subject.findOneAndUpdate(
        { code: definition.code },
        {
          $set: {
            ...definition,
            topics: undefined,
            classLevels,
            difficulty: 'intermediate',
            isActive: true,
            order: subjectIndex + 1,
            createdBy: admin._id
          }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      for (const [classIndex, classLevel] of classLevels.entries()) {
        const topic = definition.topics[classIndex];
        const chapterName = `Class ${classLevel}: ${topic}`;
        const chapter = await Chapter.findOneAndUpdate(
          { subject: subject._id, classLevel, name: chapterName },
          {
            $set: {
              description: `A practical introduction to ${topic.toLowerCase()} for Class ${classLevel} ${definition.name}.`,
              order: 1,
              learningObjectives: [
                `Explain the core ideas in ${topic}`,
                `Apply ${topic} to a guided example`,
                'Reflect on progress and identify a next step'
              ],
              estimatedDuration: 45,
              difficulty: classLevel >= 11 ? 'hard' : 'medium',
              isActive: true,
              isPublished: true,
              publishedAt: new Date(),
              createdBy: admin._id
            }
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        const moduleTitle = `${topic}: Learn and Apply`;
        const learningModule = await Module.findOneAndUpdate(
          { chapter: chapter._id, title: moduleTitle },
          {
            $set: {
              description: `A focused lesson with explanation, practice, and reflection for ${topic}.`,
              subject: subject._id,
              order: 1,
              contentBlocks: [
                {
                  type: 'text',
                  title: 'Learning focus',
                  content: `<h2>${topic}</h2><p>This lesson introduces the key ideas, vocabulary, and methods you need for Class ${classLevel} ${definition.name}.</p><p>Read actively, connect each idea to an example, and explain your reasoning in your own words.</p>`,
                  order: 1
                },
                {
                  type: 'text',
                  title: 'Practice and reflect',
                  content: '<p>Choose one idea from the lesson. Create a new example, solve or explain it step by step, then write one question you still have.</p>',
                  order: 2
                }
              ],
              estimatedDuration: 25,
              difficulty: classLevel >= 11 ? 'hard' : 'medium',
              tags: [definition.code.toLowerCase(), `class-${classLevel}`, topic.toLowerCase()],
              isActive: true,
              isPublished: true,
              publishedAt: new Date(),
              completionCriteria: { requireAllContent: true, requireQuiz: true, minQuizScore: 60 },
              createdBy: admin._id
            }
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        let quiz = await Quiz.findOne({ module: learningModule._id });
        if (!quiz) {
          quiz = new Quiz({
            title: `${topic} Checkpoint`,
            description: `Check your understanding of ${topic} for Class ${classLevel}.`,
            instructions: 'Choose the best answer for each question.',
            module: learningModule._id,
            chapter: chapter._id,
            subject: subject._id,
            questions: buildQuestions(definition, topic, classLevel),
            settings: { timeLimit: 10, attemptsAllowed: 3, passingScore: 60 },
            isActive: true,
            isPublished: true,
            publishedAt: new Date(),
            createdBy: admin._id
          });
        } else {
          quiz.set({
            title: `${topic} Checkpoint`,
            description: `Check your understanding of ${topic} for Class ${classLevel}.`,
            module: learningModule._id,
            chapter: chapter._id,
            subject: subject._id,
            isActive: true,
            isPublished: true,
            publishedAt: quiz.publishedAt || new Date()
          });
        }
        await quiz.save();
        learningModule.quiz = quiz._id;
        await learningModule.save();
      }

      const [totalChapters, totalModules, totalQuizzes] = await Promise.all([
        Chapter.countDocuments({ subject: subject._id }),
        Module.countDocuments({ subject: subject._id }),
        Quiz.countDocuments({ subject: subject._id })
      ]);
      await Subject.findByIdAndUpdate(subject._id, {
        $set: {
          'statistics.totalChapters': totalChapters,
          'statistics.totalModules': totalModules,
          'statistics.totalQuizzes': totalQuizzes
        }
      });
    }

    console.log(`Curriculum ready: ${subjects.length} subjects across ${classLevels.length} class levels.`);
  } finally {
    if (openedConnection) await mongoose.disconnect();
  }
};

if (require.main === module) {
  seedCurriculum().catch((error) => {
    console.error(`Failed to seed curriculum: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { seedCurriculum };
