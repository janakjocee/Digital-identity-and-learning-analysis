import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Target,
  Clock,
  Award,
  AlertTriangle,
  BookOpen,
  Zap
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../utils/api'

interface DashboardData {
  performanceMetrics: {
    overallScore: number
    quizzesTaken: number
    averageScore: number
    streakDays: number
  }
  aiInsights: {
    predictedScore: number
    riskLevel: string
    weakTopics: string[]
    learningCluster: string
    engagementScore: number
  }
  recentQuizzes: Array<{
    id: string
    subject: string
    score: number
    date: string
  }>
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/student/dashboard')
      setData(response.data.data)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const metrics = data?.performanceMetrics
  const insights = data?.aiInsights

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here's your learning progress overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overall Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.overallScore || 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Quizzes Taken</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.quizzesTaken || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.streakDays || 0} days
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/20 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Predicted Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {insights?.predictedScore || 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            AI Insights
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Award className="w-5 h-5 text-primary-600" />
                <span className="text-gray-700 dark:text-gray-300">Learning Cluster</span>
              </div>
              <span className="badge badge-info capitalize">
                {insights?.learningCluster?.replace('_', ' ') || 'New Student'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-primary-600" />
                <span className="text-gray-700 dark:text-gray-300">Engagement Score</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {insights?.engagementScore || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-primary-600" />
                <span className="text-gray-700 dark:text-gray-300">Risk Level</span>
              </div>
              <span className={`badge capitalize ${
                insights?.riskLevel === 'low' ? 'badge-success' :
                insights?.riskLevel === 'medium' ? 'badge-warning' :
                'badge-danger'
              }`}>
                {insights?.riskLevel || 'Low'}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Areas to Focus On
          </h3>
          {insights?.weakTopics && insights.weakTopics.length > 0 ? (
            <div className="space-y-3">
              {insights.weakTopics.slice(0, 5).map((topic, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-danger-50 dark:bg-danger-900/10 rounded-lg"
                >
                  <span className="text-gray-700 dark:text-gray-300">{topic}</span>
                  <span className="text-sm text-danger-600 dark:text-danger-400">Needs Practice</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-success-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Great job! No weak areas identified. Keep up the good work!
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Quizzes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Quizzes
        </h3>
        {data?.recentQuizzes && data.recentQuizzes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3">Subject</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentQuizzes.map((quiz) => (
                  <tr key={quiz.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 text-gray-900 dark:text-white">{quiz.subject}</td>
                    <td className="py-3">
                      <span className={`font-semibold ${
                        quiz.score >= 80 ? 'text-success-600' :
                        quiz.score >= 60 ? 'text-warning-600' :
                        'text-danger-600'
                      }`}>
                        {quiz.score}%
                      </span>
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      {new Date(quiz.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              No quizzes taken yet. Start your learning journey!
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}