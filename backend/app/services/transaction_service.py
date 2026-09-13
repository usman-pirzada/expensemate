from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.repositories.category_repository import CategoryRepository
from app.repositories.transaction_repository import TransactionRepository


class TransactionService:
    """Apply transaction business rules before persistence."""

    def __init__(self, db: Session) -> None:
        self.transactions = TransactionRepository(db)
        self.categories = CategoryRepository(db)

    def create(
        self,
        transaction_type: str,
        amount: Decimal,
        transaction_date: date,
        description: str | None = None,
        category_id: int | None = None,
    ) -> Transaction:
        self._validate(transaction_type, amount, transaction_date, category_id)
        if transaction_type == "Income" and self._monthly_income_exists(transaction_date):
            raise ValueError("monthly income is already recorded and locked")
        transaction = self._build_transaction(
            transaction_type, amount, transaction_date, description, category_id
        )
        return self.transactions.create(transaction)

    def create_monthly_income(
        self,
        year: int,
        month: int,
        amount: Decimal,
        description: str | None = None,
    ) -> Transaction:
        self._validate_month(year, month)
        transaction_date = date(year, month, 1)
        if self._monthly_income_exists(transaction_date):
            raise ValueError("monthly income is already recorded and locked")
        self._validate("Income", amount, transaction_date, None)
        transaction = self._build_transaction("Income", amount, transaction_date, description, None)
        return self.transactions.create(transaction)

    def get_monthly_income(self, year: int, month: int) -> Transaction | None:
        self._validate_month(year, month)
        return self.transactions.get_income_by_month(year, month)

    def reset_monthly_income(self, year: int, month: int) -> bool:
        self._validate_month(year, month)
        transaction = self.transactions.get_income_by_month(year, month)
        if transaction is None:
            return False
        self.transactions.delete(transaction)
        return True

    def create_many(
        self,
        transactions: list[tuple[str, Decimal, date, str | None, int | None]],
    ) -> list[Transaction]:
        """Validate every transaction first, then persist the whole batch atomically."""
        pending: list[Transaction] = []
        income_months: set[tuple[int, int]] = set()
        for transaction_type, amount, transaction_date, description, category_id in transactions:
            self._validate(transaction_type, amount, transaction_date, category_id)
            if transaction_type == "Income":
                month_key = (transaction_date.year, transaction_date.month)
                if month_key in income_months or self._monthly_income_exists(transaction_date):
                    raise ValueError("monthly income is already recorded and locked")
                income_months.add(month_key)
            pending.append(
                self._build_transaction(
                    transaction_type, amount, transaction_date, description, category_id
                )
            )
        return self.transactions.create_many(pending)

    def get(self, transaction_id: int) -> Transaction | None:
        return self.transactions.get_by_id(transaction_id)

    def list_all(self) -> list[Transaction]:
        return self.transactions.get_all()

    def list_by_month(self, year: int, month: int) -> list[Transaction]:
        self._validate_month(year, month)
        return self.transactions.get_by_month(year, month)

    def update(
        self,
        transaction_id: int,
        transaction_type: str,
        amount: Decimal,
        transaction_date: date,
        description: str | None = None,
        category_id: int | None = None,
    ) -> Transaction | None:
        transaction = self.transactions.get_by_id(transaction_id)
        if transaction is None:
            return None
        if transaction.type == "Income":
            raise ValueError("monthly income is locked and cannot be edited; reset the month to replace it")
        if transaction_type == "Income":
            raise ValueError("monthly income must be entered through the monthly income action")
        self._validate(transaction_type, amount, transaction_date, category_id)
        transaction.type = transaction_type
        transaction.amount = amount
        transaction.date = transaction_date
        transaction.description = description
        transaction.category_id = category_id
        return self.transactions.update(transaction)

    def delete(self, transaction_id: int) -> bool:
        transaction = self.transactions.get_by_id(transaction_id)
        if transaction is None:
            return False
        if transaction.type == "Income":
            raise ValueError("monthly income is locked; reset the month to remove it")
        self.transactions.delete(transaction)
        return True

    def _monthly_income_exists(self, transaction_date: date) -> bool:
        return self.transactions.get_income_by_month(transaction_date.year, transaction_date.month) is not None

    @staticmethod
    def _build_transaction(
        transaction_type: str,
        amount: Decimal,
        transaction_date: date,
        description: str | None,
        category_id: int | None,
    ) -> Transaction:
        return Transaction(
            type=transaction_type,
            amount=amount,
            date=transaction_date,
            description=description,
            category_id=category_id,
        )

    def _validate(
        self,
        transaction_type: str,
        amount: Decimal,
        transaction_date: date,
        category_id: int | None,
    ) -> None:
        if transaction_type not in {"Income", "Expense"}:
            raise ValueError("transaction type must be Income or Expense")
        if amount <= 0:
            raise ValueError("transaction amount must be greater than zero")
        if not isinstance(transaction_date, date):
            raise ValueError("transaction date is required")

        if transaction_type == "Income" and category_id is not None:
            raise ValueError("income transactions cannot have a category")
        if transaction_type == "Expense":
            if category_id is None:
                raise ValueError("expense transactions require a category")
            if self.categories.get_by_id(category_id) is None:
                raise ValueError("category does not exist")

    @staticmethod
    def _validate_month(year: int, month: int) -> None:
        if year < 2000 or not 1 <= month <= 12:
            raise ValueError("invalid year or month")
