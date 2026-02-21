import { BookOpen, Plus } from 'lucide-react'

export default function Subjects() {
  const subjects = [
    { id: 1, name: 'Mathematics', chapters: 15, quizzes: 45 },
    { id: 2, name: 'Science', chapters: 12, quizzes: 36 },
    { id: 3, name: 'English', chapters: 10, quizzes: 30 },
    { id: 4, name: 'Social Studies', chapters: 8, quizzes: 24 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subjects</h1>
        <button className="btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Add Subject
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <div key={subject.id} className="card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{subject.name}</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>{subject.chapters} Chapters</p>
              <p>{subject.quizzes} Quizzes</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}