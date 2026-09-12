from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.budget_allocation import BudgetAllocation


class BudgetAllocationRepository:
    """Provide database operations for category budget allocations."""

    def __init__(self, db: Session) -> None:
        """Initialize the repository with a SQLAlchemy session."""
        self.db = db

    def create(self, allocation: BudgetAllocation) -> BudgetAllocation:
        """Persist an allocation and return the refreshed entity."""
        self.db.add(allocation)
        self.db.commit()
        self.db.refresh(allocation)
        return allocation

    def get_by_id(self, allocation_id: int) -> BudgetAllocation | None:
        """Return an allocation by its primary key, or None when not found."""
        return self.db.get(BudgetAllocation, allocation_id)

    def get_by_budget(self, budget_id: int) -> list[BudgetAllocation]:
        """Return all category allocations belonging to a budget."""
        statement = (
            select(BudgetAllocation)
            .where(BudgetAllocation.budget_id == budget_id)
            .order_by(BudgetAllocation.category_id)
        )
        return list(self.db.scalars(statement).all())

    def get_by_budget_and_category(
        self,
        budget_id: int,
        category_id: int,
    ) -> BudgetAllocation | None:
        """Return an allocation for a budget/category pair, if one exists."""
        statement = select(BudgetAllocation).where(
            BudgetAllocation.budget_id == budget_id,
            BudgetAllocation.category_id == category_id,
        )
        return self.db.scalar(statement)

    def get_total_for_budget(self, budget_id: int):
        """Return the total allocated amount for a budget."""
        from sqlalchemy import func

        statement = select(func.coalesce(func.sum(BudgetAllocation.amount), 0)).where(
            BudgetAllocation.budget_id == budget_id
        )
        return self.db.scalar(statement)
