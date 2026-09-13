from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.budget import Budget
    from app.models.category import Category


class BudgetAllocation(Base):
    __tablename__ = "budget_allocations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    budget_id: Mapped[int] = mapped_column(
        ForeignKey("budgets.id", ondelete="CASCADE"),
        nullable=False,
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    budget: Mapped["Budget"] = relationship(back_populates="allocations")
    category: Mapped["Category"] = relationship(back_populates="budget_allocations")

    __table_args__ = (
        UniqueConstraint(
            "budget_id",
            "category_id",
            name="uq_budget_allocations_budget_category",
        ),
        CheckConstraint("amount > 0", name="ck_budget_allocations_amount_positive"),
    )
