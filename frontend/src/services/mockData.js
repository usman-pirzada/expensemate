// Sample dataset that mirrors the exact response shapes of the FastAPI backend.
// Used only while USE_MOCK is enabled so the UI can be reviewed without a running server.

const CATEGORIES = [
  { id: 1, name: 'Food' },
  { id: 2, name: 'Transport' },
  { id: 3, name: 'Bills' },
  { id: 4, name: 'Shopping' },
  { id: 5, name: 'Entertainment' },
  { id: 6, name: 'Healthcare' },
  { id: 7, name: 'Education' },
  { id: 8, name: 'Other' },
]

const TRANSACTIONS = [
  { id: 1, type: 'Income', amount: 100000, date: '2026-09-01', description: 'Monthly salary', category_id: null, created_at: '2026-09-01T09:00:00' },
  { id: 2, type: 'Income', amount: 20000, date: '2026-09-05', description: 'Freelance project', category_id: null, created_at: '2026-09-05T11:30:00' },
  { id: 3, type: 'Expense', amount: 12000, date: '2026-09-02', description: 'Groceries', category_id: 1, created_at: '2026-09-02T18:00:00' },
  { id: 4, type: 'Expense', amount: 8000, date: '2026-09-08', description: 'Restaurant dinners', category_id: 1, created_at: '2026-09-08T20:00:00' },
  { id: 5, type: 'Expense', amount: 4000, date: '2026-09-12', description: 'Lunch away from home', category_id: 1, created_at: '2026-09-12T13:00:00' },
  { id: 6, type: 'Expense', amount: 6000, date: '2026-09-03', description: 'Fuel', category_id: 2, created_at: '2026-09-03T08:00:00' },
  { id: 7, type: 'Expense', amount: 5000, date: '2026-09-10', description: 'Fuel', category_id: 2, created_at: '2026-09-10T08:00:00' },
  { id: 8, type: 'Expense', amount: 18500, date: '2026-09-04', description: 'Electricity bill', category_id: 3, created_at: '2026-09-04T10:00:00' },
  { id: 9, type: 'Expense', amount: 9000, date: '2026-09-06', description: 'New shoes', category_id: 4, created_at: '2026-09-06T16:00:00' },
  { id: 10, type: 'Expense', amount: 4500, date: '2026-09-09', description: 'Movie night', category_id: 5, created_at: '2026-09-09T21:00:00' },
  { id: 11, type: 'Expense', amount: 3000, date: '2026-09-11', description: 'Pharmacy', category_id: 6, created_at: '2026-09-11T12:00:00' },
  { id: 12, type: 'Expense', amount: 2500, date: '2026-09-07', description: 'Reference books', category_id: 7, created_at: '2026-09-07T15:00:00' },
  { id: 13, type: 'Expense', amount: 2000, date: '2026-09-12', description: 'Miscellaneous', category_id: 8, created_at: '2026-09-12T17:00:00' },
]

const SUMMARY = {
  year: 2026,
  month: 9,
  income: 120000,
  spending: 74500,
  balance: 45500,
  budget: 80000,
  used: 74500,
  remaining: 5500,
  exceeded: 0,
  usage_percentage: 93.1,
}

const CATEGORY_SPENDING = [
  { category_id: 1, spent: 24000 },
  { category_id: 2, spent: 11000 },
  { category_id: 3, spent: 18500 },
  { category_id: 4, spent: 9000 },
  { category_id: 5, spent: 4500 },
  { category_id: 6, spent: 3000 },
  { category_id: 7, spent: 2500 },
  { category_id: 8, spent: 2000 },
]

const CATEGORY_BUDGET_STATUS = [
  { category_id: 1, budget: 25000, spent: 24000, remaining: 1000, exceeded: 0, usage_percentage: 96 },
  { category_id: 2, budget: 20000, spent: 11000, remaining: 9000, exceeded: 0, usage_percentage: 55 },
  { category_id: 3, budget: 15000, spent: 18500, remaining: 0, exceeded: 3500, usage_percentage: 123.3 },
]

const MONTHLY_ALERT = {
  status: 'approaching',
  usage_percentage: 93.1,
  spent: 74500,
  budget: 80000,
}

const CATEGORY_ALERTS = [
  { category_id: 1, status: 'approaching', usage_percentage: 96, spent: 24000, budget: 25000 },
  { category_id: 3, status: 'exceeded', usage_percentage: 123.3, spent: 18500, budget: 15000 },
]

const BUDGET = { id: 21, year: 2026, month: 9, overall_amount: 80000 }

const ALLOCATIONS = [
  { id: 101, budget_id: 21, category_id: 1, amount: 25000 },
  { id: 102, budget_id: 21, category_id: 2, amount: 20000 },
  { id: 103, budget_id: 21, category_id: 3, amount: 15000 },
]

const monthKey = (year, month) => `${year}-${month}`

const isCurrentMonth = (year, month) => monthKey(year, month) === monthKey(SUMMARY.year, SUMMARY.month)

export const mockApi = {
  async getCategories() {
    return CATEGORIES
  },

  async getTransactions(year, month) {
    if (year != null && !isCurrentMonth(year, month)) return []
    return TRANSACTIONS
  },

  async createTransaction(payload) {
    return { id: 99, created_at: new Date().toISOString(), ...payload }
  },

  async updateTransaction(id, payload) {
    return { id, created_at: '2026-09-01T09:00:00', ...payload }
  },

  async deleteTransaction() {
    return undefined
  },

  async getSummary(year, month) {
    return isCurrentMonth(year, month) ? SUMMARY : emptySummary(year, month)
  },

  async getCategorySpending(year, month) {
    return isCurrentMonth(year, month) ? CATEGORY_SPENDING : []
  },

  async getCategoryBudgetStatus(year, month) {
    return isCurrentMonth(year, month) ? CATEGORY_BUDGET_STATUS : []
  },

  async getAlerts(year, month) {
    return isCurrentMonth(year, month)
      ? { monthly: MONTHLY_ALERT, categories: CATEGORY_ALERTS }
      : {
          monthly: { status: 'none', usage_percentage: 0, spent: 0, budget: 0 },
          categories: [],
        }
  },

  async getDashboard(year, month) {
    return {
      year,
      month,
      summary: isCurrentMonth(year, month) ? SUMMARY : emptySummary(year, month),
      budget_id: isCurrentMonth(year, month) ? BUDGET.id : null,
      category_spending: isCurrentMonth(year, month) ? CATEGORY_SPENDING : [],
      category_budget_status: isCurrentMonth(year, month) ? CATEGORY_BUDGET_STATUS : [],
      alerts: {
        monthly: isCurrentMonth(year, month) ? MONTHLY_ALERT : { status: 'none', usage_percentage: 0, spent: 0, budget: 0 },
        categories: isCurrentMonth(year, month) ? CATEGORY_ALERTS : [],
      },
    }
  },

  async getBudget(year, month) {
    return isCurrentMonth(year, month) ? BUDGET : null
  },

  async createBudget(payload) {
    return { id: 99, ...payload }
  },

  async updateBudget(id, overallAmount) {
    return { id, overall_amount: overallAmount }
  },

  async deleteBudget() {
    return undefined
  },

  async getAllocations(budgetId) {
    return ALLOCATIONS
  },

  async createAllocation(budgetId, payload) {
    return { id: 200, budget_id: budgetId, ...payload }
  },

  async updateAllocation(id, amount) {
    return { id, amount }
  },

  async deleteAllocation() {
    return undefined
  },

  async exportCsv() {
    const header = 'type,amount,date,description,category_id'
    const rows = TRANSACTIONS.map((t) =>
      [t.type, t.amount, t.date, t.description || '', t.category_id ?? ''].join(','),
    )
    return [header, ...rows].join('\n')
  },

  async importCsv() {
    return { imported: 5 }
  },
}

function emptySummary(year, month) {
  return {
    year,
    month,
    income: 0,
    spending: 0,
    balance: 0,
    budget: 0,
    used: 0,
    remaining: 0,
    exceeded: 0,
    usage_percentage: 0,
  }
}