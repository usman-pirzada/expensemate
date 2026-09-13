import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate, formatPercent, toISODate } from '../../src/utils/format'

describe('format utilities', () => {
  it('formats PKR currency without decimal places', () => {
    expect(formatCurrency(120000)).toBe('Rs 120,000')
    expect(formatCurrency(0)).toBe('Rs 0')
  })

  it('formats percentages with the requested precision', () => {
    expect(formatPercent(93.141)).toBe('93.1%')
    expect(formatPercent(50, 0)).toBe('50%')
  })

  it('formats ISO dates for display', () => {
    expect(formatDate('2026-09-12')).toBe('Sep 12, 2026')
    expect(formatDate('')).toBe('')
  })

  it('converts a Date to an ISO calendar date', () => {
    expect(toISODate(new Date(2026, 8, 12))).toBe('2026-09-12')
  })
})
