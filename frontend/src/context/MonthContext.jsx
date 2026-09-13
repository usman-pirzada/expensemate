import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { MONTH_NAMES } from '../utils/format'

const MonthContext = createContext(null)

function currentMonth() {
  const today = new Date()
  return { year: today.getFullYear(), month: today.getMonth() + 1 }
}

export function MonthProvider({ children }) {
  const [{ year, month }, setPeriod] = useState(currentMonth)

  const previousMonth = useCallback(() => {
    setPeriod(({ year: y, month: m }) =>
      m === 1 ? { year: y - 1, month: 12 } : { year: y, month: m - 1 },
    )
  }, [])

  const nextMonth = useCallback(() => {
    setPeriod(({ year: y, month: m }) =>
      m === 12 ? { year: y + 1, month: 1 } : { year: y, month: m + 1 },
    )
  }, [])

  const value = useMemo(
    () => ({
      year,
      month,
      label: `${MONTH_NAMES[month - 1]} ${year}`,
      previousMonth,
      nextMonth,
    }),
    [year, month, previousMonth, nextMonth],
  )

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>
}

export function useMonth() {
  const context = useContext(MonthContext)
  if (!context) throw new Error('useMonth must be used inside MonthProvider')
  return context
}