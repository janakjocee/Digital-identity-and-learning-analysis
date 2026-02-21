/**
 * Quizzes Page
 * Quiz management for students
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileQuestion,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  ChevronRight,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import api from '../../lib/api';
import { getScoreColor, formatDate } from '../../lib/utils';

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  questionCount: number;
  settings: {
    timeLimit: number;
    passingScore: number;
  };
  userAttempt?: {
    status: string;
    score: number;
  };
}

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchQuizzes();
    fetchAttempts();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await api.get('/quizzes');
      setQuizzes(response.data.data.quizzes);
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttempts = async () => {
    try {
      const response = await api.get('/quizzes/history/me');
      setAttempts(response.data.data.attempts);
    } catch (error) {
      console.error('Failed to fetch attempts:', error);
    }
  };

  const filteredQuizzes = quizzes.filter(q =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableQuizzes = filteredQuizzes.filter(q => !q.userAttempt || q.userAttempt.status !== 'completed');
  const completedQuizzes = filteredQuizzes.filter(q => q.userAttempt?.status === 'completed');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <FileQuestion className="w-6 h-6 text-blue-600" />
            <span>Quizzes</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Test your knowledge and track your progress
          </p>
        </div>
        <div className="relative w-full lg:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{quizzes.length}</p>
            <p className="text-sm text-slate-500">Total Quizzes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{completedQuizzes.length}</p>
            <p className="text-sm text-slate-500">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{availableQuizzes.length}</p>
            <p className="text-sm text-slate-500">Available</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="available" className="space-y-6">
        <TabsList>
          <TabsTrigger value="available">Available ({availableQuizzes.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedQuizzes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableQuizzes.map((quiz, index) => (
              <motion.div
                key={quiz._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <FileQuestion className="w-6 h-6 text-blue-600" />
                      </div>
                      <Badge variant="secondary">
                        {quiz.questionCount} questions
                      </Badge>
                    </div>
                    <h3 className="font-bold mb-2">{quiz.title}</h3>
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                      {quiz.description || 'Test your knowledge with this quiz'}
                    </p>
                    <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{quiz.settings.timeLimit || 'Unlimited'} min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Pass: {quiz.settings.passingScore}%</span>
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                      <Play className="w-4 h-4 mr-2" />
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {availableQuizzes.length === 0 && (
              <div className="col-span-full text-center py-12">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <p className="text-slate-500">You've completed all available quizzes!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="space-y-4">
            {completedQuizzes.map((quiz, index) => (
              <motion.div
                key={quiz._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          (quiz.userAttempt?.score || 0) >= quiz.settings.passingScore
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          {(quiz.userAttempt?.score || 0) >= quiz.settings.passingScore ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold">{quiz.title}</h3>
                          <p className="text-sm text-slate-500">
                            {quiz.questionCount} questions • {quiz.settings.timeLimit || 'Unlimited'} min
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getScoreColor(quiz.userAttempt?.score || 0)}`}>
                            {Math.round(quiz.userAttempt?.score || 0)}%
                          </p>
                          <p className="text-sm text-slate-500">
                            {(quiz.userAttempt?.score || 0) >= quiz.settings.passingScore ? 'Passed' : 'Failed'}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Retake
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {completedQuizzes.length === 0 && (
              <div className="text-center py-12">
                <FileQuestion className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-500">No completed quizzes yet</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Attempts */}
      {attempts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Attempts</CardTitle>
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
                    {attempts.slice(0, 5).map((attempt: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50">
                        <td className="py-3 px-4">{attempt.quiz?.title || 'Quiz'}</td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${getScoreColor(attempt.score?.percentage || 0)}`}>
                            {Math.round(attempt.score?.percentage || 0)}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            attempt.results?.passed
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {attempt.results?.passed ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500">
                          {formatDate(attempt.completedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}