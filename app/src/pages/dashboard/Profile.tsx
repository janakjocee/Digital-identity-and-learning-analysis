/**
 * Profile Page
 * User profile management
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, Edit2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../contexts/AuthContext';
import { getClusterLabel, getClusterColor, getRiskColor } from '../../lib/utils';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: (user as any)?.phone || '',
    dateOfBirth: (user as any)?.dateOfBirth ? new Date((user as any).dateOfBirth).toISOString().split('T')[0] : ''
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.put('/users/profile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth || undefined
      });
      await refreshUser();
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Manage your personal information and preferences
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <h2 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
              <p className="text-slate-500 capitalize">{user?.role}</p>
              
              {user?.role === 'student' && (
                <div className="mt-4 space-y-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getClusterColor(user?.aiInsights?.learningCluster || 'new')}`}>
                    {getClusterLabel(user?.aiInsights?.learningCluster || 'new')}
                  </span>
                  <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getRiskColor(user?.aiInsights?.riskLevel || 'low')}`}>
                      Risk: {user?.aiInsights?.riskLevel || 'Low'}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
                  <GraduationCap className="w-4 h-4" />
                  <span>Class {user?.assignedClass}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Details Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Personal Information</CardTitle>
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={user?.email}
                    disabled
                    className="pl-10 bg-slate-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10"
                    placeholder="Add phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Stats */}
      {user?.role === 'student' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {Math.round(user?.performanceMetrics?.overallScore || 0)}%
                  </p>
                  <p className="text-sm text-slate-500">Overall Score</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {user?.performanceMetrics?.totalQuizzesTaken || 0}
                  </p>
                  <p className="text-sm text-slate-500">Quizzes Taken</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {Math.round(user?.performanceMetrics?.averageQuizScore || 0)}%
                  </p>
                  <p className="text-sm text-slate-500">Average Score</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">
                    {user?.performanceMetrics?.completionRate || 0}%
                  </p>
                  <p className="text-sm text-slate-500">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}