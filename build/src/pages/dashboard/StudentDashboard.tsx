/**
 * Student Dashboard
 * Main dashboard for students
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Target,
  Clock,
  Award,
  BookOpen,
  Calendar,
  Zap,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import {
  formatNumber,
  getScoreColor,
  getRiskColor,
  getClusterColor,
  getClusterLabel,
  truncateText
} from '../../lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface DashboardData {
  user: any;
  performance: {
    quizStats: {
      totalQuizzes: number;
      averageScore: number;
      highestScore: number;
      totalTimeSpent: number;
    };
    weeklyActivity: any[];
    subjectPerformance: any[];
    recentQuizzes: any[];
  };
  aiInsights: {
    predictedPerformance: number;
    riskLevel: string;
    learningCluster: string;
    weakTopics: any[];
    recommendations: any[];
  };
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/users/dashboard');
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const stats = [
    {
      title: 'Average Score',
      value: `${Math.round(data?.performance?.quizStats?.averageScore || 0)}%`,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      title: 'Quizzes Taken',
      value: formatNumber(data?.performance?.quizStats?.totalQuizzes || 0),
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      title: 'Study Time',
      value: `${Math.round((data?.performance?.quizStats?.totalTimeSpent || 0) / 60)}h`,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      title: 'Completion Rate',
      value: `${user?.performanceMetrics?.completionRate || 0}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    }
  ];

  // Prepare chart data
  const scoreTrendData = data?.performance?.recentQuizzes?.slice(0, 10).reverse().map((q: any) => ({
    date: new Date(q.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: Math.round(q.score?.percentage || 0)
  })) || [];

  const subjectRadarData = data?.performance?.subjectPerformance?.slice(0, 6).map((s: any) => ({
    subject: s.subjectCode || s.subjectName?.slice(0, 10),
    score: Math.round(s.averageScore || 0),
    fullMark: 100
  })) || [];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Here's your learning progress and AI insights
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {user?.status === 'pending' && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Account pending approval</span>
            </div>
          )}
          <Button variant="outline" className="hidden sm:flex">
            <Calendar className="w-4 h-4 mr-2" />
            View Schedule
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* AI Insights & Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span>AI Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Predicted Performance */}
              <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Predicted Next Score</p>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-blue-600">
                    {Math.round(data?.aiInsights?.predictedPerformance || 0)}%
                  </span>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
              </div>

              {/* Risk Level */}
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Risk Level</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getRiskColor(data?.aiInsights?.riskLevel || 'low')}`}>
                  {data?.aiInsights?.riskLevel || 'Low'}
                </span>
              </div>

              {/* Learning Cluster */}
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Learning Profile</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getClusterColor(data?.aiInsights?.learningCluster || 'new')}`}>
                  {getClusterLabel(data?.aiInsights?.learningCluster || 'new')}
                </span>
              </div>

              {/* Weak Topics */}
              {data?.aiInsights?.weakTopics?.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Focus Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {data.aiInsights.weakTopics.slice(0, 3).map((topic: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-lg"
                      >
                        {topic.subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Score Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Score Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Subject Performance & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Radar Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Subject Mastery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={subjectRadarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.3}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-purple-500" />
                <span>Recommended for You</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.aiInsights?.recommendations?.slice(0, 4).map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{rec.title || 'Recommended Module'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {truncateText(rec.description || 'Continue your learning journey', 60)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
                {(!data?.aiInsights?.recommendations || data.aiInsights.recommendations.length === 0) && (
                  <p className="text-center text-slate-500 py-4">
                    Complete more quizzes to get personalized recommendations
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Quizzes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Quizzes</CardTitle>
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Quiz</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Score</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.performance?.recentQuizzes?.slice(0, 5).map((quiz: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50">
                      <td className="py-3 px-4">{quiz.quiz?.title || 'Quiz'}</td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${getScoreColor(quiz.score?.percentage || 0)}`}>
                          {Math.round(quiz.score?.percentage || 0)}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          quiz.results?.passed
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {quiz.results?.passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {new Date(quiz.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {(!data?.performance?.recentQuizzes || data.performance.recentQuizzes.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        No quizzes taken yet. Start learning to see your progress!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}