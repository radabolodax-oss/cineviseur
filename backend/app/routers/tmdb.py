import asyncio

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.config import TMDB_API_KEY, TMDB_BASE_URL

router = APIRouter(prefix="/api/tmdb", tags=["tmdb"])


_transport = httpx.AsyncHTTPTransport(retries=3)
_MAX_ATTEMPTS = 6


async def _tmdb_get(path: str, params: dict) -> dict:
    params = {**params, "api_key": TMDB_API_KEY}
    async with httpx.AsyncClient(timeout=15, transport=_transport) as client:
        last_error = None
        for attempt in range(_MAX_ATTEMPTS):
            try:
                resp = await client.get(f"{TMDB_BASE_URL}{path}", params=params)
                break
            except httpx.TransportError as exc:
                last_error = exc
                await asyncio.sleep(0.3 * (attempt + 1))
        else:
            raise HTTPException(status_code=502, detail=f"TMDB injoignable: {last_error}")
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="Erreur TMDB")
    return resp.json()


@router.get("/trending")
async def trending(lang: str = Query("fr"), media_type: str = Query("all"), window: str = Query("week")):
    return await _tmdb_get(f"/trending/{media_type}/{window}", {"language": lang})


@router.get("/genres")
async def genres(media_type: str = Query(pattern="^(movie|tv)$"), lang: str = Query("fr")):
    return await _tmdb_get(f"/genre/{media_type}/list", {"language": lang})


_SORT_FIELDS = {
    "movie": {
        "popularity": "popularity.desc",
        "rating": "vote_average.desc",
        "date": "release_date.desc",
        "title": "original_title.asc",
    },
    "tv": {
        "popularity": "popularity.desc",
        "rating": "vote_average.desc",
        "date": "first_air_date.desc",
        "title": "original_name.asc",
    },
}


@router.get("/discover")
async def discover(
    media_type: str = Query(pattern="^(movie|tv)$"),
    lang: str = Query("fr"),
    page: int = Query(1, ge=1, le=500),
    genre: int | None = Query(None),
    sort: str = Query("popularity", pattern="^(popularity|rating|date|title)$"),
    min_rating: float | None = Query(None, ge=0, le=10),
    year: int | None = Query(None, ge=1900, le=2100),
):
    params = {"language": lang, "sort_by": _SORT_FIELDS[media_type][sort], "page": page}
    if genre:
        params["with_genres"] = genre
    if min_rating:
        params["vote_average.gte"] = min_rating
        params.setdefault("vote_count.gte", 50)
    if sort == "rating":
        params.setdefault("vote_count.gte", 50)
    if year:
        params["primary_release_year" if media_type == "movie" else "first_air_date_year"] = year
    return await _tmdb_get(f"/discover/{media_type}", params)


_LISTS = {
    "now_playing": "/movie/now_playing",
    "upcoming": "/movie/upcoming",
}


@router.get("/lists/{kind}")
async def lists(kind: str, lang: str = Query("fr"), page: int = Query(1, ge=1, le=500)):
    if kind in _LISTS:
        return await _tmdb_get(_LISTS[kind], {"language": lang, "region": "FR", "page": page})
    if kind == "streaming":
        return await _tmdb_get(
            "/discover/movie",
            {
                "language": lang,
                "page": page,
                "watch_region": "FR",
                "with_watch_monetization_types": "flatrate",
                "sort_by": "popularity.desc",
            },
        )
    raise HTTPException(status_code=400, detail="kind invalide")


@router.get("/search")
async def search(query: str, lang: str = Query("fr"), page: int = Query(1, ge=1, le=500)):
    return await _tmdb_get("/search/multi", {"language": lang, "query": query, "page": page})


@router.get("/person/{person_id}")
async def person(person_id: int, lang: str = Query("fr")):
    """Acteur : biographie + filmographie complète (films et séries)."""
    return await _tmdb_get(f"/person/{person_id}", {"language": lang, "append_to_response": "combined_credits"})


@router.get("/{media_type}/{media_id}")
async def details(media_type: str, media_id: int, lang: str = Query("fr")):
    if media_type not in ("movie", "tv"):
        raise HTTPException(status_code=400, detail="media_type invalide")
    return await _tmdb_get(
        f"/{media_type}/{media_id}",
        {
            "language": lang,
            # release_dates (films) : distingue une sortie en salle d'une sortie directe en streaming.
            "append_to_response": "credits,videos,similar,watch/providers"
            + (",release_dates" if media_type == "movie" else ""),
        },
    )
