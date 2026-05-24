export default function LoadingSpinner({ fullPage = false, size = 'md' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  const spinner = (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600`}
    />
  )
  if (fullPage) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        {spinner}
      </div>
    )
  }
  return <div className="flex items-center justify-center py-8">{spinner}</div>
}
