from pydantic import BaseModel


class MonthlySummaryResponse(BaseModel):
    year: int
    month: int
    income: float
    spending: float
    balance: float
    budget: float
    used: float
    remaining: float
    exceeded: float
    usage_percentage: float
