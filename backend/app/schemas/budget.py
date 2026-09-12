from decimal import Decimal

from pydantic import BaseModel, Field


class BudgetCreate(BaseModel):
    year: int = Field(ge=2000)
    month: int = Field(ge=1, le=12)
    overall_amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class BudgetUpdate(BaseModel):
    overall_amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class AllocationCreate(BaseModel):
    category_id: int = Field(gt=0)
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class AllocationUpdate(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class BudgetResponse(BaseModel):
    id: int
    year: int
    month: int
    overall_amount: Decimal

    model_config = {"from_attributes": True}


class AllocationResponse(BaseModel):
    id: int
    budget_id: int
    category_id: int
    amount: Decimal

    model_config = {"from_attributes": True}
