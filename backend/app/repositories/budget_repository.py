from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.budget import Budget


class BudgetRepository:
    """Provide database operations for monthly budgets."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, budget: Budget) -> Budget:
        self.db.add(budget)
        self.db.commit()
        self.db.refresh(budget)
        return budget

    def get_by_id(self, budget_id: int) -> Budget | None:
        return self.db.get(Budget, budget_id)

    def get_by_month(self, year: int, month: int) -> Budget | None:
        statement = select(Budget).where(Budget.year == year, Budget.month == month)
        return self.db.scalar(statement)

    def get_all(self) -> list[Budget]:
        statement = select(Budget).order_by(Budget.year.desc(), Budget.month.desc())
        return list(self.db.scalars(statement).all())

    def update(self, budget: Budget) -> Budget:
        self.db.commit()
        self.db.refresh(budget)
        return budget

    def delete(self, budget: Budget) -> None:
        self.db.delete(budget)
        self.db.commit()
