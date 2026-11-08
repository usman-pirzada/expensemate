from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.repositories.category_repository import CategoryRepository
from app.repositories.transaction_repository import TransactionRepository
from app.services.transaction_validator import TransactionValidator


class TransactionService:
    """Coordinate transaction use cases and enforce monthly-income policy."""

    def __init__(self, db: Session) -> None:
        self.transactions = TransactionRepository(db)
        self.validator = TransactionValidator(CategoryRepository(db))

    def create(
        self,
        transaction_type: str,
        amount: Decimal,
        transaction_date: date,
        description: str | None = None,
        category_id: int | None = None,
    ) -> Transaction:
        self.validator.validate(transaction_type, amount, transaction_date, category_id)
        if transaction_type == "Income" and self._monthly_income_exists(transaction_date):
            raise ValueError("monthly income is already recorded and locked")
        return self.transactions.create(
            self._build_transaction(transaction_type, amount, transaction_date, description, category_id)
        )

    def create_monthly_income(
        self,
        year: int,
        month: int,
        amount: Decimal,
        description: str | None = None,
    ) -> Transaction:
        self.validator.validate_month(year, month)
        transaction_date = date(year, month, 1)
        if self._monthly_income_exists(transaction_date):
            raise ValueError("monthly income is already recorded and locked")
        self.validator.validate("Income", amount, transaction_date, None)
        return self.transactions.create(
            self._build_transaction("Income", amount, transaction_date, description, None)
        )

    def get_monthly_income(self, year: int, month: int) -> Transaction | None:
        self.validator.validate_month(year, month)
        return self.transactions.get_income_by_month(year, month)

    def reset_monthly_income(self, year: int, month: int) -> bool:
        self.validator.validate_month(year, month)
        transaction = self.transactions.get_income_by_month(year, month)
        if transaction is None:
            return False
        self.transactions.delete(transaction)
        return True

    def create_many(
        self,
        transactions: list[tuple[str, Decimal, date, str | None, int | None]],
    ) -> list[Transaction]:
        """Validate the complete batch before asking the repository to commit it."""
        pending: list[Transaction] = []
        income_months: set[tuple[int, int]] = set()

        for transaction_type, amount, transaction_date, description, category_id in transactions:
            self.validator.validate(transaction_type, amount, transaction_date, category_id)
            if transaction_type == "Income":
                month_key = (transaction_date.year, transaction_date.month)
                if month_key in income_months or self._monthly_income_exists(transaction_date):
                    raise ValueError("monthly income is already recorded and locked")
                income_months.add(month_key)
            pending.append(
                self._build_transaction(transaction_type, amount, transaction_date, description, category_id)
            )

        return self.transactions.create_many(pending)

    def get(self, transaction_id: int) -> Transaction | None:
        return self.transactions.get_by_id(transaction_id)

    def list_all(self) -> list[Transaction]:
        return self.transactions.get_all()

    def list_by_month(self, year: int, month: int) -> list[Transaction]:
        self.validator.validate_month(year, month)
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

        self.validator.validate(transaction_type, amount, transaction_date, category_id)
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
        return self.transactions.get_income_by_month(
            transaction_date.year, transaction_date.month
        ) is not None

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
