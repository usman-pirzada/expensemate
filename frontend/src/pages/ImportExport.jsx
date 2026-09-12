import { useEffect, useRef, useState } from 'react'
import Card, { CardHeader } from '../components/common/Card'
import Button from '../components/common/Button'
import { IconUpload, IconDownload, IconCheck, IconDanger } from '../components/common/Icons'
import { exportCsv, importCsv } from '../services/expenseService'

export default function ImportExport() {
  const fileInputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    return () => setResult(null)
  }, [])

  const handleExport = async () => {
    setBusy(true)
    setResult(null)
    try {
      const csv = await exportCsv()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'expensemate-transactions.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setResult({ tone: 'success', text: 'Transactions exported as CSV.' })
    } catch (error) {
      setResult({ tone: 'error', text: String(error?.message || error) })
    } finally {
      setBusy(false)
    }
  }

  const handleFile = async (file) => {
    if (!file) return
    setBusy(true)
    setResult(null)
    try {
      const content = await file.text()
      const response = await importCsv(content)
      setResult({
        tone: 'success',
        text: `Imported ${response.imported} transactions from ${file.name}.`,
      })
    } catch (error) {
      setResult({
        tone: 'error',
        text: `Import failed: ${String(error?.message || error)}`,
      })
    } finally {
      setBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Move transactions between ExpenseMate and a spreadsheet using CSV files. The backend accepts{' '}
        <code className="rounded bg-slate-200 px-1 py-0.5 text-xs dark:bg-slate-700 dark:text-slate-200">type, amount, date, description, category_id</code>.
      </p>

      {result ? (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            result.tone === 'error'
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-300'
              : 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-400/40 dark:bg-brand-500/10 dark:text-brand-300'
          }`}
        >
          {result.tone === 'error' ? <IconDanger /> : <IconCheck />}
          <span>{result.text}</span>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col p-5">
          <CardHeader
            title="Export transactions"
            subtitle="Download all transactions as a CSV file"
          />
          <div className="mt-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              The download contains every transaction currently stored, in a format you can reopen
              in a spreadsheet or re-import later.
            </p>
          </div>
          <div className="mt-5 flex-1" />
          <Button size="lg" disabled={busy} onClick={handleExport}>
            <IconDownload />
            Export CSV
          </Button>
        </Card>

        <Card className="flex flex-col p-5">
          <CardHeader
            title="Import transactions"
            subtitle="Upload a CSV file with the required columns"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => handleFile(event.target.files[0])}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition-colors hover:border-brand-400 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-brand-400 dark:hover:bg-brand-500/10"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <IconUpload />
            </span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {busy ? 'Uploading…' : 'Choose a CSV file'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Required columns: type · amount · date · description · category_id
            </span>
          </button>
        </Card>
      </div>

      <Card className="p-5">
        <CardHeader title="CSV format" subtitle="Row-level validation is handled by the backend" />
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                <th className="px-4 py-2">Column</th>
                <th className="px-4 py-2">Required</th>
                <th className="px-4 py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 dark:divide-slate-800 dark:text-slate-300">
              <tr>
                <td className="px-4 py-2 font-mono text-xs">type</td>
                <td className="px-4 py-2">Yes</td>
                <td className="px-4 py-2">Income or Expense</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">amount</td>
                <td className="px-4 py-2">Yes</td>
                <td className="px-4 py-2">Greater than zero</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">date</td>
                <td className="px-4 py-2">Yes</td>
                <td className="px-4 py-2">YYYY-MM-DD</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">description</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2">Optional text</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">category_id</td>
                <td className="px-4 py-2">Expense: yes</td>
                <td className="px-4 py-2">Income must leave it empty</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}