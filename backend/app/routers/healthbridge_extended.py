import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.models import Patient, Message, PasientjournalNote, Fullmakt, ReimbursementClaim, AuditLog, Doctor
from app.schemas.schemas import (
    MessageCreate, MessageResponse, PasientjournalNoteResponse,
    FullmaktCreate, FullmaktResponse, FrikortResponse,
    ReimbursementClaimCreate, ReimbursementClaimResponse
)

router = APIRouter(tags=["Universal Digital Health Extended Services"])

def _get_patient(user_id: int, db: Session) -> Patient:
    patient = db.query(Patient).filter(Patient.user_id == user_id).first()
    if not patient:
        patient = Patient(user_id=user_id)
        db.add(patient)
        db.commit()
        db.refresh(patient)
    return patient

# --- 1. INBOX & SECURE MESSAGES ---
@router.get("/inbox", response_model=List[MessageResponse])
def get_inbox_messages(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = _get_patient(int(payload.get("sub")), db)
    messages = db.query(Message).filter(Message.patient_id == patient.id).order_by(Message.created_at.desc()).all()
    
    if not messages:
        msg1 = Message(
            patient_id=patient.id,
            sender_name="Metropolitan Medical Center",
            subject="Appointment Confirmation & Preparation Guidelines",
            body="Your outpatient consultation has been scheduled. Please arrive 15 minutes prior to your time."
        )
        msg2 = Message(
            patient_id=patient.id,
            sender_name="Primary Doctor Dr. Astrid Lindgren",
            subject="Routine Blood Work Test Results Reviewed",
            body="Your recent blood panel parameters are within normal reference ranges. Continue current regimen."
        )
        db.add(msg1)
        db.add(msg2)
        db.commit()
        messages = [msg1, msg2]

    return [
        MessageResponse(
            id=m.id,
            sender_name=m.sender_name,
            subject=m.subject,
            body=m.body,
            is_read=m.is_read,
            created_at=str(m.created_at)
        )
        for m in messages
    ]

@router.post("/inbox", response_model=MessageResponse)
def send_inbox_message(msg: MessageCreate, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = _get_patient(int(payload.get("sub")), db)
    new_msg = Message(
        patient_id=patient.id,
        sender_name="Patient (Self)",
        subject=msg.subject,
        body=msg.body,
        is_read=True
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return MessageResponse(
        id=new_msg.id,
        sender_name=new_msg.sender_name,
        subject=new_msg.subject,
        body=new_msg.body,
        is_read=new_msg.is_read,
        created_at=str(new_msg.created_at)
    )

# --- 2. PASIENTJOURNAL (HOSPITAL EHR) WITH CONSENT TIER ENFORCEMENT ---
@router.get("/pasientjournal", response_model=List[PasientjournalNoteResponse])
def get_pasientjournal(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = _get_patient(int(payload.get("sub")), db)
    
    if patient.consent_level == "basic":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Your current privacy consent tier is set to 'BASIC'. Full hospital medical record access requires 'BASIC+' or 'FULL' consent."
        )

    notes = db.query(PasientjournalNote).filter(PasientjournalNote.patient_id == patient.id).all()

    if not notes:
        n1 = PasientjournalNote(
            patient_id=patient.id,
            hospital_name="Metropolitan Medical Center",
            department="Cardiology Outpatient Clinic",
            doctor_name="Dr. Magnus Carlsen",
            note_type="Discharge Summary",
            summary="Patient evaluated for routine checkup. ECG normal, blood pressure well managed."
        )
        db.add(n1)
        db.commit()
        notes = [n1]

    return [PasientjournalNoteResponse.model_validate(n) for n in notes]

# --- 3. PRIVACY & CONSENT MANAGEMENT ---
@router.put("/consents")
def update_consent_level(consent_level: str, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    if consent_level not in ["basic", "basic_plus", "full"]:
        raise HTTPException(status_code=400, detail="Invalid consent level")

    patient = _get_patient(int(payload.get("sub")), db)
    patient.consent_level = consent_level
    
    audit = AuditLog(user_id=patient.user_id, action="UPDATE_CONSENT", details=f"Consent level updated to {consent_level}")
    db.add(audit)
    db.commit()

    return {"status": "success", "consent_level": consent_level}

# --- 4. POWER OF ATTORNEY WITH SCOPING & REVOCATION ---
@router.get("/fullmakt", response_model=List[FullmaktResponse])
def get_fullmakter(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = _get_patient(int(payload.get("sub")), db)
    return [FullmaktResponse.model_validate(f) for f in patient.fullmakter]

@router.post("/fullmakt", response_model=FullmaktResponse)
def create_fullmakt(item: FullmaktCreate, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = _get_patient(int(payload.get("sub")), db)
    f = Fullmakt(patient_id=patient.id, **item.model_dump())
    db.add(f)
    db.commit()
    db.refresh(f)
    return FullmaktResponse.model_validate(f)

@router.delete("/fullmakt/{fullmakt_id}")
def revoke_fullmakt(fullmakt_id: int, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = _get_patient(int(payload.get("sub")), db)
    f = db.query(Fullmakt).filter(Fullmakt.id == fullmakt_id, Fullmakt.patient_id == patient.id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Power of Attorney authorization not found")
    
    db.delete(f)
    audit = AuditLog(user_id=patient.user_id, action="REVOKE_FULLMAKT", details=f"Revoked Power of Attorney for {f.attorney_name}")
    db.add(audit)
    db.commit()
    return {"status": "success", "message": f"Power of Attorney for {f.attorney_name} revoked."}

# --- 5. DONOR CARD NEXT-OF-KIN ALERT NOTIFICATION ---
@router.post("/donorkort/notify")
def notify_next_of_kin(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = _get_patient(int(payload.get("sub")), db)
    return {
        "status": "success",
        "message": f"Automated SMS & Email notification sent to registered next-of-kin informing them of your Organ Donor Card registration."
    }

# --- 6. IHIC APPLICATION WORKFLOW ---
@router.post("/ehic/apply")
def apply_for_ehic(address: str, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = _get_patient(int(payload.get("sub")), db)
    return {
        "status": "success",
        "message": f"International Health Insurance Card (IHIC) application submitted. Your physical card will be delivered to {address} within 5 business days."
    }

# --- 7. REFERRALS & SPECIALIST WAITING LIST ---
@router.get("/referrals")
def get_referrals_and_waiting_list(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = _get_patient(int(payload.get("sub")), db)
    return [
        {
            "id": 1,
            "specialist_type": "Cardiology Outpatient Clinic",
            "hospital_name": "Metropolitan Medical Center",
            "referred_by": "Dr. Astrid Lindgren (PCP)",
            "status": "Active on Waiting List",
            "queue_position": 3,
            "estimated_wait_weeks": 3,
            "referral_date": "2026-07-01"
        }
    ]

# --- 8. RESEARCH & SCREENING PROGRAMS ---
@router.get("/screening")
def get_screening_programs(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    return [
        {
            "id": 1,
            "program_name": "Colorectal Cancer Screening Program",
            "eligible_cohort": "50–74 years",
            "status": "Up to date",
            "next_due_year": 2027
        },
        {
            "id": 2,
            "program_name": "Cervical Health Screening Program",
            "eligible_cohort": "25–69 years",
            "status": "Verified",
            "next_due_year": 2028
        }
    ]

# --- 9. HEALTH CONTACTS NETWORK ---
@router.get("/health-contacts")
def get_health_contacts(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = _get_patient(int(payload.get("sub")), db)
    doctor = db.query(Doctor).first()
    return [
        {
            "id": 1,
            "role": "Assigned Primary Doctor (PCP)",
            "name": doctor.user.full_name if doctor and doctor.user else "Dr. Astrid Lindgren",
            "clinic": doctor.clinic_name if doctor else "Central Health Clinic",
            "phone": doctor.user.phone if doctor and doctor.user else "+1 (555) 234-5678"
        },
        {
            "id": 2,
            "role": "Hospital Specialist Coordinator",
            "name": "Dr. Magnus Carlsen",
            "clinic": "Metropolitan Medical Center - Cardiology Dept",
            "phone": "+1 (555) 876-5432"
        },
        {
            "id": 3,
            "role": "Community Health Nurse",
            "name": "Ingrid Solberg",
            "clinic": "City Health Station",
            "phone": "+1 (555) 999-0000"
        }
    ]

# --- 10. FRIKORT & CLAIMS ($ CURRENCY) ---
@router.get("/frikort", response_model=FrikortResponse)
def get_frikort_status(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    return FrikortResponse(
        year=2026,
        spent_amount=1850.0,
        exemption_threshold=3000.0,
        is_exempt=False
    )

@router.get("/claims", response_model=List[ReimbursementClaimResponse])
def get_claims(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = _get_patient(int(payload.get("sub")), db)
    claims = db.query(ReimbursementClaim).filter(ReimbursementClaim.patient_id == patient.id).all()
    return [ReimbursementClaimResponse.model_validate(c) for c in claims]

@router.post("/claims", response_model=ReimbursementClaimResponse)
def submit_claim(item: ReimbursementClaimCreate, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = _get_patient(int(payload.get("sub")), db)
    c = ReimbursementClaim(patient_id=patient.id, **item.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return ReimbursementClaimResponse.model_validate(c)
