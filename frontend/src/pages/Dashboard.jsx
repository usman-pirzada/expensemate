import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useMonth } from '../context/MonthContext'
import useRequest from '../hooks/useRequest'
import { getCategories, getDashboard } from '../services/expenseService'
import { formatCurrency, formatPercent } from '../utils/format'
import { categoryColor } from '../utils/colors'
import Card, { CardHeader } from '../components/common/Card'
import StatCard from '../components/common/StatCard'
import BudgetBar from '../components/common/BudgetBar'
import AlertBanner from '../components/common/AlertBanner'
import EmptyState from '../components/common/EmptyState'
import { IconVault } from '../components/common/Icons'

function ErrorNotice({ error }) {
  return (
    <Card className="flex items-center gap-3 border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-300">
      <span className="shrink-0 font-medium">Could not load the dashboard.</span>
      <span className="truncate text-red-600/80 dark:text-red-400">{String(error?.message || error)}</span>
    </Card>
  )
}

export default function Dashboard() {
  const { year, month, label } = useMonth()

  const categoriesRequest = useRequest(() => getCategories(), [])
  const dashboardRequest = useRequest(() => getDashboard(year, month), [year, month])

  const categoryName = useMemo(() => {
    const map = new Map()
    for (const category of categoriesRequest.data || []) map.set(category.id, category.name)
    return (id) => map.get(id) || `Category ${id}`
  }, [categoriesRequest.data])

  if (dashboardRequest.error) return <ErrorNotice error={dashboardRequest.error} />
  if (dashboardRequest.loading || !dashboardRequest.data) {
    return <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading dashboard…</div>
  }

  const dashboard = dashboardRequest.data
  const { summary, budget_id: budgetId, category_spending, category_budget_status, alerts } = dashboard

  const pieData = category_spending.map((item, index) => ({
    name: categoryName(item.category_id),
    value: Number(item.spent),
    color: categoryColor(index),
  }))

  const monthlyAlert = alerts?.monthly
  const categoryAlerts = alerts?.categories || []

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Monthly overview for <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Income" value={formatCurrency(summary.income)} tone="income" />
        <StatCard label="Total Spending" value={formatCurrency(summary.spending)} tone="expense" />
        <StatCard label="Balance" value={formatCurrency(summary.balance)} />
      </div>

      {summary.budget > 0 ? (
        <Card className="p-5">
          <CardHeader
            title="Overall monthly budget"
            subtitle={`${summary.budget_id ? 'Annual budget' : 'No budget configured'}`}
          />
          <div className="mt-4 px-0">
            <BudgetBar
              label="Overall"
              budget={summary.budget}
              spent={summary.spending}
              usagePercent={summary.usage_percentage}
              status={monthlyAlert?.status}
            />
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={<IconVault />}
            title="No budget for this month"
            message="Transactions can still be recorded. Create a budget to see monthly budget status."
          />
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <CardHeader title="Spending by category" subtitle={`Expenses for ${label}`} />
          <div className="mt-4 h-72">
            {pieData.length === 0 ? (
              <EmptyState title="No expenses this month" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="78%"
                    innerRadius="48%"
                    paddingAngle={2}
                    strokeWidth={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Spent']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                  />
                  <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {(monthlyAlert && monthlyAlert.status !== 'none') || categoryAlerts.length > 0 ? (
            <Card className="p-5">
              <CardHeader title="Alerts" />
              <div className="mt-4 space-y-3">
                {monthlyAlert?.status === 'approaching' ? (
                  <AlertBanner
                    type="approaching"
                    title="Overall budget approaching"
                    message={`You have used ${formatPercent(monthlyAlert.usage_percentage)} of the ${formatCurrency(monthlyAlert.budget)} monthly budget.`}
                  />
                ) : null}
                {monthlyAlert?.status === 'exceeded' ? (
                  <AlertBanner
                    type="exceeded"
                    title="Overall budget exceeded"
                    message={`Spending (${formatCurrency(monthlyAlert.spent)}) has exceeded the monthly budget.`}
                  />
                ) : null}
                {categoryAlerts.map((alert) => (
                  <AlertBanner
                    key={alert.category_id}
                    type={alert.status}
                    title={`${categoryName(alert.category_id)} budget ${alert.status === 'exceeded' ? 'exceeded' : 'approaching'}`}
                    message={`${formatPercent(alert.usage_percentage)} of ${formatCurrency(alert.budget)} used.`}
                  />
                ))}
              </div>
            </Card>
          ) : null}

          <Card className="p-5">
            <CardHeader title="Category budgets" subtitle="Explicitly allocated categories" />
            <div className="mt-4 space-y-5">
              {category_budget_status.length === 0 ? (
                <EmptyState
                  title="No category allocations"
                  message="Expenses without an allocation draw from the unallocated monthly budget."
                />
              ) : (
                category_budget_status.map((item) => (
                  <BudgetBar
                    key={item.category_id}
                    label={categoryName(item.category_id)}
                    budget={item.budget}
                    spent={item.spent}
                    usagePercent={item.usage_percentage}
                    status={
                      item.usage_percentage >= 100
                        ? 'exceeded'
                        : item.usage_percentage >= 90
                          ? 'approaching'
                          : 'none'
                    }
                  />
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}