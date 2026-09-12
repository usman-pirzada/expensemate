from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.transaction import Transaction


class TransactionRepository:
    """Provide database operations for transactions."""

    def __init__(self, db: Session) -> None:
        """Initialize the repository with a SQLAlchemy session."""
        self.db = db

    def create(self, transaction: Transaction) -> Transaction:
        """Persist a transaction and return the refreshed entity."""
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        return transaction

    def get_by_id(self, transaction_id: int) -> Transaction | None:
        """Return a transaction by its primary key, or None when not found."""
        return self.db.get(Transaction, transaction_id)

    def get_all(self) -> list[Transaction]:
        """Return all transactions ordered from newest to oldest."""
        statement = select(Transaction).order_by(Transaction.date.desc(), Transaction.id.desc())
        return list(self.db.scalars(statement).all())

    def get_by_month(self, year: int, month: int) -> list[Transaction]:
        """Return transactions belonging to the specified calendar month."""
        from calendar import monthrange

        start_date = date(year, month, 1)
        end_date = date(year, month, monthrange(year, month)[1])
        statement = (
            select(Transaction)
            .where(Transaction.date.between(start_date, end_date))
            .order_by(Transaction.date.desc(), Transaction.id.desc())
        )
        return list(self.db.scalars(statement).all())

    def get_expenses_by_month(self, year: int, month: int) -> list[Transaction]:
        """Return only expense transactions for the specified calendar month."""
        from calendar import monthrange

        start_date = date(year, month, 1)
        end_date = date(year, month, monthrange(year, month)[1])
        statement = (
            select(Transaction)
            .where(
                Transaction.type == "Expense",
                Transaction.date.between(start_date, end_date),
            )
            .order_by(Transaction.date.desc(), Transaction.id.desc())
        )
        return list(self.db.scalars(statement).all())
