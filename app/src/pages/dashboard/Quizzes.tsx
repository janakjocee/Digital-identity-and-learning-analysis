import { useEffect, useState } from 'react';
import { CheckCircle, Clock, FileQuestion, Play, Search, Trophy } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import api from '../../lib/api';
import { toast } from 'sonner';

interface Option { _id?: string; text: string; order: number; }
interface Question { _id: string; question: string; options: Option[]; }
interface Quiz {
  _id: string; title: string; description?: string; questionCount: number;
  settings: { timeLimit: number; passingScore: number; attemptsAllowed: number };
  questions?: Question[];
  subject?: { name: string };
  userAttempt?: { status: string; score: number };
}

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [search, setSearch] = useState('');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [attemptId, setAttemptId] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: { percentage: number }; passed: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuizzes = async () => {
    try {
      const { data } = await api.get('/quizzes');
      setQuizzes(data.data.quizzes);
    } catch {
      toast.error('Unable to load quizzes');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchQuizzes(); }, []);

  const startQuiz = async (quizId: string) => {
    try {
      const [{ data: quizData }, { data: attemptData }] = await Promise.all([
        api.get(`/quizzes/${quizId}`),
        api.post(`/quizzes/${quizId}/start`)
      ]);
      setActiveQuiz(quizData.data.quiz);
      setAttemptId(attemptData.data.attempt._id);
      setAnswers({});
      setResult(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to start quiz');
    }
  };

  const submitQuiz = async () => {
    if (!activeQuiz || !attemptId || !activeQuiz.questions) return;
    if (Object.keys(answers).length !== activeQuiz.questions.length) {
      toast.error('Please answer every question before submitting');
      return;
    }
    try {
      for (const question of activeQuiz.questions) {
        await api.post(`/quizzes/attempts/${attemptId}/answer`, { questionId: question._id, answer: answers[question._id], timeSpent: 10 });
      }
      const { data } = await api.post(`/quizzes/attempts/${attemptId}/complete`);
      setResult(data.data.results);
      await fetchQuizzes();
      toast.success('Quiz completed and your live record was updated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to submit quiz');
    }
  };

  const visible = quizzes.filter((quiz) => quiz.title.toLowerCase().includes(search.toLowerCase()));
  const completed = quizzes.filter((quiz) => quiz.userAttempt?.status === 'completed');

  if (loading) return <div className="flex h-96 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="flex items-center gap-2 text-2xl font-bold"><FileQuestion className="text-blue-600" />Quizzes</h1><p className="text-slate-500">Complete class-specific checkpoints and update your live learning record.</p></div>
        <div className="relative"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quizzes" className="pl-9" /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{quizzes.length}</p><p className="text-sm text-slate-500">Class quizzes</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{completed.length}</p><p className="text-sm text-slate-500">Completed</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{quizzes.length - completed.length}</p><p className="text-sm text-slate-500">Available</p></CardContent></Card>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((quiz) => (
          <Card key={quiz._id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between"><div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/30"><FileQuestion className="text-blue-600" /></div><Badge>{quiz.subject?.name || `${quiz.questionCount} questions`}</Badge></div>
              <h3 className="mt-4 font-bold">{quiz.title}</h3><p className="mt-1 text-sm text-slate-500">{quiz.description}</p>
              <div className="my-4 flex justify-between text-sm text-slate-500"><span className="flex gap-1"><Clock className="w-4 h-4" />{quiz.settings.timeLimit || 'Unlimited'} min</span><span>Pass {quiz.settings.passingScore}%</span></div>
              <Button className="w-full" onClick={() => startQuiz(quiz._id)}><Play className="mr-2 w-4 h-4" />{quiz.userAttempt?.status === 'completed' ? `Review score: ${quiz.userAttempt.score}%` : 'Start quiz'}</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(activeQuiz)} onOpenChange={(open) => !open && setActiveQuiz(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{activeQuiz?.title}</DialogTitle></DialogHeader>
          {result ? (
            <div className="py-8 text-center"><Trophy className="mx-auto h-16 w-16 text-amber-500" /><p className="mt-4 text-4xl font-bold">{result.score.percentage}%</p><p className="text-slate-500">{result.passed ? 'Passed. Great work!' : 'Keep learning and try again.'}</p><Button className="mt-6" onClick={() => setActiveQuiz(null)}>Return to quizzes</Button></div>
          ) : (
            <div className="space-y-6">
              {activeQuiz?.questions?.map((question, index) => (
                <div key={question._id} className="rounded-xl border p-4">
                  <p className="font-semibold">{index + 1}. {question.question}</p>
                  <div className="mt-3 space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <label key={option._id || optionIndex} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <input
                          type="radio"
                          name={question._id}
                          value={option._id || ''}
                          checked={answers[question._id] === option._id}
                          onChange={() => setAnswers((current) => ({ ...current, [question._id]: option._id || '' }))}
                        />
                        <span>{option.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <Button className="w-full" onClick={submitQuiz}><CheckCircle className="mr-2 w-4 h-4" />Submit quiz</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
