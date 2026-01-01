from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, asc, desc
from typing import List, Optional, Literal

from ..database import get_db
from ..models.client import Client
from ..schemas.client import ClientCreate, ClientUpdate, ClientResponse, ClientListResponse
from .auth import get_current_user

router = APIRouter()


@router.get("/", response_model=ClientListResponse)
async def get_clients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    sort_by: Optional[str] = Query("created_at", description="Field to sort by: full_name, created_at"),
    sort_order: Optional[Literal["asc", "desc"]] = Query("desc", description="Sort order"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all clients with optional search, sorting, and pagination"""
    query = db.query(Client)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Client.full_name.ilike(search_filter),
                Client.phone.ilike(search_filter),
                Client.whatsapp.ilike(search_filter)
            )
        )
    
    total = query.count()
    
    # Apply sorting
    sort_column = getattr(Client, sort_by, Client.created_at)
    if sort_order == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))
    
    clients = query.offset(skip).limit(limit).all()
    
    return {"clients": clients, "total": total}


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific client by ID"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.post("/", response_model=ClientResponse)
async def create_client(
    client: ClientCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new client"""
    db_client = Client(**client.model_dump())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int,
    client: ClientUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an existing client"""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    update_data = client.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_client, field, value)
    
    db.commit()
    db.refresh(db_client)
    return db_client


@router.delete("/{client_id}")
async def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a client"""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db.delete(db_client)
    db.commit()
    return {"message": "Client deleted successfully"}


@router.post("/bulk-delete")
async def bulk_delete_clients(
    ids: List[int],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete multiple clients by IDs"""
    deleted_count = db.query(Client).filter(Client.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    return {"message": f"{deleted_count} clients deleted successfully", "deleted_count": deleted_count}

