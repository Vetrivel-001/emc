import os
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token, get_current_user_payload, get_current_user
from app.models.models import User
from app.schemas.schemas import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    UserRoleUpdate,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    RefreshTokenRequest,
    RefreshTokenResponse,
)
from app.services import user_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Convenience flag controlling whether the reset token is echoed in the
# forgot-password response. Disable in production (real email delivery).
_INCLUDE_RESET_TOKEN = os.getenv("PASSWORD_RESET_INCLUDE_TOKEN", "true").lower() == "true"


@router.post("/register", response_model=TokenResponse)
def register_user(payload: UserRegister, request: Request, db: Session = Depends(get_db)):
    user = user_service.register_user(db, payload)
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    refresh_token = user_service.issue_refresh_token(db, user, request)
    db.commit()
    return TokenResponse(access_token=token, refresh_token=refresh_token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login_user(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    user, token, refresh_token = user_service.authenticate_user(db, payload.email, payload.password, request)
    return TokenResponse(access_token=token, refresh_token=refresh_token, user=UserResponse.model_validate(user))


@router.post("/refresh-token", response_model=RefreshTokenResponse)
def refresh_token(payload: RefreshTokenRequest, request: Request, db: Session = Depends(get_db)):
    user, access_token, new_refresh = user_service.refresh_access_token(db, payload.refresh_token, request)
    return RefreshTokenResponse(access_token=access_token, refresh_token=new_refresh, user=UserResponse.model_validate(user))


@router.post("/logout")
def logout(payload: RefreshTokenRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_service.logout_user(db, user, payload.refresh_token or None)
    return {"detail": "Logged out successfully"}


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    reset_token = user_service.forgot_password(db, payload.email)
    detail = "If an account exists for this email, a password reset link has been sent."
    if _INCLUDE_RESET_TOKEN and reset_token:
        return {"detail": detail, "reset_token": reset_token}
    return {"detail": detail}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user_service.reset_password(db, payload.token, payload.new_password)
    return {"detail": "Password has been reset. You can now log in."}


@router.get("/me", response_model=UserResponse)
def get_current_user(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)


@router.put("/me", response_model=UserResponse)
def update_current_user(update_data: UserRoleUpdate, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if update_data.full_name:
        user.full_name = update_data.full_name
    if update_data.phone:
        user.phone = update_data.phone
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)
