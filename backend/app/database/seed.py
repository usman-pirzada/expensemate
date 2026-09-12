from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Category

DEFAULT_CATEGORIES = (
    "Food",
    "Transport",
    "Bills",
    "Shopping",
    "Entertainment",
    "Healthcare",
    "Education",
    "Other",
)


def seed_categories(db: Session) -> None:
    """Insert predefined expense categories that do not already exist."""
    existing = set(db.scalars(select(Category.name)).all())

    for name in DEFAULT_CATEGORIES:
        if name not in existing:
            db.add(Category(name=name))

    db.commit()
