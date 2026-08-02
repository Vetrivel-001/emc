from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional, List

# --- AUTH & USER SCHEMAS ---
class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "patient"
    phone: Optional[str] = None
    national_id: Optional[str] = None
    specialization: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    national_id: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class UserRoleUpdate(BaseModel):
    role: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class SystemStatsResponse(BaseModel):
    total_users: int
    total_patients: int
    total_doctors: int
    total_appointments: int
    total_prescriptions: int
    total_audit_logs: int

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None
    user: UserResponse

class UserUpdateMe(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    national_id: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class RefreshTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserAdminResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    national_id: Optional[str] = None
    is_active: bool
    email_verified: bool = False
    account_locked: bool = False
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    national_id: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class PaginatedUsersResponse(BaseModel):
    total: int
    page: int
    limit: int
    pages: int
    users: List[UserAdminResponse]

class LoginHistoryResponse(BaseModel):
    id: int
    email: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    status: str
    failure_reason: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# --- PATIENT & FASTLEGE SCHEMAS ---
class PatientProfileUpdate(BaseModel):
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    consent_level: Optional[str] = "full"

class FastlegeResponse(BaseModel):
    doctor_id: int
    doctor_name: str
    specialization: str
    clinic_name: str
    phone: Optional[str] = None
    capacity_available: int

class PatientResponse(BaseModel):
    id: int
    user_id: int
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    fastlege_id: Optional[int] = None
    gp_switch_count: Optional[int] = 0
    consent_level: Optional[str] = "full"
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# --- DOCTOR SCHEMAS ---
class DoctorCreate(BaseModel):
    specialization: str
    license_number: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = 0
    bio: Optional[str] = None
    consultation_fee: Optional[float] = 50.0
    clinic_name: Optional[str] = "Oslo Municipal Health Center"

class DoctorResponse(BaseModel):
    id: int
    user_id: int
    specialization: str
    license_number: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = 0
    bio: Optional[str] = None
    consultation_fee: Optional[float] = 50.0
    clinic_name: Optional[str] = None
    current_patient_count: Optional[int] = 0
    max_patient_capacity: Optional[int] = 1500
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# --- APPOINTMENT SCHEMAS ---
class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_date: str
    appointment_time: str
    reason: Optional[str] = None

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    appointment_date: str
    appointment_time: str
    status: str
    reason: Optional[str] = None
    notes: Optional[str] = None
    doctor: Optional[DoctorResponse] = None
    patient: Optional[PatientResponse] = None

    class Config:
        from_attributes = True

# --- MEDICAL RECORDS SCHEMAS ---
class MedicalHistoryCreate(BaseModel):
    condition_name: str
    diagnosed_date: Optional[str] = None
    status: Optional[str] = "active"
    notes: Optional[str] = None

class MedicalHistoryResponse(BaseModel):
    id: int
    patient_id: int
    condition_name: str
    diagnosed_date: Optional[str] = None
    status: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class HealthRecordCreate(BaseModel):
    record_type: str
    title: str
    description: Optional[str] = None
    file_path: Optional[str] = None

class HealthRecordResponse(BaseModel):
    id: int
    patient_id: int
    record_type: str
    title: str
    description: Optional[str] = None
    file_path: Optional[str] = None
    record_date: str

    class Config:
        from_attributes = True
        
class LabReportCreate(BaseModel):
    test_name: str
    category: Optional[str] = None
    result_value: Optional[str] = None
    reference_range: Optional[str] = None
    pdf_path: Optional[str] = None

class LabReportResponse(BaseModel):
    id: int
    patient_id: int
    test_name: str
    category: Optional[str] = None
    result_value: Optional[str] = None
    reference_range: Optional[str] = None
    report_date: str
    pdf_path: Optional[str] = None

    class Config:
        from_attributes = True

class VaccinationRecordCreate(BaseModel):
    vaccine_name: str
    dose_number: Optional[int] = 1
    administered_date: str
    next_due_date: Optional[str] = None
    provider: Optional[str] = None

class VaccinationRecordResponse(BaseModel):
    id: int
    patient_id: int
    vaccine_name: str
    dose_number: int
    administered_date: str
    next_due_date: Optional[str] = None
    provider: Optional[str] = None

    class Config:
        from_attributes = True

# --- HealthBridge EXTENDED SCHEMAS ---
class MessageCreate(BaseModel):
    subject: str
    body: str

class MessageResponse(BaseModel):
    id: int
    sender_name: str
    subject: str
    body: str
    is_read: bool
    created_at: str

    class Config:
        from_attributes = True

class PasientjournalNoteResponse(BaseModel):
    id: int
    hospital_name: str
    department: str
    doctor_name: str
    note_type: str
    summary: str
    record_date: str

    class Config:
        from_attributes = True

class FullmaktCreate(BaseModel):
    attorney_name: str
    attorney_national_id: str
    scope: Optional[str] = "Full HealthBridge Access"
    valid_until: str

class FullmaktResponse(BaseModel):
    id: int
    attorney_name: str
    attorney_national_id: str
    scope: str
    valid_until: str

    class Config:
        from_attributes = True

class FrikortResponse(BaseModel):
    year: int
    spent_amount: float
    exemption_threshold: float = 3040.0
    is_exempt: bool

class ReimbursementClaimCreate(BaseModel):
    claim_type: str  # pasientreiser, helfo_blue_rx, dental, npe_claim
    amount: float
    details: str

class ReimbursementClaimResponse(BaseModel):
    id: int
    claim_type: str
    amount: float
    details: str
    status: str
    submitted_date: str

    class Config:
        from_attributes = True

class PrescriptionCreate(BaseModel):
    patient_id: int
    medication_name: str
    dosage: str
    usage_instructions: Optional[str] = None
    valid_until: str

class PrescriptionResponse(BaseModel):
    id: int
    patient_id: Optional[int] = None
    doctor_id: Optional[int] = None
    medication_name: str
    dosage: str
    usage_instructions: Optional[str] = None
    status: str
    valid_until: str
    doctor_name: Optional[str] = None

    class Config:
        from_attributes = True

class PatientDetailResponse(BaseModel):
    id: int
    user_id: int
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    user: Optional[UserResponse] = None
    medical_histories: List[MedicalHistoryResponse] = []
    lab_reports: List[LabReportResponse] = []
    vaccinations: List[VaccinationRecordResponse] = []
    prescriptions: List[PrescriptionResponse] = []
    pasientjournal_notes: List[PasientjournalNoteResponse] = []

    class Config:
        from_attributes = True

class DonorCardUpdate(BaseModel):
    is_donor: bool
    organ_restrictions: Optional[str] = "All organs"
    next_of_kin_name: Optional[str] = None
    next_of_kin_phone: Optional[str] = None

class DonorCardResponse(BaseModel):
    id: int
    patient_id: int
    is_donor: bool
    organ_restrictions: Optional[str] = None
    next_of_kin_name: Optional[str] = None
    next_of_kin_phone: Optional[str] = None

    class Config:
        from_attributes = True

class DataAccessLogResponse(BaseModel):
    id: int
    accessed_by_name: str
    accessed_by_role: str
    organization: str
    purpose: str
    timestamp: str

    class Config:
        from_attributes = True

class EHICCardResponse(BaseModel):
    card_number: str
    full_name: str
    national_id: str
    date_of_birth: str
    expiry_date: str
    issuer: str = "HELFO Norway"

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    message: str
    chat_history: Optional[List[ChatMessage]] = []
    previous_interaction_id: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    interaction_id: Optional[str] = None

class SummarizeRecordsRequest(BaseModel):
    patient_id: Optional[int] = None
    records_text: Optional[str] = None
    include_prescriptions: Optional[bool] = True
    include_lab_reports: Optional[bool] = True
    include_medical_history: Optional[bool] = True

class SummarizeRecordsResponse(BaseModel):
    summary: str
    key_findings: List[str] = []
    risk_level: str = "Low"  # Low, Moderate, High, Critical
    recommendations: List[str] = []
    generated_at: str

class AISearchRequest(BaseModel):
    query: str
    category: Optional[str] = None
    limit: Optional[int] = 5

class AISearchResultItem(BaseModel):
    topic: str
    category: str
    content: str
    relevance_score: float
    key_takeaway: Optional[str] = None

class AISearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[AISearchResultItem]
    ai_overview: Optional[str] = None

class KnowledgeBaseCategory(BaseModel):
    category: str
    topic_count: int
    topics: List[str]

