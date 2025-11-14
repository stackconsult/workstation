"""Auth middleware."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from .jwt import verify_token

security = HTTPBearer()

async def get_current_user(credentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return payload

def require_auth(user = Depends(get_current_user)):
    return user
