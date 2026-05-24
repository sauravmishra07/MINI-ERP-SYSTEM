import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  CheckSquare,
  X,
  ShoppingCart,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../constants'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/requests', label: 'Purchase Requests', icon: ClipboardList },
  { to: '/requests/new', label: 'Create Request', icon: PlusCircle },
]

const managerItems = [
  { to: '/approvals', label: 'Approval Management', icon: CheckSquare },
]

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  const isManager = user?.role === ROLES.MANAGER || user?.role === ROLES.ADMIN
  const items = isManager ? [...navItems, ...managerItems] : navItems

  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-100 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-indigo-600" />
            <span className="text-base font-bold text-gray-900">Mini ERP</span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-600 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {items.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink to={to} className={linkCls} onClick={onClose}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info */}
        {user && (
          <div className="border-t border-gray-100 px-4 py-3">
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">{user.name}</p>
                <p className="truncate text-xs text-gray-500">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
