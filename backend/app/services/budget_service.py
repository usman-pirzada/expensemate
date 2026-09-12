from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.budget_allocation import BudgetAllocation
from app.repositories.budget_allocation_repository import BudgetAllocationRepository
from app.repositories.budget_repository import BudgetRepository
from app.repositories.category_repository import CategoryRepository


class BudgetService:
    """Apply monthly budget and allocation business rules."""

    def __init__(self, db: Session) -> None:
        self.budgets = BudgetRepository(db)
        self.allocations = BudgetAllocationRepository(db)
        self.categories = CategoryRepository(db)

    def create(self, year: int, month: int, overall_amount: Decimal) -> Budget:
        self._validate_period(year, month)
        self._validate_amount(overall_amount)
        if self.budgets.get_by_month(year, month) is not None:
            raise ValueError("a budget already exists for this month")
        return self.budgets.create(
            Budget(year=year, month=month, overall_amount=overall_amount)
        )

    def get(self, budget_id: int) -> Budget | None:
        return self.budgets.get_by_id(budget_id)

    def get_by_month(self, year: int, month: int) -> Budget | None:
        self._validate_period(year, month)
        return self.budgets.get_by_month(year, month)

    def list_all(self) -> list[Budget]:
        return self.budgets.get_all()

    def update(self, budget_id: int, overall_amount: Decimal) -> Budget | None:
        self._validate_amount(overall_amount)
        budget = self.budgets.get_by_id(budget_id)
        if budget is None:
            return None
        allocated = self._decimal(self.allocations.get_total_for_budget(budget_id))
        if allocated > overall_amount:
            raise ValueError("overall budget cannot be less than allocated amount")
        budget.overall_amount = overall_amount
        return self.budgets.update(budget)

    def delete(self, budget_id: int) -> bool:
        budget = self.budgets.get_by_id(budget_id)
        if budget is None:
            return False
        self.budgets.delete(budget)
        return True

    def add_allocation(
        self,
        budget_id: int,
        category_id: int,
        amount: Decimal,
    ) -> BudgetAllocation:
        self._validate_amount(amount)
        budget = self.budgets.get_by_id(budget_id)
        if budget is None:
            raise ValueError("budget does not exist")
        if self.categories.get_by_id(category_id) is None:
            raise ValueError("category does not exist")
        if self.allocations.get_by_budget_and_category(budget_id, category_id):
            raise ValueError("category is already allocated in this budget")
        self._ensure_within_budget(budget, amount)
        allocation = BudgetAllocation(
            budget_id=budget_id,
            category_id=category_id,
            amount=amount,
        )
        return self.allocations.create(allocation)

    def update_allocation(
        self,
        allocation_id: int,
        amount: Decimal,
    ) -> BudgetAllocation | None:
        self._validate_amount(amount)
        allocation = self.allocations.get_by_id(allocation_id)
        if allocation is None:
            return None
        budget = self.budgets.get_by_id(allocation.budget_id)
        if budget is None:
            raise ValueError("budget does not exist")
        current_total = self._decimal(
            self.allocations.get_total_for_budget(allocation.budget_id)
        )
        if current_total - allocation.amount + amount > budget.overall_amount:
            raise ValueError("allocated amounts cannot exceed the overall budget")
        allocation.amount = amount
        return self.allocations.update(allocation)

    def delete_allocation(self, allocation_id: int) -> bool:
        allocation = self.allocations.get_by_id(allocation_id)
        if allocation is None:
            return False
        self.allocations.delete(allocation)
        return True

    def get_allocations(self, budget_id: int) -> list[BudgetAllocation]:
        return self.allocations.get_by_budget(budget_id)

    def get_allocation_total(self, budget_id: int) -> Decimal:
        return self._decimal(self.allocations.get_total_for_budget(budget_id))

    def _ensure_within_budget(self, budget: Budget, amount: Decimal) -> None:
        allocated = self._decimal(self.allocations.get_total_for_budget(budget.id))
        if allocated + amount > budget.overall_amount:
            raise ValueError("allocated amounts cannot exceed the overall budget")

    @staticmethod
    def _validate_amount(amount: Decimal) -> None:
        if amount <= 0:
            raise ValueError("amount must be greater than zero")

    @staticmethod
    def _validate_period(year: int, month: int) -> None:
        if year < 2000 or not 1 <= month <= 12:
            raise ValueError("invalid year or month")

    @staticmethod
    def _decimal(value) -> Decimal:
        return Decimal(str(value or 0))
