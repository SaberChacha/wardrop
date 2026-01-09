from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.admin import Admin, UserRole
from ..schemas.auth import AdminResponse, UserCreate, UserUpdate, PasswordReset
from .auth import get_current_user, get_password_hash

router = APIRouter()


async def get_admin_user(current_user: Admin = Depends(get_current_user)) -> Admin:
    """Dependency that ensures the current user is an admin"""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can perform this action"
        )
    return current_user


@router.get("/", response_model=List[AdminResponse])
async def list_users(
    db: Session = Depends(get_db),
    current_user: Admin = Depends(get_admin_user)
):
    """List all users (admin only)"""
    users = db.query(Admin).order_by(Admin.created_at.desc()).all()
    return users


@router.post("/", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: Admin = Depends(get_admin_user)
):
    """Create a new user (admin only)"""
    # Check if email already exists
    existing_user = db.query(Admin).filter(Admin.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = Admin(
        email=user_data.email,
        password_hash=hashed_password,
        name=user_data.name,
        role=UserRole(user_data.role)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/{user_id}", response_model=AdminResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Admin = Depends(get_admin_user)
):
    """Get a specific user (admin only)"""
    user = db.query(Admin).filter(Admin.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.put("/{user_id}", response_model=AdminResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: Admin = Depends(get_admin_user)
):
    """Update a user (admin only)"""
    user = db.query(Admin).filter(Admin.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent demoting the last admin
    if user_data.role == "staff" and user.role == UserRole.admin:
        admin_count = db.query(Admin).filter(Admin.role == UserRole.admin).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the last administrator"
            )
    
    # Check email uniqueness if changing email
    if user_data.email and user_data.email != user.email:
        existing = db.query(Admin).filter(Admin.email == user_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        user.email = user_data.email
    
    if user_data.name:
        user.name = user_data.name
    if user_data.role:
        user.role = UserRole(user_data.role)
    
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Admin = Depends(get_admin_user)
):
    """Delete a user (admin only)"""
    user = db.query(Admin).filter(Admin.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent deleting yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Prevent deleting the last admin
    if user.role == UserRole.admin:
        admin_count = db.query(Admin).filter(Admin.role == UserRole.admin).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the last administrator"
            )
    
    db.delete(user)
    db.commit()
    return None


@router.put("/{user_id}/password", status_code=status.HTTP_200_OK)
async def reset_user_password(
    user_id: int,
    password_data: PasswordReset,
    db: Session = Depends(get_db),
    current_user: Admin = Depends(get_admin_user)
):
    """Reset a user's password (admin only)"""
    user = db.query(Admin).filter(Admin.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

