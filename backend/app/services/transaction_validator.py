from datetime import date, datetime
from decimal import Decimal

from app.repositories.category_repository import CategoryRepository


class TransactionValidator:
    """Centralize transaction input and domain-rule validation."""

    MAX_AMOUNT = Decimal("9999999999.99")

    def __init__(self, categories: CategoryRepository) -> None:
        self.categories = categories

    def validate(
        self,
        transaction_type: str,
        amount: Decimal,
        transaction_date: date,
        category_id: int | None,
    ) -> None:
        if transaction_type not in {"Income", "Expense"}:
            raise ValueError("transaction type must be Income or Expense")
        if not isinstance(amount, Decimal) or not amount.is_finite():
            raise ValueError("transaction amount must be a finite decimal")
        if amount <= 0:
            raise ValueError("transaction amount must be greater than zero")
        if amount > self.MAX_AMOUNT:
            raise ValueError("transaction amount exceeds the maximum supported value")
        if isinstance(transaction_date, datetime) or not isinstance(transaction_date, date):
            raise ValueError("transaction date is required")

        if transaction_type == "Income" and category_id is not None:
            raise ValueError("income transactions cannot have a category")
        if transaction_type == "Expense":
            if category_id is None:
                raise ValueError("expense transactions require a category")
            if self.categories.get_by_id(category_id) is None:
                raise ValueError("category does not exist")

    @staticmethod
    def validate_month(year: int, month: int) -> None:
        if year < 2000 or not 1 <= month <= 12:
            raise ValueError("invalid year or month")
