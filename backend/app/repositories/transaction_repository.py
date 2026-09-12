from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.transaction import Transaction


class TransactionRepository:
    """Provide database operations for transactions."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, transaction: Transaction) -> Transaction:
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        return transaction

    def create_many(self, transactions: list[Transaction]) -> list[Transaction]:
        """Persist a batch atomically so a failed import cannot leave partial data."""
        self.db.add_all(transactions)
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        for transaction in transactions:
            self.db.refresh(transaction)
        return transactions

    def get_by_id(self, transaction_id: int) -> Transaction | None:
        return self.db.get(Transaction, transaction_id)

    def get_all(self) -> list[Transaction]:
        statement = select(Transaction).order_by(Transaction.date.desc(), Transaction.id.desc())
        return list(self.db.scalars(statement).all())

    def get_by_month(self, year: int, month: int) -> list[Transaction]:
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

    def update(self, transaction: Transaction) -> Transaction:
        self.db.commit()
        self.db.refresh(transaction)
        return transaction

    def delete(self, transaction: Transaction) -> None:
        self.db.delete(transaction)
        self.db.commit()
