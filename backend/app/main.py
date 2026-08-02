from fastapi import Request
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.core.logger import logger
from app.models.models import User, Patient, Doctor, Prescription, DonorCard, DataAccessLog, run_schema_migrations
from app.routers import auth, patients, doctors, appointments, ai, admin, users, healthbridge, healthbridge_extended

# Create DB tables (new tables) + additively migrate existing tables (new columns)
Base.metadata.create_all(bind=engine)
run_schema_migrations(engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url.path}")

    response = await call_next(request)

    logger.info(
        f"Response: {request.method} {request.url.path} - Status {response.status_code}"
    )

    return response

# Static directories
os.makedirs("uploads", exist_ok=True)
os.makedirs("logs", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(patients.router, prefix=settings.API_V1_STR)
app.include_router(doctors.router, prefix=settings.API_V1_STR)
app.include_router(appointments.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)

# Core HealthBridge Services (mounted under /HealthBridge, /healthbridge, and /helsenorge)
app.include_router(healthbridge.router, prefix=f"{settings.API_V1_STR}/HealthBridge")
app.include_router(healthbridge.router, prefix=f"{settings.API_V1_STR}/healthbridge", include_in_schema=False)
app.include_router(healthbridge.router, prefix=f"{settings.API_V1_STR}/helsenorge", include_in_schema=False)

# Extended HealthBridge Services (mounted under /HealthBridge-ext, /healthbridge-ext, and /helsenorge-ext)
app.include_router(healthbridge_extended.router, prefix=f"{settings.API_V1_STR}/HealthBridge-ext")
app.include_router(healthbridge_extended.router, prefix=f"{settings.API_V1_STR}/healthbridge-ext", include_in_schema=False)
app.include_router(healthbridge_extended.router, prefix=f"{settings.API_V1_STR}/helsenorge-ext", include_in_schema=False)

@app.on_event("startup")
def seed_initial_data():
    logger.info("HealthBridge application started")
    db = SessionLocal()
    try:
        # 1. Admin
        admin_user = db.query(User).filter(User.email == "admin@healthbridge.no").first()
        if not admin_user:
            admin_user = User(
                email="admin@healthbridge.no",
                password_hash=get_password_hash("Admin123!"),
                full_name="HealthBridge Administrator",
                role="admin",
                national_id="01019012345"
            )
            db.add(admin_user)

        # 2. Demo Doctors
        doc_user1 = db.query(User).filter(User.email == "doctor@healthbridge.no").first()
        if not doc_user1:
            doc_user1 = User(
                email="doctor@healthbridge.no",
                password_hash=get_password_hash("Doctor123!"),
                full_name="Dr. Astrid Lindgren",
                role="doctor",
                phone="+1 (555) 234-5678",
                national_id="12048598765"
            )
            db.add(doc_user1)
            db.commit()
            db.refresh(doc_user1)

            doc1_profile = Doctor(
                user_id=doc_user1.id,
                specialization="Primary Care Physician (PCP)",
                license_number="US-982341",
                qualification="MD (Harvard Medical School)",
                experience_years=12,
                bio="Specialist in primary healthcare, preventive medicine, and family practice.",
                clinic_name="Central Health Clinic",
                consultation_fee=75.0
            )
            db.add(doc1_profile)

        doc_user2 = db.query(User).filter(User.email == "doctor2@healthbridge.no").first()
        if not doc_user2:
            doc_user2 = User(
                email="doctor2@healthbridge.no",
                password_hash=get_password_hash("Doctor123!"),
                full_name="Dr. Magnus Carlsen",
                role="doctor",
                phone="+1 (555) 876-5432",
                national_id="25119054321"
            )
            db.add(doc_user2)
            db.commit()
            db.refresh(doc_user2)

            doc2_profile = Doctor(
                user_id=doc_user2.id,
                specialization="Cardiology & Internal Medicine",
                license_number="US-771192",
                qualification="MD PhD (Johns Hopkins)",
                experience_years=15,
                bio="Consultant in cardiovascular conditions and general internal medicine.",
                clinic_name="Metropolitan Medical Center",
                consultation_fee=90.0
            )
            db.add(doc2_profile)

        # 3. Demo Patient
        pat_user = db.query(User).filter(User.email == "patient@healthbridge.no").first()
        if not pat_user:
            pat_user = User(
                email="patient@healthbridge.no",
                password_hash=get_password_hash("Patient123!"),
                full_name="Lars Hansen",
                role="patient",
                phone="+1 (555) 912-3456",
                national_id="15068844321"
            )
            db.add(pat_user)
            db.commit()
            db.refresh(pat_user)

            fastlege_doc = db.query(Doctor).first()
            pat_profile = Patient(
                user_id=pat_user.id,
                date_of_birth="1988-06-15",
                gender="Male",
                blood_group="O+",
                emergency_contact="+1 (555) 987-6543",
                address="100 Main Street, Suite 400",
                fastlege_id=fastlege_doc.id if fastlege_doc else None
            )
            db.add(pat_profile)
            db.commit()
            db.refresh(pat_profile)

            # Seed demo prescriptions
            rx1 = Prescription(
                patient_id=pat_profile.id,
                doctor_id=fastlege_doc.id if fastlege_doc else 1,
                medication_name="Paracetamol 500mg",
                dosage="1 tablet up to 3 times daily as needed for pain",
                status="active",
                valid_until="2027-01-15"
            )
            rx2 = Prescription(
                patient_id=pat_profile.id,
                doctor_id=fastlege_doc.id if fastlege_doc else 1,
                medication_name="Ventolin Evohaler 100mcg",
                dosage="1-2 puffs when required for acute asthma symptoms",
                status="active",
                valid_until="2026-11-30"
            )
            db.add(rx1)
            db.add(rx2)

            # Seed Donor card
            donor = DonorCard(
                patient_id=pat_profile.id,
                is_donor=True,
                organ_restrictions="All organs",
                next_of_kin_name="Kari Hansen",
                next_of_kin_phone="+1 (555) 987-6543"
            )
            db.add(donor)

        db.commit()
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "message": "Welcome to HealthBridge Digital Healthcare API",
        "docs": "/docs",
        "version": settings.VERSION,
    }
