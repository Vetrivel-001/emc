from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.models import Patient, MedicalHistory, LabReport, Prescription, User
from app.schemas.schemas import (
    ChatRequest, ChatResponse,
    SummarizeRecordsRequest, SummarizeRecordsResponse,
    AISearchRequest, AISearchResponse,
    KnowledgeBaseCategory
)
from app.services.ai_service import ai_service

router = APIRouter(prefix="/ai", tags=["AI Health Assistant"])

@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    history = [msg.model_dump() for msg in payload.chat_history] if payload.chat_history else []
    reply, interaction_id = await ai_service.generate_response(message=message, chat_history=history)
    return ChatResponse(reply=reply, interaction_id=interaction_id)

@router.post("/summarize-records", response_model=SummarizeRecordsResponse)
async def summarize_records(
    payload: SummarizeRecordsRequest,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user_payload)
):
    """Generates an AI summary of medical records, lab test reports, and prescriptions."""
    patient_records: Dict[str, Any] = {
        "medical_histories": [],
        "lab_reports": [],
        "prescriptions": []
    }

    # Fetch patient records from DB if patient context is available
    target_patient = None
    if current_user and current_user.get("user_id"):
        target_patient = db.query(Patient).filter(Patient.user_id == current_user["user_id"]).first()
    
    if not target_patient and payload.patient_id:
        target_patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()

    if not target_patient:
        # Fallback to demo patient if database lookup has no specific patient
        target_patient = db.query(Patient).first()

    if target_patient:
        if payload.include_medical_history:
            histories = db.query(MedicalHistory).filter(MedicalHistory.patient_id == target_patient.id).all()
            patient_records["medical_histories"] = [
                {"condition_name": h.condition_name, "status": h.status, "notes": h.notes}
                for h in histories
            ]
        if payload.include_lab_reports:
            labs = db.query(LabReport).filter(LabReport.patient_id == target_patient.id).all()
            patient_records["lab_reports"] = [
                {"test_name": l.test_name, "result_value": l.result_value, "reference_range": l.reference_range}
                for l in labs
            ]
        if payload.include_prescriptions:
            rxs = db.query(Prescription).filter(Prescription.patient_id == target_patient.id).all()
            patient_records["prescriptions"] = [
                {"medication_name": p.medication_name, "dosage": p.dosage, "status": p.status}
                for p in rxs
            ]

    # If payload provided custom text records, append them as text context
    if payload.records_text and payload.records_text.strip():
        patient_records["custom_notes"] = payload.records_text.strip()

    summary_result = await ai_service.summarize_medical_records(patient_records)
    return SummarizeRecordsResponse(**summary_result)

@router.post("/search", response_model=AISearchResponse)
async def ai_search(payload: AISearchRequest):
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Search query cannot be empty")

    results = await ai_service.search_medical_topics(
        query=query,
        category=payload.category,
        limit=payload.limit or 5
    )
    return AISearchResponse(**results)

@router.get("/knowledge-base", response_model=List[KnowledgeBaseCategory])
def get_knowledge_base():
    """Retrieves all indexed RAG knowledge base categories and topics."""
    categories = ai_service.get_knowledge_categories()
    return [KnowledgeBaseCategory(**c) for c in categories]
