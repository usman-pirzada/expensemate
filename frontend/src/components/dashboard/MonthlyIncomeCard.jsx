import { useEffect, useState } from 'react'
import Card, { CardHeader } from '../common/Card'
import Button from '../common/Button'
import { IconCheck, IconClose, IconEdit } from '../common/Icons'
import { createMonthlyIncome, getMonthlyIncome, resetMonthlyIncome } from '../../services/expenseService'
import { formatCurrency } from '../../utils/format'

export default function MonthlyIncomeCard({ year, month, onChanged }) {
  const [income, setIncome] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getMonthlyIncome(year, month)
      setIncome(result)
      if (result) {
        setAmount(String(result.amount))
        setDescription(result.description || '')
      } else {
        setAmount('')
        setDescription('')
      }
    } catch (err) {
      setError(String(err?.message || err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [year, month])

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await createMonthlyIncome(year, month, amount, description || null)
      setEditing(false)
      await load()
      onChanged?.()
    } catch (err) {
      setError(String(err?.message || err))
    } finally {
      setSaving(false)
    }
  }

  const reset = async () => {
    setSaving(true)
    setError(null)
    try {
      await resetMonthlyIncome(year, month)
      setIncome(null)
      setAmount('')
      setDescription('')
      setEditing(false)
      onChanged?.()
    } catch (err) {
      setError(String(err?.message || err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Card className="p-5">Loading monthly income…</Card>

  return (
    <Card className="p-5">
      <CardHeader title="Monthly income" subtitle={income ? 'Recorded and locked' : 'Record your income for this month'} />
      {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p> : null}

      {income && !editing ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-bold tabular-nums text-brand-700 dark:text-brand-400">{formatCurrency(income.amount)}</p>
            {income.description ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{income.description}</p> : null}
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">🔒 Locked after confirmation. Reset the month to replace it.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={reset} disabled={saving}>
            <IconEdit />
            Reset & re-enter
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Amount
            <input
              required
              min="0.01"
              step="0.01"
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900"
              placeholder="120000"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Description <span className="font-normal text-slate-400">(optional)</span>
            <input
              maxLength={255}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900"
              placeholder="Monthly salary"
            />
          </label>
          <div className="flex gap-2">
            {editing ? <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)}><IconClose /> Cancel</Button> : null}
            <Button type="submit" size="sm" disabled={saving}><IconCheck /> Confirm & lock</Button>
          </div>
        </form>
      )}
    </Card>
  )
}
