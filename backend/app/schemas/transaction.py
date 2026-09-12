from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TransactionCreate(BaseModel):
    type: str
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    date: date
    description: str | None = Field(default=None, max_length=255)
    category_id: int | None = None

    @field_validator("type")
    @classmethod
    def validate_type(cls, value: str) -> str:
        if value not in {"Income", "Expense"}:
            raise ValueError("transaction type must be Income or Expense")
        return value


class TransactionResponse(TransactionCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
