# backend/main.py
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from backend.api.routes import api_router
from backend.core.config import settings
from backend.core.database import init_db
from backend.core.middleware import privacy_middleware, rate_limit_middleware
from backend.federation.routes import federation_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    pass


app = FastAPI(
    title="Glade - Privacy-Focused Federated Social Network",
    description="ActivityPub-compatible local community platform",
    version="0.1.0",
    lifespan=lifespan,
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)
app.add_middleware(privacy_middleware)
app.add_middleware(rate_limit_middleware)

# Routes
app.include_router(api_router, prefix="/api/v1")
app.include_router(federation_router, prefix="")
