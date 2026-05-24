import { STATUS, PRIORITY } from '../constants'

export default function FilterBar({ filters, onChange }) {
  const set = (key, val) => onChange({ ...filters, [key]: val, page: 1 })

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={filters.status || ''}
        onChange={(e) => set('status', e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      >
        <option value="">All Statuses</option>
        {Object.values(STATUS).map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        value={filters.priority || ''}
        onChange={(e) => set('priority', e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      >
        <option value="">All Priorities</option>
        {Object.values(PRIORITY).map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <input
        type="date"
        value={filters.from || ''}
        onChange={(e) => set('from', e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        aria-label="From date"
      />

      <input
        type="date"
        value={filters.to || ''}
        onChange={(e) => set('to', e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        aria-label="To date"
      />

      <button
        onClick={() => onChange({ page: 1 })}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
      >
        Clear
      </button>
    </div>
  )
}
