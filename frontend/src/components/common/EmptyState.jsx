export default function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      {icon ? (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          {icon}
        </span>
      ) : null}
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p>
      {message ? <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{message}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}