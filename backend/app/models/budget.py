from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Integer, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.budget_allocation import BudgetAllocation


class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    overall_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    allocations: Mapped[list["BudgetAllocation"]] = relationship(
        back_populates="budget",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("year", "month", name="uq_budgets_year_month"),
        CheckConstraint("month BETWEEN 1 AND 12", name="ck_budgets_month"),
        CheckConstraint("year >= 2000", name="ck_budgets_year"),
        CheckConstraint("overall_amount > 0", name="ck_budgets_amount_positive"),
    )
