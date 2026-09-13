from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.budget import (
    AllocationCreate,
    AllocationResponse,
    AllocationUpdate,
    BudgetCreate,
    BudgetResponse,
    BudgetUpdate,
)
from app.services.budget_service import BudgetService

router = APIRouter(prefix="/budgets", tags=["budgets"])


def service(db: Session) -> BudgetService:
    return BudgetService(db)


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(payload: BudgetCreate, db: Session = Depends(get_db)):
    try:
        return service(db).create(**payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("", response_model=list[BudgetResponse])
def list_budgets(db: Session = Depends(get_db)):
    return service(db).list_all()


@router.get("/month/{year}/{month}", response_model=BudgetResponse)
def get_budget_by_month(year: int, month: int, db: Session = Depends(get_db)):
    try:
        budget = service(db).get_by_month(year, month)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if budget is None:
        raise HTTPException(status_code=404, detail="budget not found")
    return budget


@router.get("/{budget_id}", response_model=BudgetResponse)
def get_budget(budget_id: int, db: Session = Depends(get_db)):
    budget = service(db).get(budget_id)
    if budget is None:
        raise HTTPException(status_code=404, detail="budget not found")
    return budget


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(budget_id: int, payload: BudgetUpdate, db: Session = Depends(get_db)):
    try:
        budget = service(db).update(budget_id, payload.overall_amount)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if budget is None:
        raise HTTPException(status_code=404, detail="budget not found")
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(budget_id: int, db: Session = Depends(get_db)):
    if not service(db).delete(budget_id):
        raise HTTPException(status_code=404, detail="budget not found")


@router.post("/{budget_id}/allocations", response_model=AllocationResponse, status_code=status.HTTP_201_CREATED)
def add_allocation(budget_id: int, payload: AllocationCreate, db: Session = Depends(get_db)):
    try:
        return service(db).add_allocation(budget_id, **payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{budget_id}/allocations", response_model=list[AllocationResponse])
def list_allocations(budget_id: int, db: Session = Depends(get_db)):
    if service(db).get(budget_id) is None:
        raise HTTPException(status_code=404, detail="budget not found")
    return service(db).get_allocations(budget_id)


@router.put("/allocations/{allocation_id}", response_model=AllocationResponse)
def update_allocation(allocation_id: int, payload: AllocationUpdate, db: Session = Depends(get_db)):
    try:
        allocation = service(db).update_allocation(allocation_id, payload.amount)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if allocation is None:
        raise HTTPException(status_code=404, detail="allocation not found")
    return allocation


@router.delete("/allocations/{allocation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_allocation(allocation_id: int, db: Session = Depends(get_db)):
    if not service(db).delete_allocation(allocation_id):
        raise HTTPException(status_code=404, detail="allocation not found")
