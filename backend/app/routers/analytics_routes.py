from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.analytics import MonthlySummaryResponse
from app.services.alert_service import AlertService
from app.services.analytics_service import AnalyticsService
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary/{year}/{month}", response_model=MonthlySummaryResponse)
def monthly_summary(year: int, month: int, db: Session = Depends(get_db)):
    try:
        return AnalyticsService(db).monthly_summary(year, month)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/categories/{year}/{month}")
def category_spending(year: int, month: int, db: Session = Depends(get_db)):
    try:
        return AnalyticsService(db).category_spending(year, month)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/category-budgets/{year}/{month}")
def category_budget_status(year: int, month: int, db: Session = Depends(get_db)):
    try:
        return AnalyticsService(db).category_budget_status(year, month)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/alerts/{year}/{month}")
def monthly_alerts(year: int, month: int, db: Session = Depends(get_db)):
    try:
        svc = AlertService(db)
        return {
            "monthly": svc.monthly_alert(year, month),
            "categories": svc.category_alerts(year, month),
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/dashboard/{year}/{month}")
def dashboard(year: int, month: int, db: Session = Depends(get_db)):
    try:
        return DashboardService(db).get_monthly_dashboard(year, month)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
