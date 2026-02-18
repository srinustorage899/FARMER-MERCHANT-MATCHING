"""
farmer_model.py — Pydantic schemas for the Farmer upload flow.

Separated into *request*, *DB document*, and *response* schemas so that
the API layer never leaks internal fields (like `_id` or `active`).
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class LocationSchema(BaseModel):
    """GPS coordinates attached to a crop listing."""
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in degrees")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude in degrees")


class FarmerUploadRequest(BaseModel):
    """Incoming JSON from the Upload Crop form."""
    crop: str = Field(..., min_length=1, description="Crop name, e.g. Tomato")
    quantity: float = Field(..., gt=0, description="Quantity in kg")
    price: float = Field(..., gt=0, description="Price per kg in ₹")
    location: LocationSchema


class ListingDocument(BaseModel):
    """
    Full document stored in MongoDB.

    Fields added server-side:
    - listing_id   : UUID string (primary key for the platform)
    - active       : lazy-deletion flag (defaults to True)
    - created_at   : UTC timestamp
    """
    listing_id: str
    crop: str
    quantity: float
    price: float
    location: LocationSchema
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FarmerUploadResponse(BaseModel):
    """Returned to the client after a successful upload."""
    status: str = "success"
    listing_id: str
    message: str = "Listing created and queued for indexing."
