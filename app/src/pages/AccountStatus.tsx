import { AlertCircle, Brain, CheckCircle2, Clock3, LogOut, ShieldX } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const statusContent = {
  pending: {
    icon: Clock3,
    title: 'Your account is pending approval',
    description: 'An administrator needs to approve your student account before you can access learning content.',
    className: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30'
  },
  rejected: {
    icon: ShieldX,
    title: 'Your registration was not approved',
    description: 'Please contact an administrator if you believe this was a mistake.',
    className: 'text-red-600 bg-red-100 dark:bg-red-900/30'
  },
  suspended: {
    icon: AlertCircle,
    title: 'Your account is suspended',
    description: 'Please contact an administrator to restore access to your account.',
    className: 'text-red-600 bg-red-100 dark:bg-red-900/30'
  },
  approved: {
    icon: CheckCircle2,
    title: 'Your account is approved',
    description: 'You can now access your learning dashboard.',
    className: 'text-green-600 bg-green-100 dark:bg-green-900/30'
  }
};

export default function AccountStatus() {
  const { user, logout } = useAuth();
  const content = statusContent[user?.status || 'pending'];
  const StatusIcon = content.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold">LearnSync AI</span>
          </div>
          <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${content.className}`}>
            <StatusIcon className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-3">{content.title}</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">{content.description}</p>
          <Button variant="outline" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
