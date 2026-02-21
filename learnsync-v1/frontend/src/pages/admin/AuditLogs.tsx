import { Shield, Search } from 'lucide-react'

export default function AuditLogs() {
  const logs = [
    { id: 1, action: 'USER_LOGIN', user: 'john@example.com', timestamp: '2024-01-15 10:30:00', ip: '192.168.1.1' },
    { id: 2, action: 'QUIZ_COMPLETED', user: 'jane@example.com', timestamp: '2024-01-15 10:25:00', ip: '192.168.1.2' },
    { id: 3, action: 'USER_REGISTERED', user: 'new@example.com', timestamp: '2024-01-15 10:20:00', ip: '192.168.1.3' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search logs..."
          className="input pl-10"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="pb-3 px-6 pt-6">Action</th>
              <th className="pb-3 px-6">User</th>
              <th className="pb-3 px-6">Timestamp</th>
              <th className="pb-3 px-6">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-primary-600" />
                    <span className="text-gray-900 dark:text-white">{log.action}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-gray-900 dark:text-white">{log.user}</td>
                <td className="py-4 px-6 text-gray-600 dark:text-gray-400">{log.timestamp}</td>
                <td className="py-4 px-6 text-gray-600 dark:text-gray-400">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}