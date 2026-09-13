import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import MonthSelector from './MonthSelector'
import ThemeToggle from './ThemeToggle'
import Button from '../common/Button'
import { IconPlus } from '../common/Icons'

const titles = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/budget': 'Budget',
  '/analytics': 'Analytics',
  '/import-export': 'Import / Export',
}

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const title = titles[location.pathname] || 'ExpenseMate'

  const openTransactions = () => {
    setMobileNavOpen(false)
    navigate('/transactions?new=1')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <Sidebar mobile onNavigate={() => setMobileNavOpen(false)} />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
            className="flex-1 bg-slate-900/50"
          />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="h-5 w-5">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <MonthSelector />
            <ThemeToggle />
            <Button size="sm" onClick={openTransactions}>
              <IconPlus />
              <span className="hidden sm:inline">Add Transaction</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}