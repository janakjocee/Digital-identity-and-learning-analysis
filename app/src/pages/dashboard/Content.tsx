import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle, ChevronRight, GraduationCap, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import api from '../../lib/api';
import { toast } from 'sonner';

interface Subject { _id: string; name: string; code: string; color: string; }
interface Chapter { _id: string; name: string; description?: string; subject: Subject; order: number; }
interface ModuleSummary { _id: string; title: string; description?: string; chapter: string; estimatedDuration: number; }
interface ContentBlock { _id: string; title?: string; content?: string; type: string; }
interface ModuleDetail extends ModuleSummary { contentBlocks: ContentBlock[]; }

export default function Content() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [activeModule, setActiveModule] = useState<ModuleDetail | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchContent = async () => {
    try {
      const { data } = await api.get('/content/my-content');
      setSubjects(data.data.subjects);
      setChapters(data.data.chapters);
      setModules(data.data.modules);
      setCompletedIds(data.data.progress.completedModuleIds);
    } catch {
      toast.error('Unable to load learning content');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchContent(); }, []);

  const openModule = async (moduleId: string) => {
    try {
      const { data } = await api.get(`/content/modules/${moduleId}`);
      setActiveModule(data.data.module);
    } catch {
      toast.error('Unable to open this lesson');
    }
  };

  const completeModule = async () => {
    if (!activeModule) return;
    try {
      await api.post(`/content/modules/${activeModule._id}/complete`, { timeSpent: activeModule.estimatedDuration * 60 });
      setCompletedIds((current) => [...new Set([...current, activeModule._id])]);
      toast.success('Lesson completed and progress updated');
    } catch {
      toast.error('Unable to update progress');
    }
  };

  const progress = modules.length ? Math.round((completedIds.length / modules.length) * 100) : 0;
  const continueModule = useMemo(
    () => modules.find((item) => !completedIds.includes(item._id)) || modules[0],
    [modules, completedIds]
  );
  const visibleChapters = selectedSubjectId === 'all'
    ? chapters
    : chapters.filter((chapter) => chapter.subject?._id === selectedSubjectId);

  if (isLoading) return <div className="flex h-96 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center space-x-2 text-2xl font-bold"><BookOpen className="w-6 h-6 text-blue-600" /><span>Learning Content</span></h1>
        <p className="text-slate-500">Explore published subjects and complete lessons for your class.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <Card
            key={subject._id}
            role="button"
            tabIndex={0}
            className={`cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md ${selectedSubjectId === subject._id ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedSubjectId((current) => current === subject._id ? 'all' : subject._id)}
            onKeyDown={(event) => event.key === 'Enter' && setSelectedSubjectId((current) => current === subject._id ? 'all' : subject._id)}
          >
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${subject.color}20` }}>
                <GraduationCap className="w-6 h-6" style={{ color: subject.color }} />
              </div>
              <h3 className="font-bold">{subject.name}</h3>
              <p className="text-sm text-slate-500">{chapters.filter((c) => c.subject?._id === subject._id).length} chapter</p>
              <p className="mt-3 text-xs font-medium text-blue-600">{selectedSubjectId === subject._id ? 'Showing lessons - click to clear' : 'Open subject lessons'}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Chapters and lessons</CardTitle>
            {selectedSubjectId !== 'all' && <Button variant="outline" size="sm" onClick={() => setSelectedSubjectId('all')}>Show all subjects</Button>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {visibleChapters.map((chapter) => {
            const chapterModules = modules.filter((item) => item.chapter === chapter._id);
            return (
              <div key={chapter._id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex gap-2"><Badge style={{ backgroundColor: chapter.subject?.color }}>{chapter.subject?.name}</Badge><Badge variant="secondary">Chapter {chapter.order}</Badge></div>
                    <p className="mt-2 font-semibold">{chapter.name}</p>
                    <p className="text-sm text-slate-500">{chapter.description}</p>
                  </div>
                  <span className="text-sm text-slate-500">{chapterModules.length} lesson</span>
                </div>
                <div className="mt-4 space-y-2">
                  {chapterModules.map((item) => (
                    <div key={item._id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        {completedIds.includes(item._id) ? <CheckCircle className="w-5 h-5 text-green-600" /> : <PlayCircle className="w-5 h-5 text-blue-600" />}
                        <div><p className="font-medium">{item.title}</p><p className="text-xs text-slate-500">{item.estimatedDuration} minutes</p></div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openModule(item._id)}>{completedIds.includes(item._id) ? 'Review' : 'Start'}<ChevronRight className="ml-1 w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {visibleChapters.length === 0 && <p className="py-8 text-center text-slate-500">No published lessons are available for this subject yet.</p>}
        </CardContent>
      </Card>

      {continueModule && (
        <Card>
          <CardHeader><CardTitle>Continue learning</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4">
              <div><p className="font-medium">{continueModule.title}</p><p className="text-sm text-slate-500">{completedIds.length} of {modules.length} lessons complete</p><Progress value={progress} className="mt-2 w-48" /></div>
              <Button onClick={() => openModule(continueModule._id)}>Continue <ChevronRight className="ml-1 w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(activeModule)} onOpenChange={(open) => !open && setActiveModule(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{activeModule?.title}</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500">{activeModule?.description}</p>
          <div className="space-y-4">
            {activeModule?.contentBlocks.map((block) => (
              <div key={block._id} className="rounded-xl border p-4">
                <h3 className="font-semibold">{block.title}</h3>
                <div className="prose prose-sm mt-2 max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: block.content || '' }} />
              </div>
            ))}
          </div>
          <Button onClick={completeModule} disabled={activeModule ? completedIds.includes(activeModule._id) : false}>
            <CheckCircle className="mr-2 w-4 h-4" />{activeModule && completedIds.includes(activeModule._id) ? 'Lesson completed' : 'Mark lesson complete'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
