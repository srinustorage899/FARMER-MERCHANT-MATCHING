"""
user_model.py — Pydantic schemas for Farmer and Merchant user accounts.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class FarmerUser(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MerchantUser(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)
    company: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
