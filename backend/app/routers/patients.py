from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
import uuid
from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.models import User, Patient, HealthRecord, LabReport, VaccinationRecord, MedicalHistory
from app.schemas.schemas import (
    PatientResponse, PatientProfileUpdate,
    HealthRecordCreate, HealthRecordResponse,
    LabReportCreate, LabReportResponse,
    VaccinationRecordCreate, VaccinationRecordResponse,
    MedicalHistoryCreate, MedicalHistoryResponse,
)

router = APIRouter(prefix="/patients", tags=["Patient Records & Dashboard"])

def _get_patient_by_user_id(user_id: int, db: Session) -> Patient:
    patient = db.query(Patient).filter(Patient.user_id == user_id).first()
    if not patient:
        patient = Patient(user_id=user_id)
        db.add(patient)
        db.commit()
        db.refresh(patient)
    return patient

@router.get("/profile", response_model=PatientResponse)
def get_patient_profile(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    patient = _get_patient_by_user_id(user_id, db)
    return PatientResponse.model_validate(patient)

@router.put("/profile", response_model=PatientResponse)
def update_patient_profile(update_data: PatientProfileUpdate, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    patient = _get_patient_by_user_id(user_id, db)

    for field, val in update_data.model_dump(exclude_unset=True).items():
        setattr(patient, field, val)

    db.commit()
    db.refresh(patient)
    return PatientResponse.model_validate(patient)

# --- MEDICAL HISTORY ---
@router.get("/medical-history", response_model=List[MedicalHistoryResponse])
def get_medical_history(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = _get_patient_by_user_id(int(payload.get("sub")), db)
    records = db.query(MedicalHistory).filter(MedicalHistory.patient_id == patient.id).all()
    return [MedicalHistoryResponse.model_validate(r) for r in records]

@router.post("/medical-history", response_model=MedicalHistoryResponse)
def create_medical_history(item: MedicalHistoryCreate, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = _get_patient_by_user_id(int(payload.get("sub")), db)
    record = MedicalHistory(patient_id=patient.id, **item.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return MedicalHistoryResponse.model_validate(record)

# --- HEALTH RECORDS ---
@router.get("/records", response_model=List[HealthRecordResponse])
def get_health_records(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = _get_patient_by_user_id(int(payload.get("sub")), db)
    records = db.query(HealthRecord).filter(HealthRecord.patient_id == patient.id).all()
    return [HealthRecordResponse.model_validate(r) for r in records]

@router.post("/records", response_model=HealthRecordResponse)
def create_health_record(item: HealthRecordCreate, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = _get_patient_by_user_id(int(payload.get("sub")), db)
    record = HealthRecord(patient_id=patient.id, **item.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return HealthRecordResponse.model_validate(record)

# --- LAB REPORTS ---
@router.get("/lab-reports", response_model=List[LabReportResponse])
def get_lab_reports(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = _get_patient_by_user_id(int(payload.get("sub")), db)
    reports = db.query(LabReport).filter(LabReport.patient_id == patient.id).all()
    return [LabReportResponse.model_validate(r) for r in reports]

# @router.post("/lab-reports", response_model=LabReportResponse)
# def create_lab_report(item: LabReportCreate, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
#     patient = _get_patient_by_user_id(int(payload.get("sub")), db)
#     report = LabReport(patient_id=patient.id, **item.model_dump())
#     db.add(report)
#     db.commit()
#     db.refresh(report)
#     return LabReportResponse.model_validate(report)

@router.post("/lab-reports", response_model=LabReportResponse)
def create_lab_report(
    test_name: str = Form(...),
    category: str = Form(None),
    result_value: str = Form(None),
    reference_range: str = Form(None),
    pdf: UploadFile = File(...),
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    patient = _get_patient_by_user_id(int(payload.get("sub")), db)

    if not pdf.filename.lower().endswith(".pdf"):
        raise HTTPException(
          status_code=400,
          detail="Only PDF files are allowed."
        )

    # Generate a unique filename
    file_extension = os.path.splitext(pdf.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    # Save file
    # file_path = os.path.join("uploads", unique_filename)

    # with open(file_path, "wb") as buffer:
    #     shutil.copyfileobj(pdf.file, buffer)
# Save file
    file_path = os.path.join("uploads", unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(pdf.file, buffer)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}"
        )
    # Save database record
    report = LabReport(
        patient_id=patient.id,
        test_name=test_name,
        category=category,
        result_value=result_value,
        reference_range=reference_range,
        pdf_path=file_path
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return LabReportResponse.model_validate(report)

@router.delete("/lab-reports/{report_id}")
def delete_lab_report(
    report_id: int,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    patient = _get_patient_by_user_id(int(payload.get("sub")), db)

    # Find report belonging to logged-in patient
    report = db.query(LabReport).filter(
        LabReport.id == report_id,
        LabReport.patient_id == patient.id
    ).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Lab report not found."
        )

    # Delete uploaded file if exists
    if report.pdf_path and os.path.exists(report.pdf_path):
        os.remove(report.pdf_path)

    # Delete database record
    db.delete(report)
    db.commit()

    return {
        "message": "Lab report deleted successfully."
    }

# --- VACCINATIONS ---
@router.get("/vaccinations", response_model=List[VaccinationRecordResponse])
def get_vaccinations(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = _get_patient_by_user_id(int(payload.get("sub")), db)
    vacs = db.query(VaccinationRecord).filter(VaccinationRecord.patient_id == patient.id).all()
    return [VaccinationRecordResponse.model_validate(v) for v in vacs]

@router.post("/vaccinations", response_model=VaccinationRecordResponse)
def create_vaccination(item: VaccinationRecordCreate, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    patient = _get_patient_by_user_id(int(payload.get("sub")), db)
    vac = VaccinationRecord(patient_id=patient.id, **item.model_dump())
    db.add(vac)
    db.commit()
    db.refresh(vac)
    return VaccinationRecordResponse.model_validate(vac)
