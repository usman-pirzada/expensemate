import Card from './Card'

const valueTones = {
  default: 'text-slate-900 dark:text-white',
  income: 'text-brand-700 dark:text-brand-400',
  expense: 'text-red-600 dark:text-red-400',
  neutral: 'text-slate-600 dark:text-slate-400',
}

export default function StatCard({ label, value, sub, tone = 'default', icon }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          <p className={`mt-1.5 truncate text-2xl font-semibold tabular-nums ${valueTones[tone]}`}>
            {value}
          </p>
          {sub ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p> : null}
        </div>
        {icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {icon}
          </span>
        ) : null}
      </div>
    </Card>
  )
}