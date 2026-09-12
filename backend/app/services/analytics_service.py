from decimal import Decimal

from sqlalchemy.orm import Session

from app.repositories.budget_allocation_repository import BudgetAllocationRepository
from app.repositories.budget_repository import BudgetRepository
from app.repositories.transaction_repository import TransactionRepository


class AnalyticsService:
    """Calculate dashboard and monthly budget analytics."""

    def __init__(self, db: Session) -> None:
        self.transactions = TransactionRepository(db)
        self.budgets = BudgetRepository(db)
        self.allocations = BudgetAllocationRepository(db)

    def monthly_summary(self, year: int, month: int) -> dict[str, Decimal | int | str]:
        if year < 2000 or not 1 <= month <= 12:
            raise ValueError("invalid year or month")

        transactions = self.transactions.get_by_month(year, month)
        income = sum(
            (transaction.amount for transaction in transactions if transaction.type == "Income"),
            Decimal("0"),
        )
        spending = sum(
            (transaction.amount for transaction in transactions if transaction.type == "Expense"),
            Decimal("0"),
        )
        budget = self.budgets.get_by_month(year, month)
        overall_budget = budget.overall_amount if budget else Decimal("0")
        remaining = max(overall_budget - spending, Decimal("0"))
        exceeded = max(spending - overall_budget, Decimal("0"))
        percentage = (
            (spending / overall_budget * Decimal("100"))
            if overall_budget > 0
            else Decimal("0")
        )

        return {
            "year": year,
            "month": month,
            "income": income,
            "spending": spending,
            "balance": income - spending,
            "budget": overall_budget,
            "used": min(spending, overall_budget),
            "remaining": remaining,
            "exceeded": exceeded,
            "usage_percentage": percentage,
        }

    def category_spending(self, year: int, month: int) -> list[dict[str, Decimal | int]]:
        transactions = self.transactions.get_expenses_by_month(year, month)
        totals: dict[int, Decimal] = {}
        for transaction in transactions:
            if transaction.category_id is not None:
                totals[transaction.category_id] = totals.get(
                    transaction.category_id, Decimal("0")
                ) + transaction.amount

        return [
            {"category_id": category_id, "spent": amount}
            for category_id, amount in sorted(totals.items())
        ]

    def category_budget_status(
        self,
        year: int,
        month: int,
    ) -> list[dict[str, Decimal | int]]:
        budget = self.budgets.get_by_month(year, month)
        if budget is None:
            return []

        spending = {
            item["category_id"]: item["spent"]
            for item in self.category_spending(year, month)
        }
        result = []
        for allocation in self.allocations.get_by_budget(budget.id):
            spent = spending.get(allocation.category_id, Decimal("0"))
            result.append(
                {
                    "category_id": allocation.category_id,
                    "budget": allocation.amount,
                    "spent": spent,
                    "remaining": max(allocation.amount - spent, Decimal("0")),
                    "exceeded": max(spent - allocation.amount, Decimal("0")),
                    "usage_percentage": (
                        spent / allocation.amount * Decimal("100")
                    ),
                }
            )
        return result
