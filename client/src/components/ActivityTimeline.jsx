import { timeAgo } from '../utils'

const ACTION_COLORS = {
  CREATED: 'bg-gray-400',
  UPDATED: 'bg-yellow-400',
  SUBMITTED: 'bg-blue-500',
  APPROVED: 'bg-green-500',
  REJECTED: 'bg-red-500',
}

export default function ActivityTimeline({ logs = [], loading }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!logs.length) {
    return <p className="text-sm text-gray-500">No recent activity.</p>
  }

  return (
    <ol className="relative border-l border-gray-200 pl-4">
      {logs.map((log, i) => (
        <li key={log.id || i} className="mb-6 ml-4">
          <span
            className={`absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white ${ACTION_COLORS[log.action] || 'bg-gray-400'}`}
          />
          <div className="flex flex-wrap items-baseline gap-1 text-sm">
            <span className="font-medium text-gray-800">
              {log.performedBy?.name || 'Someone'}
            </span>
            <span className="text-gray-500 lowercase">{log.action}</span>
            {log.request?.itemName && (
              <span className="font-medium text-gray-700">"{log.request.itemName}"</span>
            )}
          </div>
          {log.remarks && (
            <p className="mt-0.5 text-xs text-gray-500 italic">"{log.remarks}"</p>
          )}
          <time className="text-xs text-gray-400">{timeAgo(log.createdAt)}</time>
        </li>
      ))}
    </ol>
  )
}
