import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Transactions from '../../src/pages/Transactions'

const { useRequestMock, useMonthMock } = vi.hoisted(() => ({
  useRequestMock: vi.fn(),
  useMonthMock: vi.fn(),
}))

vi.mock('../../src/hooks/useRequest', () => ({ default: useRequestMock }))
vi.mock('../../src/context/MonthContext', () => ({ useMonth: useMonthMock }))
vi.mock('../../src/services/expenseService', () => ({
  getCategories: vi.fn(),
  getTransactions: vi.fn(),
  createTransaction: vi.fn().mockResolvedValue({ id: 99 }),
  updateTransaction: vi.fn().mockResolvedValue({ id: 1 }),
  deleteTransaction: vi.fn().mockResolvedValue(undefined),
}))

import { deleteTransaction } from '../../src/services/expenseService'

const categories = [
  { id: 1, name: 'Food' },
  { id: 2, name: 'Transport' },
]

const transactions = [
  {
    id: 1,
    type: 'Income',
    amount: 100000,
    date: '2026-09-01',
    description: 'Monthly salary',
    category_id: null,
  },
  {
    id: 2,
    type: 'Expense',
    amount: 12000,
    date: '2026-09-02',
    description: 'Groceries',
    category_id: 1,
  },
]

function renderTransactions(data = transactions) {
  useMonthMock.mockReturnValue({ year: 2026, month: 9, label: 'September 2026' })
  const categoryRequest = { data: categories, loading: false, error: null, reload: vi.fn() }
  const transactionRequest = { data, loading: false, error: null, reload: vi.fn() }

  useRequestMock
    .mockImplementationOnce(() => categoryRequest)
    .mockImplementationOnce(() => transactionRequest)

  render(<MemoryRouter><Transactions /></MemoryRouter>)
  return { categoryRequest, transactionRequest }
}

describe('Transactions page', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the selected month, transaction totals, and locked income', () => {
    renderTransactions()
    expect(screen.getByText('Showing transactions for')).toBeInTheDocument()
    expect(screen.getByText('September 2026')).toBeInTheDocument()
    expect(screen.getByText(/Rs\s*100,000/)).toBeInTheDocument()
    expect(screen.getByText(/Rs\s*12,000/)).toBeInTheDocument()
    expect(screen.getByText(/Rs\s*88,000/)).toBeInTheDocument()
    expect(screen.getByText('Monthly salary')).toBeInTheDocument()
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Locked')).toBeInTheDocument()
  })

  it('opens the add expense form', async () => {
    const user = userEvent.setup()
    renderTransactions()
    await user.click(screen.getByRole('button', { name: 'Add Expense' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveTextContent('Add expense')
    expect(screen.getByLabelText('Amount')).toBeInTheDocument()
  })

  it('deletes an expense and shows a success message', async () => {
    const user = userEvent.setup()
    const { transactionRequest } = renderTransactions()
    await user.click(screen.getByRole('button', { name: 'Delete transaction' }))

    await waitFor(() => {
      expect(deleteTransaction).toHaveBeenCalledWith(2)
      expect(transactionRequest.reload).toHaveBeenCalledTimes(1)
      expect(screen.getByText('Expense deleted.')).toBeInTheDocument()
    })
  })

  it('shows an empty state when there are no transactions', () => {
    renderTransactions([])
    expect(screen.getByText('No transactions this month')).toBeInTheDocument()
    expect(screen.getByText('Record your monthly income from the Dashboard, then add expenses here.')).toBeInTheDocument()
  })
})
