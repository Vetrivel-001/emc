"""Business logic for the HealthBridge authentication & user-management module.

Routers stay thin and delegate every operation here (Single Responsibility).
Reuses the existing security primitives and the existing User model.
"""
import os
import datetime
from typing import Optional, Tuple, List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logger import logger
from app.core.security import (
    MAX_LOGIN_ATTEMPTS,
    ACCOUNT_LOCK_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    create_password_reset_token,
    decode_access_token,
    hash_token,
)
from app.models.models import User, Patient, Doctor, RefreshToken, LoginHistory, AuditLog
from app.schemas.schemas import UserRegister, UserUpdateMe, AdminUserUpdate

VALID_ROLES = ("patient", "doctor", "admin")


# ---------------------------------------------------------------------------
# Audit & login-history helpers
# ---------------------------------------------------------------------------
def write_audit_log(db: Session, user_id: Optional[int], action: str, details: str, ip_address: Optional[str] = None) -> None:
    db.add(AuditLog(user_id=user_id, action=action, details=details, ip_address=ip_address))


def record_login_history(db: Session, user_id: Optional[int], email: Optional[str], request, status_: str, reason: Optional[str] = None) -> None:
    ip_address = request.client.host if request is not None else None
    user_agent = request.headers.get("user-agent") if request is not None else None
    db.add(LoginHistory(
        user_id=user_id,
        email=email,
        ip_address=ip_address,
        user_agent=user_agent,
        status=status_,
        failure_reason=reason,
    ))


# ---------------------------------------------------------------------------
# Registration & authentication
# ---------------------------------------------------------------------------
def register_user(db: Session, payload: UserRegister) -> User:
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    role = payload.role.lower() if payload.role else "patient"
    if role not in VALID_ROLES:
        role = "patient"

    user = User(
        email=payload.email.lower().strip(),
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        role=role,
        phone=payload.phone,
        national_id=payload.national_id,
        password_changed_at=datetime.datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Provision role profile
    if role == "patient":
        db.add(Patient(user_id=user.id))
    elif role == "doctor":
        db.add(Doctor(user_id=user.id, specialization=payload.specialization or "General Physician"))

    write_audit_log(db, user.id, "REGISTER", f"User registered with role {role}")
    db.commit()
    db.refresh(user)
    return user


def is_locked_out(user: User) -> bool:
    """True while the account is locked and the lock window has not expired."""
    if not user.account_locked:
        return False
    if user.account_locked_at is not None:
        elapsed = datetime.datetime.utcnow() - user.account_locked_at
        if elapsed.total_seconds() > ACCOUNT_LOCK_MINUTES * 60:
            return False  # lock window expired, allow login attempts again
    return True


def issue_refresh_token(db: Session, user: User, request=None) -> str:
    refresh_token = create_refresh_token({"sub": str(user.id), "email": user.email, "role": user.role})
    db.add(RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        user_agent=request.headers.get("user-agent") if request is not None else None,
        ip_address=request.client.host if request is not None else None,
    ))
    return refresh_token


def issue_token_pair(db: Session, user: User, request=None) -> Tuple[str, str]:
    access_token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    refresh_token = issue_refresh_token(db, user, request)
    return access_token, refresh_token


def authenticate_user(db: Session, email: str, password: str, request=None) -> Tuple[User, str, str]:
    """Validate credentials, enforce account lock, and record login history.

    Returns (user, access_token, refresh_token) on success. Keeps the existing
    login flow while adding account-lock and login-history behaviour.
    """
    user = db.query(User).filter(User.email == email.lower().strip()).first()

    if not user:
        record_login_history(db, None, email.lower().strip(), request, "failed", "No account found")
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if is_locked_out(user):
        record_login_history(db, user.id, user.email, request, "locked", "Account temporarily locked")
        db.commit()
        raise HTTPException(
            status_code=423,
            detail=f"Account is temporarily locked after repeated failed logins. Try again in {ACCOUNT_LOCK_MINUTES} minutes.",
        )

    if not verify_password(password, user.password_hash):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
            user.account_locked = True
            user.account_locked_at = datetime.datetime.utcnow()
            record_login_history(db, user.id, user.email, request, "locked", f"Locked after {MAX_LOGIN_ATTEMPTS} failed attempts")
            db.commit()
            raise HTTPException(
                status_code=423,
                detail=f"Account locked after {MAX_LOGIN_ATTEMPTS} failed login attempts. Try again later.",
            )
        record_login_history(db, user.id, user.email, request, "failed", "Invalid password")
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    # Success: reset counters, stamp last login, issue tokens
    user.failed_login_attempts = 0
    user.account_locked = False
    user.account_locked_at = None
    user.last_login = datetime.datetime.utcnow()
    access_token, refresh_token = issue_token_pair(db, user, request)
    record_login_history(db, user.id, user.email, request, "success")
    write_audit_log(db, user.id, "LOGIN", "User logged in", request.client.host if request is not None else None)
    db.commit()
    return user, access_token, refresh_token


def refresh_access_token(db: Session, refresh_token: str, request=None) -> Tuple[User, str, str]:
    """Validate a refresh token and rotate it (revoke old, issue new pair)."""
    payload = decode_access_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = int(payload.get("sub"))
    record = db.query(RefreshToken).filter(RefreshToken.token_hash == hash_token(refresh_token)).first()
    if not record or record.revoked:
        raise HTTPException(status_code=401, detail="Refresh token has been revoked")

    if record.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=401, detail="Refresh token has expired")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User account no longer active")

    record.revoked = True
    access_token, new_refresh = issue_token_pair(db, user, request)
    write_audit_log(db, user.id, "TOKEN_REFRESH", "Access token refreshed", request.client.host if request is not None else None)
    db.commit()
    return user, access_token, new_refresh


def logout_user(db: Session, user: User, refresh_token: Optional[str] = None) -> None:
    if refresh_token:
        record = db.query(RefreshToken).filter(RefreshToken.token_hash == hash_token(refresh_token)).first()
        if record and not record.revoked:
            record.revoked = True
    write_audit_log(db, user.id, "LOGOUT", "User logged out")
    db.commit()


# ---------------------------------------------------------------------------
# Password management
# ---------------------------------------------------------------------------
def _revoke_all_user_tokens(db: Session, user_id: int) -> None:
    for record in db.query(RefreshToken).filter(RefreshToken.user_id == user_id, RefreshToken.revoked == False).all():
        record.revoked = True


def change_password(db: Session, user: User, current_password: str, new_password: str) -> None:
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if current_password == new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password")

    user.password_hash = get_password_hash(new_password)
    user.password_changed_at = datetime.datetime.utcnow()
    _revoke_all_user_tokens(db, user.id)
    write_audit_log(db, user.id, "CHANGE_PASSWORD", "User changed password")
    db.commit()


def forgot_password(db: Session, email: str) -> Optional[str]:
    """Generate a short-lived password-reset token.

    Returns the token (demo/dev only) or None. The response message is always
    the same whether or not the account exists to avoid user enumeration.
    """
    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if not user:
        return None

    token = create_password_reset_token(user)
    logger.info(f"Password reset link for {user.email} (dev): /reset-password?token={token}")
    write_audit_log(db, user.id, "FORGOT_PASSWORD", "Password reset requested")
    db.commit()
    return token


def reset_password(db: Session, token: str, new_password: str) -> None:
    payload = decode_access_token(token)
    if not payload or payload.get("type") != "password_reset":
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token")

    user = db.query(User).filter(User.id == int(payload.get("sub"))).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token")

    user.password_hash = get_password_hash(new_password)
    user.password_changed_at = datetime.datetime.utcnow()
    user.failed_login_attempts = 0
    user.account_locked = False
    user.account_locked_at = None
    _revoke_all_user_tokens(db, user.id)
    write_audit_log(db, user.id, "PASSWORD_RESET", "Password reset via token")
    db.commit()


# ---------------------------------------------------------------------------
# Self-service profile management
# ---------------------------------------------------------------------------
def update_own_profile(db: Session, user: User, payload: UserUpdateMe) -> User:
    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.national_id is not None:
        existing = db.query(User).filter(User.national_id == payload.national_id, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="National ID already in use")
        user.national_id = payload.national_id
    write_audit_log(db, user.id, "PROFILE_UPDATE", "User updated own profile")
    db.commit()
    db.refresh(user)
    return user


def deactivate_own_account(db: Session, user: User) -> None:
    user.is_active = False
    _revoke_all_user_tokens(db, user.id)
    write_audit_log(db, user.id, "ACCOUNT_DEACTIVATED", "User deactivated own account")
    db.commit()


def get_login_history(db: Session, user_id: int, limit: int = 20) -> List[LoginHistory]:
    return (
        db.query(LoginHistory)
        .filter(LoginHistory.user_id == user_id)
        .order_by(LoginHistory.timestamp.desc())
        .limit(max(1, min(limit, 100)))
        .all()
    )


# ---------------------------------------------------------------------------
# Admin user management
# ---------------------------------------------------------------------------
def list_users(db: Session, page: int = 1, limit: int = 20, search: Optional[str] = None):
    query = db.query(User)
    if search:
        like = f"%{search.strip()}%"
        query = query.filter((User.email.like(like)) | (User.full_name.like(like)))
    total = query.count()
    users = (
        query.order_by(User.id)
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return users, total


def get_user_by_id(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def update_user_by_admin(db: Session, user: User, payload: AdminUserUpdate) -> User:
    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
    if payload.email is not None:
        new_email = payload.email.lower().strip()
        existing = db.query(User).filter(User.email == new_email, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = new_email
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.national_id is not None:
        existing = db.query(User).filter(User.national_id == payload.national_id, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="National ID already in use")
        user.national_id = payload.national_id
    if payload.role is not None:
        role = payload.role.lower()
        if role not in VALID_ROLES:
            raise HTTPException(status_code=400, detail="Invalid role")
        user.role = role
        if role == "patient" and not user.patient_profile:
            db.add(Patient(user_id=user.id))
        elif role == "doctor" and not user.doctor_profile:
            db.add(Doctor(user_id=user.id, specialization="General Practice"))
    if payload.is_active is not None:
        user.is_active = payload.is_active

    write_audit_log(db, user.id, "ADMIN_USER_UPDATE", f"Admin updated user {user.id}")
    db.commit()
    db.refresh(user)
    return user


def delete_user_by_admin(db: Session, user: User, admin_user: User) -> None:
    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    write_audit_log(db, user.id, "ADMIN_USER_DELETE", f"Deleted by admin {admin_user.id}")
    db.delete(user)
    db.commit()
