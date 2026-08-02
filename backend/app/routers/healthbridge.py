import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.models import Patient, Doctor, Prescription, DonorCard, DataAccessLog, User, AuditLog
from app.schemas.schemas import (
    FastlegeResponse, PrescriptionResponse, DonorCardUpdate, DonorCardResponse,
    DataAccessLogResponse, EHICCardResponse
)

router = APIRouter(prefix="/healthbridge", tags=["HealthBridge Digital Services"])

def _get_patient(user_id: int, db: Session) -> Patient:
    patient = db.query(Patient).filter(Patient.user_id == user_id).first()
    if not patient:
        patient = Patient(user_id=user_id)
        db.add(patient)
        db.commit()
        db.refresh(patient)
    return patient

# --- FASTLEGE (GP) SERVICES ---
@router.get("/fastlege", response_model=FastlegeResponse)
def get_my_fastlege(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    patient = _get_patient(user_id, db)

    if not patient.fastlege_id:
        first_doc = db.query(Doctor).first()
        if first_doc:
            patient.fastlege_id = first_doc.id
            db.commit()

    if not patient.fastlege_id:
        raise HTTPException(status_code=404, detail="No assigned Primary Doctor found")

    doctor = db.query(Doctor).filter(Doctor.id == patient.fastlege_id).first()
    return FastlegeResponse(
        doctor_id=doctor.id,
        doctor_name=doctor.user.full_name if doctor.user else "Dr. GP",
        specialization=doctor.specialization,
        clinic_name=doctor.clinic_name or "Central Health Clinic",
        phone=doctor.user.phone if doctor.user else "+1 (555) 234-5678",
        capacity_available=max(0, doctor.max_patient_capacity - doctor.current_patient_count)
    )

@router.get("/fastlege/available", response_model=List[FastlegeResponse])
def get_available_fastleger(db: Session = Depends(get_db)):
    doctors = db.query(Doctor).all()
    return [
        FastlegeResponse(
            doctor_id=doc.id,
            doctor_name=doc.user.full_name if doc.user else f"Dr. {doc.specialization}",
            specialization=doc.specialization,
            clinic_name=doc.clinic_name or "Central Health Clinic",
            phone=doc.user.phone if doc.user else "+1 (555) 234-5678",
            capacity_available=max(0, doc.max_patient_capacity - doc.current_patient_count)
        )
        for doc in doctors
    ]

@router.post("/fastlege/switch/{doctor_id}")
def switch_fastlege(doctor_id: int, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    patient = _get_patient(user_id, db)

    if patient.gp_switch_count >= 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quota exceeded: You have reached the maximum limit of 2 Primary Doctor switches per calendar year."
        )

    target_doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not target_doctor:
        raise HTTPException(status_code=404, detail="Selected doctor not found")

    patient.fastlege_id = target_doctor.id
    patient.gp_switch_count += 1
    
    audit = AuditLog(user_id=user_id, action="SWITCH_GP", details=f"Switched Primary Doctor to Dr. {target_doctor.user.full_name if target_doctor.user else doctor_id}")
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "message": f"Successfully switched your Primary Doctor to {target_doctor.user.full_name if target_doctor.user else 'new doctor'}.",
        "switches_remaining": 2 - patient.gp_switch_count
    }

# --- PRESCRIPTION & E-RESEPT SERVICES ---
@router.get("/prescriptions", response_model=List[PrescriptionResponse])
def get_my_prescriptions(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    patient = _get_patient(user_id, db)
    rxs = db.query(Prescription).filter(Prescription.patient_id == patient.id).all()
    
    result = []
    for rx in rxs:
        doc = db.query(Doctor).filter(Doctor.id == rx.doctor_id).first()
        doc_name = doc.user.full_name if doc and doc.user else "Primary Care Doctor"
        res = PrescriptionResponse.model_validate(rx)
        res.doctor_name = doc_name
        result.append(res)
    return result

@router.post("/prescriptions/{prescription_id}/renew")
def renew_prescription(prescription_id: int, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    patient = _get_patient(user_id, db)
    rx = db.query(Prescription).filter(Prescription.id == prescription_id, Prescription.patient_id == patient.id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")

    rx.status = "renewal_requested"
    audit = AuditLog(user_id=user_id, action="RENEW_PRESCRIPTION", details=f"Requested renewal for {rx.medication_name}")
    db.add(audit)
    db.commit()

    return {"status": "success", "message": f"Digital renewal request for {rx.medication_name} sent to doctor."}

# --- ORGAN DONOR CARD (DONORKORT) SERVICES ---
@router.get("/donorkort", response_model=DonorCardResponse)
def get_my_donor_card(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    patient = _get_patient(user_id, db)
    donor = db.query(DonorCard).filter(DonorCard.patient_id == patient.id).first()
    if not donor:
        donor = DonorCard(patient_id=patient.id, is_donor=True, organ_restrictions="All organs")
        db.add(donor)
        db.commit()
        db.refresh(donor)
    return DonorCardResponse.model_validate(donor)

@router.put("/donorkort", response_model=DonorCardResponse)
def update_donor_card(item: DonorCardUpdate, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    patient = _get_patient(user_id, db)
    donor = db.query(DonorCard).filter(DonorCard.patient_id == patient.id).first()
    if not donor:
        donor = DonorCard(patient_id=patient.id)
        db.add(donor)

    donor.is_donor = item.is_donor
    donor.organ_restrictions = item.organ_restrictions
    if item.next_of_kin_name:
        donor.next_of_kin_name = item.next_of_kin_name
    if item.next_of_kin_phone:
        donor.next_of_kin_phone = item.next_of_kin_phone

    donor.updated_at = datetime.datetime.utcnow()
    audit = AuditLog(user_id=user_id, action="UPDATE_DONOR_CARD", details=f"Updated organ donor status to {item.is_donor}")
    db.add(audit)
    db.commit()
    db.refresh(donor)
    return DonorCardResponse.model_validate(donor)

# --- INTERNATIONAL HEALTH CARD SERVICES ---
@router.get("/ehic", response_model=EHICCardResponse)
def get_digital_ehic(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    patient = _get_patient(user_id, db)
    
    return EHICCardResponse(
        card_number=f"IHIC-{user.id:04d}-99281-2026",
        full_name=user.full_name,
        national_id=user.national_id or "SSN-998241",
        date_of_birth=patient.date_of_birth or "1988-06-15",
        expiry_date="2028-12-31",
        issuer="Global Health Insurance Bureau"
    )

# --- DATA ACCESS AUDIT LOG SERVICES ---
@router.get("/access-log", response_model=List[DataAccessLogResponse])
def get_data_access_logs(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    patient = _get_patient(user_id, db)
    logs = db.query(DataAccessLog).filter(DataAccessLog.patient_id == patient.id).order_by(DataAccessLog.timestamp.desc()).all()

    if not logs:
        log1 = DataAccessLog(
            patient_id=patient.id,
            accessed_by_name="Dr. Astrid Lindgren",
            accessed_by_role="Primary Doctor (PCP)",
            organization="Central Health Clinic",
            purpose="Routine Consultation & Prescription Renewal Check"
        )
        log2 = DataAccessLog(
            patient_id=patient.id,
            accessed_by_name="Dr. Magnus Carlsen",
            accessed_by_role="Cardiologist",
            organization="Metropolitan Medical Center",
            purpose="Specialist Outpatient Evaluation"
        )
        db.add(log1)
        db.add(log2)
        db.commit()
        logs = [log1, log2]

    return [
        DataAccessLogResponse(
            id=l.id,
            accessed_by_name=l.accessed_by_name,
            accessed_by_role=l.accessed_by_role,
            organization=l.organization,
            purpose=l.purpose,
            timestamp=str(l.timestamp)
        )
        for l in logs
    ]
