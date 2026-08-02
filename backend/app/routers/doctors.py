from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.models import Doctor, User, Patient, Prescription, Appointment
from app.schemas.schemas import (
    DoctorResponse, DoctorCreate, PatientDetailResponse, PatientResponse,
    PrescriptionCreate, PrescriptionResponse
)

router = APIRouter(prefix="/doctors", tags=["Doctor Management"])

@router.get("/", response_model=List[DoctorResponse])
def list_doctors(specialization: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Doctor).join(User).filter(User.is_active == True)
    if specialization:
        query = query.filter(Doctor.specialization.ilike(f"%{specialization}%"))
    doctors = query.all()
    return [DoctorResponse.model_validate(doc) for doc in doctors]

@router.get("/me/profile", response_model=DoctorResponse)
def get_my_doctor_profile(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    doc = db.query(Doctor).filter(Doctor.user_id == user_id).first()
    if not doc:
        # Create default profile if not exists
        doc = Doctor(user_id=user_id, specialization="General Medicine")
        db.add(doc)
        db.commit()
        db.refresh(doc)
    return DoctorResponse.model_validate(doc)

@router.put("/profile", response_model=DoctorResponse)
def update_doctor_profile(profile_data: DoctorCreate, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    doc = db.query(Doctor).filter(Doctor.user_id == user_id).first()
    if not doc:
        doc = Doctor(user_id=user_id, specialization=profile_data.specialization)
        db.add(doc)

    for field, val in profile_data.model_dump(exclude_unset=True).items():
        setattr(doc, field, val)

    db.commit()
    db.refresh(doc)
    return DoctorResponse.model_validate(doc)

@router.get("/my-patients", response_model=List[PatientResponse])
def get_doctor_patients(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    doc = db.query(Doctor).filter(Doctor.user_id == user_id).first()
    if not doc:
        return [PatientResponse.model_validate(p) for p in db.query(Patient).all()]

    # Collect patient IDs associated with appointments or assigned Fastlege
    assigned_ids = set()
    for app in db.query(Appointment).filter(Appointment.doctor_id == doc.id).all():
        assigned_ids.add(app.patient_id)
    for p in db.query(Patient).filter(Patient.fastlege_id == doc.id).all():
        assigned_ids.add(p.id)

    if assigned_ids:
        patients = db.query(Patient).filter(Patient.id.in_(assigned_ids)).all()
    else:
        patients = db.query(Patient).all()
        
    return [PatientResponse.model_validate(p) for p in patients]

@router.get("/patients/{patient_id}", response_model=PatientDetailResponse)
def get_patient_detail_for_doctor(patient_id: int, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return PatientDetailResponse.model_validate(patient)

@router.post("/prescriptions", response_model=PrescriptionResponse)
def create_prescription_for_patient(rx: PrescriptionCreate, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    doc = db.query(Doctor).filter(Doctor.user_id == user_id).first()
    if not doc:
        raise HTTPException(status_code=403, detail="Only registered doctors can issue prescriptions")
    
    new_rx = Prescription(
        patient_id=rx.patient_id,
        doctor_id=doc.id,
        medication_name=rx.medication_name,
        dosage=rx.dosage,
        usage_instructions=rx.usage_instructions,
        valid_until=rx.valid_until,
        status="active"
    )
    db.add(new_rx)
    db.commit()
    db.refresh(new_rx)
    res = PrescriptionResponse.model_validate(new_rx)
    res.doctor_name = doc.user.full_name if doc.user else "Dr. HealthBridge"
    return res

@router.get("/prescriptions/my-issued", response_model=List[PrescriptionResponse])
def get_issued_prescriptions(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    doc = db.query(Doctor).filter(Doctor.user_id == user_id).first()
    if not doc:
        return []
    rxs = db.query(Prescription).filter(Prescription.doctor_id == doc.id).all()
    result = []
    for rx in rxs:
        res = PrescriptionResponse.model_validate(rx)
        res.doctor_name = doc.user.full_name if doc.user else "Dr. HealthBridge"
        result.append(res)
    return result

@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doc = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return DoctorResponse.model_validate(doc)
