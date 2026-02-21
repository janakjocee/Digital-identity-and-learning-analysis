/**
 * Subjects Page (Admin)
 * Content management for administrators
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Plus,
  Search,
  MoreHorizontal,
  BookOpen,
  Layers,
  FileQuestion
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import api from '../../lib/api';
import { toast } from 'sonner';

interface Subject {
  _id: string;
  name: string;
  code: string;
  description?: string;
  color: string;
  classLevels: number[];
  statistics: {
    totalChapters: number;
    totalModules: number;
    totalQuizzes: number;
  };
}

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/content/subjects');
      setSubjects(response.data.data.subjects);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <span>Subjects</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage subjects, chapters, and learning content
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject Name</label>
                  <Input placeholder="e.g., Mathematics" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject Code</label>
                  <Input placeholder="e.g., MATH" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input placeholder="Brief description" />
                </div>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                  Create Subject
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{subjects.length}</p>
            <p className="text-sm text-slate-500">Total Subjects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {subjects.reduce((sum, s) => sum + s.statistics.totalChapters, 0)}
            </p>
            <p className="text-sm text-slate-500">Total Chapters</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {subjects.reduce((sum, s) => sum + s.statistics.totalModules, 0)}
            </p>
            <p className="text-sm text-slate-500">Total Modules</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {subjects.reduce((sum, s) => sum + s.statistics.totalQuizzes, 0)}
            </p>
            <p className="text-sm text-slate-500">Total Quizzes</p>
          </CardContent>
        </Card>
      </div>

      {/* Subjects Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map((subject, index) => (
          <motion.div
            key={subject._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: subject.color }}
                  >
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
                <h3 className="text-xl font-bold mb-1">{subject.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{subject.code}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                  {subject.description || 'No description available'}
                </p>
                <div className="flex items-center space-x-4 text-sm text-slate-500">
                  <div className="flex items-center space-x-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{subject.statistics.totalChapters}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Layers className="w-4 h-4" />
                    <span>{subject.statistics.totalModules}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileQuestion className="w-4 h-4" />
                    <span>{subject.statistics.totalQuizzes}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap gap-2">
                    {subject.classLevels.map(level => (
                      <Badge key={level} variant="secondary">Class {level}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}