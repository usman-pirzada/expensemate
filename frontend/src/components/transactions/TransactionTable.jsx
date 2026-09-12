import Badge from '../common/Badge'
import Button from '../common/Button'
import { IconEdit, IconTrash } from '../common/Icons'
import { formatCurrency, formatDate } from '../../utils/format'

export default function TransactionTable({ transactions, categoryName, onEdit, onDelete }) {
  if (transactions.length === 0) {
    return (
      <tr>
<td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          No transactions recorded for this month yet.
        </td>
      </tr>
    )
  }

  return transactions.map((transaction) => {
    const isIncome = transaction.type === 'Income'
    return (
      <tr key={transaction.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40">
        <td className="px-6 py-3 whitespace-nowrap text-sm tabular-nums text-slate-600 dark:text-slate-400">
          {formatDate(transaction.date)}
        </td>
        <td className="px-6 py-3 text-sm">
          <Badge tone={isIncome ? 'green' : 'red'}>
            {isIncome ? 'Income' : 'Expense'}
          </Badge>
        </td>
        <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
          {isIncome ? '—' : categoryName(transaction.category_id)}
        </td>
        <td className="max-w-56 truncate px-6 py-3 text-sm text-slate-500 dark:text-slate-400">
          {transaction.description || '—'}
        </td>
        <td
          className={`px-6 py-3 text-right text-sm font-semibold tabular-nums ${
            isIncome ? 'text-brand-700 dark:text-brand-400' : 'text-slate-800 dark:text-slate-100'
          }`}
        >
          {isIncome ? '+' : '−'}
          {formatCurrency(transaction.amount)}
        </td>
        <td className="px-6 py-3">
          <div className="flex justify-end gap-1">
            <button
              type="button"
              aria-label="Edit transaction"
              onClick={() => onEdit(transaction)}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <IconEdit />
            </button>
            <button
              type="button"
              aria-label="Delete transaction"
              onClick={() => onDelete(transaction)}
              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            >
              <IconTrash />
            </button>
          </div>
        </td>
      </tr>
    )
  })
}