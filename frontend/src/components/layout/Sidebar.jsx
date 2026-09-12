import { NavLink } from 'react-router-dom'
import { IconDashboard, IconList, IconWallet, IconChart, IconSwap } from '../common/Icons'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  { to: '/transactions', label: 'Transactions', icon: IconList },
  { to: '/budget', label: 'Budget', icon: IconWallet },
  { to: '/analytics', label: 'Analytics', icon: IconChart },
  { to: '/import-export', label: 'Import / Export', icon: IconSwap },
]

export default function Sidebar({ mobile = false, onNavigate }) {
  return (
    <aside
      className={`flex flex-col bg-slate-900 ${
        mobile ? 'h-full w-64 p-4' : 'hidden w-60 shrink-0 p-4 lg:flex'
      }`}
    >
      <div className="mb-6 flex items-center gap-2 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-base font-bold text-white">
          E
        </span>
        <div>
          <p className="text-base font-semibold leading-tight text-white">ExpenseMate</p>
          <p className="text-[11px] leading-tight text-slate-400">Personal expense manager</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-500/15 text-brand-300'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon className="text-lg" />
            {label}
          </NavLink>
        ))}
      </nav>

      <p className="px-2 pt-4 text-[11px] leading-snug text-slate-500">
        Local single-user app. All data stays on this machine.
      </p>
    </aside>
  )
}