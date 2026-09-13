import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

function initialDark() {
  if (typeof window === 'undefined') return false
  const saved = localStorage.getItem('expensemate-theme')
  if (saved != null) return saved === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(initialDark)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    localStorage.setItem('expensemate-theme', dark ? 'dark' : 'light')
  }, [dark])

  const value = useMemo(
    () => ({
      dark,
      toggleTheme: () => setDark((current) => !current),
    }),
    [dark],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}