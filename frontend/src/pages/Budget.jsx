import { useMemo, useState } from 'react'
import Card, { CardHeader } from '../components/common/Card'
import BudgetBar from '../components/common/BudgetBar'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import EmptyState from '../components/common/EmptyState'
import BudgetForm from '../components/budget/BudgetForm'
import AllocationForm from '../components/budget/AllocationForm'
import { IconWallet, IconPlus, IconEdit, IconTrash } from '../components/common/Icons'
import { useMonth } from '../context/MonthContext'
import useRequest from '../hooks/useRequest'
import {
  getCategories,
  getBudget,
  getAllocations,
  getCategoryBudgetStatus,
  getMonthlySummary,
  createBudget,
  updateBudget,
  deleteBudget,
  createAllocation,
  updateAllocation,
  deleteAllocation,
} from '../services/expenseService'
import { formatCurrency } from '../utils/format'

export default function Budget() {
  const { year, month, label } = useMonth()

  const budgetRequest = useRequest(() => getBudget(year, month), [year, month])
  const allocationsRequest = useRequest(
    () => (budgetRequest.data ? getAllocations(budgetRequest.data.id) : Promise.resolve([])),
    [budgetRequest.data?.id],
  )
  const categoryStatusRequest = useRequest(() => getCategoryBudgetStatus(year, month), [year, month])
  const summaryRequest = useRequest(() => getMonthlySummary(year, month), [year, month])
  const categoriesRequest = useRequest(() => getCategories(), [])

  const [budgetModal, setBudgetModal] = useState({ open: false, budget: null })
  const [allocationModal, setAllocationModal] = useState({ open: false, allocation: null })
  const [message, setMessage] = useState(null)

  const budget = budgetRequest.data
  const allocations = allocationsRequest.data || []
  const categoryStatus = categoryStatusRequest.data || []
  const summary = summaryRequest.data

  const reloadAll = () => {
    budgetRequest.reload()
    allocationsRequest.reload()
    categoryStatusRequest.reload()
    summaryRequest.reload()
  }

  const categoryName = useMemo(() => {
    const map = new Map()
    for (const category of categoriesRequest.data || []) map.set(category.id, category.name)
    return (id) => map.get(id) || `Category ${id}`
  }, [categoriesRequest.data])

  const usageFor = useMemo(() => {
    const map = new Map()
    for (const item of categoryStatus) map.set(item.category_id, item)
    return (categoryId) => map.get(categoryId)
  }, [categoryStatus])

  const allocatedTotal = allocations.reduce((sum, allocation) => sum + Number(allocation.amount), 0)
  const unallocated = budget ? Math.max(0, Number(budget.overall_amount) - allocatedTotal) : 0
  const allocatedCategoryIds = allocations.map((allocation) => allocation.category_id)
  const categoriesAvailableToAllocate = (categoriesRequest.data || []).length - allocatedCategoryIds.length

  const handleSaveBudget = async (overallAmount) => {
    setMessage(null)
    try {
      if (budget) {
        await updateBudget(budget.id, overallAmount)
        setMessage({ tone: 'success', text: 'Budget updated.' })
      } else {
        await createBudget(year, month, overallAmount)
        setMessage({ tone: 'success', text: 'Budget created.' })
      }
      setBudgetModal({ open: false, budget: null })
      reloadAll()
    } catch (error) {
      setMessage({ tone: 'error', text: String(error?.message || error) })
      setBudgetModal({ open: false, budget: null })
    }
  }

  const handleDeleteBudget = async () => {
    setMessage(null)
    try {
      await deleteBudget(budget.id)
      setMessage({ tone: 'success', text: 'Budget deleted.' })
      reloadAll()
    } catch (error) {
      setMessage({ tone: 'error', text: String(error?.message || error) })
    }
  }

  const handleSaveAllocation = async (categoryId, amount) => {
    setMessage(null)
    try {
      if (allocationModal.allocation) {
        await updateAllocation(allocationModal.allocation.id, amount)
        setMessage({ tone: 'success', text: 'Allocation updated.' })
      } else {
        await createAllocation(budget.id, categoryId, amount)
        setMessage({ tone: 'success', text: 'Allocation added.' })
      }
      setAllocationModal({ open: false, allocation: null })
      reloadAll()
    } catch (error) {
      setMessage({ tone: 'error', text: String(error?.message || error) })
      setAllocationModal({ open: false, allocation: null })
    }
  }

  const handleDeleteAllocation = async (allocation) => {
    setMessage(null)
    try {
      await deleteAllocation(allocation.id)
      setMessage({ tone: 'success', text: 'Allocation removed.' })
      reloadAll()
    } catch (error) {
      setMessage({ tone: 'error', text: String(error?.message || error) })
    }
  }

  if (budgetRequest.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-300">
        Could not load the budget: {String(budgetRequest.error?.message || budgetRequest.error)}
      </div>
    )
  }

  if (budgetRequest.loading) {
    return <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading budget…</div>
  }

  if (!budget) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        {message ? <MessageBanner message={message} onDismiss={() => setMessage(null)} /> : null}
        <Card>
          <EmptyState
            icon={<IconWallet />}
            title={`No budget for ${label}`}
            message="Create an overall monthly budget to start tracking how much you can spend."
            action={
              <Button onClick={() => setBudgetModal({ open: true, budget: null })}>
                <IconPlus />
                Create budget
              </Button>
            }
          />
        </Card>

        <Modal open={budgetModal.open} onClose={() => setBudgetModal({ open: false, budget: null })} title="Create monthly budget">
          <BudgetForm periodLabel={label} onSubmit={handleSaveBudget} onClose={() => setBudgetModal({ open: false, budget: null })} />
        </Modal>
      </div>
    )
  }

  const overallStatus =
    summary && summary.budget > 0
      ? summary.usage_percentage >= 100
        ? 'exceeded'
        : summary.usage_percentage >= 90
          ? 'approaching'
          : 'none'
      : 'none'

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {message ? <MessageBanner message={message} onDismiss={() => setMessage(null)} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Budget for <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setBudgetModal({ open: true, budget })}>
            <IconEdit />
            Edit budget
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDeleteBudget}>
            <IconTrash />
          </Button>
        </div>
      </div>

      <Card className="p-5">
        <CardHeader
          title="Overall monthly budget"
          subtitle={`${formatCurrency(allocatedTotal)} allocated · ${formatCurrency(unallocated)} unallocated`}
        />
        <div className="mt-4">
          <BudgetBar
            label="Overall"
            budget={budget.overall_amount}
            spent={summary?.spending ?? 0}
            usagePercent={summary?.usage_percentage ?? 0}
            status={overallStatus}
          />
        </div>
      </Card>

      <Card className="p-5">
        <CardHeader
          title="Category allocations"
          subtitle="Exact per-category amounts within the overall budget"
          action={
            categoriesAvailableToAllocate > 0 && unallocated > 0 ? (
              <Button size="sm" onClick={() => setAllocationModal({ open: true, allocation: null })}>
                <IconPlus />
                Add allocation
              </Button>
            ) : null
          }
        />

        {allocations.length === 0 ? (
          <EmptyState
            title="No category allocations yet"
            message="Optional. Expenses in categories without an allocation draw from the unallocated budget."
            action={
              categoriesAvailableToAllocate > 0 ? (
                <Button
                  size="sm"
                  onClick={() => setAllocationModal({ open: true, allocation: null })}
                >
                  <IconPlus />
                  Add allocation
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="mt-4 space-y-5">
            {allocations.map((allocation) => {
              const usage = usageFor(allocation.category_id)
              return (
                <div key={allocation.id} className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <BudgetBar
                      label={categoryName(allocation.category_id)}
                      budget={allocation.amount}
                      spent={usage?.spent ?? 0}
                      usagePercent={usage?.usage_percentage ?? 0}
                      status={
                        usage
                          ? usage.usage_percentage >= 100
                            ? 'exceeded'
                            : usage.usage_percentage >= 90
                              ? 'approaching'
                              : 'none'
                          : 'none'
                      }
                    />
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label="Edit allocation"
                      onClick={() => setAllocationModal({ open: true, allocation })}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    >
                      <IconEdit />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete allocation"
                      onClick={() => handleDeleteAllocation(allocation)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Modal
        open={budgetModal.open}
        onClose={() => setBudgetModal({ open: false, budget: null })}
        title={budgetModal.budget ? 'Edit monthly budget' : 'Create monthly budget'}
      >
        <BudgetForm
          initial={budgetModal.budget}
          periodLabel={label}
          onSubmit={handleSaveBudget}
          onClose={() => setBudgetModal({ open: false, budget: null })}
        />
      </Modal>

      <Modal
        open={allocationModal.open}
        onClose={() => setAllocationModal({ open: false, allocation: null })}
        title={allocationModal.allocation ? 'Edit allocation' : 'Add category allocation'}
      >
        <AllocationForm
          categories={categoriesRequest.data || []}
          overallBudget={budget.overall_amount}
          allocatedTotal={allocatedTotal}
          excludedCategoryIds={allocatedCategoryIds}
          initial={allocationModal.allocation}
          onSubmit={handleSaveAllocation}
          onClose={() => setAllocationModal({ open: false, allocation: null })}
        />
      </Modal>
    </div>
  )
}

function MessageBanner({ message, onDismiss }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
        message.tone === 'error'
          ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-300'
          : 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-400/40 dark:bg-brand-500/10 dark:text-brand-300'
      }`}
    >
      <span>{message.text}</span>
      <button type="button" className="font-medium underline" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  )
}