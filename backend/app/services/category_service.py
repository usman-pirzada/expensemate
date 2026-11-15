from sqlalchemy.orm import Session

from app.models.category import Category
from app.repositories.category_repository import CategoryRepository


class CategoryService:
    """Expose category use cases to API controllers."""

    def __init__(self, db: Session) -> None:
        self.categories = CategoryRepository(db)

    def list_categories(self) -> list[Category]:
        """Return categories in the repository's canonical display order."""
        return self.categories.get_all()
