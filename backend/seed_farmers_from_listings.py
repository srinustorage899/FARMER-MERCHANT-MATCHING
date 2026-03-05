"""
Script to migrate all unique farmers from listings to farmers collection with default credentials.
"""
import asyncio
from datetime import datetime
from app.database.mongodb import get_database
from app.database.userdb import get_farmers_collection
from app.models.user_model import FarmerUser
from app.config import MONGO_COLLECTION_LISTINGS

async def migrate_farmers():
    try:
        db = get_database()
        # Test connection
        await db.command({"ping": 1})
        print("MongoDB connection successful.")
        listings = db[MONGO_COLLECTION_LISTINGS]
        farmers = get_farmers_collection()

        # Get all unique farmer names
        names = await listings.distinct("farmer_name")
        print(f"Found {len(names)} unique farmers.")
        for name in names:
            if not name:
                continue
            # Sanitize name for email
            safe_name = name.replace(' ', '').replace('.', '').replace(',', '').replace('@', '').replace('!', '').replace('#', '').replace('$', '').replace('%', '').replace('^', '').replace('&', '').replace('*', '').replace('(', '').replace(')', '').replace('+', '').replace('=', '').replace('/', '').replace('\\', '').replace('?', '').replace('>', '').replace('<', '').replace(':', '').replace(';', '').replace('"', '').replace("'", '').replace('[', '').replace(']', '').replace('{', '').replace('}', '').replace('|', '').replace('`', '').replace('~', '').lower()
            email = f"{safe_name}@gmail.com"
            password = f"{safe_name}@123"
            try:
                farmer_doc = FarmerUser(name=name, email=email, password=password, created_at=datetime.utcnow()).model_dump()
                # Upsert to avoid duplicates
                result = await farmers.update_one({"email": email}, {"$setOnInsert": farmer_doc}, upsert=True)
                if result.upserted_id:
                    print(f"Inserted farmer: {name} -> {email}")
                else:
                    print(f"Farmer already exists: {name} -> {email}")
            except Exception as e:
                print(f"Error for farmer '{name}': {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(migrate_farmers())
