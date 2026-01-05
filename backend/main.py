from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
from backend.routers import auth, cards, transactions

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FinTrack API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, set to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cards.router)
app.include_router(transactions.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to FinTrack API"}
