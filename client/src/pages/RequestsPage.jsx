import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import RequestTable from '../components/RequestTable'
import FilterBar from '../components/FilterBar'
import SearchBar from '../components/SearchBar'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import { useRequests } from '../hooks/useRequests'
import { getExportUrl } from '../api/requests'

export default function RequestsPage() {
  const [search, setSearch] = useState('')
  const { requests, total, totalPages, page, loading, error, params, setParams } = useRequests({ page: 1, limit: 10 })

  const handleSearch = (val) => {
    setSearch(val)
    setParams((p) => ({ ...p, department: val || undefined, page: 1 }))
  }

  const handleFilterChange = (newFilters) => {
    setParams((p) => ({ ...p, ...newFilters }))
  }

  const handlePageChange = (newPage) => {
    setParams((prev) => ({ ...prev, page: newPage }))
  }

  const exportUrl = getExportUrl({
    status: params.status,
    priority: params.priority,
    department: params.department,
    from: params.from,
    to: params.to,
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Purchase Requests</h1>
          <p className="text-sm text-gray-500">{total} total requests</p>
        </div>
        <div className="flex gap-2">
          <a
            href={exportUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
          <Link
            to="/requests/new"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            New Request
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="w-full sm:w-64">
          <SearchBar value={search} onChange={handleSearch} />
        </div>
        <FilterBar filters={params} onChange={handleFilterChange} />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!loading && requests.length === 0 ? (
        <EmptyState
          title="No requests found"
          description="Try adjusting your filters or create a new request."
          action={
            <Link
              to="/requests/new"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create Request
            </Link>
          }
        />
      ) : (
        <>
          <RequestTable requests={requests} loading={loading} />
          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  )
}
