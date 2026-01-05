from sqlalchemy import Column, Integer, String, Boolean, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)

    transactions = relationship("Transaction", back_populates="owner")
    cards = relationship("Card", back_populates="owner")

class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    stmt_date = Column(Integer)  # Day of the month
    due_date = Column(Integer)   # Day of the month
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="cards")
    transactions = relationship("Transaction", back_populates="card")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    amount = Column(Float)
    date = Column(Date)
    category = Column(String)
    tag = Column(String) # Need, Want, Savings
    mode = Column(String) # UPI, Credit Card, etc.
    comment = Column(String, nullable=True)
    
    user_id = Column(Integer, ForeignKey("users.id"))
    card_id = Column(Integer, ForeignKey("cards.id"), nullable=True)

    owner = relationship("User", back_populates="transactions")
    card = relationship("Card", back_populates="transactions")
