import { useMonth } from '../../context/MonthContext'
import { IconChevronLeft, IconChevronRight } from '../common/Icons'

export default function MonthSelector() {
  const { year, month, label, previousMonth, nextMonth } = useMonth()

  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
      <button
        type="button"
        onClick={previousMonth}
        aria-label="Previous month"
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
      >
        <IconChevronLeft />
      </button>
      <span className="min-w-[7.5rem] text-center text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <button
        type="button"
        onClick={nextMonth}
        aria-label="Next month"
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
      >
        <IconChevronRight />
      </button>
    </div>
  )
}