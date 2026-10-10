from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from app.config import CORS_ORIGINS
from app.db import rate_limits_collection
from app.routers import auth, cinemas, tmdb, watchlist

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        await rate_limits_collection.create_index("expires_at", expireAfterSeconds=0)
    except PyMongoError:
        pass
    yield


app = FastAPI(title="CineViseur API", lifespan=lifespan)


@app.exception_handler(PyMongoError)
async def mongo_error_handler(request: Request, exc: PyMongoError):
    return JSONResponse(
        status_code=503,
        content={"detail": "Base de données injoignable. Vérifie que Docker Desktop est ouvert, puis réessaie."},
    )


# La session est un cookie : un site tiers pourrait déclencher une action au nom de l'utilisateur.
# Les écritures venant d'une autre origine que le site autorisé sont donc refusées.
@app.middleware("http")
async def reject_foreign_writes(request: Request, call_next):
    origin = request.headers.get("origin")
    if request.method not in SAFE_METHODS and origin and origin not in CORS_ORIGINS:
        return JSONResponse(status_code=403, content={"detail": "Origine refusée"})
    return await call_next(request)


# Réponses JSON compressées (les listes TMDB pèsent ~15 Ko, ~4 Ko une fois compressées).
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cinemas.router)
app.include_router(tmdb.router)
app.include_router(watchlist.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
