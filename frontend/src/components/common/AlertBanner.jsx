import { IconWarning, IconDanger, IconCheck } from './Icons'

const styles = {
  approaching: {
    wrap: 'border-amber-200 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-500/10',
    text: 'text-amber-800 dark:text-amber-200',
    icon: <IconWarning className="text-amber-500" />,
    title: 'Approaching budget',
  },
  exceeded: {
    wrap: 'border-red-200 bg-red-50 dark:border-red-400/30 dark:bg-red-500/10',
    text: 'text-red-800 dark:text-red-200',
    icon: <IconDanger className="text-red-500" />,
    title: 'Budget exceeded',
  },
  ok: {
    wrap: 'border-brand-200 bg-brand-50 dark:border-brand-400/30 dark:bg-brand-500/10',
    text: 'text-brand-800 dark:text-brand-200',
    icon: <IconCheck className="text-brand-500" />,
    title: 'On track',
  },
}

export default function AlertBanner({ type = 'approaching', title, message }) {
  const style = styles[type] || styles.ok
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${style.wrap}`}>
      <span className="mt-0.5 shrink-0">{style.icon}</span>
      <div className={`min-w-0 ${style.text}`}>
        <p className="text-sm font-semibold">{title ?? style.title}</p>
        {message ? <p className="mt-1 text-sm opacity-90">{message}</p> : null}
      </div>
    </div>
  )
}