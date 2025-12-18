from pydantic import BaseModel
from typing import List, Optional
from datetime import date


class DashboardStats(BaseModel):
    total_clients: int
    total_dresses: int
    total_clothing: int
    active_bookings: int
    monthly_rental_revenue: float
    monthly_sales_revenue: float
    monthly_total_revenue: float
    monthly_sales_cost: float
    monthly_sales_profit: float
    pending_deposits: float
    low_stock_count: int
    upcoming_returns: int


class MonthlyEarnings(BaseModel):
    period: str
    rentals: float
    sales: float
    sales_cost: float
    sales_profit: float
    total: float


class EarningsReport(BaseModel):
    start_date: date
    end_date: date
    period_type: str
    total_rentals: float
    total_sales: float
    total_sales_cost: float
    total_sales_profit: float
    total_revenue: float
    total_profit: float
    earnings_by_period: List[MonthlyEarnings]


class TopDress(BaseModel):
    dress_id: int
    dress_name: str
    rental_count: int
    total_revenue: float


class TopDressesReport(BaseModel):
    dresses: List[TopDress]


class TopClient(BaseModel):
    client_id: int
    client_name: str
    booking_count: int
    rental_spent: float
    sale_count: int
    sales_spent: float
    total_spent: float


class TopClientsReport(BaseModel):
    clients: List[TopClient]

