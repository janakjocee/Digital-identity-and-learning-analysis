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

const topicKnowledge = {
  MATH: [
    ['Compare rational and irrational numbers using decimal representations.', 'sqrt(2) is irrational because its decimal never terminates or repeats.', 'Which number is irrational?', 'sqrt(2)', ['0.75', '3/5']],
    ['Translate situations into expressions and solve linear equations.', 'For 3x + 5 = 20, subtract 5 and divide by 3 to get x = 5.', 'What is x when 3x + 5 = 20?', '5', ['3', '15']],
    ['Use angle, area, volume, and scale relationships to solve spatial problems.', 'The area of a triangle is one half multiplied by base multiplied by height.', 'What is the area of a triangle with base 8 cm and height 5 cm?', '20 cm²', ['40 cm²', '13 cm²']],
    ['Interpret distributions and calculate probability from data.', 'Probability is favourable outcomes divided by all equally likely outcomes.', 'A fair die is rolled. What is the probability of an even number?', '1/2', ['1/3', '2/3']],
    ['Model change with functions and interpret rates and graphs.', 'The gradient of a linear graph represents its rate of change.', 'In y = 4x + 2, what is the gradient?', '4', ['2', '6']]
  ],
  ENG: [
    ['Infer meaning by combining textual evidence with context.', 'A strong inference cites a precise detail and explains what it suggests.', 'Which response makes the strongest inference?', 'A claim supported by quoted evidence and explanation', ['A personal guess only', 'A copied sentence without explanation']],
    ['Shape narrative voice, imagery, structure, and character for an audience.', 'Specific sensory details help readers imagine a setting.', 'Which technique most vividly establishes setting?', 'Specific sensory imagery', ['A list of unrelated facts', 'Repeated vague adjectives']],
    ['Use sentence structure, punctuation, and vocabulary deliberately.', 'A semicolon can join two closely related independent clauses.', 'Where is a semicolon most appropriate?', 'Between two closely related complete clauses', ['Between a subject and verb', 'Before every quotation']],
    ['Analyse how writers use language, structure, and form to create meaning.', 'Analysis explains both the technique and its effect on the reader.', 'What makes literary analysis convincing?', 'Evidence linked to the writer’s method and effect', ['Plot summary alone', 'An unsupported opinion']],
    ['Communicate a clear academic argument using evidence and accurate referencing.', 'A focused thesis states the central argument that the essay will prove.', 'What is the role of a thesis statement?', 'To state the essay’s central argument', ['To list every source', 'To repeat the title']]
  ],
  SCI: [
    ['Explain how specialised cells and body systems support life.', 'Mitochondria release usable energy through aerobic respiration.', 'Which organelle releases energy through respiration?', 'Mitochondrion', ['Nucleus', 'Cell wall']],
    ['Use particle models and chemical equations to explain reactions.', 'In a closed system, mass is conserved during a chemical reaction.', 'Why is mass conserved in a chemical reaction?', 'Atoms are rearranged rather than created or destroyed', ['All products are gases', 'Energy has mass']],
    ['Describe forces, energy transfers, motion, and electricity quantitatively.', 'Speed is calculated by dividing distance travelled by time taken.', 'A cyclist travels 120 m in 10 s. What is the speed?', '12 m/s', ['1200 m/s', '0.083 m/s']],
    ['Explain interactions between organisms, climate, and Earth systems.', 'Energy enters most ecosystems through photosynthesis by producers.', 'Where does energy enter most food chains?', 'From sunlight captured by producers', ['From decomposers', 'From top predators']],
    ['Plan fair tests, evaluate evidence, and communicate valid conclusions.', 'A fair test changes one independent variable while controlling others.', 'What makes an investigation a fair test?', 'Only the independent variable is deliberately changed', ['Every variable changes', 'The result is predicted correctly']]
  ],
  CS: [
    ['Decompose problems and design precise algorithms.', 'Decomposition breaks a complex problem into smaller manageable parts.', 'What is decomposition?', 'Breaking a problem into smaller parts', ['Encrypting a file', 'Repeating an instruction forever']],
    ['Create programs using sequence, selection, iteration, and functions.', 'Selection allows a program to choose a path based on a condition.', 'Which construct chooses between paths?', 'Selection', ['Sequence', 'Storage']],
    ['Represent, organise, validate, and analyse data responsibly.', 'Validation checks whether input follows rules before it is processed.', 'What does input validation do?', 'Checks that data meets defined rules', ['Guarantees data is true', 'Deletes all duplicates automatically']],
    ['Explain how networks communicate and how systems can be protected.', 'HTTPS encrypts data exchanged between a browser and web server.', 'What is a key benefit of HTTPS?', 'It encrypts data in transit', ['It removes the need for passwords', 'It makes every website trustworthy']],
    ['Plan, build, test, document, and improve a software product.', 'Testing compares actual behaviour with expected behaviour.', 'Why are test cases used?', 'To check actual results against expected results', ['To replace requirements', 'To avoid user feedback']]
  ],
  HIST: [
    ['Evaluate provenance, context, usefulness, and limitations of sources.', 'A source’s provenance includes who created it, when, and why.', 'What does provenance help a historian assess?', 'The origin and purpose of a source', ['Only its spelling', 'Whether it is the oldest source']],
    ['Compare societies using political, economic, social, and cultural evidence.', 'Historical comparison needs consistent criteria and evidence from both societies.', 'What makes a historical comparison fair?', 'Using the same criteria and evidence for both societies', ['Judging only by modern values', 'Using one source for one society']],
    ['Explain causes, consequences, turning points, and differing experiences of conflict.', 'Long-term conditions and short-term triggers can both cause conflict.', 'What is a historical trigger?', 'An event that accelerates existing tensions', ['A consequence many years later', 'A source written by a historian']],
    ['Trace continuity and change in rights, power, and social movements.', 'Continuity refers to aspects that remain similar over time.', 'What does continuity mean in history?', 'Something that remains broadly similar over time', ['A sudden revolution', 'A historian changing their mind']],
    ['Develop an evidence-led enquiry and reach a balanced judgement.', 'A balanced judgement weighs competing evidence before reaching a conclusion.', 'What strengthens an enquiry conclusion?', 'Weighing evidence before making a judgement', ['Ignoring contradictory evidence', 'Using the longest source']]
  ],
  GEO: [
    ['Read maps, use scale, interpret coordinates, and collect fieldwork data.', 'A map scale converts distance on a map into distance on the ground.', 'What does a map scale show?', 'The relationship between map and ground distance', ['Only the map direction', 'The height of every building']],
    ['Explain how tectonic, river, coastal, and weather processes shape landscapes.', 'Erosion wears material away while deposition lays transported material down.', 'What is deposition?', 'The laying down of transported material', ['The breakdown of rock in place', 'The movement of people']],
    ['Analyse population change, migration, urbanisation, and settlement patterns.', 'Push factors encourage people to leave a place; pull factors attract them.', 'Which is a pull factor?', 'More employment opportunities at a destination', ['Conflict at the origin', 'Crop failure at the origin']],
    ['Evaluate climate evidence and strategies for sustainable resource use.', 'Mitigation reduces causes of climate change; adaptation manages impacts.', 'Which action is climate mitigation?', 'Replacing fossil-fuel electricity with renewable energy', ['Building higher flood barriers', 'Creating an evacuation plan']],
    ['Explain trade, development, interdependence, and global inequality.', 'Interdependence means places rely on one another through flows such as trade.', 'What does global interdependence mean?', 'Places rely on each other through global connections', ['Every country produces everything it needs', 'Trade only occurs locally']]
  ]
};

const buildQuestions = (subject, topic, classLevel, knowledge, applied = false) => [
  {
    type: 'mcq',
    question: knowledge[2],
    options: [
      { text: knowledge[3], isCorrect: true, order: 1 },
      { text: knowledge[4][0], isCorrect: false, order: 2 },
      { text: knowledge[4][1], isCorrect: false, order: 3 }
    ],
    explanation: knowledge[1],
    points: 1,
    difficulty: 'easy',
    order: 1
  },
  {
    type: 'mcq',
    question: applied ? `Which approach best applies ${topic} to an unfamiliar Class ${classLevel} problem?` : `Which study action best builds secure understanding of ${topic}?`,
    options: [
      { text: applied ? 'Identify relevant evidence, apply the method, and evaluate the result' : 'Explain the core idea, retrieve it from memory, and practise it', isCorrect: true, order: 1 },
      { text: 'Copy an answer without checking it', isCorrect: false, order: 2 },
      { text: 'Skip the evidence or working', isCorrect: false, order: 3 }
    ],
    explanation: `${topic} is learned securely through accurate explanation, deliberate practice, and reflection.`,
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

const buildLessons = (subject, topic, classLevel, knowledge) => [
  {
    title: `${topic}: Core Concepts`,
    description: `Build secure subject knowledge and vocabulary for ${topic}.`,
    contentBlocks: [
      { type: 'text', title: 'What you will learn', content: `<h2>${topic}</h2><p>${knowledge[0]}</p><p><strong>Key idea:</strong> ${knowledge[1]}</p>`, order: 1 },
      { type: 'text', title: 'Retrieval check', content: `<p>Without looking back, explain the key idea in two sentences. Then create a simple example that demonstrates it in ${subject.name}.</p>`, order: 2 }
    ],
    questions: buildQuestions(subject, topic, classLevel, knowledge, false)
  },
  {
    title: `${topic}: Applied Practice`,
    description: `Apply ${topic} through evidence, reasoning, and an authentic task.`,
    contentBlocks: [
      { type: 'text', title: 'Worked application', content: `<h2>Apply ${topic}</h2><p>Start by identifying what the task asks, select the relevant knowledge, show each reasoning step, and check whether the conclusion is supported.</p><p>${knowledge[1]}</p>`, order: 1 },
      { type: 'text', title: 'Independent challenge', content: `<p>Create or find a real-world example connected to ${topic}. Analyse it using the lesson method, then write a short evaluation of what your answer explains well and what could be improved.</p>`, order: 2 }
    ],
    questions: buildQuestions(subject, topic, classLevel, knowledge, true)
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

        const knowledge = topicKnowledge[definition.code][classIndex];
        for (const [lessonIndex, lesson] of buildLessons(definition, topic, classLevel, knowledge).entries()) {
          const learningModule = await Module.findOneAndUpdate(
            { chapter: chapter._id, order: lessonIndex + 1 },
            {
              $set: {
                title: lesson.title,
                description: lesson.description,
                subject: subject._id,
                contentBlocks: lesson.contentBlocks,
                estimatedDuration: lessonIndex === 0 ? 25 : 35,
                difficulty: classLevel >= 11 ? 'hard' : lessonIndex === 0 ? 'easy' : 'medium',
                tags: [definition.code.toLowerCase(), `class-${classLevel}`, topic.toLowerCase(), lessonIndex === 0 ? 'foundation' : 'application'],
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
          if (!quiz) quiz = new Quiz({ module: learningModule._id, createdBy: admin._id });
          quiz.set({
            title: `${lesson.title} Checkpoint`,
            description: `A Class ${classLevel} ${definition.name} checkpoint based on ${topic}.`,
            instructions: 'Choose the best answer, then use the feedback to decide what to revise.',
            chapter: chapter._id,
            subject: subject._id,
            questions: lesson.questions,
            settings: { timeLimit: 10, attemptsAllowed: 3, passingScore: 60, showExplanation: true },
            isActive: true,
            isPublished: true,
            publishedAt: quiz.publishedAt || new Date()
          });
          await quiz.save();
          learningModule.quiz = quiz._id;
          await learningModule.save();
        }
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
