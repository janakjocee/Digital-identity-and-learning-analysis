import { FileText, Download, Calendar } from 'lucide-react'

export default function Reports() {
  const reports = [
    { id: 1, name: 'Student Performance Report', type: 'PDF', generated: '2024-01-15' },
    { id: 2, name: 'At-Risk Students Analysis', type: 'Excel', generated: '2024-01-14' },
    { id: 3, name: 'Quiz Statistics', type: 'PDF', generated: '2024-01-13' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Generate New Report
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <select className="input">
            <option>Select Report Type</option>
            <option>Performance Report</option>
            <option>Risk Analysis</option>
            <option>Quiz Statistics</option>
          </select>
          <input type="date" className="input" />
          <button className="btn-primary flex items-center justify-center">
            <FileText className="w-5 h-5 mr-2" />
            Generate
          </button>
        </div>
      </div>

      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Generated Reports
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {reports.map((report) => (
            <div key={report.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{report.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Generated on {report.generated}
                  </p>
                </div>
              </div>
              <button className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}