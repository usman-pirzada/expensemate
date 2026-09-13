import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCategories, getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../services/expenseService'
import useRequest from '../hooks/useRequest'
import { useMonth } from '../context/MonthContext'
import { formatCurrency } from '../utils/format'
import Card from '../components/common/Card'
import StatCard from '../components/common/StatCard'
import EmptyState from '../components/common/EmptyState'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import TransactionForm from '../components/transactions/TransactionForm'
import TransactionTable from '../components/transactions/TransactionTable'
import { IconList, IconPlus } from '../components/common/Icons'

export default function Transactions() {
  const { year, month, label } = useMonth()
  const [searchParams, setSearchParams] = useSearchParams()

  const categoriesRequest = useRequest(() => getCategories(), [])
  const transactionsRequest = useRequest(() => getTransactions(year, month), [year, month])

  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [message, setMessage] = useState(null)

  const transactions = transactionsRequest.data || []

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null)
      setFormOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const categoryName = useMemo(() => {
    const map = new Map()
    for (const category of categoriesRequest.data || []) map.set(category.id, category.name)
    return (id) => map.get(id) || `Category ${id}`
  }, [categoriesRequest.data])

  const totals = useMemo(() => {
    let income = 0
    let spending = 0
    for (const transaction of transactions) {
      if (transaction.type === 'Income') income += Number(transaction.amount)
      else spending += Number(transaction.amount)
    }
    return { income, spending, balance: income - spending }
  }, [transactions])

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (transaction) => {
    if (transaction.type === 'Income') {
      setMessage({ tone: 'error', text: 'Monthly income is locked. Reset the month from the Dashboard to replace it.' })
      return
    }
    setEditing(transaction)
    setFormOpen(true)
  }

  const handleSubmit = async (payload) => {
    setMessage(null)
    try {
      if (editing) {
        await updateTransaction(editing.id, payload)
        transactionsRequest.reload()
        setFormOpen(false)
        setMessage({ tone: 'success', text: 'Expense updated.' })
      } else {
        await createTransaction({ ...payload, type: 'Expense' })
        transactionsRequest.reload()
        setFormOpen(false)
        setMessage({ tone: 'success', text: 'Expense added.' })
      }
    } catch (error) {
      setMessage({ tone: 'error', text: String(error?.message || error) })
      setFormOpen(false)
    }
  }

  const handleDelete = async (transaction) => {
    setMessage(null)
    if (transaction.type === 'Income') {
      setMessage({ tone: 'error', text: 'Monthly income is locked. Reset the month from the Dashboard to remove it.' })
      return
    }
    try {
      await deleteTransaction(transaction.id)
      transactionsRequest.reload()
      setMessage({ tone: 'success', text: 'Expense deleted.' })
    } catch (error) {
      setMessage({ tone: 'error', text: String(error?.message || error) })
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {message ? (
        <div className={`rounded-lg border px-4 py-3 text-sm ${message.tone === 'error' ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-300' : 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-400/40 dark:bg-brand-500/10 dark:text-brand-300'}`}>
          {message.text}
          <button type="button" className="ml-2 font-medium underline" onClick={() => setMessage(null)}>Dismiss</button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Showing transactions for <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        </p>
        <Button onClick={openAdd}><IconPlus /> Add Expense</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Income" value={formatCurrency(totals.income)} tone="income" />
        <StatCard label="Spending" value={formatCurrency(totals.spending)} tone="expense" />
        <StatCard label="Net" value={formatCurrency(totals.balance)} />
      </div>

      <Card className="overflow-hidden">
        {transactions.length === 0 ? (
          <EmptyState icon={<IconList />} title="No transactions this month" message="Record your monthly income from the Dashboard, then add expenses here." action={<Button size="sm" onClick={openAdd}><IconPlus /> Add expense</Button>} />
        ) : (
          <table className="w-full table-fixed text-left">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th className="w-32 px-6 py-3">Date</th><th className="w-24 px-6 py-3">Type</th><th className="w-32 px-6 py-3">Category</th><th className="px-6 py-3">Description</th><th className="w-32 px-6 py-3 text-right">Amount</th><th className="w-20 px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent"><TransactionTable transactions={transactions} categoryName={categoryName} onEdit={openEdit} onDelete={handleDelete} /></tbody>
          </table>
        )}
      </Card>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit expense' : 'Add expense'}>
        <TransactionForm initial={editing} categories={categoriesRequest.data || []} allowIncome={false} onSubmit={handleSubmit} onClose={() => setFormOpen(false)} />
      </Modal>
    </div>
  )
}