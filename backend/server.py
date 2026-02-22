from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.environ.get('SECRET_KEY', 'inventory-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = await db.users.find_one({"email": email}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    role: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: str
    name: str
    role: str

class LoginResponse(BaseModel):
    token: str
    user: UserResponse

class InventoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    category: str
    subcategory: str
    quantity: int
    available: int
    empty: int = 0
    unit: str
    min_threshold: int
    status: str
    last_updated: str

class InventoryItemCreate(BaseModel):
    name: str
    category: str
    subcategory: str
    quantity: int
    available: int = 0
    empty: int = 0
    unit: str
    min_threshold: int

class InventoryItemUpdate(BaseModel):
    quantity: Optional[int] = None
    available: Optional[int] = None
    empty: Optional[int] = None
    min_threshold: Optional[int] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    item_id: str
    item_name: str
    category: str
    quantity: int
    ordered_by: str
    ordered_by_name: str
    status: str
    created_at: str
    updated_at: str
    notes: Optional[str] = None

class OrderCreate(BaseModel):
    item_id: str
    item_name: str
    category: str
    quantity: int
    notes: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str

class Vendor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    contact_person: str
    phone: str
    email: str
    materials_supplied: List[str]
    status: str
    created_at: str

class VendorCreate(BaseModel):
    name: str
    contact_person: str
    phone: str
    email: str
    materials_supplied: List[str]

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    materials_supplied: Optional[List[str]] = None
    status: Optional[str] = None

class DashboardStats(BaseModel):
    total_items: int
    low_stock_count: int
    out_of_stock_count: int
    pending_orders: int
    total_orders: int
    active_vendors: int

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    icon: str
    subcategories: List[str]
    order: int
    created_at: str

class CategoryCreate(BaseModel):
    name: str
    icon: str
    subcategories: List[str]

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    subcategories: Optional[List[str]] = None
    order: Optional[int] = None

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserRegister):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(user_data.password)
    user_doc = {
        "email": user_data.email,
        "password": hashed_password,
        "name": user_data.name,
        "role": user_data.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    return UserResponse(email=user_data.email, name=user_data.name, role=user_data.role)

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user["email"]})
    return LoginResponse(
        token=token,
        user=UserResponse(email=user["email"], name=user["name"], role=user["role"])
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

@api_router.get("/inventory", response_model=List[InventoryItem])
async def get_inventory(current_user: dict = Depends(get_current_user)):
    items = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    return items

@api_router.post("/inventory", response_model=InventoryItem)
async def create_inventory_item(item: InventoryItemCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "inventory_manager":
        raise HTTPException(status_code=403, detail="Only inventory managers can add items")
    
    import uuid
    item_id = str(uuid.uuid4())
    status = "available" if item.quantity >= item.min_threshold else "low_stock" if item.quantity > 0 else "out_of_stock"
    
    item_doc = {
        "id": item_id,
        "name": item.name,
        "category": item.category,
        "subcategory": item.subcategory,
        "quantity": item.quantity,
        "available": item.available,
        "empty": item.empty,
        "unit": item.unit,
        "min_threshold": item.min_threshold,
        "status": status,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }
    await db.inventory.insert_one(item_doc)
    return InventoryItem(**item_doc)

@api_router.put("/inventory/{item_id}", response_model=InventoryItem)
async def update_inventory_item(item_id: str, update: InventoryItemUpdate, current_user: dict = Depends(get_current_user)):
    item = await db.inventory.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        update_data["last_updated"] = datetime.now(timezone.utc).isoformat()
        
        if "quantity" in update_data:
            min_threshold = update_data.get("min_threshold", item["min_threshold"])
            quantity = update_data["quantity"]
            update_data["status"] = "available" if quantity >= min_threshold else "low_stock" if quantity > 0 else "out_of_stock"
        
        await db.inventory.update_one({"id": item_id}, {"$set": update_data})
    
    updated_item = await db.inventory.find_one({"id": item_id}, {"_id": 0})
    return InventoryItem(**updated_item)

@api_router.delete("/inventory/{item_id}")
async def delete_inventory_item(item_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "inventory_manager":
        raise HTTPException(status_code=403, detail="Only inventory managers can delete items")
    
    result = await db.inventory.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}

@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: dict = Depends(get_current_user)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate, current_user: dict = Depends(get_current_user)):
    import uuid
    order_id = str(uuid.uuid4())
    
    order_doc = {
        "id": order_id,
        "item_id": order.item_id,
        "item_name": order.item_name,
        "category": order.category,
        "quantity": order.quantity,
        "ordered_by": current_user["email"],
        "ordered_by_name": current_user["name"],
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "notes": order.notes
    }
    await db.orders.insert_one(order_doc)
    return Order(**order_doc)

@api_router.put("/orders/{order_id}", response_model=Order)
async def update_order_status(order_id: str, update: OrderStatusUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "inventory_manager" and update.status != "pending":
        raise HTTPException(status_code=403, detail="Only inventory managers can approve/reject orders")
    
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": update.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    updated_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return Order(**updated_order)

@api_router.get("/vendors", response_model=List[Vendor])
async def get_vendors(current_user: dict = Depends(get_current_user)):
    vendors = await db.vendors.find({}, {"_id": 0}).to_list(1000)
    return vendors

@api_router.post("/vendors", response_model=Vendor)
async def create_vendor(vendor: VendorCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "inventory_manager":
        raise HTTPException(status_code=403, detail="Only inventory managers can add vendors")
    
    import uuid
    vendor_id = str(uuid.uuid4())
    
    vendor_doc = {
        "id": vendor_id,
        "name": vendor.name,
        "contact_person": vendor.contact_person,
        "phone": vendor.phone,
        "email": vendor.email,
        "materials_supplied": vendor.materials_supplied,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.vendors.insert_one(vendor_doc)
    return Vendor(**vendor_doc)

@api_router.put("/vendors/{vendor_id}", response_model=Vendor)
async def update_vendor(vendor_id: str, update: VendorUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "inventory_manager":
        raise HTTPException(status_code=403, detail="Only inventory managers can update vendors")
    
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.vendors.update_one({"id": vendor_id}, {"$set": update_data})
    
    updated_vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    return Vendor(**updated_vendor)

@api_router.delete("/vendors/{vendor_id}")
async def delete_vendor(vendor_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "inventory_manager":
        raise HTTPException(status_code=403, detail="Only inventory managers can delete vendors")
    
    result = await db.vendors.delete_one({"id": vendor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return {"message": "Vendor deleted successfully"}

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    items = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    vendors = await db.vendors.find({}, {"_id": 0}).to_list(1000)
    
    low_stock = sum(1 for item in items if item["status"] == "low_stock")
    out_of_stock = sum(1 for item in items if item["status"] == "out_of_stock")
    pending_orders = sum(1 for order in orders if order["status"] == "pending")
    active_vendors = sum(1 for vendor in vendors if vendor["status"] == "active")
    
    return DashboardStats(
        total_items=len(items),
        low_stock_count=low_stock,
        out_of_stock_count=out_of_stock,
        pending_orders=pending_orders,
        total_orders=len(orders),
        active_vendors=active_vendors
    )

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
