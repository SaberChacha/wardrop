from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from datetime import date, datetime, timedelta

from ..database import get_db
from ..models.booking import Booking
from ..models.sale import Sale
from ..models.dress import Dress
from ..models.clothing import Clothing
from ..models.client import Client
from ..schemas.reports import (
    DashboardStats, 
    EarningsReport, 
    TopDressesReport, 
    TopClientsReport,
    MonthlyEarnings
)
from .auth import get_current_user

router = APIRouter()


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get dashboard overview statistics"""
    today = date.today()
    start_of_month = today.replace(day=1)
    
    # Total counts
    total_clients = db.query(Client).count()
    total_dresses = db.query(Dress).count()
    total_clothing = db.query(Clothing).count()
    
    # Active bookings (confirmed or in_progress)
    active_bookings = db.query(Booking).filter(
        Booking.booking_status.in_(["confirmed", "in_progress"])
    ).count()
    
    # Monthly revenue from bookings
    monthly_rental_revenue = db.query(func.sum(Booking.rental_price)).filter(
        Booking.start_date >= start_of_month,
        Booking.booking_status != "cancelled"
    ).scalar() or 0
    
    # Monthly revenue from sales
    monthly_sales_revenue = db.query(func.sum(Sale.total_price)).filter(
        Sale.sale_date >= start_of_month
    ).scalar() or 0
    
    # Monthly cost from sales (based on purchase_price)
    monthly_sales_with_cost = db.query(
        func.sum(Sale.quantity * Clothing.purchase_price)
    ).join(
        Clothing, Sale.clothing_id == Clothing.id
    ).filter(
        Sale.sale_date >= start_of_month,
        Clothing.purchase_price.isnot(None)
    ).scalar() or 0
    
    monthly_sales_profit = float(monthly_sales_revenue) - float(monthly_sales_with_cost)
    
    # Pending deposits
    pending_deposits = db.query(func.sum(Booking.deposit_amount)).filter(
        Booking.deposit_status == "pending",
        Booking.booking_status != "cancelled"
    ).scalar() or 0
    
    # Low stock items (less than 3)
    low_stock_count = db.query(Clothing).filter(
        Clothing.stock_quantity < 3,
        Clothing.stock_quantity > 0
    ).count()
    
    # Upcoming returns (bookings ending in next 7 days)
    next_week = today + timedelta(days=7)
    upcoming_returns = db.query(Booking).filter(
        Booking.end_date >= today,
        Booking.end_date <= next_week,
        Booking.booking_status == "in_progress"
    ).count()
    
    return {
        "total_clients": total_clients,
        "total_dresses": total_dresses,
        "total_clothing": total_clothing,
        "active_bookings": active_bookings,
        "monthly_rental_revenue": float(monthly_rental_revenue),
        "monthly_sales_revenue": float(monthly_sales_revenue),
        "monthly_total_revenue": float(monthly_rental_revenue + monthly_sales_revenue),
        "monthly_sales_cost": float(monthly_sales_with_cost),
        "monthly_sales_profit": monthly_sales_profit,
        "pending_deposits": float(pending_deposits),
        "low_stock_count": low_stock_count,
        "upcoming_returns": upcoming_returns
    }


@router.get("/earnings", response_model=EarningsReport)
async def get_earnings_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    period: str = Query("monthly", regex="^(daily|weekly|monthly|yearly)$"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get earnings report with breakdown by period"""
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=365)
    
    # Get rental earnings
    rental_query = db.query(
        func.date_trunc(period if period != "daily" else "day", Booking.start_date).label("period"),
        func.sum(Booking.rental_price).label("amount")
    ).filter(
        Booking.start_date >= start_date,
        Booking.start_date <= end_date,
        Booking.booking_status != "cancelled"
    ).group_by("period").all()
    
    # Get sales earnings with cost
    sales_query = db.query(
        func.date_trunc(period if period != "daily" else "day", Sale.sale_date).label("period"),
        func.sum(Sale.total_price).label("amount"),
        func.sum(Sale.quantity * Clothing.purchase_price).label("cost")
    ).join(
        Clothing, Sale.clothing_id == Clothing.id
    ).filter(
        Sale.sale_date >= start_date,
        Sale.sale_date <= end_date
    ).group_by("period").all()
    
    # Combine into periods
    periods_data = {}
    for row in rental_query:
        period_key = row.period.strftime("%Y-%m-%d") if row.period else "Unknown"
        if period_key not in periods_data:
            periods_data[period_key] = {"rentals": 0, "sales": 0, "sales_cost": 0}
        periods_data[period_key]["rentals"] = float(row.amount or 0)
    
    for row in sales_query:
        period_key = row.period.strftime("%Y-%m-%d") if row.period else "Unknown"
        if period_key not in periods_data:
            periods_data[period_key] = {"rentals": 0, "sales": 0, "sales_cost": 0}
        periods_data[period_key]["sales"] = float(row.amount or 0)
        periods_data[period_key]["sales_cost"] = float(row.cost or 0)
    
    # Format response
    monthly_earnings = [
        {
            "period": k,
            "rentals": v["rentals"],
            "sales": v["sales"],
            "sales_cost": v["sales_cost"],
            "sales_profit": v["sales"] - v["sales_cost"],
            "total": v["rentals"] + v["sales"]
        }
        for k, v in sorted(periods_data.items())
    ]
    
    total_rentals = sum(e["rentals"] for e in monthly_earnings)
    total_sales = sum(e["sales"] for e in monthly_earnings)
    total_sales_cost = sum(e["sales_cost"] for e in monthly_earnings)
    total_sales_profit = total_sales - total_sales_cost
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "period_type": period,
        "total_rentals": total_rentals,
        "total_sales": total_sales,
        "total_sales_cost": total_sales_cost,
        "total_sales_profit": total_sales_profit,
        "total_revenue": total_rentals + total_sales,
        "total_profit": total_rentals + total_sales_profit,
        "earnings_by_period": monthly_earnings
    }


@router.get("/top-dresses", response_model=TopDressesReport)
async def get_top_dresses(
    limit: int = Query(10, ge=1, le=50),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get top rented dresses"""
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=365)
    
    query = db.query(
        Dress.id,
        Dress.name,
        func.count(Booking.id).label("rental_count"),
        func.sum(Booking.rental_price).label("total_revenue")
    ).join(
        Booking, Dress.id == Booking.dress_id
    ).filter(
        Booking.start_date >= start_date,
        Booking.start_date <= end_date,
        Booking.booking_status != "cancelled"
    ).group_by(Dress.id, Dress.name).order_by(
        func.count(Booking.id).desc()
    ).limit(limit).all()
    
    dresses = [
        {
            "dress_id": row.id,
            "dress_name": row.name,
            "rental_count": row.rental_count,
            "total_revenue": float(row.total_revenue or 0)
        }
        for row in query
    ]
    
    return {"dresses": dresses}


@router.get("/top-clients", response_model=TopClientsReport)
async def get_top_clients(
    limit: int = Query(10, ge=1, le=50),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get top clients by spending"""
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=365)
    
    # Get rental spending
    rental_spending = db.query(
        Client.id,
        Client.full_name,
        func.count(Booking.id).label("booking_count"),
        func.sum(Booking.rental_price).label("rental_spent")
    ).join(
        Booking, Client.id == Booking.client_id
    ).filter(
        Booking.start_date >= start_date,
        Booking.start_date <= end_date,
        Booking.booking_status != "cancelled"
    ).group_by(Client.id, Client.full_name).all()
    
    # Get sales spending
    sales_spending = db.query(
        Client.id,
        func.count(Sale.id).label("sale_count"),
        func.sum(Sale.total_price).label("sales_spent")
    ).join(
        Sale, Client.id == Sale.client_id
    ).filter(
        Sale.sale_date >= start_date,
        Sale.sale_date <= end_date
    ).group_by(Client.id).all()
    
    # Combine data
    clients_data = {}
    for row in rental_spending:
        clients_data[row.id] = {
            "client_id": row.id,
            "client_name": row.full_name,
            "booking_count": row.booking_count,
            "rental_spent": float(row.rental_spent or 0),
            "sale_count": 0,
            "sales_spent": 0
        }
    
    for row in sales_spending:
        if row.id in clients_data:
            clients_data[row.id]["sale_count"] = row.sale_count
            clients_data[row.id]["sales_spent"] = float(row.sales_spent or 0)
        else:
            client = db.query(Client).filter(Client.id == row.id).first()
            if client:
                clients_data[row.id] = {
                    "client_id": row.id,
                    "client_name": client.full_name,
                    "booking_count": 0,
                    "rental_spent": 0,
                    "sale_count": row.sale_count,
                    "sales_spent": float(row.sales_spent or 0)
                }
    
    # Sort by total spending
    clients = sorted(
        clients_data.values(),
        key=lambda x: x["rental_spent"] + x["sales_spent"],
        reverse=True
    )[:limit]
    
    for c in clients:
        c["total_spent"] = c["rental_spent"] + c["sales_spent"]
    
    return {"clients": clients}

