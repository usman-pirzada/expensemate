import { useState } from 'react'
import Button from '../common/Button'

export default function BudgetForm({ initial = null, periodLabel, onSubmit, onClose }) {
  const [amount, setAmount] = useState(initial ? String(initial.overall_amount) : '')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    const value = Number(amount)
    const nextErrors = {}
    if (!amount || Number.isNaN(value)) nextErrors.amount = 'Overall amount is required'
    else if (value <= 0) nextErrors.amount = 'Amount must be greater than zero'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await onSubmit(value)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = errors.amount
    ? 'w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-red-500/60 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-red-500/20'
    : 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-brand-400 dark:focus:ring-brand-500/20'

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Month: <span className="font-medium text-slate-700 dark:text-slate-200">{periodLabel}</span>
      </p>
      <div>
        <label htmlFor="budget-amount" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Overall monthly budget
        </label>
        <input
          id="budget-amount"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          placeholder="0.00"
          autoFocus
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className={inputClass}
        />
        {errors.amount ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.amount}</p> : null}
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Create budget'}
        </Button>
      </div>
    </form>
  )
}