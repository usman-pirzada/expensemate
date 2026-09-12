from decimal import Decimal

from sqlalchemy.orm import Session

from app.repositories.budget_allocation_repository import BudgetAllocationRepository
from app.repositories.budget_repository import BudgetRepository
from app.repositories.transaction_repository import TransactionRepository


class AlertService:
    """Determine budget alert states from current spending."""

    APPROACHING_THRESHOLD = Decimal("90")
    EXCEEDED_THRESHOLD = Decimal("100")

    def __init__(self, db: Session) -> None:
        self.transactions = TransactionRepository(db)
        self.budgets = BudgetRepository(db)
        self.allocations = BudgetAllocationRepository(db)

    def monthly_alert(self, year: int, month: int) -> dict[str, Decimal | str]:
        budget = self.budgets.get_by_month(year, month)
        if budget is None:
            return {
                "status": "none",
                "usage_percentage": Decimal("0"),
                "spent": Decimal("0"),
                "budget": Decimal("0"),
            }

        spent = sum(
            (
                transaction.amount
                for transaction in self.transactions.get_expenses_by_month(year, month)
            ),
            Decimal("0"),
        )
        percentage = spent / budget.overall_amount * Decimal("100")
        status = "exceeded" if percentage >= self.EXCEEDED_THRESHOLD else (
            "approaching" if percentage >= self.APPROACHING_THRESHOLD else "none"
        )
        return {
            "status": status,
            "usage_percentage": percentage,
            "spent": spent,
            "budget": budget.overall_amount,
        }

    def category_alerts(self, year: int, month: int) -> list[dict[str, Decimal | int | str]]:
        budget = self.budgets.get_by_month(year, month)
        if budget is None:
            return []

        spending = {}
        for transaction in self.transactions.get_expenses_by_month(year, month):
            if transaction.category_id is not None:
                spending[transaction.category_id] = spending.get(
                    transaction.category_id, Decimal("0")
                ) + transaction.amount

        alerts = []
        for allocation in self.allocations.get_by_budget(budget.id):
            spent = spending.get(allocation.category_id, Decimal("0"))
            percentage = spent / allocation.amount * Decimal("100")
            if percentage >= self.EXCEEDED_THRESHOLD:
                status = "exceeded"
            elif percentage >= self.APPROACHING_THRESHOLD:
                status = "approaching"
            else:
                status = "none"
            if status != "none":
                alerts.append(
                    {
                        "category_id": allocation.category_id,
                        "status": status,
                        "usage_percentage": percentage,
                        "spent": spent,
                        "budget": allocation.amount,
                    }
                )
        return alerts
