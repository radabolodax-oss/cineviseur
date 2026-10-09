from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from app.config import CORS_ORIGINS
from app.routers import auth, cinemas, tmdb, watchlist

app = FastAPI(title="CineViseur API")


@app.exception_handler(PyMongoError)
async def mongo_error_handler(request: Request, exc: PyMongoError):
    return JSONResponse(
        status_code=503,
        content={"detail": "Base de données injoignable. Vérifie que Docker Desktop est ouvert, puis réessaie."},
    )

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
