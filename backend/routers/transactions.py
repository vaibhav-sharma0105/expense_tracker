from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta
from sqlalchemy import func

from backend import models, schemas, database
from backend.routers.auth import get_current_user

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.get("/", response_model=List[schemas.Transaction])
def get_transactions(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    filter_type: Optional[str] = Query(None, description="day, week, month, year"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id)
    
    today = date.today()
    
    if filter_type:
        if filter_type == "day":
            query = query.filter(models.Transaction.date == today)
        elif filter_type == "week":
            start_of_week = today - timedelta(days=today.weekday())
            query = query.filter(models.Transaction.date >= start_of_week)
        elif filter_type == "month":
            start_of_month = today.replace(day=1)
            query = query.filter(models.Transaction.date >= start_of_month)
        elif filter_type == "year":
            start_of_year = today.replace(month=1, day=1)
            query = query.filter(models.Transaction.date >= start_of_year)
            
    # Explicit dates override presets
    if start_date:
        query = query.filter(models.Transaction.date >= start_date)
    if end_date:
        query = query.filter(models.Transaction.date <= end_date)
        
    return query.order_by(models.Transaction.date.desc()).all()

@router.post("/", response_model=schemas.Transaction)
def create_transaction(tx: schemas.TransactionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    new_tx = models.Transaction(**tx.model_dump(), user_id=current_user.id)
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    return new_tx

@router.put("/{tx_id}", response_model=schemas.Transaction)
def update_transaction(tx_id: int, tx_data: schemas.TransactionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    tx = db.query(models.Transaction).filter(models.Transaction.id == tx_id, models.Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for key, value in tx_data.model_dump().items():
        setattr(tx, key, value)

    db.commit()
    db.refresh(tx)
    return tx

@router.delete("/{tx_id}")
def delete_transaction(tx_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    tx = db.query(models.Transaction).filter(models.Transaction.id == tx_id, models.Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(tx)
    db.commit()
    return {"message": "Transaction deleted"}
