from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminCreate(BaseModel):
    """Schema for first-time admin registration"""
    email: EmailStr
    password: str
    name: str


class UserCreate(BaseModel):
    """Schema for admin creating new users"""
    email: EmailStr
    password: str
    name: str
    role: Literal["admin", "staff"] = "staff"


class UserUpdate(BaseModel):
    """Schema for updating user info (without password)"""
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[Literal["admin", "staff"]] = None


class PasswordChange(BaseModel):
    """Schema for user changing their own password"""
    current_password: str
    new_password: str


class PasswordReset(BaseModel):
    """Schema for admin resetting a user's password"""
    new_password: str


class AdminUpdate(BaseModel):
    name: Optional[str] = None


class AdminResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

