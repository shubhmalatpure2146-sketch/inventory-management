import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def populate_database():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("Clearing existing data...")
    await db.users.delete_many({})
    await db.inventory.delete_many({})
    await db.orders.delete_many({})
    await db.vendors.delete_many({})
    await db.categories.delete_many({})
    
    print("Creating default categories...")
    categories = [
        {
            "id": "welding",
            "name": "Welding",
            "icon": "Flame",
            "subcategories": ["Welding Rods", "Gas", "Disposables"],
            "order": 1,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "fabrication",
            "name": "Fabrication",
            "icon": "Wrench",
            "subcategories": ["Grinder", "Disposables"],
            "order": 2,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "miscellaneous",
            "name": "Miscellaneous",
            "icon": "Archive",
            "subcategories": ["Nails", "Packing Material", "Other"],
            "order": 3,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.categories.insert_many(categories)
    print(f"Created {len(categories)} categories")
    
    print("Creating demo users...")
    users = [
        {
            "email": "manager@test.com",
            "password": pwd_context.hash("demo123"),
            "name": "John Manager",
            "role": "inventory_manager",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "email": "stocker@test.com",
            "password": pwd_context.hash("demo123"),
            "name": "Mike Stocker",
            "role": "stocker",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.users.insert_many(users)
    print(f"Created {len(users)} users")
    
    print("Creating inventory items...")
    inventory_items = [
        # Welding - Welding Rods
        {"id": "wr1", "name": "E7018 Welding Rod", "category": "welding", "subcategory": "Welding Rods", "quantity": 150, "available": 0, "empty": 0, "unit": "kg", "min_threshold": 50, "status": "available", "last_updated": datetime.now(timezone.utc).isoformat()},
        {"id": "wr2", "name": "E6013 Welding Rod", "category": "welding", "subcategory": "Welding Rods", "quantity": 30, "available": 0, "empty": 0, "unit": "kg", "min_threshold": 40, "status": "low_stock", "last_updated": datetime.now(timezone.utc).isoformat()},
        {"id": "wr3", "name": "E316L Stainless Rod", "category": "welding", "subcategory": "Welding Rods", "quantity": 0, "available": 0, "empty": 0, "unit": "kg", "min_threshold": 30, "status": "out_of_stock", "last_updated": datetime.now(timezone.utc).isoformat()},
        
        # Welding - Gas
        {"id": "gas1", "name": "LPG Cylinders", "category": "welding", "subcategory": "Gas", "quantity": 0, "available": 8, "empty": 4, "unit": "cylinder", "min_threshold": 5, "status": "available", "last_updated": datetime.now(timezone.utc).isoformat()},
        {"id": "gas2", "name": "Argon Cylinders", "category": "welding", "subcategory": "Gas", "quantity": 0, "available": 3, "empty": 2, "unit": "cylinder", "min_threshold": 4, "status": "low_stock", "last_updated": datetime.now(timezone.utc).isoformat()},
        {"id": "gas3", "name": "CO2 Cylinders", "category": "welding", "subcategory": "Gas", "quantity": 0, "available": 6, "empty": 1, "unit": "cylinder", "min_threshold": 4, "status": "available", "last_updated": datetime.now(timezone.utc).isoformat()},
        
        # Welding - Disposables
        {"id": "wd1", "name": "Welding Gloves", "category": "welding", "subcategory": "Disposables", "quantity": 25, "available": 0, "empty": 0, "unit": "pcs", "min_threshold": 20, "status": "available", "last_updated": datetime.now(timezone.utc).isoformat()},
        {"id": "wd2", "name": "Safety Glasses", "category": "welding", "subcategory": "Disposables", "quantity": 15, "available": 0, "empty": 0, "unit": "pcs", "min_threshold": 20, "status": "low_stock", "last_updated": datetime.now(timezone.utc).isoformat()},
        {"id": "wd3", "name": "Welding Shields", "category": "welding", "subcategory": "Disposables", "quantity": 8, "available": 0, "empty": 0, "unit": "pcs", "min_threshold": 10, "status": "low_stock", "last_updated": datetime.now(timezone.utc).isoformat()},
        
        # Fabrication - Grinder
        {"id": "gr1", "name": "Angle Grinder 4-inch", "category": "fabrication", "subcategory": "Grinder", "quantity": 5, "available": 0, "empty": 0, "unit": "pcs", "min_threshold": 3, "status": "available", "last_updated": datetime.now(timezone.utc).isoformat()},
        {"id": "gr2", "name": "Angle Grinder 9-inch", "category": "fabrication", "subcategory": "Grinder", "quantity": 2, "available": 0, "empty": 0, "unit": "pcs", "min_threshold": 2, "status": "available", "last_updated": datetime.now(timezone.utc).isoformat()},
        
        # Fabrication - Disposables
        {"id": "fd1", "name": "Grinding Wheels 4-inch", "category": "fabrication", "subcategory": "Disposables", "quantity": 45, "available": 0, "empty": 0, "unit": "pcs", "min_threshold": 30, "status": "available", "last_updated": datetime.now(timezone.utc).isoformat()},
        {"id": "fd2", "name": "Grinding Wheels 9-inch", "category": "fabrication", "subcategory": "Disposables", "quantity": 18, "available": 0, "empty": 0, "unit": "pcs", "min_threshold": 20, "status": "low_stock", "last_updated": datetime.now(timezone.utc).isoformat()},
        {"id": "fd3", "name": "Cutting Blades", "category": "fabrication", "subcategory": "Disposables", "quantity": 0, "available": 0, "empty": 0, "unit": "pcs", "min_threshold": 15, "status": "out_of_stock", "last_updated": datetime.now(timezone.utc).isoformat()},
        
        # Miscellaneous
        {"id": "misc1", "name": "Steel Nails 3-inch", "category": "miscellaneous", "subcategory": "Nails", "quantity": 200, "available": 0, "empty": 0, "unit": "kg", "min_threshold": 100, "status": "available", "last_updated": datetime.now(timezone.utc).isoformat()},
        {"id": "misc2", "name": "Steel Nails 2-inch", "category": "miscellaneous", "subcategory": "Nails", "quantity": 75, "available": 0, "empty": 0, "unit": "kg", "min_threshold": 80, "status": "low_stock", "last_updated": datetime.now(timezone.utc).isoformat()},
        {"id": "misc3", "name": "Bubble Wrap Roll", "category": "miscellaneous", "subcategory": "Packing Material", "quantity": 12, "available": 0, "empty": 0, "unit": "box", "min_threshold": 10, "status": "available", "last_updated": datetime.now(timezone.utc).isoformat()},
        {"id": "misc4", "name": "Cardboard Boxes Large", "category": "miscellaneous", "subcategory": "Packing Material", "quantity": 5, "available": 0, "empty": 0, "unit": "box", "min_threshold": 15, "status": "low_stock", "last_updated": datetime.now(timezone.utc).isoformat()},
    ]
    await db.inventory.insert_many(inventory_items)
    print(f"Created {len(inventory_items)} inventory items")
    
    print("Creating sample orders...")
    orders = [
        {
            "id": "order1",
            "item_id": "wr3",
            "item_name": "E316L Stainless Rod",
            "category": "welding",
            "quantity": 50,
            "ordered_by": "stocker@test.com",
            "ordered_by_name": "Mike Stocker",
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "notes": "Urgent - needed for upcoming project"
        },
        {
            "id": "order2",
            "item_id": "fd3",
            "item_name": "Cutting Blades",
            "category": "fabrication",
            "quantity": 30,
            "ordered_by": "stocker@test.com",
            "ordered_by_name": "Mike Stocker",
            "status": "approved",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "notes": None
        },
        {
            "id": "order3",
            "item_id": "gas2",
            "item_name": "Argon Cylinders",
            "category": "welding",
            "quantity": 5,
            "ordered_by": "stocker@test.com",
            "ordered_by_name": "Mike Stocker",
            "status": "delivered",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "notes": None
        }
    ]
    await db.orders.insert_many(orders)
    print(f"Created {len(orders)} orders")
    
    print("Creating vendors...")
    vendors = [
        {
            "id": "vendor1",
            "name": "Steel & Weld Supplies Co.",
            "contact_person": "Robert Smith",
            "phone": "+1-555-0101",
            "email": "robert@steelweld.com",
            "materials_supplied": ["Welding Rods", "Gas Cylinders", "Safety Equipment"],
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "vendor2",
            "name": "Industrial Tools Ltd.",
            "contact_person": "Sarah Johnson",
            "phone": "+1-555-0202",
            "email": "sarah@industrialtools.com",
            "materials_supplied": ["Grinders", "Grinding Wheels", "Cutting Blades"],
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "vendor3",
            "name": "PackPro Solutions",
            "contact_person": "Michael Brown",
            "phone": "+1-555-0303",
            "email": "michael@packpro.com",
            "materials_supplied": ["Packing Materials", "Boxes", "Bubble Wrap"],
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "vendor4",
            "name": "Hardware Depot",
            "contact_person": "Emily Davis",
            "phone": "+1-555-0404",
            "email": "emily@hardwaredepot.com",
            "materials_supplied": ["Nails", "Screws", "General Hardware"],
            "status": "inactive",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.vendors.insert_many(vendors)
    print(f"Created {len(vendors)} vendors")
    
    print("\n✓ Database populated successfully!")
    print("\nDemo Credentials:")
    print("- Inventory Manager: manager@test.com / demo123")
    print("- Stocker: stocker@test.com / demo123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(populate_database())
