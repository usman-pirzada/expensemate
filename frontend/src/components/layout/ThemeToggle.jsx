import { useTheme } from '../../context/ThemeContext'

export default function ThemeToggle() {
  const { dark, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-slate-200 ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:bg-slate-700 dark:ring-slate-600 dark:hover:bg-slate-600"
    >
      <span
        className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          dark ? 'translate-x-[1.4rem]' : 'translate-x-[0.15rem]'
        }`}
      >
        <span
          className={`flex h-full w-full items-center justify-center text-xs transition-colors ${
            dark ? 'text-amber-400' : 'text-slate-500'
          }`}
          aria-hidden
        >
          {dark ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          )}
        </span>
      </span>
    </button>
  )
}