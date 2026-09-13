// Fixed palette used for category pie slices and bar segments.
export const CATEGORY_COLORS = [
  '#10b981',
  '#6366f1',
  '#f59e0b',
  '#ef4444',
  '#0ea5e9',
  '#ec4899',
  '#8b5cf6',
  '#e7c558',
]

export function categoryColor(index) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}