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
    radius: Optional[float] = Field(None, gt=0, description="Search radius in km (auto-set by backend if omitted)")
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
    farmer_name: str = Field("Unknown Farmer", description="Display name of the farmer")
    match_score: float = Field(0.0, description="Composite score (0=best). Lower = better match (weighted distance + price)")


class MerchantSearchResponse(BaseModel):
    """Returned to the client after a search."""
    status: str = "success"
    count: int
    results: list[MatchedFarmerResult]
