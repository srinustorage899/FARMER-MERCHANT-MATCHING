"""
userdb.py — MongoDB access for Farmer and Merchant user collections.
"""
from app.database.mongodb import get_database
from app.config import MONGO_DB_NAME

FARMERS_COLLECTION = "farmers"
MERCHANTS_COLLECTION = "merchants"

def get_farmers_collection():
    db = get_database()
    return db[FARMERS_COLLECTION]

def get_merchants_collection():
    db = get_database()
    return db[MERCHANTS_COLLECTION]
