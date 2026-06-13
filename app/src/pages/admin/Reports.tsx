import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, FileText, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import api from '../../lib/api';
import { toast } from 'sonner';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const [dateRange, setDateRange] = useState('30');
  const [dashboard, setDashboard] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [dashboardResponse, analyticsResponse] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get(`/admin/analytics?days=${dateRange}`)
        ]);
        setDashboard(dashboardResponse.data.data);
        setAnalytics(analyticsResponse.data.data);
      } catch {
        toast.error('Unable to load platform reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [dateRange]);

  const clusterData = useMemo(() => (analytics?.clusterDistribution || []).map((item: any, index: number) => ({
    name: item._id || 'New',
    value: item.count,
    color: COLORS[index % COLORS.length]
  })), [analytics]);

  const exportCsv = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total students', dashboard?.users?.students || 0],
      ['Active today', dashboard?.activeToday || 0],
      ['Quiz attempts', dashboard?.quizzes?.totalAttempts || 0],
      ['Average quiz score', Math.round(dashboard?.quizzes?.averageScore || 0)],
      ['Subjects', dashboard?.content?.subjects || 0],
      ['Modules', dashboard?.content?.modules || 0],
      ...((analytics?.subjectPerformance || []).map((item: any) => [`${item._id} average score`, Math.round(item.averageScore || 0)]))
    ];
    const blob = new Blob([rows.map((row) => row.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `platform-report-${dateRange}-days.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Platform report downloaded');
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" /></div>;

  const stats = [
    { label: 'Total Students', value: dashboard?.users?.students || 0, icon: Users, color: 'text-blue-600' },
    { label: 'Active Today', value: dashboard?.activeToday || 0, icon: TrendingUp, color: 'text-green-600' },
    { label: 'Quiz Attempts', value: dashboard?.quizzes?.totalAttempts || 0, icon: BarChart3, color: 'text-purple-600' },
    { label: 'Average Score', value: `${Math.round(dashboard?.quizzes?.averageScore || 0)}%`, icon: TrendingUp, color: 'text-orange-600' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><h1 className="flex items-center gap-2 text-2xl font-bold"><FileText className="text-blue-600" />Reports & Analytics</h1><p className="text-slate-500">Live platform performance and engagement data.</p></div>
        <div className="flex gap-3">
          <select value={dateRange} onChange={(event) => setDateRange(event.target.value)} className="h-10 rounded-md border bg-background px-3">
            <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last year</option>
          </select>
          <Button variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
          <Button variant="outline" onClick={() => window.print()}><Download className="mr-2 h-4 w-4" />Print / PDF</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => <Card key={stat.label}><CardContent className="flex items-center justify-between p-6"><div><p className="text-sm text-slate-500">{stat.label}</p><p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p></div><stat.icon className={`h-7 w-7 ${stat.color}`} /></CardContent></Card>)}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Daily Active Users</CardTitle></CardHeader><CardContent><div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={analytics?.dailyActiveUsers || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="_id" fontSize={11} /><YAxis /><Tooltip /><Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} /></LineChart></ResponsiveContainer></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Learning Clusters</CardTitle></CardHeader><CardContent><div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={clusterData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={100}>{clusterData.map((item: any) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Quiz Performance</CardTitle></CardHeader><CardContent><div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={analytics?.quizPerformance || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="_id" fontSize={11} /><YAxis domain={[0, 100]} /><Tooltip /><Line type="monotone" dataKey="averageScore" stroke="#3b82f6" strokeWidth={2} /></LineChart></ResponsiveContainer></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Subject Performance</CardTitle></CardHeader><CardContent><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics?.subjectPerformance || []} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" domain={[0, 100]} /><YAxis dataKey="_id" type="category" width={90} fontSize={11} /><Tooltip /><Bar dataKey="averageScore" fill="#8b5cf6" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>
      </div>
    </div>
  );
}
