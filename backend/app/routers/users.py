from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import User
from app.schemas.schemas import (
    UserResponse,
    UserAdminResponse,
    UserUpdateMe,
    ChangePasswordRequest,
    LoginHistoryResponse,
    AdminUserUpdate,
    PaginatedUsersResponse,
)
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Users"])


# ---------------------------------------------------------------------------
# Self-service (any authenticated role)
# ---------------------------------------------------------------------------
@router.get("/me", response_model=UserResponse)
def get_my_profile(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)


@router.put("/me", response_model=UserResponse)
def update_my_profile(
    payload: UserUpdateMe,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updated = user_service.update_own_profile(db, user, payload)
    return UserResponse.model_validate(updated)


@router.patch("/change-password")
def change_my_password(
    payload: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_service.change_password(db, user, payload.current_password, payload.new_password)
    return {"detail": "Password changed successfully"}


@router.delete("/me")
def deactivate_my_account(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_service.deactivate_own_account(db, user)
    return {"detail": "Account deactivated"}


@router.get("/me/login-history", response_model=List[LoginHistoryResponse])
def get_my_login_history(
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_service.get_login_history(db, user.id, limit)


# ---------------------------------------------------------------------------
# Admin user management (admin role only)
# ---------------------------------------------------------------------------
@router.get("", response_model=PaginatedUsersResponse)
def admin_list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    _: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    users, total = user_service.list_users(db, page, limit, search)
    pages = (total + limit - 1) // limit if total else 0
    return PaginatedUsersResponse(
        total=total,
        page=page,
        limit=limit,
        pages=pages,
        users=[UserAdminResponse.model_validate(u) for u in users],
    )


@router.get("/{user_id}", response_model=UserAdminResponse)
def admin_get_user(
    user_id: int,
    _: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    user = user_service.get_user_by_id(db, user_id)
    return UserAdminResponse.model_validate(user)


@router.put("/{user_id}", response_model=UserAdminResponse)
def admin_update_user(
    user_id: int,
    payload: AdminUserUpdate,
    _: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    user = user_service.get_user_by_id(db, user_id)
    updated = user_service.update_user_by_admin(db, user, payload)
    return UserAdminResponse.model_validate(updated)


@router.delete("/{user_id}")
def admin_delete_user(
    user_id: int,
    admin_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    user = user_service.get_user_by_id(db, user_id)
    user_service.delete_user_by_admin(db, user, admin_user)
    return {"detail": f"User {user_id} deleted"}
