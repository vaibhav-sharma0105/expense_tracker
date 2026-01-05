from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend import models, schemas, database
from backend.routers.auth import get_current_user

router = APIRouter(prefix="/cards", tags=["cards"])

@router.get("/", response_model=List[schemas.Card])
def get_cards(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Card).filter(models.Card.user_id == current_user.id).all()

@router.post("/", response_model=schemas.Card)
def create_card(card: schemas.CardCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    new_card = models.Card(**card.model_dump(), user_id=current_user.id)
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    return new_card

@router.delete("/{card_id}")
def delete_card(card_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    card = db.query(models.Card).filter(models.Card.id == card_id, models.Card.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Optional: Set card_id to null for associated transactions
    transactions = db.query(models.Transaction).filter(models.Transaction.card_id == card_id).all()
    for t in transactions:
        t.card_id = None
    
    db.delete(card)
    db.commit()
    return {"message": "Card deleted"}
