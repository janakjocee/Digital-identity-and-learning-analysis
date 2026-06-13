import { FormEvent, useEffect, useState } from 'react';
import { BookOpen, FileQuestion, GraduationCap, Layers, Plus, Search } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import api from '../../lib/api';
import { toast } from 'sonner';

interface Subject {
  _id: string; name: string; code: string; description?: string; color: string; classLevels: number[];
  statistics: { totalChapters: number; totalModules: number; totalQuizzes: number; };
}
const classes = [8, 9, 10, 11, 12];

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [unitSubject, setUnitSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '' });
  const [unitForm, setUnitForm] = useState({ classLevel: '8', title: '', description: '', lessonContent: '', quizQuestion: '' });
  const [loading, setLoading] = useState(true);

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/content/subjects');
      setSubjects(data.data.subjects);
    } catch {
      toast.error('Unable to load subjects');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchSubjects(); }, []);

  const createSubject = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.post('/content/subjects', { ...subjectForm, classLevels: classes });
      setSubjectOpen(false);
      setSubjectForm({ name: '', code: '', description: '' });
      await fetchSubjects();
      toast.success('Subject created for Classes 8–12');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to create subject');
    }
  };

  const createUnit = async (event: FormEvent) => {
    event.preventDefault();
    if (!unitSubject) return;
    try {
      await api.post('/content/learning-units', { ...unitForm, subject: unitSubject._id, classLevel: Number(unitForm.classLevel) });
      setUnitSubject(null);
      setUnitForm({ classLevel: '8', title: '', description: '', lessonContent: '', quizQuestion: '' });
      await fetchSubjects();
      toast.success('Published chapter, lesson, and quiz created');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to create learning unit');
    }
  };

  const visible = subjects.filter((subject) => `${subject.name} ${subject.code}`.toLowerCase().includes(search.toLowerCase()));
  const totals = subjects.reduce((sum, subject) => ({
    chapters: sum.chapters + subject.statistics.totalChapters,
    modules: sum.modules + subject.statistics.totalModules,
    quizzes: sum.quizzes + subject.statistics.totalQuizzes
  }), { chapters: 0, modules: 0, quizzes: 0 });

  if (loading) return <div className="flex h-96 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="flex items-center gap-2 text-2xl font-bold"><GraduationCap className="text-blue-600" />Curriculum control</h1><p className="text-slate-500">Create subjects and publish complete learning units for students.</p></div>
        <div className="flex gap-3">
          <div className="relative"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><Input className="pl-9" placeholder="Search subjects" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Dialog open={subjectOpen} onOpenChange={setSubjectOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 w-4 h-4" />Add subject</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Add subject</DialogTitle></DialogHeader>
              <form className="space-y-4" onSubmit={createSubject}>
                <Input required placeholder="Subject name" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} />
                <Input required placeholder="Subject code" value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} />
                <Textarea placeholder="Description" value={subjectForm.description} onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })} />
                <p className="text-sm text-slate-500">The new subject will be available to Classes 8–12.</p>
                <Button className="w-full" type="submit">Create subject</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[['Subjects', subjects.length], ['Chapters', totals.chapters], ['Lessons', totals.modules], ['Quizzes', totals.quizzes]].map(([label, value]) => (
          <Card key={label}><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{value}</p><p className="text-sm text-slate-500">{label}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((subject) => (
          <Card key={subject._id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between"><div className="rounded-xl p-3" style={{ backgroundColor: subject.color }}><GraduationCap className="text-white" /></div><Badge>{subject.code}</Badge></div>
              <h3 className="mt-4 text-xl font-bold">{subject.name}</h3><p className="mt-1 min-h-10 text-sm text-slate-500">{subject.description}</p>
              <div className="my-4 flex justify-between text-sm text-slate-500">
                <span className="flex gap-1"><BookOpen className="w-4 h-4" />{subject.statistics.totalChapters}</span>
                <span className="flex gap-1"><Layers className="w-4 h-4" />{subject.statistics.totalModules}</span>
                <span className="flex gap-1"><FileQuestion className="w-4 h-4" />{subject.statistics.totalQuizzes}</span>
              </div>
              <div className="mb-4 flex flex-wrap gap-1">{subject.classLevels.map((level) => <Badge key={level} variant="secondary">Class {level}</Badge>)}</div>
              <Button className="w-full" variant="outline" onClick={() => setUnitSubject(subject)}><Plus className="mr-2 w-4 h-4" />Add published learning unit</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(unitSubject)} onOpenChange={(open) => !open && setUnitSubject(null)}>
        <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Add {unitSubject?.name} learning unit</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={createUnit}>
            <label className="block text-sm font-medium">Class
              <select className="mt-1 w-full rounded-md border bg-background p-2" value={unitForm.classLevel} onChange={(e) => setUnitForm({ ...unitForm, classLevel: e.target.value })}>{classes.map((level) => <option key={level} value={level}>Class {level}</option>)}</select>
            </label>
            <Input required placeholder="Unit title" value={unitForm.title} onChange={(e) => setUnitForm({ ...unitForm, title: e.target.value })} />
            <Textarea placeholder="Short description" value={unitForm.description} onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })} />
            <Textarea placeholder="Lesson content" value={unitForm.lessonContent} onChange={(e) => setUnitForm({ ...unitForm, lessonContent: e.target.value })} />
            <Input placeholder="Starter quiz question" value={unitForm.quizQuestion} onChange={(e) => setUnitForm({ ...unitForm, quizQuestion: e.target.value })} />
            <p className="text-sm text-slate-500">Publishing creates a chapter, readable lesson, and student quiz together.</p>
            <Button className="w-full" type="submit">Publish learning unit</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
