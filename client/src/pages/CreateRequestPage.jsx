import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { createRequest } from '../api/requests'
import { PRIORITY } from '../constants'
import { getErrorMessage } from '../utils'

export default function CreateRequestPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (data) => {
    try {
      await createRequest({
        ...data,
        quantity: Number(data.quantity),
        requiredDate: new Date(data.requiredDate).toISOString(),
      })
      toast.success('Purchase request created successfully')
      navigate('/requests')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const inputCls = (field) =>
    `w-full rounded-lg border px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 ${
      errors[field]
        ? 'border-red-300 focus:border-red-400 focus:ring-red-400'
        : 'border-gray-200 focus:border-indigo-400 focus:ring-indigo-400'
    }`

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Create Purchase Request</h1>
        <p className="text-sm text-gray-500">Fill in the details below to submit a new request.</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-5"
        noValidate
      >
        {/* Item Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="itemName">
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            id="itemName"
            type="text"
            className={inputCls('itemName')}
            placeholder="e.g. Office chairs"
            {...register('itemName', { required: 'Item name is required' })}
          />
          {errors.itemName && <p className="mt-1 text-xs text-red-600">{errors.itemName.message}</p>}
        </div>

        {/* Quantity + Unit */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="quantity">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              className={inputCls('quantity')}
              placeholder="10"
              {...register('quantity', {
                required: 'Quantity is required',
                min: { value: 1, message: 'Must be greater than 0' },
              })}
            />
            {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="unit">
              Unit <span className="text-red-500">*</span>
            </label>
            <input
              id="unit"
              type="text"
              className={inputCls('unit')}
              placeholder="pcs, kg, litre..."
              {...register('unit', { required: 'Unit is required' })}
            />
            {errors.unit && <p className="mt-1 text-xs text-red-600">{errors.unit.message}</p>}
          </div>
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="department">
            Department <span className="text-red-500">*</span>
          </label>
          <input
            id="department"
            type="text"
            className={inputCls('department')}
            placeholder="e.g. Operations"
            {...register('department', { required: 'Department is required' })}
          />
          {errors.department && <p className="mt-1 text-xs text-red-600">{errors.department.message}</p>}
        </div>

        {/* Required Date + Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="requiredDate">
              Required Date <span className="text-red-500">*</span>
            </label>
            <input
              id="requiredDate"
              type="date"
              className={inputCls('requiredDate')}
              {...register('requiredDate', {
                required: 'Required date is required',
                validate: (v) =>
                  new Date(v) > new Date() || 'Date must be in the future',
              })}
            />
            {errors.requiredDate && <p className="mt-1 text-xs text-red-600">{errors.requiredDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="priority">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              id="priority"
              className={inputCls('priority')}
              {...register('priority', { required: 'Priority is required' })}
            >
              <option value="">Select priority</option>
              {Object.values(PRIORITY).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {errors.priority && <p className="mt-1 text-xs text-red-600">{errors.priority.message}</p>}
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="reason">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reason"
            rows={4}
            className={inputCls('reason')}
            placeholder="Describe why this purchase is needed (min. 10 characters)"
            {...register('reason', {
              required: 'Reason is required',
              minLength: { value: 10, message: 'Reason must be at least 10 characters' },
            })}
          />
          {errors.reason && <p className="mt-1 text-xs text-red-600">{errors.reason.message}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/requests')}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Creating...' : 'Create Request'}
          </button>
        </div>
      </form>
    </div>
  )
}
