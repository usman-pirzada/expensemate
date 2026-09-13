// Real HTTP layer against the FastAPI backend. In the production Docker image,
// the frontend and API share the same origin, so use a relative /api URL.
// During Vite development, use the local FastAPI server unless overridden.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api')

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function request(path, { method = 'GET', body, headers } = {}) {
  const options = { method, headers: { ...headers } }
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options)

  if (response.status === 204) return undefined

  let data = null
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  if (!response.ok) {
    const detail = typeof data === 'object' && data !== null ? data.detail : data
    throw new ApiError(response.status, detail || `Request failed (${response.status})`)
  }

  return data
}

export const api = {
  getCategories: () => request('/categories'),

  listTransactions: (year, month) =>
    request(`/transactions${year != null ? `?year=${year}&month=${month}` : ''}`),
  createTransaction: (payload) => request('/transactions', { method: 'POST', body: payload }),
  getTransaction: (id) => request(`/transactions/${id}`),
  updateTransaction: (id, payload) =>
    request(`/transactions/${id}`, { method: 'PUT', body: payload }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),

  getMonthlyIncome: (year, month) => request(`/income/${year}/${month}`),
  createMonthlyIncome: (year, month, payload) =>
    request(`/income/${year}/${month}`, { method: 'POST', body: payload }),
  resetMonthlyIncome: (year, month) =>
    request(`/income/${year}/${month}`, { method: 'DELETE' }),

  listBudgets: () => request('/budgets'),
  getBudgetByMonth: (year, month) => request(`/budgets/month/${year}/${month}`),
  getBudget: (id) => request(`/budgets/${id}`),
  createBudget: (payload) => request('/budgets', { method: 'POST', body: payload }),
  updateBudget: (id, overall_amount) =>
    request(`/budgets/${id}`, { method: 'PUT', body: { overall_amount } }),
  deleteBudget: (id) => request(`/budgets/${id}`, { method: 'DELETE' }),

  listAllocations: (budgetId) => request(`/budgets/${budgetId}/allocations`),
  createAllocation: (budgetId, payload) =>
    request(`/budgets/${budgetId}/allocations`, { method: 'POST', body: payload }),
  updateAllocation: (allocationId, amount) =>
    request(`/budgets/allocations/${allocationId}`, { method: 'PUT', body: { amount } }),
  deleteAllocation: (allocationId) => request(`/budgets/allocations/${allocationId}`, { method: 'DELETE' }),

  getSummary: (year, month) => request(`/analytics/summary/${year}/${month}`),
  getCategorySpending: (year, month) => request(`/analytics/categories/${year}/${month}`),
  getCategoryBudgetStatus: (year, month) =>
    request(`/analytics/category-budgets/${year}/${month}`),
  getAlerts: (year, month) => request(`/analytics/alerts/${year}/${month}`),
  getDashboard: (year, month) => request(`/analytics/dashboard/${year}/${month}`),

  exportCsv: () => request('/transactions/csv/export'),
  importCsv: (content) => request('/transactions/csv/import', { method: 'POST', body: { content } }),
}
