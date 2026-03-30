from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.mom import MoM
from app.models.user import User
from app.schemas.mom import MoMCreate, MoMUpdate, MoMResponse

router = APIRouter()

@router.get("/", response_model=List[MoMResponse])
def read_moms(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    moms = db.query(MoM).offset(skip).limit(limit).all()
    return moms

@router.post("/", response_model=MoMResponse)
def create_mom(
    mom: MoMCreate, 
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    db_mom = MoM(**mom.dict(), created_by=current_user.id)
    db.add(db_mom)
    db.commit()
    db.refresh(db_mom)
    return db_mom

@router.get("/{mom_id}", response_model=MoMResponse)
def read_mom(
    mom_id: int, 
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    mom = db.query(MoM).filter(MoM.id == mom_id).first()
    if mom is None:
        raise HTTPException(status_code=404, detail="MoM not found")
    return mom

@router.put("/{mom_id}", response_model=MoMResponse)
def update_mom(
    mom_id: int, 
    mom_in: MoMUpdate, 
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    mom = db.query(MoM).filter(MoM.id == mom_id).first()
    if mom is None:
        raise HTTPException(status_code=404, detail="MoM not found")
    
    # Optional: Check if current_user.id == mom.created_by
    
    update_data = mom_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(mom, key, value)
    
    db.add(mom)
    db.commit()
    db.refresh(mom)
    return mom

@router.delete("/{mom_id}")
def delete_mom(
    mom_id: int, 
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    mom = db.query(MoM).filter(MoM.id == mom_id).first()
    if mom is None:
        raise HTTPException(status_code=404, detail="MoM not found")
    
    db.delete(mom)
    db.commit()
    return {"detail": "MoM deleted successfully"}
