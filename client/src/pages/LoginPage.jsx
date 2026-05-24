import { useState, useEffect } from 'react'
import { useSearchParams, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ShoppingCart, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { login, register } from '../api/auth'
import { getErrorMessage } from '../utils'
import { ROLES, API_URL } from '../constants'

const ROLE_OPTIONS = [
  { value: ROLES.EMPLOYEE, label: 'Employee' },
  { value: ROLES.MANAGER, label: 'Manager' },
  { value: ROLES.ADMIN, label: 'Admin' },
]

export default function LoginPage() {
  const { user, loading, setUser } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register: formRegister,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { role: ROLES.EMPLOYEE } })

  // Show OAuth error from query param
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) toast.error(decodeURIComponent(error))
  }, [searchParams])

  // Already logged in → go to dashboard
  if (!loading && user) return <Navigate to="/dashboard" replace />

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'))
    reset()
    setShowPassword(false)
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const res =
        mode === 'login'
          ? await login({ email: data.email, password: data.password, role: data.role })
          : await register({ name: data.name, email: data.email, password: data.password, role: data.role })

      setUser(res.data.data.user)
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created successfully!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = (field) =>
    `w-full rounded-lg border px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 ${
      errors[field]
        ? 'border-red-300 focus:border-red-400 focus:ring-red-400'
        : 'border-gray-200 focus:border-indigo-400 focus:ring-indigo-400'
    }`

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-gray-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600">
            <ShoppingCart className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Mini ERP</h1>
          <p className="mt-1 text-sm text-gray-500">Purchase Request Management</p>
        </div>

        {/* Tab switcher */}
        <div className="mb-6 flex rounded-lg border border-gray-200 p-1">
          <button
            type="button"
            onClick={() => mode !== 'login' && switchMode()}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
              mode === 'login'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => mode !== 'register' && switchMode()}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
              mode === 'register'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Name — register only */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                className={inputCls('name')}
                placeholder="Jane Doe"
                {...formRegister('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'At least 2 characters' },
                })}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Company Email</label>
            <input
              type="email"
              className={inputCls('email')}
              placeholder="you@k95foods.com"
              {...formRegister('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
              })}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={inputCls('password')}
                placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
                {...formRegister('password', {
                  required: 'Password is required',
                  minLength:
                    mode === 'register'
                      ? { value: 6, message: 'At least 6 characters' }
                      : undefined,
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {mode === 'login' ? 'Sign in as' : 'Role'}
            </label>
            <select
              className={inputCls('role')}
              {...formRegister('role', { required: 'Role is required' })}
            >
              {ROLE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>}
            {mode === 'login' && (
              <p className="mt-1 text-xs text-gray-400">
                Must match the role assigned to your account.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition"
          >
            {submitting
              ? mode === 'login'
                ? 'Signing in...'
                : 'Creating account...'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Google sign-in */}
        <a
          href={`${API_URL}/api/v1/auth/google`}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {/* Google logo SVG */}
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </a>

        <p className="mt-4 text-center text-xs text-gray-400">
          Only @k95foods.com email addresses are allowed.
        </p>
      </div>
    </div>
  )
}
