import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MonthProvider } from './context/MonthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Budget from './pages/Budget'
import Analytics from './pages/Analytics'
import ImportExport from './pages/ImportExport'

function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <p className="text-2xl font-semibold text-slate-700 dark:text-slate-200">Page not found</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">That page does not exist in ExpenseMate.</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <MonthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/import-export" element={<ImportExport />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </MonthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}