from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status, Depends

from ..services.auth_service import (
    authenticate_user,
    create_access_token,
    create_user,
    get_current_user,
    get_user_by_email,
)


router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


def _build_auth_response(user):
    token = create_access_token(user["id"], user["email"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
        },
    }


@router.post("/register")
def register(request: RegisterRequest):
    existing_user = get_user_by_email(request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = create_user(request.name, request.email, request.password)
    return _build_auth_response(user)


@router.post("/login")
def login(request: LoginRequest):
    user = authenticate_user(request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return _build_auth_response(user)


@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return {"user": current_user}