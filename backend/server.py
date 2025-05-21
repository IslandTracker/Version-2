from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import logging
from pathlib import Path
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware

# Constants
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ.get('DB_NAME', 'maldives_tracker')
logging.info(f"Connecting to MongoDB at {mongo_url}, using database {db_name}")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class IslandBase(BaseModel):
    name: str
    atoll: str
    latitude: float
    longitude: float
    type: str  # resort, inhabited, uninhabited
    population: Optional[int] = None
    description: Optional[str] = None
    tags: List[str] = []
    image_urls: List[str] = []
    size_km2: Optional[float] = None
    amenities: List[str] = []
    water_activities: List[str] = []
    transfer_options: List[str] = []

class IslandCreate(IslandBase):
    pass

class Island(IslandBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    visited_islands: List[str] = []
    badges: List[str] = []
    active_challenges: List[str] = []

class UserInDB(User):
    pass

class VisitBase(BaseModel):
    island_id: str
    visit_date: datetime
    notes: Optional[str] = None
    photo_urls: List[str] = []

class VisitCreate(VisitBase):
    pass

class Visit(VisitBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Badge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    image_url: Optional[str] = None
    criteria: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Challenge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    objective: Dict[str, Any]
    duration_days: int
    reward: Dict[str, Any]
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Helper functions
def verify_password(plain_password, hashed_password):
    logging.info("Verifying password")
    try:
        result = pwd_context.verify(plain_password, hashed_password)
        logging.info(f"Password verification result: {result}")
        return result
    except Exception as e:
        logging.error(f"Error verifying password: {e}")
        return False

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user(email: str):
    user_dict = await db.users.find_one({"email": email})
    if user_dict:
        return UserInDB(**user_dict)

async def authenticate_user(email: str, password: str):
    logging.info(f"Authenticating user: {email}")
    user = await get_user(email)
    if not user:
        logging.error(f"User not found: {email}")
        return False
    if not verify_password(password, user.hashed_password):
        logging.error(f"Invalid password for user: {email}")
        return False
    logging.info(f"User authenticated successfully: {email}")
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = await get_user(email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

# Authentication endpoints
@api_router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    # Print debug info
    logging.info(f"Login attempt for user: {form_data.username}")
    
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        logging.error(f"Authentication failed for user: {form_data.username}")
        # Let's check if user exists but password is incorrect
        db_user = await get_user(form_data.username)
        if db_user:
            logging.error("User exists but password verification failed")
        else:
            logging.error("User does not exist")
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Authentication successful
    logging.info(f"Authentication successful for user: {form_data.username}")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# User endpoints
@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    db_user = await get_user(user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        visited_islands=[],
        badges=[],
        active_challenges=[]
    )
    user_dict = db_user.dict()
    await db.users.insert_one(user_dict)
    return db_user

@api_router.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Island endpoints
@api_router.post("/islands", response_model=Island)
async def create_island(island: IslandCreate):
    db_island = Island(**island.dict())
    island_dict = db_island.dict()
    await db.islands.insert_one(island_dict)
    return db_island

@api_router.get("/islands", response_model=List[Island])
async def get_islands():
    islands = await db.islands.find().to_list(1000)
    return [Island(**island) for island in islands]

@api_router.get("/islands/{island_id}", response_model=Island)
async def get_island(island_id: str):
    island = await db.islands.find_one({"id": island_id})
    if island:
        return Island(**island)
    raise HTTPException(status_code=404, detail="Island not found")

# Visit endpoints
@api_router.post("/visits", response_model=Visit)
async def create_visit(visit: VisitCreate, current_user: User = Depends(get_current_user)):
    island = await db.islands.find_one({"id": visit.island_id})
    if not island:
        raise HTTPException(status_code=404, detail="Island not found")
    
    db_visit = Visit(**visit.dict(), user_id=current_user.id)
    visit_dict = db_visit.dict()
    await db.visits.insert_one(visit_dict)
    
    # Add island to user's visited islands if not already there
    if visit.island_id not in current_user.visited_islands:
        await db.users.update_one(
            {"id": current_user.id},
            {"$push": {"visited_islands": visit.island_id}}
        )
    
    return db_visit

@api_router.get("/visits", response_model=List[Visit])
async def get_user_visits(current_user: User = Depends(get_current_user)):
    visits = await db.visits.find({"user_id": current_user.id}).to_list(1000)
    return [Visit(**visit) for visit in visits]

# Sample data initialization
SAMPLE_ISLANDS = [
    {
        "id": str(uuid.uuid4()),
        "name": "Maafushi",
        "atoll": "Kaafu",
        "latitude": 3.9428,
        "longitude": 73.5377,
        "type": "inhabited",
        "population": 3025,
        "description": "Popular local island known for budget-friendly tourism",
        "tags": ["budget", "local", "water sports"],
        "image_urls": ["https://images.unsplash.com/photo-1573843981242-273fef20a9a5?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"],
        "size_km2": 0.83,
        "amenities": ["hotels", "restaurants", "dive shops"],
        "water_activities": ["snorkeling", "diving", "jet skiing"],
        "transfer_options": ["speedboat"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Baros",
        "atoll": "North Male",
        "latitude": 4.2833,
        "longitude": 73.4167,
        "type": "resort",
        "population": None,
        "description": "Luxury 5-star resort island with over-water villas",
        "tags": ["luxury", "honeymoon", "private"],
        "image_urls": ["https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"],
        "size_km2": 0.25,
        "amenities": ["spa", "fine dining", "water villas", "PADI dive center"],
        "water_activities": ["snorkeling", "diving", "sailing", "windsurfing"],
        "transfer_options": ["speedboat"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Baa Atoll",
        "atoll": "Baa",
        "latitude": 5.1708,
        "longitude": 73.0664,
        "type": "uninhabited",
        "population": 0,
        "description": "UNESCO Biosphere Reserve known for manta rays and whale sharks",
        "tags": ["nature", "marine life", "conservation"],
        "image_urls": ["https://images.unsplash.com/photo-1586861710684-b4e36ae77c4a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"],
        "size_km2": None,
        "amenities": [],
        "water_activities": ["snorkeling", "diving"],
        "transfer_options": ["boat tour"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Hulhumale",
        "atoll": "Kaafu",
        "latitude": 4.2167,
        "longitude": 73.5500,
        "type": "inhabited",
        "population": 50000,
        "description": "Artificial island near Male airport, with beaches and local life",
        "tags": ["urban", "transit", "local"],
        "image_urls": ["https://images.unsplash.com/photo-1557639712-220c45613b61?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"],
        "size_km2": 4.0,
        "amenities": ["hotels", "restaurants", "shops", "mosque"],
        "water_activities": ["swimming", "watersports"],
        "transfer_options": ["bus", "taxi", "ferry"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Soneva Fushi",
        "atoll": "Baa",
        "latitude": 5.1167,
        "longitude": 73.0667,
        "type": "resort",
        "population": None,
        "description": "Eco-luxury resort with private villas and pristine beaches",
        "tags": ["luxury", "eco", "private"],
        "image_urls": ["https://images.unsplash.com/photo-1541480205551-0e742d656ad5?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"],
        "size_km2": 1.4,
        "amenities": ["private pool villas", "observatory", "spa", "outdoor cinema"],
        "water_activities": ["snorkeling", "diving", "surfing", "dolphin cruises"],
        "transfer_options": ["seaplane"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Dhigurah",
        "atoll": "Alif Dhaal",
        "latitude": 3.5167,
        "longitude": 72.9333,
        "type": "inhabited",
        "population": 600,
        "description": "Long island known for whale shark sightings and bikini beach",
        "tags": ["whale sharks", "local", "beach"],
        "image_urls": ["https://images.unsplash.com/photo-1621696372074-fee6fe9f5bc9?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"],
        "size_km2": 3.0,
        "amenities": ["guesthouses", "cafes", "dive shops"],
        "water_activities": ["snorkeling", "diving", "whale shark excursions"],
        "transfer_options": ["speedboat", "public ferry"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
]

SAMPLE_BADGES = [
    {
        "id": str(uuid.uuid4()),
        "name": "Island Novice",
        "description": "Visited your first island in the Maldives",
        "image_url": "https://img.icons8.com/external-vitaliy-gorbachev-flat-vitaly-gorbachev/58/000000/external-island-landscape-vitaliy-gorbachev-flat-vitaly-gorbachev.png",
        "criteria": {"visits_count": 1},
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Island Explorer",
        "description": "Visited 5 different islands",
        "image_url": "https://img.icons8.com/fluency/48/000000/sea-waves.png",
        "criteria": {"visits_count": 5},
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Luxury Connoisseur",
        "description": "Visited 3 resort islands",
        "image_url": "https://img.icons8.com/color/48/000000/beach-umbrella.png",
        "criteria": {"island_type": "resort", "count": 3},
        "created_at": datetime.utcnow()
    }
]

SAMPLE_CHALLENGES = [
    {
        "id": str(uuid.uuid4()),
        "name": "Kaafu Atoll Explorer",
        "description": "Visit 3 islands in Kaafu Atoll",
        "objective": {"atoll": "Kaafu", "count": 3},
        "duration_days": 90,
        "reward": {"badge": "Kaafu Expert", "points": 500},
        "is_active": True,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Local Island Experience",
        "description": "Visit 5 inhabited islands to experience local Maldivian culture",
        "objective": {"island_type": "inhabited", "count": 5},
        "duration_days": 180,
        "reward": {"badge": "Cultural Immersion", "points": 750},
        "is_active": True,
        "created_at": datetime.utcnow()
    }
]

@app.on_event("startup")
async def startup_db_client():
    # Initialize islands collection with sample data if empty
    if await db.islands.count_documents({}) == 0:
        await db.islands.insert_many(SAMPLE_ISLANDS)
        logging.info("Initialized islands collection with sample data")
    
    # Initialize badges collection with sample data if empty
    if await db.badges.count_documents({}) == 0:
        await db.badges.insert_many(SAMPLE_BADGES)
        logging.info("Initialized badges collection with sample data")
    
    # Initialize challenges collection with sample data if empty
    if await db.challenges.count_documents({}) == 0:
        await db.challenges.insert_many(SAMPLE_CHALLENGES)
        logging.info("Initialized challenges collection with sample data")
    
    # Add a test user if it doesn't exist
    test_user = await db.users.find_one({"email": "test@example.com"})
    if not test_user:
        hashed_password = get_password_hash("test123")
        test_user = {
            "id": str(uuid.uuid4()),
            "email": "test@example.com",
            "name": "Test User",
            "hashed_password": hashed_password,
            "visited_islands": [],
            "badges": [],
            "active_challenges": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.users.insert_one(test_user)
        logging.info("Created test user: test@example.com")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Maldives Island Tracker API"}
