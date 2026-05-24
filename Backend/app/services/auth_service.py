import base64
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from database.connection import get_connection, get_cursor


JWT_SECRET = os.getenv("AUTH_SECRET_KEY", "change-me-in-production")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = int(os.getenv("AUTH_TOKEN_EXPIRE_MINUTES", "720"))

_security = HTTPBearer(auto_error=False)


def _pbkdf2_hash(password: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 150000)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = _pbkdf2_hash(password, salt)
    salt_b64 = base64.b64encode(salt).decode("utf-8")
    digest_b64 = base64.b64encode(digest).decode("utf-8")
    return f"{salt_b64}${digest_b64}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_b64, digest_b64 = stored_hash.split("$", 1)
        salt = base64.b64decode(salt_b64.encode("utf-8"))
        expected = base64.b64decode(digest_b64.encode("utf-8"))
    except ValueError:
        return False

    candidate = _pbkdf2_hash(password, salt)
    return hmac.compare_digest(candidate, expected)


def create_access_token(user_id: int, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": now,
        "exp": now + timedelta(minutes=TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


def get_user_by_email(email: str):
    conn = get_connection()
    try:
        cursor = get_cursor(conn)
        cursor.execute(
            "SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?",
            (email.lower(),),
        )
        return cursor.fetchone()
    finally:
        conn.close()


def create_user(name: str, email: str, password: str):
    conn = get_connection()
    try:
        cursor = get_cursor(conn)
        password_hash = hash_password(password)
        created_at = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            """
            INSERT INTO users (name, email, password_hash, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (name.strip(), email.lower(), password_hash, created_at),
        )
        conn.commit()
        cursor.execute(
            "SELECT id, name, email, created_at FROM users WHERE email = ?",
            (email.lower(),),
        )
        return cursor.fetchone()
    finally:
        conn.close()


def authenticate_user(email: str, password: str):
    user = get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token",
        )

    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    email = payload.get("email")

    if not user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user = get_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
    }