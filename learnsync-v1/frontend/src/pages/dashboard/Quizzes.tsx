import { BookOpen, Play } from 'lucide-react'

export default function Quizzes() {
  const quizzes = [
    { id: 1, subject: 'Mathematics', topic: 'Algebra', questions: 10, difficulty: 'Medium' },
    { id: 2, subject: 'Science', topic: 'Physics', questions: 15, difficulty: 'Hard' },
    { id: 3, subject: 'English', topic: 'Grammar', questions: 20, difficulty: 'Easy' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Available Quizzes</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{quiz.subject}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{quiz.topic}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
              <span>{quiz.questions} questions</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                quiz.difficulty === 'Easy' ? 'bg-success-100 text-success-600' :
                quiz.difficulty === 'Medium' ? 'bg-warning-100 text-warning-600' :
                'bg-danger-100 text-danger-600'
              }`}>
                {quiz.difficulty}
              </span>
            </div>
            <button className="w-full btn-primary flex items-center justify-center">
              <Play className="w-4 h-4 mr-2" />
              Start Quiz
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}