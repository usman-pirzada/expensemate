from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.budget import Budget


class BudgetRepository:
    """Provide database operations for monthly budgets."""

    def __init__(self, db: Session) -> None:
        """Initialize the repository with a SQLAlchemy session."""
        self.db = db

    def create(self, budget: Budget) -> Budget:
        """Persist a monthly budget and return the refreshed entity."""
        self.db.add(budget)
        self.db.commit()
        self.db.refresh(budget)
        return budget

    def get_by_id(self, budget_id: int) -> Budget | None:
        """Return a budget by its primary key, or None when not found."""
        return self.db.get(Budget, budget_id)

    def get_by_month(self, year: int, month: int) -> Budget | None:
        """Return the budget for a specific calendar month, if one exists."""
        statement = select(Budget).where(Budget.year == year, Budget.month == month)
        return self.db.scalar(statement)

    def get_all(self) -> list[Budget]:
        """Return all monthly budgets ordered from newest to oldest."""
        statement = select(Budget).order_by(Budget.year.desc(), Budget.month.desc())
        return list(self.db.scalars(statement).all())
