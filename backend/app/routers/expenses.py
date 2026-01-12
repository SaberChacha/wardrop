from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import asc, desc, func
from typing import Optional, Literal
from datetime import date, timedelta

from ..database import get_db
from ..models.expense import Expense
from ..schemas.expense import (
    ExpenseCreate, 
    ExpenseUpdate, 
    ExpenseResponse, 
    ExpenseListResponse,
    ExpenseSummaryResponse,
    ExpenseSummary
)
from .auth import get_admin_user

router = APIRouter()


@router.get("/", response_model=ExpenseListResponse)
async def get_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    sort_by: Optional[str] = Query("date", description="Field to sort by: date, amount, created_at"),
    sort_order: Optional[Literal["asc", "desc"]] = Query("desc", description="Sort order"),
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)
):
    """Get all expenses with optional filters, sorting, and pagination (admin only)"""
    query = db.query(Expense).options(joinedload(Expense.creator))
    
    if start_date:
        query = query.filter(Expense.date >= start_date)
    
    if end_date:
        query = query.filter(Expense.date <= end_date)
    
    total = query.count()
    
    # Apply sorting
    sort_column = getattr(Expense, sort_by, Expense.date)
    if sort_order == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))
    
    expenses = query.offset(skip).limit(limit).all()
    
    return {"expenses": expenses, "total": total}


@router.get("/summary", response_model=ExpenseSummaryResponse)
async def get_expenses_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    period: str = Query("monthly", regex="^(daily|monthly|yearly)$"),
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)
):
    """Get expenses summary by period (admin only)"""
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=365)
    
    # Get expenses grouped by period
    if period == "daily":
        period_func = func.date_trunc('day', Expense.date)
    elif period == "yearly":
        period_func = func.date_trunc('year', Expense.date)
    else:  # monthly
        period_func = func.date_trunc('month', Expense.date)
    
    expenses_query = db.query(
        period_func.label("period"),
        func.sum(Expense.amount).label("total_amount"),
        func.count(Expense.id).label("count")
    ).filter(
        Expense.date >= start_date,
        Expense.date <= end_date
    ).group_by("period").order_by("period").all()
    
    expenses_by_period = [
        ExpenseSummary(
            period=row.period.strftime("%Y-%m-%d") if row.period else "Unknown",
            total_amount=float(row.total_amount or 0),
            count=row.count
        )
        for row in expenses_query
    ]
    
    total_expenses = sum(e.total_amount for e in expenses_by_period)
    expense_count = sum(e.count for e in expenses_by_period)
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "period_type": period,
        "total_expenses": total_expenses,
        "expense_count": expense_count,
        "expenses_by_period": expenses_by_period
    }


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)
):
    """Get a specific expense by ID (admin only)"""
    expense = db.query(Expense).options(
        joinedload(Expense.creator)
    ).filter(Expense.id == expense_id).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.post("/", response_model=ExpenseResponse)
async def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)
):
    """Create a new expense (admin only)"""
    db_expense = Expense(
        amount=expense.amount,
        date=expense.date,
        reason=expense.reason,
        notes=expense.notes,
        created_by=current_user.id
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    # Reload with relationships
    return db.query(Expense).options(
        joinedload(Expense.creator)
    ).filter(Expense.id == db_expense.id).first()


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: int,
    expense: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)
):
    """Update an existing expense (admin only)"""
    db_expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    update_data = expense.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_expense, field, value)
    
    db.commit()
    db.refresh(db_expense)
    
    return db.query(Expense).options(
        joinedload(Expense.creator)
    ).filter(Expense.id == db_expense.id).first()


@router.delete("/{expense_id}")
async def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)
):
    """Delete an expense (admin only)"""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}


@router.post("/bulk-delete")
async def bulk_delete_expenses(
    ids: list[int],
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)
):
    """Delete multiple expenses by IDs (admin only)"""
    deleted_count = db.query(Expense).filter(Expense.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    return {"message": f"{deleted_count} expenses deleted successfully", "deleted_count": deleted_count}
