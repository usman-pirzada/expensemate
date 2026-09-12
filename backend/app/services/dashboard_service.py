from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.services.alert_service import AlertService
from app.services.analytics_service import AnalyticsService
from app.services.budget_service import BudgetService
from app.services.transaction_service import TransactionService


class DashboardService:
    """Assemble the data needed by the dashboard in one application-level call."""

    def __init__(self, db: Session) -> None:
        self.transactions = TransactionService(db)
        self.budgets = BudgetService(db)
        self.analytics = AnalyticsService(db)
        self.alerts = AlertService(db)

    def get_monthly_dashboard(self, year: int, month: int) -> dict:
        """Return monthly financial summary, budget status, analytics, and alerts."""
        summary = self.analytics.monthly_summary(year, month)
        budget = self.budgets.get_by_month(year, month)
        category_spending = self.analytics.category_spending(year, month)
        category_budget_status = self.analytics.category_budget_status(year, month)
        monthly_alert = self.alerts.monthly_alert(year, month)
        category_alerts = self.alerts.category_alerts(year, month)

        return {
            "year": year,
            "month": month,
            "summary": summary,
            "budget_id": budget.id if budget else None,
            "category_spending": category_spending,
            "category_budget_status": category_budget_status,
            "alerts": {
                "monthly": monthly_alert,
                "categories": category_alerts,
            },
        }
