"""Limitation simple du nombre de requêtes par adresse IP (anti-spam / anti-bruteforce).

Stockage en mémoire : suffisant pour une seule instance d'API. Derrière plusieurs instances,
il faudrait un stockage partagé (Redis, Mongo).
"""
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window = window_seconds
        self.hits: dict[str, deque] = defaultdict(deque)

    def __call__(self, request: Request) -> None:
        forwarded = request.headers.get("x-forwarded-for")
        ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "inconnu")
        key = f"{request.url.path}:{ip}"
        now = time.monotonic()
        hits = self.hits[key]
        while hits and now - hits[0] > self.window:
            hits.popleft()
        if len(hits) >= self.max_requests:
            retry = int(self.window - (now - hits[0])) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Trop de tentatives. Réessaie dans quelques minutes.",
                headers={"Retry-After": str(retry)},
            )
        hits.append(now)


# 10 connexions / 5 min et 5 inscriptions / heure par IP.
login_limiter = RateLimiter(max_requests=10, window_seconds=300)
register_limiter = RateLimiter(max_requests=5, window_seconds=3600)
