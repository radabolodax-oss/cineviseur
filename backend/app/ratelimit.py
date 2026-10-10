"""Limitation simple du nombre de requêtes (anti-spam / anti-bruteforce).

Stockage en mémoire : suffisant pour une seule instance d'API. Derrière plusieurs instances,
il faudrait un stockage partagé (Redis, Mongo).
"""
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status


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
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window = window_seconds
        self.hits: dict[str, deque] = defaultdict(deque)

    def hit(self, key: str) -> None:
        now = time.monotonic()
        hits = self.hits[key]
        while hits and now - hits[0] > self.window:
            hits.popleft()
        if not hits:
            self.hits.pop(key, None)
            hits = self.hits[key]
        if len(hits) >= self.max_requests:
            retry = int(self.window - (now - hits[0])) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Trop de tentatives. Réessaie dans quelques minutes.",
                headers={"Retry-After": str(retry)},
            )
        hits.append(now)

    def __call__(self, request: Request) -> None:
        self.hit(f"{request.url.path}:{client_ip(request)}")


# 10 connexions / 5 min et 5 inscriptions / heure par IP.
login_limiter = RateLimiter(max_requests=10, window_seconds=300)
register_limiter = RateLimiter(max_requests=5, window_seconds=3600)
# Par compte visé, quelle que soit l'IP : bloque une attaque répartie sur beaucoup d'adresses.
account_limiter = RateLimiter(max_requests=10, window_seconds=900)
