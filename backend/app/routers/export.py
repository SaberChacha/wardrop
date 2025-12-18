from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
import io

from ..database import get_db
from ..services.excel import ExcelService
from .auth import get_current_user

router = APIRouter()


@router.get("/clients")
async def export_clients(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Export all clients to Excel"""
    excel_service = ExcelService(db)
    output = excel_service.export_clients()
    
    return StreamingResponse(
        io.BytesIO(output),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=clients.xlsx"}
    )


@router.get("/dresses")
async def export_dresses(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Export all dresses to Excel"""
    excel_service = ExcelService(db)
    output = excel_service.export_dresses()
    
    return StreamingResponse(
        io.BytesIO(output),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=dresses.xlsx"}
    )


@router.get("/clothing")
async def export_clothing(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Export all clothing items to Excel"""
    excel_service = ExcelService(db)
    output = excel_service.export_clothing()
    
    return StreamingResponse(
        io.BytesIO(output),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=clothing.xlsx"}
    )


@router.get("/bookings")
async def export_bookings(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Export bookings to Excel"""
    excel_service = ExcelService(db)
    output = excel_service.export_bookings(start_date, end_date)
    
    return StreamingResponse(
        io.BytesIO(output),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=bookings.xlsx"}
    )


@router.get("/sales")
async def export_sales(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Export sales to Excel"""
    excel_service = ExcelService(db)
    output = excel_service.export_sales(start_date, end_date)
    
    return StreamingResponse(
        io.BytesIO(output),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=sales.xlsx"}
    )


@router.get("/commercial-report")
async def export_commercial_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Export comprehensive commercial report"""
    excel_service = ExcelService(db)
    output = excel_service.export_commercial_report(start_date, end_date)
    
    return StreamingResponse(
        io.BytesIO(output),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=commercial_report_{date.today()}.xlsx"}
    )


@router.post("/import/clients")
async def import_clients(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Import clients from Excel file"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be an Excel file (.xlsx or .xls)")
    
    contents = await file.read()
    excel_service = ExcelService(db)
    
    try:
        result = excel_service.import_clients(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")


@router.post("/import/dresses")
async def import_dresses(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Import dresses from Excel file"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be an Excel file (.xlsx or .xls)")
    
    contents = await file.read()
    excel_service = ExcelService(db)
    
    try:
        result = excel_service.import_dresses(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")


@router.post("/import/clothing")
async def import_clothing(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Import clothing items from Excel file"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be an Excel file (.xlsx or .xls)")
    
    contents = await file.read()
    excel_service = ExcelService(db)
    
    try:
        result = excel_service.import_clothing(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")

