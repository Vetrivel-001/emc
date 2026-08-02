import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy import inspect, text
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    national_id = Column(String, unique=True, nullable=True)  # Fødselsnummer (11 digits)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="patient")  # patient, doctor, admin
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # --- Authentication enhancement fields ---
    last_login = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    email_verified = Column(Boolean, default=False)
    password_changed_at = Column(DateTime, nullable=True)
    account_locked = Column(Boolean, default=False)
    account_locked_at = Column(DateTime, nullable=True)
    created_by = Column(Integer, nullable=True)  # id of the admin who created the user (if any)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    patient_profile = relationship("Patient", back_populates="user", uselist=False, cascade="all, delete-orphan")
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    login_history = relationship("LoginHistory", back_populates="user", cascade="all, delete-orphan")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)
    user_agent = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="refresh_tokens")

class LoginHistory(Base):
    __tablename__ = "login_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    email = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    status = Column(String, default="success")  # success, failed, locked
    failure_reason = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="login_history")

def run_schema_migrations(engine):
    """Additively migrate existing SQLite databases to include new User columns.

    ``Base.metadata.create_all`` only creates missing tables; it never alters
    existing ones. This helper adds the new authentication columns to an
    already-initialised ``healthbridge.db`` without touching existing rows.
    """
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    if "users" not in tables:
        return

    existing_columns = {c["name"] for c in inspector.get_columns("users")}
    new_columns = {
        "last_login": "DATETIME",
        "failed_login_attempts": "INTEGER DEFAULT 0",
        "email_verified": "BOOLEAN DEFAULT 0",
        "password_changed_at": "DATETIME",
        "account_locked": "BOOLEAN DEFAULT 0",
        "account_locked_at": "DATETIME",
        "created_by": "INTEGER",
        "updated_at": "DATETIME",
    }

    with engine.begin() as conn:
        for column_name, column_type in new_columns.items():
            if column_name not in existing_columns:
                conn.execute(text(f'ALTER TABLE users ADD COLUMN "{column_name}" {column_type}'))

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    date_of_birth = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)
    emergency_contact = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    fastlege_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    gp_switch_count = Column(Integer, default=0)
    consent_level = Column(String, default="full")  # basic, basic_plus, full

    user = relationship("User", back_populates="patient_profile")
    fastlege = relationship("Doctor", foreign_keys=[fastlege_id])
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    medical_histories = relationship("MedicalHistory", back_populates="patient", cascade="all, delete-orphan")
    health_records = relationship("HealthRecord", back_populates="patient", cascade="all, delete-orphan")
    lab_reports = relationship("LabReport", back_populates="patient", cascade="all, delete-orphan")
    vaccinations = relationship("VaccinationRecord", back_populates="patient", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="patient", cascade="all, delete-orphan")
    donor_card = relationship("DonorCard", back_populates="patient", uselist=False, cascade="all, delete-orphan")
    access_logs = relationship("DataAccessLog", back_populates="patient", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="patient", cascade="all, delete-orphan")
    pasientjournal_notes = relationship("PasientjournalNote", back_populates="patient", cascade="all, delete-orphan")
    fullmakter = relationship("Fullmakt", back_populates="patient", cascade="all, delete-orphan")
    claims = relationship("ReimbursementClaim", back_populates="patient", cascade="all, delete-orphan")

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    specialization = Column(String, nullable=False)
    license_number = Column(String, nullable=True)
    qualification = Column(String, nullable=True)
    experience_years = Column(Integer, default=0)
    bio = Column(Text, nullable=True)
    consultation_fee = Column(Float, default=50.0)
    clinic_name = Column(String, default="Oslo Municipal Health Center")
    max_patient_capacity = Column(Integer, default=1500)
    current_patient_count = Column(Integer, default=1200)

    user = relationship("User", back_populates="doctor_profile")
    appointments = relationship("Appointment", back_populates="doctor", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="doctor", cascade="all, delete-orphan")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    appointment_date = Column(String, nullable=False)
    appointment_time = Column(String, nullable=False)
    status = Column(String, default="scheduled")
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")

class MedicalHistory(Base):
    __tablename__ = "medical_histories"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    condition_name = Column(String, nullable=False)
    diagnosed_date = Column(String, nullable=True)
    status = Column(String, default="active")
    notes = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="medical_histories")

class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    record_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String, nullable=True)
    record_date = Column(String, default=lambda: datetime.date.today().isoformat())

    patient = relationship("Patient", back_populates="health_records")

class LabReport(Base):
    __tablename__ = "lab_reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    test_name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    result_value = Column(String, nullable=True)
    reference_range = Column(String, nullable=True)
    report_date = Column(String, default=lambda: datetime.date.today().isoformat())
    pdf_path = Column(String, nullable=True)

    patient = relationship("Patient", back_populates="lab_reports")

class VaccinationRecord(Base):
    __tablename__ = "vaccination_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    vaccine_name = Column(String, nullable=False)
    dose_number = Column(Integer, default=1)
    administered_date = Column(String, nullable=False)
    next_due_date = Column(String, nullable=True)
    provider = Column(String, nullable=True)

    patient = relationship("Patient", back_populates="vaccinations")

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    medication_name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    usage_instructions = Column(Text, nullable=True)
    status = Column(String, default="active")
    valid_until = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="prescriptions")
    doctor = relationship("Doctor", back_populates="prescriptions")

class DonorCard(Base):
    __tablename__ = "donor_cards"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), unique=True, nullable=False)
    is_donor = Column(Boolean, default=True)
    organ_restrictions = Column(String, nullable=True)
    next_of_kin_name = Column(String, nullable=True)
    next_of_kin_phone = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="donor_card")

class DataAccessLog(Base):
    __tablename__ = "data_access_logs"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    accessed_by_name = Column(String, nullable=False)
    accessed_by_role = Column(String, nullable=False)
    organization = Column(String, nullable=False)
    purpose = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="access_logs")

# --- HealthBridge EXTENDED MODELS FOR THE 31 FEATURES ---
class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    sender_name = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="messages")

class PasientjournalNote(Base):
    __tablename__ = "pasientjournal_notes"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    hospital_name = Column(String, nullable=False)
    department = Column(String, nullable=False)
    doctor_name = Column(String, nullable=False)
    note_type = Column(String, nullable=False)  # Discharge Summary, Clinical Note, Referral
    summary = Column(Text, nullable=False)
    record_date = Column(String, default=lambda: datetime.date.today().isoformat())

    patient = relationship("Patient", back_populates="pasientjournal_notes")

class Fullmakt(Base):
    __tablename__ = "fullmakter"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    attorney_name = Column(String, nullable=False)
    attorney_national_id = Column(String, nullable=False)
    scope = Column(String, default="Full HealthBridge Access")  # Prescriptions, General, Full
    valid_until = Column(String, nullable=False)

    patient = relationship("Patient", back_populates="fullmakter")

class ReimbursementClaim(Base):
    __tablename__ = "reimbursement_claims"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    claim_type = Column(String, nullable=False)  # pasientreiser, helfo_blue_rx, dental, npe_claim
    amount = Column(Float, default=0.0)
    details = Column(Text, nullable=False)
    status = Column(String, default="submitted")  # submitted, approved, rejected
    submitted_date = Column(String, default=lambda: datetime.date.today().isoformat())

    patient = relationship("Patient", back_populates="claims")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
