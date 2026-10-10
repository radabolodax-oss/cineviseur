import math
import re
from urllib.parse import quote_plus

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query

from app.ratelimit import public_data_limiter

router = APIRouter(prefix="/api/cinemas", tags=["cinemas"], dependencies=[Depends(public_data_limiter)])

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    # maps.mail.ru retiré : serveur russe, RGPD incertain, pas nécessaire avec deux miroirs EU.
]

# Formats premium proposés par les grands réseaux français. Indicatif : tous les cinémas d'un réseau
# n'ont pas toutes les salles, d'où la mention « selon le réseau » côté site.
CHAINS = [
    (re.compile(r"path[ée]|gaumont", re.I), "Pathé", "https://www.pathe.fr/cinemas", ["Dolby Cinema", "IMAX", "4DX", "ScreenX", "3D"]),
    (re.compile(r"\bugc\b", re.I), "UGC", "https://www.ugc.fr/cinemas.html", ["IMAX", "4DX", "3D"]),
    (re.compile(r"\bcgr\b", re.I), "CGR", "https://www.cgrcinemas.fr/", ["ICE", "3D"]),
    (re.compile(r"kin[ée]polis", re.I), "Kinepolis", "https://kinepolis.fr/", ["Laser ULTRA", "4DX", "ScreenX", "IMAX", "3D"]),
    (re.compile(r"m[ée]garama", re.I), "Mégarama", "https://www.megarama.fr/", ["IMAX", "3D"]),
    (re.compile(r"\bmk2\b", re.I), "MK2", "https://www.mk2.com/salles", ["VO"]),
    (re.compile(r"cin[ée]ville", re.I), "Cinéville", "https://www.cineville.fr/", ["3D"]),
    (re.compile(r"cin[ée]max|grand rex", re.I), None, None, ["IMAX"]),
]

# Étiquettes OpenStreetMap qui décrivent les équipements d'une salle (rares mais exactes).
OSM_FORMAT_TAGS = {
    "cinema:3D": "3D",
    "cinema:imax": "IMAX",
    "cinema:4dx": "4DX",
    "cinema:dolby_atmos": "Dolby Atmos",
    "cinema:screenx": "ScreenX",
}


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _formats(tags: dict) -> tuple[list[str], str | None, str | None, str]:
    """Formats connus, enseigne, site du réseau, et source de l'information (osm | reseau | inconnu)."""
    exact = [label for key, label in OSM_FORMAT_TAGS.items() if tags.get(key) in ("yes", "true")]
    label = " ".join(filter(None, [tags.get("brand"), tags.get("operator"), tags.get("name")]))
    for pattern, brand, site, formats in CHAINS:
        if pattern.search(label):
            if exact:
                return exact, brand, site, "osm"
            return formats, brand, site, "reseau"
    return exact, tags.get("brand"), None, "osm" if exact else "inconnu"


@router.get("/nearby")
async def nearby(lat: float = Query(..., ge=-90, le=90), lon: float = Query(..., ge=-180, le=180), radius_km: float = Query(10, ge=1, le=50)):
    radius_m = int(radius_km * 1000)
    # nwr + center : beaucoup de cinémas sont cartographiés comme bâtiments, pas comme points.
    # Si le serveur est chargé, on se rabat sur les seuls points (requête plus légère).
    queries = [
        f'[out:json][timeout:25];nwr["amenity"="cinema"](around:{radius_m},{lat},{lon});out center tags;',
        f'[out:json][timeout:20];node["amenity"="cinema"](around:{radius_m},{lat},{lon});out body;',
    ]
    # Overpass refuse désormais les requêtes sans User-Agent identifiable (HTTP 406).
    headers = {"User-Agent": "CineViseur/1.0 (recherche de cinemas proches)"}

    resp = None
    async with httpx.AsyncClient(timeout=30, headers=headers) as client:
        for query in queries:
            for url in OVERPASS_URLS:
                try:
                    resp = await client.post(url, data={"data": query})
                except httpx.TransportError:
                    resp = None
                    continue
                if resp.status_code == 200:
                    break
            if resp is not None and resp.status_code == 200:
                break

    if resp is None or resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Erreur du service de cinémas")

    cinemas = []
    seen = set()
    for el in resp.json().get("elements", []):
        clat = el.get("lat") or el.get("center", {}).get("lat")
        clon = el.get("lon") or el.get("center", {}).get("lon")
        if clat is None or clon is None:
            continue
        tags = el.get("tags", {})
        name = tags.get("name") or "Cinéma"
        key = (name.lower(), round(clat, 3), round(clon, 3))
        if key in seen:
            continue
        seen.add(key)
        street = tags.get("addr:street")
        number = tags.get("addr:housenumber")
        city = tags.get("addr:city")
        street_line = f"{number} {street}".strip() if number and street else street
        formats, brand, chain_site, source = _formats(tags)
        website = tags.get("website") or tags.get("contact:website")
        cinemas.append(
            {
                "id": f'{el.get("type", "node")}-{el.get("id")}',
                "name": name,
                "brand": brand,
                "address": ", ".join(p for p in [street_line, city] if p) or None,
                "lat": clat,
                "lon": clon,
                "distance_km": round(_haversine_km(lat, lon, clat, clon), 1),
                "screens": tags.get("screen") or tags.get("screens"),
                "formats": formats,
                "formats_source": source,
                # Séances : site du cinéma, sinon site du réseau, sinon recherche web du cinéma.
                "showtimes_url": website
                or chain_site
                or f"https://www.google.com/search?q={quote_plus(name + ' ' + (city or '') + ' séances')}",
            }
        )

    cinemas.sort(key=lambda c: c["distance_km"])
    return {"cinemas": cinemas[:20]}
