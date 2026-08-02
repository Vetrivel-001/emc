from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.models import Appointment, Patient, Doctor, AuditLog
from app.schemas.schemas import AppointmentCreate, AppointmentUpdate, AppointmentResponse

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.post("/", response_model=AppointmentResponse)
def book_appointment(payload: AppointmentCreate, user_payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(user_payload.get("sub"))
    patient = db.query(Patient).filter(Patient.user_id == user_id).first()
    if not patient:
        patient = Patient(user_id=user_id)
        db.add(patient)
        db.commit()
        db.refresh(patient)

    doctor = db.query(Doctor).filter(Doctor.id == payload.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Selected doctor not found")

    appointment = Appointment(
        patient_id=patient.id,
        doctor_id=doctor.id,
        appointment_date=payload.appointment_date,
        appointment_time=payload.appointment_time,
        reason=payload.reason,
        status="scheduled",
    )
    db.add(appointment)
    
    audit = AuditLog(user_id=user_id, action="BOOK_APPOINTMENT", details=f"Booked appointment with Doctor #{doctor.id}")
    db.add(audit)
    
    db.commit()
    db.refresh(appointment)
    return AppointmentResponse.model_validate(appointment)

@router.get("/my-appointments", response_model=List[AppointmentResponse])
def get_user_appointments(user_payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(user_payload.get("sub"))
    role = user_payload.get("role")

    if role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == user_id).first()
        if not doctor:
            return []
        apps = db.query(Appointment).filter(Appointment.doctor_id == doctor.id).all()
    else:
        patient = db.query(Patient).filter(Patient.user_id == user_id).first()
        if not patient:
            return []
        apps = db.query(Appointment).filter(Appointment.patient_id == patient.id).all()

    return [AppointmentResponse.model_validate(app) for app in apps]

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(appointment_id: int, payload: AppointmentUpdate, user_payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if payload.status:
        app.status = payload.status
    if payload.notes:
        app.notes = payload.notes

    db.commit()
    db.refresh(app)
    return AppointmentResponse.model_validate(app)
