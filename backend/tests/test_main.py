import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import Base, get_db
from backend.auth import create_access_token

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_register_login(test_db):
    # Register
    response = client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "password", "full_name": "Test User"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

    # Login
    response = client.post(
        "/auth/token",
        data={"username": "test@example.com", "password": "password"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_create_read_transactions(test_db):
    # 1. Register & Get Token
    client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "password", "full_name": "User"},
    )
    login_res = client.post(
        "/auth/token",
        data={"username": "user@example.com", "password": "password"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Add Transaction
    tx_data = {
        "name": "Coffee",
        "amount": 150.0,
        "date": "2023-10-27",
        "category": "Food",
        "tag": "Want",
        "mode": "UPI"
    }
    res = client.post("/transactions/", json=tx_data, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Coffee"
    assert data["user_id"] is not None

    # 3. Read Transaction
    res = client.get("/transactions/", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["name"] == "Coffee"
