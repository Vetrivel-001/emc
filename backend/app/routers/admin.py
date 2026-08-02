from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user_payload, get_password_hash
from app.models.models import User, Patient, Doctor, Appointment, Prescription, AuditLog
from app.schemas.schemas import UserResponse, UserRegister, UserRoleUpdate, SystemStatsResponse, AppointmentResponse

router = APIRouter(prefix="/admin", tags=["Admin Portal"])

def _verify_admin(payload: dict):
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")

@router.get("/stats", response_model=SystemStatsResponse)
def get_system_stats(user_payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    _verify_admin(user_payload)
    return SystemStatsResponse(
        total_users=db.query(User).count(),
        total_patients=db.query(Patient).count(),
        total_doctors=db.query(Doctor).count(),
        total_appointments=db.query(Appointment).count(),
        total_prescriptions=db.query(Prescription).count(),
        total_audit_logs=db.query(AuditLog).count()
    )

@router.get("/users", response_model=List[UserResponse])
def get_all_users(user_payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    _verify_admin(user_payload)
    users = db.query(User).all()
    return [UserResponse.model_validate(u) for u in users]

@router.post("/users", response_model=UserResponse)
def admin_create_user(user_data: UserRegister, user_payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    _verify_admin(user_payload)
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role or "patient",
        phone=user_data.phone,
        national_id=user_data.national_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if new_user.role == "patient":
        patient = Patient(user_id=new_user.id)
        db.add(patient)
    elif new_user.role == "doctor":
        doc = Doctor(user_id=new_user.id, specialization=user_data.specialization or "General Practice")
        db.add(doc)

    db.commit()
    return UserResponse.model_validate(new_user)

@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(user_id: int, role_data: UserRoleUpdate, user_payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    _verify_admin(user_payload)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = role_data.role
    if role_data.full_name:
        user.full_name = role_data.full_name
    if role_data.email:
        user.email = role_data.email
    if role_data.phone:
        user.phone = role_data.phone

    # Ensure profile existence if role changes
    if role_data.role == "patient" and not user.patient_profile:
        patient = Patient(user_id=user.id)
        db.add(patient)
    elif role_data.role == "doctor" and not user.doctor_profile:
        doc = Doctor(user_id=user.id, specialization="General Practice")
        db.add(doc)

    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)

@router.put("/users/{user_id}/toggle-status")
def toggle_user_status(user_id: int, user_payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    _verify_admin(user_payload)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"status": "success", "is_active": user.is_active}

@router.delete("/users/{user_id}")
def delete_user(user_id: int, user_payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    _verify_admin(user_payload)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"status": "deleted", "id": user_id}

@router.get("/appointments", response_model=List[AppointmentResponse])
def get_all_system_appointments(user_payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    _verify_admin(user_payload)
    apps = db.query(Appointment).all()
    return [AppointmentResponse.model_validate(a) for a in apps]

@router.get("/audit-logs")
def get_audit_logs(user_payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    _verify_admin(user_payload)
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(200).all()
    return [{"id": l.id, "user_id": l.user_id, "action": l.action, "details": l.details, "timestamp": str(l.timestamp)} for l in logs]

