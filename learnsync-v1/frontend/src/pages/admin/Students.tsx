import { useEffect, useState } from 'react'
import { Users, Search, Filter, CheckCircle, XCircle } from 'lucide-react'
import api from '../../utils/api'

interface Student {
  _id: string
  firstName: string
  lastName: string
  email: string
  status: string
  grade: number
  aiInsights: {
    riskLevel: string
    learningCluster: string
  }
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await api.get('/admin/students')
      setStudents(response.data.data.students)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/admin/students/${id}/approve`)
      fetchStudents()
    } catch (error) {
      console.error('Error approving student:', error)
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Users className="w-5 h-5" />
          <span>{students.length} total</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="pb-3 px-6 pt-6">Name</th>
              <th className="pb-3 px-6">Grade</th>
              <th className="pb-3 px-6">Status</th>
              <th className="pb-3 px-6">Risk Level</th>
              <th className="pb-3 px-6">Cluster</th>
              <th className="pb-3 px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student._id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-4 px-6">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                  </div>
                </td>
                <td className="py-4 px-6 text-gray-900 dark:text-white">Class {student.grade}</td>
                <td className="py-4 px-6">
                  <span className={`badge capitalize ${
                    student.status === 'active' ? 'badge-success' :
                    student.status === 'pending' ? 'badge-warning' :
                    'badge-danger'
                  }`}>
                    {student.status}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className={`badge capitalize ${
                    student.aiInsights?.riskLevel === 'low' ? 'badge-success' :
                    student.aiInsights?.riskLevel === 'medium' ? 'badge-warning' :
                    'badge-danger'
                  }`}>
                    {student.aiInsights?.riskLevel || 'Low'}
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-600 dark:text-gray-400 capitalize">
                  {student.aiInsights?.learningCluster?.replace('_', ' ') || 'New'}
                </td>
                <td className="py-4 px-6">
                  {student.status === 'pending' && (
                    <button
                      onClick={() => handleApprove(student._id)}
                      className="p-2 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors"
                      title="Approve"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No students found</p>
          </div>
        )}
      </div>
    </div>
  )
}