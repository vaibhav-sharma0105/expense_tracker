from pydantic import BaseModel
from typing import Optional, List
from datetime import date

# Auth
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    username: str # OAuth2PasswordRequestForm uses 'username' for email
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Card
class CardBase(BaseModel):
    name: str
    stmt_date: int
    due_date: int

class CardCreate(CardBase):
    pass

class Card(CardBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

# Transaction
class TransactionBase(BaseModel):
    name: str
    amount: float
    date: date
    category: str
    tag: str
    mode: str
    card_id: Optional[int] = None

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True
