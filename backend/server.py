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
    is_admin: bool = False

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hashed_password: str
    is_admin: bool = False
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
    
class BlogPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str
    content: str
    summary: str
    author: str
    featured_image: Optional[str] = None
    tags: List[str] = []
    category: str
    is_published: bool = True
    view_count: int = 0
    is_featured: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

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

async def get_current_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

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

# Blog post endpoints
@api_router.get("/blog-posts", response_model=List[BlogPost])
async def get_blog_posts(
    skip: int = 0, 
    limit: int = 10, 
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    featured_only: bool = False
):
    query = {"is_published": True}
    
    if category:
        query["category"] = category
    
    if tag:
        query["tags"] = {"$in": [tag]}
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}}
        ]
    
    if featured_only:
        query["is_featured"] = True
    
    # Increment view count
    total = await db.blog_posts.count_documents(query)
    
    # Sort by created_at descending (newest first)
    cursor = db.blog_posts.find(query).sort("created_at", -1).skip(skip).limit(limit)
    posts = await cursor.to_list(length=limit)
    
    return [BlogPost(**post) for post in posts]

@api_router.get("/blog-posts/{post_id}", response_model=BlogPost)
async def get_blog_post(post_id: str):
    post = await db.blog_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    # Increment view count
    await db.blog_posts.update_one(
        {"id": post_id},
        {"$inc": {"view_count": 1}}
    )
    
    # Get updated post
    post = await db.blog_posts.find_one({"id": post_id})
    return BlogPost(**post)

@api_router.get("/blog-posts/slug/{slug}", response_model=BlogPost)
async def get_blog_post_by_slug(slug: str):
    post = await db.blog_posts.find_one({"slug": slug})
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    # Increment view count
    await db.blog_posts.update_one(
        {"slug": slug},
        {"$inc": {"view_count": 1}}
    )
    
    # Get updated post
    post = await db.blog_posts.find_one({"slug": slug})
    return BlogPost(**post)

@api_router.get("/blog-categories", response_model=List[str])
async def get_blog_categories():
    # Get all unique categories
    categories = await db.blog_posts.distinct("category", {"is_published": True})
    return categories

@api_router.get("/blog-tags", response_model=List[str])
async def get_blog_tags():
    # Get all unique tags
    all_tags = await db.blog_posts.distinct("tags", {"is_published": True})
    # Flatten the list if needed
    return all_tags

# Admin blog post management endpoints
@api_router.post("/admin/blog-posts", response_model=BlogPost)
async def create_blog_post(blog_post: BlogPost, current_admin: User = Depends(get_current_admin)):
    # Check if slug already exists
    existing_post = await db.blog_posts.find_one({"slug": blog_post.slug})
    if existing_post:
        raise HTTPException(status_code=400, detail="Blog post with this slug already exists")
    
    post_dict = blog_post.dict()
    await db.blog_posts.insert_one(post_dict)
    return blog_post

@api_router.put("/admin/blog-posts/{post_id}", response_model=BlogPost)
async def update_blog_post(post_id: str, blog_post: BlogPost, current_admin: User = Depends(get_current_admin)):
    # Check if blog post exists
    existing_post = await db.blog_posts.find_one({"id": post_id})
    if not existing_post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    # Check if updating to a slug that already exists (except this post)
    slug_exists = await db.blog_posts.find_one({"slug": blog_post.slug, "id": {"$ne": post_id}})
    if slug_exists:
        raise HTTPException(status_code=400, detail="Blog post with this slug already exists")
    
    post_dict = blog_post.dict()
    post_dict["updated_at"] = datetime.utcnow()
    
    await db.blog_posts.update_one({"id": post_id}, {"$set": post_dict})
    return blog_post

@api_router.delete("/admin/blog-posts/{post_id}", status_code=204)
async def delete_blog_post(post_id: str, current_admin: User = Depends(get_current_admin)):
    # Check if blog post exists
    existing_post = await db.blog_posts.find_one({"id": post_id})
    if not existing_post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    await db.blog_posts.delete_one({"id": post_id})
    return

# Admin island management endpoints
@api_router.post("/admin/islands", response_model=Island)
async def admin_create_island(island: IslandCreate, current_admin: User = Depends(get_current_admin)):
    db_island = Island(**island.dict())
    island_dict = db_island.dict()
    await db.islands.insert_one(island_dict)
    return db_island

@api_router.put("/admin/islands/{island_id}", response_model=Island)
async def admin_update_island(island_id: str, island: Island, current_admin: User = Depends(get_current_admin)):
    # Check if island exists
    existing_island = await db.islands.find_one({"id": island_id})
    if not existing_island:
        raise HTTPException(status_code=404, detail="Island not found")
    
    island_dict = island.dict()
    island_dict["updated_at"] = datetime.utcnow()
    
    await db.islands.update_one({"id": island_id}, {"$set": island_dict})
    return island

@api_router.delete("/admin/islands/{island_id}", status_code=204)
async def admin_delete_island(island_id: str, current_admin: User = Depends(get_current_admin)):
    # Check if island exists
    existing_island = await db.islands.find_one({"id": island_id})
    if not existing_island:
        raise HTTPException(status_code=404, detail="Island not found")
    
    # Check if any users have visited this island
    user_visited = await db.users.find_one({"visited_islands": island_id})
    if user_visited:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete island that has been visited by users. Consider disabling it instead."
        )
    
    await db.islands.delete_one({"id": island_id})
    return

# Admin user management endpoints
@api_router.get("/admin/users", response_model=List[User])
async def admin_get_users(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    current_admin: User = Depends(get_current_admin)
):
    query = {}
    
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}}
        ]
    
    # Sort by created_at descending (newest first)
    cursor = db.users.find(query).sort("created_at", -1).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    
    return [User(**user) for user in users]

@api_router.put("/admin/users/{user_id}", response_model=User)
async def admin_update_user(user_id: str, user_update: UserBase, current_admin: User = Depends(get_current_admin)):
    # Check if user exists
    existing_user = await db.users.find_one({"id": user_id})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prepare update dict
    update_dict = user_update.dict(exclude_unset=True)
    update_dict["updated_at"] = datetime.utcnow()
    
    await db.users.update_one({"id": user_id}, {"$set": update_dict})
    
    # Get updated user
    updated_user = await db.users.find_one({"id": user_id})
    return User(**updated_user)

@api_router.delete("/admin/users/{user_id}", status_code=204)
async def admin_delete_user(user_id: str, current_admin: User = Depends(get_current_admin)):
    # Check if user exists
    existing_user = await db.users.find_one({"id": user_id})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deleting admin users
    if existing_user.get("is_admin", False):
        raise HTTPException(status_code=400, detail="Cannot delete admin users")
    
    await db.users.delete_one({"id": user_id})
    
    # Also clean up any visits by this user
    await db.visits.delete_many({"user_id": user_id})
    
    return

# Admin challenge management endpoints
@api_router.post("/admin/challenges", response_model=Challenge)
async def admin_create_challenge(challenge: Challenge, current_admin: User = Depends(get_current_admin)):
    challenge_dict = challenge.dict()
    await db.challenges.insert_one(challenge_dict)
    return challenge

@api_router.put("/admin/challenges/{challenge_id}", response_model=Challenge)
async def admin_update_challenge(challenge_id: str, challenge: Challenge, current_admin: User = Depends(get_current_admin)):
    # Check if challenge exists
    existing_challenge = await db.challenges.find_one({"id": challenge_id})
    if not existing_challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    challenge_dict = challenge.dict()
    
    await db.challenges.update_one({"id": challenge_id}, {"$set": challenge_dict})
    return challenge

@api_router.delete("/admin/challenges/{challenge_id}", status_code=204)
async def admin_delete_challenge(challenge_id: str, current_admin: User = Depends(get_current_admin)):
    # Check if challenge exists
    existing_challenge = await db.challenges.find_one({"id": challenge_id})
    if not existing_challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    # Check if any users are currently participating in this challenge
    user_participating = await db.users.find_one({"active_challenges": challenge_id})
    if user_participating:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete challenge that users are participating in. Consider disabling it instead."
        )
    
    await db.challenges.delete_one({"id": challenge_id})
    return

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

SAMPLE_BLOG_POSTS = [
    {
        "id": str(uuid.uuid4()),
        "title": "Top 10 Must-Visit Islands in the Maldives",
        "slug": "top-10-must-visit-islands-maldives",
        "summary": "Discover the best islands to explore during your Maldives vacation, from luxury resorts to hidden local gems.",
        "content": """
# Top 10 Must-Visit Islands in the Maldives

The Maldives archipelago comprises nearly 1,200 islands, each with its own unique charm. With so many options, it can be overwhelming to decide which ones to visit. This guide highlights ten islands that showcase the diversity and beauty of this tropical paradise.

## 1. Maafushi

This local island has become a popular destination for budget travelers. With its beautiful beaches, water sports activities, and authentic local experiences, Maafushi offers a perfect balance between comfort and cultural immersion.

## 2. Baros

One of the most luxurious resort islands, Baros boasts pristine beaches, crystal-clear waters, and world-class overwater villas. It's a favorite among honeymooners and those seeking a romantic getaway.

## 3. Dhigurah

Known for its long, white-sand beach and as a hotspot for whale shark sightings, Dhigurah is a must-visit for nature lovers and underwater enthusiasts.

## 4. Fuvahmulah

This unique island is actually an atoll in itself and hosts a rare ecosystem with freshwater lakes. It's also famous for tiger shark diving, attracting adventure seekers.

## 5. Thoddoo

A local agricultural island known for its fruit plantations. Thoddoo offers a different perspective on Maldivian life, beautiful beaches, and affordable guesthouses.

## 6. Hithadhoo in Addu Atoll

The southernmost atoll of the Maldives, Addu features a unique landscape with lush vegetation and the longest causeway in the country connecting several islands.

## 7. Ukulhas

A model for eco-tourism in the Maldives, Ukulhas has won awards for its waste management and environmental initiatives while offering beautiful beaches and snorkeling.

## 8. Vaadhoo

Famous for the "Sea of Stars" phenomenon where bioluminescent plankton create a magical nighttime display in the waters surrounding the island.

## 9. Soneva Fushi

An eco-luxury resort that pioneered sustainable tourism in the Maldives, offering barefoot luxury and unique experiences like treetop dining and outdoor cinemas.

## 10. Hulhumale

This artificial island near Male is rapidly developing and offers a glimpse into the urban future of the Maldives, with restaurants, cafes, and public beaches.

## Planning Your Visit

The best time to visit the Maldives is during the dry season from November to April. When visiting local islands, remember to respect cultural norms, including modest dress codes outside designated "bikini beaches."

Start your island-hopping adventure with IslandLogger.mv to track and share your experiences across these beautiful destinations!
        """,
        "author": "Maldives Travel Expert",
        "featured_image": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        "tags": ["travel guide", "islands", "vacation", "beaches"],
        "category": "Travel Guides",
        "is_published": True,
        "view_count": 1245,
        "is_featured": True,
        "created_at": datetime.utcnow() - timedelta(days=30),
        "updated_at": datetime.utcnow() - timedelta(days=15)
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Underwater Photography: Capturing the Beauty of Maldives Marine Life",
        "slug": "underwater-photography-maldives-marine-life",
        "summary": "Tips and techniques for capturing stunning underwater photographs of the colorful coral reefs and marine life in the Maldives.",
        "content": """
# Underwater Photography: Capturing the Beauty of Maldives Marine Life

The Maldives offers some of the world's most spectacular underwater landscapes and marine life. From vibrant coral gardens to graceful manta rays and colorful reef fish, the opportunities for underwater photography are endless. Here's how to make the most of your underwater photography experience in the Maldives.

## Equipment Essentials

### Entry Level Options

If you're just starting out, consider these options:

- Waterproof action cameras (GoPro, DJI Osmo Action, etc.)
- Underwater smartphone housings (much more affordable than dedicated setups)
- Rental equipment from your resort or dive center

### Advanced Setups

For serious photographers:

- DSLR or mirrorless camera with an underwater housing
- Wide-angle lenses for reef scenes and large marine life
- Macro lenses for small creatures and details
- Underwater strobes or lights to restore color at depth

## Best Locations for Underwater Photography

### North Malé Atoll

- **Banana Reef**: One of the first dive sites discovered in the Maldives, featuring dramatic overhangs and colorful coral formations
- **Shark Point**: Great for reef shark photography
- **Hulhumalé Reef**: Accessible house reef with abundant marine life

### Ari Atoll (Alifu)

- **Maaya Thila**: Famous for soft corals and the chance to photograph reef sharks
- **Manta Point**: Seasonal manta ray cleaning station (best during northeast monsoon)
- **Fish Head**: Stunning reef formation with schooling fish and sharks

### Baa Atoll

- **Hanifaru Bay**: UNESCO Biosphere Reserve famous for manta rays and whale sharks (seasonal - June to November)
- **Dhigali Haa**: Beautiful reef system with great visibility

## Photography Techniques

### 1. Master Buoyancy Control

Before worrying about camera settings, perfect your buoyancy. This is essential for:
- Protecting the delicate reef environment
- Stabilizing your shots without a tripod
- Getting close to subjects without disturbing them

### 2. Get Close, Then Get Closer

Water reduces color, contrast, and sharpness, so:
- Get as close as physically possible to your subject
- Use wide-angle lenses for larger scenes
- Consider split shots (half above/half below the surface) for unique perspectives

### 3. Understand Light and Color

- Shoot during the "golden hours" (early morning or late afternoon) for the best natural light
- Remember that colors fade with depth (red disappears first, then orange, yellow, etc.)
- Use artificial lights (strobes/video lights) to restore true colors
- Shoot upward toward the surface to capture light rays filtering through the water

### 4. Camera Settings

- Use a fast shutter speed (1/125 or faster) to freeze motion
- Set aperture between f/8-f/16 for good depth of field
- Increase ISO as needed (modern cameras handle higher ISOs well)
- Consider manual white balance when shooting without strobes

## Conservation Awareness

- Never touch, chase, or harass marine life for a photo
- Maintain a safe distance from all creatures
- Be aware of your fins and equipment to avoid damaging coral
- Follow all local marine protected area regulations
- Consider sharing your images to support conservation efforts

## Post-Processing Tips

- Adjust white balance to reduce the blue/green cast
- Increase contrast and vibrance (underwater images often look flat)
- Consider local adjustments to balance foreground and background exposure
- Use noise reduction software if shooting at higher ISOs

Start documenting your underwater adventures with IslandLogger.mv and share your best shots with fellow travelers!
        """,
        "author": "Marine Photography Expert",
        "featured_image": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        "tags": ["photography", "underwater", "marine life", "coral reefs"],
        "category": "Photography",
        "is_published": True,
        "view_count": 968,
        "is_featured": False,
        "created_at": datetime.utcnow() - timedelta(days=45),
        "updated_at": datetime.utcnow() - timedelta(days=45)
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Living Like a Local: Authentic Experiences on Inhabited Maldives Islands",
        "slug": "living-like-local-authentic-maldives-experiences",
        "summary": "Beyond the luxury resorts, discover the rich culture and daily life on the local inhabited islands of the Maldives.",
        "content": """
# Living Like a Local: Authentic Experiences on Inhabited Maldives Islands

While the Maldives is renowned for its luxury resorts and overwater bungalows, the local inhabited islands offer travelers a chance to experience authentic Maldivian culture, cuisine, and daily life. Here's how to immerse yourself in the local way of life during your Maldives adventure.

## Choosing the Right Local Islands

Not all inhabited islands are created equal when it comes to tourism infrastructure. Here are some excellent options for travelers seeking authentic experiences:

### Maafushi (South Malé Atoll)
- The pioneer of local tourism
- Well-developed guesthouse infrastructure
- Easy access from Malé
- Good balance of authenticity and tourist amenities

### Dhigurah (South Ari Atoll)
- Long, beautiful beach
- Whale shark sightings nearby
- Relaxed atmosphere
- Less crowded than Maafushi

### Thoddoo (North Ari Atoll)
- Agricultural island with fruit farms
- Beautiful bikini beach
- Fewer tourists
- Great snorkeling

### Fulidhoo (Vaavu Atoll)
- Tiny island with traditional atmosphere
- Famous for "Bodu Beru" cultural performances
- Excellent diving nearby
- Friendly community

## Cultural Norms and Etiquette

The Maldives is a 100% Sunni Muslim country with conservative customs on local islands:

- Dress modestly in public areas (shoulders and knees covered)
- Swimwear is only permitted on designated "bikini beaches"
- No alcohol is available on local islands (only on resorts)
- Remove shoes when entering homes or mosques
- Public displays of affection are discouraged
- Photography: Always ask before photographing locals
- Friday is a holy day - expect limited services during prayer times

## Authentic Experiences to Seek Out

### 1. Traditional Cuisine

Don't miss these local specialties:

- **Mas Huni**: A breakfast dish of shredded tuna, coconut, onion, and chili
- **Garudhiya**: Fresh tuna soup served with rice, lime, chili, and onions
- **Rihaakuru**: A thick brown paste made from tuna, used as a condiment
- **Hedhikaa**: Savory snacks like masroshi (tuna stuffed pastry) and gulha (fish dumplings)
- **Fresh tropical fruits**: Especially local mangoes, papayas, and watermelons

Where to find authentic food:
- Local "hotaa" (cafés)
- Small family-run restaurants
- Homestay meals
- Street food vendors in the evening

### 2. Daily Life

Immerse yourself in island rhythms:

- **Morning fish market**: Watch the day's catch come in (typically early morning)
- **Sunset harbor gathering**: Join locals at the jetty to watch the sunset
- **Friday prayers**: Observe from a respectful distance as the community gathers
- **School visits**: Some islands allow visitors to meet students and see education in action
- **Joali Dhoni building**: Watch traditional boat craftsmanship on certain islands

### 3. Cultural Activities

Participate in these cultural experiences:

- **Bodu Beru**: Traditional drumming and dancing performances
- **Raa Bai**: Local crafts using palm leaves and coconut products
- **Handicraft workshops**: Learn to make traditional items like 'koadi' (mats)
- **Coconut harvesting demonstrations**: Watch skilled climbers at work
- **Cooking classes**: Learn to prepare traditional Maldivian dishes

### 4. Connect with Locals

The Maldivian people are known for their hospitality:

- **Holhuashi**: Public gathering places where men socialize (you may be invited to join)
- **Undhoali**: Traditional swings where you can chat with locals
- **Guesthouse hosts**: Often happy to share stories and local knowledge
- **Local guides**: Hire local guides for insights only residents would know
- **Community events**: Ask about any festivals or celebrations happening during your stay

## Supporting Local Communities

Tourism on local islands directly benefits communities when you:

- Stay at locally-owned guesthouses
- Eat at local restaurants
- Hire local guides for excursions
- Purchase souvenirs directly from artisans
- Participate in community-based tours

## Environmental Awareness

Local islands face environmental challenges:

- Use water consciously (many islands rely on desalination)
- Avoid single-use plastics
- Take all non-biodegradable waste back to Malé or dispose properly
- Support beach clean-ups often organized by guesthouses
- Choose marine tour operators who follow responsible practices

By tracking your visits to local islands with IslandLogger.mv, you're documenting a more authentic side of the Maldives that many travelers never experience!
        """,
        "author": "Cultural Travel Writer",
        "featured_image": "https://images.unsplash.com/photo-1573843981242-273fef20a9a5?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        "tags": ["local islands", "culture", "authentic travel", "food"],
        "category": "Cultural Experience",
        "is_published": True,
        "view_count": 723,
        "is_featured": True,
        "created_at": datetime.utcnow() - timedelta(days=15),
        "updated_at": datetime.utcnow() - timedelta(days=15)
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
        
    # Initialize blog posts collection with sample data if empty
    if await db.blog_posts.count_documents({}) == 0:
        await db.blog_posts.insert_many(SAMPLE_BLOG_POSTS)
        logging.info("Initialized blog posts collection with sample data")
    
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
        
    # Add admin user if it doesn't exist
    admin_user = await db.users.find_one({"email": "admin@islandlogger.mv"})
    if not admin_user:
        hashed_password = get_password_hash("admin123")
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": "admin@islandlogger.mv",
            "name": "Admin User",
            "hashed_password": hashed_password,
            "is_admin": True,
            "visited_islands": [],
            "badges": [],
            "active_challenges": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.users.insert_one(admin_user)
        logging.info("Created admin user: admin@islandlogger.mv")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@app.get("/debug-user/{email}")
async def debug_user(email: str):
    user = await db.users.find_one({"email": email})
    if not user:
        return {"status": "User not found"}
    
    # Don't return password
    if "hashed_password" in user:
        user["hashed_password"] = "[REDACTED]"
    
    return user

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
