"""API key management."""
import secrets
import hashlib
from typing import Tuple

def generate_api_key() -> Tuple[str, str]:
    plain_key = secrets.token_urlsafe(32)
    return plain_key, hash_api_key(plain_key)

def hash_api_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode()).hexdigest()

def verify_api_key(plain_key: str, hashed_key: str) -> bool:
    return hash_api_key(plain_key) == hashed_key
