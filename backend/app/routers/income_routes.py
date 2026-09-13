from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.transaction import TransactionResponse
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/income", tags=["income"])


class MonthlyIncomeCreate(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    description: str | None = Field(default=None, max_length=255)


@router.get("/{year}/{month}", response_model=TransactionResponse | None)
def get_monthly_income(year: int, month: int, db: Session = Depends(get_db)):
    try:
        return TransactionService(db).get_monthly_income(year, month)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{year}/{month}", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_monthly_income(
    year: int,
    month: int,
    payload: MonthlyIncomeCreate,
    db: Session = Depends(get_db),
):
    try:
        return TransactionService(db).create_monthly_income(
            year, month, payload.amount, payload.description
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{year}/{month}", status_code=status.HTTP_204_NO_CONTENT)
def reset_monthly_income(year: int, month: int, db: Session = Depends(get_db)):
    try:
        if not TransactionService(db).reset_monthly_income(year, month):
            raise HTTPException(status_code=404, detail="monthly income not found")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
