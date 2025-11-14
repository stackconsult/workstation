"""Authentication API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import List
from datetime import datetime

from src.auth import create_access_token, create_refresh_token, verify_token
from src.auth import generate_api_key, require_auth

router = APIRouter(prefix="/api/auth", tags=["authentication"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    username: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class APIKeyResponse(BaseModel):
    id: str
    key: str
    created_at: datetime


@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest):
    """Register a new user."""
    # TODO: Hash password with bcrypt and save to database
    # For now, generate tokens
    user_data = {"user_id": "mock-user-id", "email": request.email}
    return TokenResponse(
        access_token=create_access_token(user_data),
        refresh_token=create_refresh_token(user_data)
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Login and get JWT tokens."""
    # TODO: Verify password from database
    user_data = {"user_id": "mock-user-id", "email": request.email}
    return TokenResponse(
        access_token=create_access_token(user_data),
        refresh_token=create_refresh_token(user_data)
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(refresh_token: str):
    """Refresh access token using refresh token."""
    payload = verify_token(refresh_token, token_type="refresh")
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    
    user_data = {"user_id": payload["user_id"], "email": payload.get("email")}
    return TokenResponse(
        access_token=create_access_token(user_data),
        refresh_token=refresh_token
    )


@router.post("/api-keys", response_model=APIKeyResponse)
async def create_api_key(user = Depends(require_auth)):
    """Generate a new API key for the user."""
    plain_key, hashed_key = generate_api_key()
    # TODO: Save hashed_key to database
    return APIKeyResponse(
        id="mock-key-id",
        key=plain_key,
        created_at=datetime.utcnow()
    )


@router.get("/api-keys", response_model=List[dict])
async def list_api_keys(user = Depends(require_auth)):
    """List user's API keys."""
    # TODO: Fetch from database
    return []


@router.delete("/api-keys/{key_id}")
async def revoke_api_key(key_id: str, user = Depends(require_auth)):
    """Revoke an API key."""
    # TODO: Delete from database
    return {"status": "revoked", "id": key_id}
