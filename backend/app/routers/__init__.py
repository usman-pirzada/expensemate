from app.routers.analytics_routes import router as analytics_router
from app.routers.budget_routes import router as budget_router
from app.routers.category_routes import router as category_router
from app.routers.csv_routes import router as csv_router
from app.routers.income_routes import router as income_router
from app.routers.transaction_routes import router as transaction_router

__all__ = [
    "analytics_router",
    "budget_router",
    "category_router",
    "csv_router",
    "income_router",
    "transaction_router",
]
