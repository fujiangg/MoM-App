from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, mom
from app.db.base import Base
from app.db.session import engine

app = FastAPI(title="MoM Management API")

# Setup CORS
origins = [
    "http://localhost:5173",  # Vite default port
    "http://localhost:3000",
    "http://10.100.33.70:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(mom.router, prefix="/mom", tags=["MoM"])

@app.get("/")
def read_root():
    return {"message": "Welcome to MoM Management API"}

# Create tables on startup (for demo purposes)
@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)
