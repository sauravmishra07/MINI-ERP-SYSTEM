import { useState } from 'react'
import toast from 'react-hot-toast'
import RequestTable from '../components/RequestTable'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import ConfirmationModal from '../components/ConfirmationModal'
import { useRequests } from '../hooks/useRequests'
import { approveRequest, rejectRequest } from '../api/requests'
import { getErrorMessage } from '../utils'
import { STATUS } from '../constants'

export default function ApprovalPage() {
  const { requests, totalPages, page, loading, error, setParams, refetch } = useRequests({
    status: STATUS.SUBMITTED,
    page: 1,
    limit: 10,
  })

  const [modal, setModal] = useState({ open: false, type: null, request: null })
  const [actionLoading, setActionLoading] = useState(false)

  const openModal = (type, request) => setModal({ open: true, type, request })
  const closeModal = () => setModal({ open: false, type: null, request: null })

  const handleConfirm = async (remarks) => {
    const { type, request } = modal
    setActionLoading(true)
    try {
      if (type === 'approve') {
        await approveRequest(request.id, { remarks })
        toast.success('Request approved')
      } else {
        await rejectRequest(request.id, { remarks })
        toast.success('Request rejected')
      }
      closeModal()
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Approval Management</h1>
        <p className="text-sm text-gray-500">Review and act on submitted purchase requests</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!loading && requests.length === 0 ? (
        <EmptyState
          title="No pending requests"
          description="All submitted requests have been reviewed."
        />
      ) : (
        <>
          <RequestTable
            requests={requests}
            loading={loading}
            showActions
            onApprove={(req) => openModal('approve', req)}
            onReject={(req) => openModal('reject', req)}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
          />
        </>
      )}

      <ConfirmationModal
        isOpen={modal.open}
        onClose={closeModal}
        onConfirm={handleConfirm}
        loading={actionLoading}
        showRemarks
        title={modal.type === 'approve' ? 'Approve Request' : 'Reject Request'}
        description={
          modal.request
            ? `Are you sure you want to ${modal.type} "${modal.request.itemName}"?`
            : ''
        }
        confirmLabel={modal.type === 'approve' ? 'Approve' : 'Reject'}
        confirmVariant={modal.type === 'approve' ? 'primary' : 'danger'}
      />
    </div>
  )
}
