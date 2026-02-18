"""
merchant_model.py — Pydantic schemas for the Merchant search flow.

Separated into *request* and *response* schemas.
"""

from pydantic import BaseModel, Field
from typing import Optional

from app.models.farmer_model import LocationSchema


class MerchantSearchRequest(BaseModel):
    """Incoming JSON from the Find Farmers form."""
    crop: str = Field(..., min_length=1, description="Crop to search for")
    quantity: float = Field(..., gt=0, description="Required quantity in kg")
    max_price: float = Field(..., gt=0, description="Maximum acceptable price per kg (₹)")
    radius: float = Field(..., gt=0, description="Search radius in km")
    location: LocationSchema


class MatchedFarmerResult(BaseModel):
    """A single matched farmer returned in the search response."""
    listing_id: str
    crop: str
    quantity: float
    price: float
    latitude: float
    longitude: float
    distance_km: float = Field(..., description="Haversine distance in km")


class MerchantSearchResponse(BaseModel):
    """Returned to the client after a search."""
    status: str = "success"
    count: int
    results: list[MatchedFarmerResult]
