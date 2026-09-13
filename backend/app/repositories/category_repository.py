from sqlalchemy import case, select
from sqlalchemy.orm import Session

from app.models.category import Category


class CategoryRepository:
    """Provide database operations for predefined transaction categories."""

    def __init__(self, db: Session) -> None:
        """Initialize the repository with a SQLAlchemy session."""
        self.db = db

    def get_all(self) -> list[Category]:
        """Return all categories alphabetically, with Other listed last."""
        statement = select(Category).order_by(
            case((Category.name == "Other", 1), else_=0),
            Category.name,
        )
        return list(self.db.scalars(statement).all())

    def get_by_id(self, category_id: int) -> Category | None:
        """Return a category by its primary key, or None when not found."""
        return self.db.get(Category, category_id)

    def get_by_name(self, name: str) -> Category | None:
        """Return a category by its exact name, or None when not found."""
        statement = select(Category).where(Category.name == name)
        return self.db.scalar(statement)
