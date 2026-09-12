import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useMonth } from '../context/MonthContext'
import useRequest from '../hooks/useRequest'
import { getCategories, getCategorySpending, getMonthlySummary } from '../services/expenseService'
import { formatCurrency, formatPercent, MONTH_NAMES_SHORT } from '../utils/format'
import { categoryColor } from '../utils/colors'
import Card, { CardHeader } from '../components/common/Card'
import StatCard from '../components/common/StatCard'
import EmptyState from '../components/common/EmptyState'
import Badge from '../components/common/Badge'
import { IconChart } from '../components/common/Icons'

function previousPeriods(year, month, count) {
  const periods = []
  let y = year
  let m = month
  for (let i = 0; i < count; i++) {
    periods.push({ year: y, month: m })
    m -= 1
    if (m === 0) {
      m = 12
      y -= 1
    }
  }
  return periods
}

export default function Analytics() {
  const { year, month, label } = useMonth()

  const basePeriods = useMemo(() => previousPeriods(year, month, 3), [year, month])

  const categoriesRequest = useRequest(() => getCategories(), [])
  const spendingRequest = useRequest(() => getCategorySpending(year, month), [year, month])
  const summaryRequest = useRequest(
    () => Promise.all(basePeriods.map((period) => getMonthlySummary(period.year, period.month).catch(() => null))),
    [year, month],
  )

  const categoryName = useMemo(() => {
    const map = new Map()
    for (const category of categoriesRequest.data || []) map.set(category.id, category.name)
    return (id) => map.get(id) || `Category ${id}`
  }, [categoriesRequest.data])

  if (summaryRequest.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-300">
        Could not load analytics: {String(summaryRequest.error?.message || summaryRequest.error)}
      </div>
    )
  }

  if (summaryRequest.loading || !summaryRequest.data) {
    return <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading analytics…</div>
  }

  const currentSummary = summaryRequest.data[0]
  const pieData = (spendingRequest.data || []).map((item, index) => ({
    name: categoryName(item.category_id),
    value: Number(item.spent),
    color: categoryColor(index),
  }))
  const hasPieData = pieData.some((item) => item.value > 0)

  const barData = basePeriods.map((period, index) => {
    const summary = summaryRequest.data[index] || {}
    return {
      name: `${MONTH_NAMES_SHORT[period.month - 1]} ‘${String(period.year).slice(2)}`,
      Income: Number(summary.income) || 0,
      Spending: Number(summary.spending) || 0,
    }
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Monthly analytics for <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Income" value={formatCurrency(currentSummary.income)} tone="income" />
        <StatCard label="Total Spending" value={formatCurrency(currentSummary.spending)} tone="expense" />
        <StatCard label="Balance" value={formatCurrency(currentSummary.balance)} />
        <StatCard
          label="Budget Used"
          value={formatPercent(currentSummary.usage_percentage)}
          sub={
            currentSummary.exceeded > 0
              ? `${formatCurrency(currentSummary.exceeded)} over budget`
              : `${formatCurrency(currentSummary.remaining)} remaining`
          }
          tone={currentSummary.usage_percentage >= 100 ? 'expense' : 'default'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <CardHeader title="Monthly summary" subtitle="Income vs spending, last 3 months" />
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value)}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 13 }} />
                <Bar dataKey="Income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={42} />
                <Bar dataKey="Spending" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title="Spending by category" subtitle={`Expense distribution for ${label}`} />
          {hasPieData ? (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    innerRadius="50%"
                    paddingAngle={2}
                    strokeWidth={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [formatCurrency(value), name]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                  />
                  <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={<IconChart />} title="No expenses this month" message="Expense categories will appear here once you record expenses." />
          )}
        </Card>
      </div>

      <Card className="p-5">
        <CardHeader title="Category-wise spending" subtitle="Breakdown for the selected month" />
        {pieData.length === 0 ? (
          <EmptyState title="No category spending to show" />
        ) : (
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                  <Badge tone="slate">{formatPercent((item.value / (currentSummary.spending || 1)) * 100)}</Badge>
                </div>
                <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}