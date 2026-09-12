from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.budget_allocation import BudgetAllocation
    from app.models.transaction import Transaction


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)

    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="category",
    )
    budget_allocations: Mapped[list["BudgetAllocation"]] = relationship(
        back_populates="category",
        cascade="all, delete-orphan",
    )
