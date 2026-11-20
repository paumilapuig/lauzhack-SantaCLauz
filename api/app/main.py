from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth import AuthenticatedUser
from .config import get_settings
from .schemas import Health, Me

app = FastAPI(title="LauzHack API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=Health)
def health() -> Health:
    return Health(ok=True)


@app.get("/api/me", response_model=Me)
def read_me(user: AuthenticatedUser) -> Me:
    return Me(id=user.id, email=user.email)
