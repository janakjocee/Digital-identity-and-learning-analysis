/**
 * Audit Logs Page (Admin)
 * System audit logs for administrators
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Search,
  Filter,
  Calendar,
  User,
  Shield,
  AlertCircle,
  CheckCircle,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import api from '../../lib/api';

const getActionColor = (action: string) => {
  if (action.includes('approve')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (action.includes('create')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (action.includes('delete') || action.includes('suspend')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (action.includes('login')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
};

const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/admin/audit-logs?limit=100')
      .then((response) => setLogs(response.data.data.logs))
      .catch(() => toast.error('Unable to load audit logs'));
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      (log.user?.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || log.action.includes(filter);
    
    return matchesSearch && matchesFilter;
  });

  const handleExport = () => {
    const header = ['Time', 'User', 'Action', 'Description', 'Entity', 'Status'];
    const rows = filteredLogs.map((log) => [log.timestamp, log.user?.email || 'Unknown', log.action, log.description, log.entityName || log.entityType || '', log.status]);
    const blob = new Blob([[header, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'audit-logs.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Audit logs downloaded');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            <span>Audit Logs</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Track all system activities and user actions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            >
              <option value="all">All Actions</option>
              <option value="login">Login</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="approve">Approve</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Action</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Entity</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <motion.tr
                    key={log._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {log.user?.firstName?.[0] || '?'}{log.user?.lastName?.[0] || ''}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{log.user?.firstName || 'Unknown'} {log.user?.lastName || ''}</p>
                          <p className="text-xs text-slate-500">{log.user?.role || log.userRole}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{log.description}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium">{log.entityName}</p>
                        <p className="text-xs text-slate-500">{log.entityType}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center space-x-1 text-sm ${
                        log.status === 'success' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {log.status === 'success' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        <span className="capitalize">{log.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500">
                      {formatDate(log.timestamp)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
