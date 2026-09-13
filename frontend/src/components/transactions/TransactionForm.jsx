import { useEffect, useState } from 'react'
import { toISODate } from '../../utils/format'
import Button from '../common/Button'

export default function TransactionForm({ initial = null, categories = [], onSubmit, onClose, allowIncome = true }) {
  const [type, setType] = useState(initial?.type || 'Expense')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [date, setDate] = useState(initial?.date || toISODate(new Date()))
  const [description, setDescription] = useState(initial?.description || '')
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (type === 'Income') setCategoryId('')
  }, [type])

  const handleTypeSwitch = (nextType) => {
    setType(nextType)
    if (nextType === 'Income') setCategoryId('')
  }

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = {}

    const amountValue = Number(amount)
    if (!amount || Number.isNaN(amountValue)) {
      nextErrors.amount = 'Amount is required'
    } else if (amountValue <= 0) {
      nextErrors.amount = 'Amount must be greater than zero'
    }
    if (!date) nextErrors.date = 'A valid date is required'
    if (type === 'Expense' && !categoryId) nextErrors.category = 'Select a category for this expense'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await onSubmit({
        type,
        amount: amountValue,
        date,
        description: description.trim() || null,
        category_id: type === 'Income' ? null : Number(categoryId),
      })
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
      {allowIncome ? (
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Type</span>
          <div className="grid grid-cols-2 gap-2">
            {['Expense', 'Income'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleTypeSwitch(option)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  type === option
                    ? option === 'Income'
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400/60 dark:bg-brand-500/15 dark:text-brand-300'
                      : 'border-red-300 bg-red-50 text-red-700 dark:border-red-400/60 dark:bg-red-500/15 dark:text-red-300'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="tx-amount" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Amount</label>
          <input id="tx-amount" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" value={amount} autoFocus onChange={(event) => setAmount(event.target.value)} className={inputClass(errors.amount)} />
          {errors.amount ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.amount}</p> : null}
        </div>
        <div>
          <label htmlFor="tx-date" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Date</label>
          <input id="tx-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className={inputClass(errors.date)} />
          {errors.date ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.date}</p> : null}
        </div>
      </div>

      {type === 'Expense' ? (
        <div>
          <label htmlFor="tx-category" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Category</label>
          <select id="tx-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={inputClass(errors.category)}>
            <option value="">Select a category…</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          {errors.category ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.category}</p> : null}
        </div>
      ) : (
        <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">Income transactions do not have a category.</p>
      )}

      <div>
        <label htmlFor="tx-description" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Description <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span></label>
        <input id="tx-description" type="text" maxLength={255} placeholder="e.g. Groceries" value={description} onChange={(event) => setDescription(event.target.value)} className={inputClass(false)} />
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : initial ? 'Save changes' : type === 'Expense' ? 'Add expense' : 'Add income'}</Button>
      </div>
    </form>
  )
}