from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.budget_allocation import BudgetAllocation


class BudgetAllocationRepository:
    """Provide database operations for category budget allocations."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, allocation: BudgetAllocation) -> BudgetAllocation:
        self.db.add(allocation)
        self.db.commit()
        self.db.refresh(allocation)
        return allocation

    def get_by_id(self, allocation_id: int) -> BudgetAllocation | None:
        return self.db.get(BudgetAllocation, allocation_id)

    def get_by_budget(self, budget_id: int) -> list[BudgetAllocation]:
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
        statement = select(BudgetAllocation).where(
            BudgetAllocation.budget_id == budget_id,
            BudgetAllocation.category_id == category_id,
        )
        return self.db.scalar(statement)

    def get_total_for_budget(self, budget_id: int):
        from sqlalchemy import func

        statement = select(func.coalesce(func.sum(BudgetAllocation.amount), 0)).where(
            BudgetAllocation.budget_id == budget_id
        )
        return self.db.scalar(statement)

    def update(self, allocation: BudgetAllocation) -> BudgetAllocation:
        self.db.commit()
        self.db.refresh(allocation)
        return allocation

    def delete(self, allocation: BudgetAllocation) -> None:
        self.db.delete(allocation)
        self.db.commit()
