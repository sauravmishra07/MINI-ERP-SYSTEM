import { Link } from 'react-router-dom'
import { Eye, CheckCircle, XCircle } from 'lucide-react'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'
import { formatDate } from '../utils'
import { STATUS } from '../constants'

export default function RequestTable({
  requests = [],
  loading,
  showActions = false,
  onApprove,
  onReject,
}) {
  if (loading) {
    return (
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {['Item Name', 'Department', 'Priority', 'Status', 'Requested By', 'Required Date', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {[...Array(7)].map((__, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-gray-200" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Item Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Department</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Priority</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Requested By</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Required Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {requests.map((req) => (
            <tr key={req.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-800">{req.itemName}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{req.department}</td>
              <td className="px-4 py-3"><PriorityBadge priority={req.priority} /></td>
              <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
              <td className="px-4 py-3 text-sm text-gray-600">{req.createdBy?.name || '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{formatDate(req.requiredDate)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/requests/${req.id}`}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  {showActions && req.status === STATUS.SUBMITTED && (
                    <>
                      <button
                        onClick={() => onApprove(req)}
                        className="rounded p-1 text-gray-400 hover:bg-green-50 hover:text-green-600"
                        title="Approve"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onReject(req)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Reject"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
