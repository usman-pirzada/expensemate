import { formatCurrency, formatPercent } from '../../utils/format'

/**
 * Single horizontal budget bar per the project spec:
 *   [==========------]  used | remaining
 *   [==========][=====]  budget | overage (bar keeps growing past 100%)
 */
export default function BudgetBar({ label, budget, spent, usagePercent, status = 'none' }) {
  const usage = Math.max(0, Math.min(100, Number(usagePercent) || 0))
  const exceeded = (Number(usagePercent) || 0) > 100
  const remaining = Math.max(0, Number(budget) - Number(spent))
  const overage = Math.max(0, Number(spent) - Number(budget))

  const fillColor = exceeded || status === 'exceeded' ? 'bg-amber-400' : 'bg-brand-500'
  const overflowColor = 'bg-red-500'

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
        <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(spent)}</span>
          {' / '}
          {formatCurrency(budget)}
          <span className="ml-2">{formatPercent(usagePercent)}</span>
        </span>
      </div>

      <div className="relative h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${fillColor}`}
          style={{ width: `${usage}%` }}
        />
        {exceeded ? (
          <div
            className={`absolute inset-y-0 ${overflowColor} ${usage >= 100 ? 'right-[-2px]' : ''}`}
            style={{ left: '100%', width: `${exceeded ? usage - 100 : 0}%` }}
          />
        ) : null}
        {usage > 0 && usage < 100 ? (
          <div
            className="absolute inset-y-0 w-px bg-white/80"
            style={{ left: `${usage}%` }}
          />
        ) : null}
      </div>

      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className="tabular-nums text-slate-500 dark:text-slate-400">
          {exceeded ? (
            <span className="font-medium text-red-600 dark:text-red-400">
              {formatCurrency(overage)} over budget
            </span>
          ) : (
            <span>
              {formatCurrency(remaining)} remaining
            </span>
          )}
        </span>
        {usage > 0 ? (
          <span className="tabular-nums text-slate-400 dark:text-slate-500">
            {formatCurrency(Math.min(spent, budget))} of budget used
          </span>
        ) : null}
      </div>
    </div>
  )
}