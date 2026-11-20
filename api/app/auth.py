from functools import lru_cache
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import get_settings
from .db import get_supabase
from .schemas import CurrentUser

ASYMMETRIC_ALGORITHMS = ["ES256", "RS256", "EdDSA"]
SUPABASE_AUDIENCE = "authenticated"

bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache
def _jwks_client() -> jwt.PyJWKClient:
    jwks_url = f"{get_settings().supabase_url}/auth/v1/.well-known/jwks.json"
    return jwt.PyJWKClient(jwks_url, cache_keys=True)


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing access token",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _uses_legacy_symmetric_secret(token: str) -> bool:
    return jwt.get_unverified_header(token).get("alg") == "HS256"


def _verify_with_jwks(token: str) -> CurrentUser:
    signing_key = _jwks_client().get_signing_key_from_jwt(token)
    claims = jwt.decode(
        token,
        signing_key.key,
        algorithms=ASYMMETRIC_ALGORITHMS,
        audience=SUPABASE_AUDIENCE,
    )
    return CurrentUser(id=claims["sub"], email=claims.get("email", ""))


def _verify_with_supabase(token: str) -> CurrentUser:
    response = get_supabase().auth.get_user(token)
    if response is None or response.user is None:
        raise _unauthorized()
    return CurrentUser(id=response.user.id, email=response.user.email or "")


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> CurrentUser:
    """Verify the Supabase access token sent as `Authorization: Bearer <token>`."""
    if credentials is None:
        raise _unauthorized()
    token = credentials.credentials
    try:
        if _uses_legacy_symmetric_secret(token):
            return _verify_with_supabase(token)
        return _verify_with_jwks(token)
    except HTTPException:
        raise
    except Exception as error:
        raise _unauthorized() from error


AuthenticatedUser = Annotated[CurrentUser, Depends(get_current_user)]
