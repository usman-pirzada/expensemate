import { useState } from 'react'
import Button from '../common/Button'
import { formatCurrency } from '../../utils/format'

export default function AllocationForm({
  categories,
  overallBudget,
  allocatedTotal,
  excludedCategoryIds = [],
  initial = null,
  onSubmit,
  onClose,
}) {
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const remaining = Math.max(0, Number(overallBudget) - Number(allocatedTotal))

  // Categories already allocated cannot be re-selected when creating.
  const available =
    initial != null
      ? categories
      : categories.filter((category) => !excludedCategoryIds.includes(category.id))

  const submit = async (event) => {
    event.preventDefault()
    const value = Number(amount)
    const nextErrors = {}
    if (!categoryId) nextErrors.category = 'Select a category'
    if (!amount || Number.isNaN(value)) nextErrors.amount = 'Amount is required'
    else if (value <= 0) nextErrors.amount = 'Amount must be greater than zero'
    if (!initial && value > remaining) {
      nextErrors.amount = `Only ${formatCurrency(remaining)} remains unallocated`
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await onSubmit(Number(categoryId), value)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = (hasError) =>
    `w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:ring-2 dark:bg-slate-800 dark:text-slate-100 ${
      hasError
        ? 'border-red-300 focus:border-red-400 focus:ring-red-100 dark:border-red-500/60 dark:focus:ring-red-500/20'
        : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100 dark:border-slate-600 dark:focus:border-brand-400 dark:focus:ring-brand-500/20'
    }`

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        {formatCurrency(allocatedTotal)} allocated · {formatCurrency(remaining)} remaining of{' '}
        {formatCurrency(overallBudget)}
      </div>

      <div>
        <label htmlFor={`alloc-category-${initial?.id ?? 'new'}`} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Category
        </label>
        <select
          id={`alloc-category-${initial?.id ?? 'new'}`}
          value={categoryId}
          disabled={Boolean(initial)}
          onChange={(event) => setCategoryId(event.target.value)}
          className={inputClass(errors.category)}
        >
          <option value="">Select a category…</option>
          {available.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.category ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.category}</p> : null}
      </div>

      <div>
        <label htmlFor="alloc-amount" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Allocation amount
        </label>
        <input
          id="alloc-amount"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          placeholder="0.00"
          autoFocus
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className={inputClass(errors.amount)}
        />
        {errors.amount ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.amount}</p> : null}
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Add allocation'}
        </Button>
      </div>
    </form>
  )
}