from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .auth import AuthenticatedUser
from .config import get_settings
from .profiles import fetch_profile
from .routers import classdata, classdata_sessions, classdata_word_states
from .schemas import Health, Me

app = FastAPI(title="LauzHack API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(classdata.router)
app.include_router(classdata_sessions.router)
app.include_router(classdata_word_states.router)


@app.get("/health", response_model=Health)
def health() -> Health:
    return Health(ok=True)


@app.get("/api/me", response_model=Me)
def read_me(user: AuthenticatedUser) -> Me:
    profile = fetch_profile(user.id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return Me(id=user.id, email=user.email, display_name=profile.display_name, role=profile.role)
