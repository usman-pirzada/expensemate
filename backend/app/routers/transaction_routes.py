from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/transactions", tags=["transactions"])


def service(db: Session) -> TransactionService:
    return TransactionService(db)


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    try:
        return service(db).create(**payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("", response_model=list[TransactionResponse])
def list_transactions(
    year: int | None = Query(default=None, ge=2000),
    month: int | None = Query(default=None, ge=1, le=12),
    db: Session = Depends(get_db),
):
    if (year is None) != (month is None):
        raise HTTPException(status_code=400, detail="year and month must be provided together")
    svc = service(db)
    return svc.list_all() if year is None else svc.list_by_month(year, month)


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = service(db).get(transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="transaction not found")
    return transaction


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(transaction_id: int, payload: TransactionCreate, db: Session = Depends(get_db)):
    try:
        transaction = service(db).update(transaction_id, **payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if transaction is None:
        raise HTTPException(status_code=404, detail="transaction not found")
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    if not service(db).delete(transaction_id):
        raise HTTPException(status_code=404, detail="transaction not found")
