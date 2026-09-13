import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TransactionForm from '../../../src/components/transactions/TransactionForm'

const categories = [
  { id: 1, name: 'Food' },
  { id: 2, name: 'Transport' },
]

function renderForm(overrides = {}) {
  const props = {
    initial: null,
    categories,
    allowIncome: false,
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onClose: vi.fn(),
    ...overrides,
  }

  render(<TransactionForm {...props} />)
  return props
}

describe('TransactionForm', () => {
  it('renders expense mode with a category selector by default', () => {
    renderForm()

    expect(screen.queryByRole('button', { name: 'Income' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Category')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Food' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeInTheDocument()
  })

  it('requires an amount', async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await user.click(screen.getByRole('button', { name: 'Add expense' }))

    expect(screen.getByText('Amount is required')).toBeInTheDocument()
    expect(props.onSubmit).not.toHaveBeenCalled()
  })

  it('rejects zero and negative amounts', async () => {
    const user = userEvent.setup()
    const props = renderForm()
    const amount = screen.getByLabelText('Amount')

    await user.type(amount, '-1')
    await user.click(screen.getByRole('button', { name: 'Add expense' }))

    expect(screen.getByText('Amount must be greater than zero')).toBeInTheDocument()
    expect(props.onSubmit).not.toHaveBeenCalled()
  })

  it('requires a category for an expense', async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await user.type(screen.getByLabelText('Amount'), '1200')
    await user.click(screen.getByRole('button', { name: 'Add expense' }))

    expect(screen.getByText('Select a category for this expense')).toBeInTheDocument()
    expect(props.onSubmit).not.toHaveBeenCalled()
  })

  it('submits a valid expense with a numeric category id', async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await user.type(screen.getByLabelText('Amount'), '1200.50')
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-09-12' } })
    await user.selectOptions(screen.getByLabelText('Category'), '1')
    await user.type(screen.getByLabelText(/Description/), '  Groceries  ')
    await user.click(screen.getByRole('button', { name: 'Add expense' }))

    expect(props.onSubmit).toHaveBeenCalledWith({
      type: 'Expense',
      amount: 1200.5,
      date: '2026-09-12',
      description: 'Groceries',
      category_id: 1,
    })
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('loads existing expense values in edit mode', () => {
    renderForm({
      initial: {
        id: 10,
        type: 'Expense',
        amount: 8500,
        date: '2026-09-08',
        description: 'Fuel',
        category_id: 2,
      },
    })

    expect(screen.getByLabelText('Amount')).toHaveValue(8500)
    expect(screen.getByLabelText('Date')).toHaveValue('2026-09-08')
    expect(screen.getByLabelText('Category')).toHaveValue('2')
    expect(screen.getByLabelText(/Description/)).toHaveValue('Fuel')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
  })
})
