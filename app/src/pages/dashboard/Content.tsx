/**
 * Content Page
 * Learning content for students
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  ChevronRight,
  PlayCircle,
  FileText,
  CheckCircle,
  Lock,
  GraduationCap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import api from '../../lib/api';

interface Subject {
  _id: string;
  name: string;
  code: string;
  description?: string;
  color: string;
}

interface Chapter {
  _id: string;
  name: string;
  description?: string;
  subject: Subject;
  order: number;
}

export default function Content() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await api.get('/content/my-content');
      setSubjects(response.data.data.subjects);
      setChapters(response.data.data.chapters);
    } catch (error) {
      console.error('Failed to fetch content:', error);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <span>Learning Content</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Explore subjects and chapters for your class
        </p>
      </div>

      {/* Subjects */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {subjects.map((subject, index) => (
          <motion.div
            key={subject._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="group cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${subject.color}20` }}
                >
                  <GraduationCap className="w-6 h-6" style={{ color: subject.color }} />
                </div>
                <h3 className="font-bold mb-1">{subject.name}</h3>
                <p className="text-sm text-slate-500">{subject.code}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    {chapters.filter(c => c.subject?._id === subject._id).length} chapters
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Chapters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle>Chapters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chapters.map((chapter, index) => (
                <div
                  key={chapter._id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${chapter.subject?.color}20` }}
                    >
                      <span className="font-bold" style={{ color: chapter.subject?.color }}>
                        {chapter.order}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{chapter.name}</p>
                      <p className="text-sm text-slate-500">{chapter.subject?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-sm text-slate-500">
                      <PlayCircle className="w-4 h-4" />
                      <span>5 modules</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Start
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
              {chapters.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No chapters available for your class yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Continue Learning */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <PlayCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium">Introduction to Algebra</p>
                  <p className="text-sm text-slate-500">Mathematics • Chapter 1</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Progress value={65} className="w-32 h-2" />
                    <span className="text-sm text-slate-500">65%</span>
                  </div>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}