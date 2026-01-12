from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


class ExpenseBase(BaseModel):
    amount: Decimal
    date: date
    reason: str
    notes: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    amount: Optional[Decimal] = None
    date: Optional[date] = None
    reason: Optional[str] = None
    notes: Optional[str] = None


class CreatorInfo(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class ExpenseResponse(BaseModel):
    id: int
    amount: Decimal
    date: date
    reason: str
    notes: Optional[str] = None
    created_by: int
    creator: Optional[CreatorInfo] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExpenseListResponse(BaseModel):
    expenses: List[ExpenseResponse]
    total: int


class ExpenseSummary(BaseModel):
    period: str
    total_amount: Decimal
    count: int


class ExpenseSummaryResponse(BaseModel):
    start_date: date
    end_date: date
    period_type: str
    total_expenses: Decimal
    expense_count: int
    expenses_by_period: List[ExpenseSummary]
