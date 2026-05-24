import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import ActivityTimeline from '../components/ActivityTimeline'
import LoadingSpinner from '../components/LoadingSpinner'
import { getRequest, submitRequest } from '../api/requests'
import { useAuth } from '../context/AuthContext'
import { formatDate, formatDateTime, getErrorMessage } from '../utils'
import { STATUS } from '../constants'

export default function RequestDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const fetchRequest = () => {
    setLoading(true)
    getRequest(id)
      .then((res) => setRequest(res.data.data.request))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRequest() }, [id])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await submitRequest(id)
      toast.success('Request submitted for approval')
      fetchRequest()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return (
    <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
  )
  if (!request) return null

  const isOwner = user?.id === request.createdById
  const canSubmit = isOwner && request.status === STATUS.DRAFT

  const fields = [
    { label: 'Item Name', value: request.itemName },
    { label: 'Quantity', value: `${request.quantity} ${request.unit}` },
    { label: 'Department', value: request.department },
    { label: 'Required Date', value: formatDate(request.requiredDate) },
    { label: 'Created By', value: request.createdBy?.name },
    { label: 'Created At', value: formatDateTime(request.createdAt) },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/requests" className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{request.itemName}</h1>
          <p className="text-sm text-gray-500">Request #{request.id.slice(0, 8)}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <PriorityBadge priority={request.priority} />
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Details</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs font-medium text-gray-500">{label}</dt>
              <dd className="mt-0.5 text-sm text-gray-800">{value || '—'}</dd>
            </div>
          ))}
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-gray-500">Reason</dt>
            <dd className="mt-0.5 text-sm text-gray-800">{request.reason}</dd>
          </div>
        </dl>

        {canSubmit && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Audit Trail</h2>
        <ActivityTimeline logs={request.auditLogs || []} />
      </div>
    </div>
  )
}
