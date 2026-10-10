from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Cookie, HTTPException, status

from app.config import SESSION_COOKIE
from app.db import users_collection
from app.security import decode_access_token


def object_id_or_404(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Élément introuvable")


async def get_current_user(session: str | None = Cookie(default=None, alias=SESSION_COOKIE)):
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non authentifié")

    decoded = decode_access_token(session)
    if decoded is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")
    user_id, version = decoded

    try:
        object_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")

    user = await users_collection.find_one({"_id": object_id})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable")
    # Jeton émis avant une déconnexion : révoqué.
    if version != user.get("token_version", 0):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expirée")

    return user
