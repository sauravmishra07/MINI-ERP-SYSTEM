import { useEffect, useState } from 'react'
import { ClipboardList, Clock, CheckCircle, XCircle } from 'lucide-react'
import DashboardCard from '../components/DashboardCard'
import ActivityTimeline from '../components/ActivityTimeline'
import { getStats, getActivity } from '../api/dashboard'
import { getErrorMessage } from '../utils'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)
  const [statsError, setStatsError] = useState(null)
  const [activityError, setActivityError] = useState(null)

  useEffect(() => {
    getStats()
      .then((res) => setStats(res.data.data))
      .catch((err) => setStatsError(getErrorMessage(err)))
      .finally(() => setStatsLoading(false))

    getActivity()
      .then((res) => setLogs(res.data.data.logs))
      .catch((err) => setActivityError(getErrorMessage(err)))
      .finally(() => setActivityLoading(false))
  }, [])

  const cards = [
    { title: 'Total Requests', key: 'total', icon: ClipboardList, color: 'indigo' },
    { title: 'Pending Review', key: 'pending', icon: Clock, color: 'blue' },
    { title: 'Approved', key: 'approved', icon: CheckCircle, color: 'green' },
    { title: 'Rejected', key: 'rejected', icon: XCircle, color: 'red' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your purchase requests</p>
      </div>

      {statsError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{statsError}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, key, icon, color }) => (
          <DashboardCard
            key={key}
            title={title}
            value={stats?.[key]}
            icon={icon}
            color={color}
            loading={statsLoading}
          />
        ))}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-800">Recent Activity</h2>
        {activityError ? (
          <p className="text-sm text-red-600">{activityError}</p>
        ) : (
          <ActivityTimeline logs={logs} loading={activityLoading} />
        )}
      </div>
    </div>
  )
}
