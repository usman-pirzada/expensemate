// Domain service: pages talk to this module only.
//
// When USE_MOCK is true, every function returns sample data so the UI can be
// reviewed without a running backend. Flip USE_MOCK to false to talk to the
// real FastAPI server (see ./api.js).

import { api, ApiError } from './api'
import { mockApi } from './mockData'

export const USE_MOCK = true

const normalize = (fn) => async (...args) => {
  if (USE_MOCK) return fn(...args)
  return mockToReal(fn(...args))
}

// When the real backend is used, the JSON layer is returned directly.
function mockToReal(promise) {
  return promise
}

export async function getCategories() {
  if (USE_MOCK) return mockApi.getCategories()
  return api.getCategories()
}

export async function getTransactions(year, month) {
  if (USE_MOCK) return mockApi.getTransactions(year, month)
  return api.listTransactions(year, month)
}

export async function createTransaction(payload) {
  if (USE_MOCK) return mockApi.createTransaction(payload)
  return api.createTransaction(payload)
}

export async function updateTransaction(id, payload) {
  if (USE_MOCK) return mockApi.updateTransaction(id, payload)
  return api.updateTransaction(id, payload)
}

export async function deleteTransaction(id) {
  if (USE_MOCK) return mockApi.deleteTransaction(id)
  return api.deleteTransaction(id)
}

export async function getMonthlySummary(year, month) {
  if (USE_MOCK) return mockApi.getSummary(year, month)
  return api.getSummary(year, month)
}

export async function getCategorySpending(year, month) {
  if (USE_MOCK) return mockApi.getCategorySpending(year, month)
  return api.getCategorySpending(year, month)
}

export async function getCategoryBudgetStatus(year, month) {
  if (USE_MOCK) return mockApi.getCategoryBudgetStatus(year, month)
  return api.getCategoryBudgetStatus(year, month)
}

export async function getAlerts(year, month) {
  if (USE_MOCK) return mockApi.getAlerts(year, month)
  return api.getAlerts(year, month)
}

export async function getDashboard(year, month) {
  if (USE_MOCK) return mockApi.getDashboard(year, month)
  return api.getDashboard(year, month)
}

/** Returns the budget for the month, or null when none exists. */
export async function getBudget(year, month) {
  if (USE_MOCK) return mockApi.getBudget(year, month)
  try {
    return await api.getBudgetByMonth(year, month)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function createBudget(year, month, overallAmount) {
  const payload = { year, month, overall_amount: overallAmount }
  if (USE_MOCK) return mockApi.createBudget(payload)
  return api.createBudget(payload)
}

export async function updateBudget(id, overallAmount) {
  if (USE_MOCK) return mockApi.updateBudget(id, overallAmount)
  return api.updateBudget(id, overallAmount)
}

export async function deleteBudget(id) {
  if (USE_MOCK) return mockApi.deleteBudget(id)
  return api.deleteBudget(id)
}

export async function getAllocations(budgetId) {
  if (USE_MOCK) return mockApi.getAllocations(budgetId)
  return api.listAllocations(budgetId)
}

export async function createAllocation(budgetId, categoryId, amount) {
  const payload = { category_id: categoryId, amount }
  if (USE_MOCK) return mockApi.createAllocation(budgetId, payload)
  return api.createAllocation(budgetId, payload)
}

export async function updateAllocation(allocationId, amount) {
  if (USE_MOCK) return mockApi.updateAllocation(allocationId, amount)
  return api.updateAllocation(allocationId, amount)
}

export async function deleteAllocation(allocationId) {
  if (USE_MOCK) return mockApi.deleteAllocation(allocationId)
  return api.deleteAllocation(allocationId)
}

export async function exportCsv() {
  if (USE_MOCK) return mockApi.exportCsv()
  return api.exportCsv()
}

export async function importCsv(content) {
  if (USE_MOCK) return mockApi.importCsv(content)
  return api.importCsv(content)
}