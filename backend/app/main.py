from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from app.config import COOKIE_SECURE, CORS_ORIGINS, SESSION_COOKIE
from app.db import alerts_collection, rate_limits_collection, ratings_collection, users_collection, watchlist_collection
from app.routers import auth, cinemas, tmdb, watchlist

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        await rate_limits_collection.create_index("expires_at", expireAfterSeconds=0)
        await users_collection.create_index("email", unique=True)
        await watchlist_collection.create_index([("user_id", 1), ("media_id", 1), ("media_type", 1)], unique=True)
        await alerts_collection.create_index([("user_id", 1), ("media_id", 1), ("media_type", 1)], unique=True)
        await ratings_collection.create_index([("user_id", 1), ("media_id", 1), ("media_type", 1)], unique=True)
    except PyMongoError:
        pass
    yield


# En production (COOKIE_SECURE=True), la documentation interactive Swagger/OpenAPI est masquée.
app = FastAPI(
    title="CineViseur API",
    lifespan=lifespan,
    docs_url=None if COOKIE_SECURE else "/docs",
    redoc_url=None if COOKIE_SECURE else "/redoc",
    openapi_url=None if COOKIE_SECURE else "/openapi.json",
)


@app.exception_handler(PyMongoError)
async def mongo_error_handler(request: Request, exc: PyMongoError):
    return JSONResponse(
        status_code=503,
        content={"detail": "Base de données injoignable. Vérifie que Docker Desktop est ouvert, puis réessaie."},
    )


# La session est un cookie : un site tiers pourrait déclencher une action au nom de l'utilisateur (CSRF).
# Toute écriture provenant d'une origine non autorisée — ou sans en-tête Origin alors qu'un cookie de session
# est présent — est refusée.
@app.middleware("http")
async def reject_foreign_writes(request: Request, call_next):
    if request.method not in SAFE_METHODS:
        origin = request.headers.get("origin")
        has_session = SESSION_COOKIE in request.cookies
        if origin and origin not in CORS_ORIGINS:
            return JSONResponse(status_code=403, content={"detail": "Origine refusée"})
        if has_session and not origin:
            return JSONResponse(status_code=403, content={"detail": "En-tête Origin requis"})
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
