from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.csv_service import CSVService

router = APIRouter(prefix="/transactions/csv", tags=["csv"])


class CSVImportRequest(BaseModel):
    content: str


@router.get("/export", response_class=PlainTextResponse)
def export_transactions(db: Session = Depends(get_db)):
    return CSVService(db).export_transactions()


@router.post("/import")
def import_transactions(payload: CSVImportRequest, db: Session = Depends(get_db)):
    try:
        imported = CSVService(db).import_transactions(payload.content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"imported": imported}
