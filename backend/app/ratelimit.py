"""Limitation du nombre de requêtes, stockée dans MongoDB (partagée entre instances, survit aux redémarrages).

Fenêtre fixe : un compteur par clé et par tranche de temps. Les compteurs expirés sont supprimés
automatiquement par un index TTL (créé au démarrage, voir main.py).
"""
import time
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request, status
from pymongo import ReturnDocument
from pymongo.errors import PyMongoError

from app.db import rate_limits_collection


def client_ip(request: Request) -> str:
    """IP réelle du client.

    Le proxy de l'hébergeur (Render) AJOUTE l'IP qu'il voit à la fin de X-Forwarded-For :
    seule la dernière valeur est fiable. Les premières peuvent être écrites par l'attaquant.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "inconnu"


class RateLimiter:
    def __init__(self, name: str, max_requests: int, window_seconds: int):
        self.name = name
        self.max_requests = max_requests
        self.window = window_seconds

    async def hit(self, key: str) -> None:
        now = time.time()
        bucket = int(now // self.window)
        try:
            doc = await rate_limits_collection.find_one_and_update(
                {"_id": f"{self.name}:{key}:{bucket}"},
                {
                    "$inc": {"count": 1},
                    "$setOnInsert": {"expires_at": datetime.now(timezone.utc) + timedelta(seconds=self.window * 2)},
                },
                upsert=True,
                return_document=ReturnDocument.AFTER,
            )
        except PyMongoError:
            # Compter est une protection, pas une condition de bon fonctionnement :
            # si la base tombe, on laisse passer plutôt que de rendre le site inutilisable.
            return
        if doc["count"] > self.max_requests:
            retry = int(self.window - (now % self.window)) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Trop de tentatives. Réessaie dans quelques minutes.",
                headers={"Retry-After": str(retry)},
            )

    async def __call__(self, request: Request) -> None:
        await self.hit(client_ip(request))


# Par IP : 10 connexions / 5 min, 5 inscriptions / heure.
login_limiter = RateLimiter("login", max_requests=10, window_seconds=300)
register_limiter = RateLimiter("register", max_requests=5, window_seconds=3600)
# Par couple (compte visé, IP) : freine le devinage de mot de passe sans permettre à un tiers
# de bloquer le compte d'un utilisateur depuis une autre adresse.
login_account_limiter = RateLimiter("login_account", max_requests=10, window_seconds=900)
# Routes publiques qui consomment la clé TMDB ou l'API Overpass.
public_data_limiter = RateLimiter("public_data", max_requests=240, window_seconds=60)
