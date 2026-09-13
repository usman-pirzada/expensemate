import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

    expect(screen.getByRole('button', { name: 'Expense' })).toBeInTheDocument()
    expect(screen.getByLabelText('Category')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Food' })).toBeInTheDocument()
  })

  it('requires an amount', async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await user.click(screen.getByRole('button', { name: 'Add transaction' }))

    expect(screen.getByText('Amount is required')).toBeInTheDocument()
    expect(props.onSubmit).not.toHaveBeenCalled()
  })

  it('rejects zero and negative amounts', async () => {
    const user = userEvent.setup()
    const props = renderForm()
    const amount = screen.getByLabelText('Amount')

    await user.type(amount, '0')
    await user.click(screen.getByRole('button', { name: 'Add transaction' }))

    expect(screen.getByText('Amount must be greater than zero')).toBeInTheDocument()
    expect(props.onSubmit).not.toHaveBeenCalled()
  })

  it('requires a category for an expense', async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await user.type(screen.getByLabelText('Amount'), '1200')
    await user.click(screen.getByRole('button', { name: 'Add transaction' }))

    expect(screen.getByText('Select a category for this expense')).toBeInTheDocument()
    expect(props.onSubmit).not.toHaveBeenCalled()
  })

  it('submits a valid expense with a numeric category id', async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await user.type(screen.getByLabelText('Amount'), '1200.50')
    await user.clear(screen.getByLabelText('Date'))
    await user.type(screen.getByLabelText('Date'), '2026-09-12')
    await user.selectOptions(screen.getByLabelText('Category'), '1')
    await user.type(screen.getByLabelText(/Description/), '  Groceries  ')
    await user.click(screen.getByRole('button', { name: 'Add transaction' }))

    expect(props.onSubmit).toHaveBeenCalledWith({
      type: 'Expense',
      amount: 1200.5,
      date: '2026-09-12',
      description: 'Groceries',
      category_id: 1,
    })
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('switches to income and removes the category selector', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Income' }))

    expect(screen.queryByLabelText('Category')).not.toBeInTheDocument()
    expect(screen.getByText('Income transactions do not have a category.')).toBeInTheDocument()
  })

  it('clears a selected category when switching from expense to income', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.selectOptions(screen.getByLabelText('Category'), '1')
    await user.click(screen.getByRole('button', { name: 'Income' }))
    await user.click(screen.getByRole('button', { name: 'Expense' }))

    expect(screen.getByLabelText('Category')).toHaveValue('')
  })

  it('submits income with a null category', async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await user.click(screen.getByRole('button', { name: 'Income' }))
    await user.type(screen.getByLabelText('Amount'), '50000')
    await user.clear(screen.getByLabelText('Date'))
    await user.type(screen.getByLabelText('Date'), '2026-09-01')
    await user.click(screen.getByRole('button', { name: 'Add transaction' }))

    expect(props.onSubmit).toHaveBeenCalledWith({
      type: 'Income',
      amount: 50000,
      date: '2026-09-01',
      description: null,
      category_id: null,
    })
  })

  it('loads existing transaction values in edit mode', () => {
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
