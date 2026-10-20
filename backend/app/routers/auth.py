from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pymongo.errors import DuplicateKeyError

from app.config import ACCESS_TOKEN_EXPIRE_MINUTES, COOKIE_SAMESITE, COOKIE_SECURE, SESSION_COOKIE
from app.db import alerts_collection, ratings_collection, users_collection, watchlist_collection
from app.deps import get_current_user
from app.models import LoginRequest, RegisterRequest, UserOut
from app.ratelimit import client_ip, login_account_limiter, login_limiter, register_limiter
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _to_user_out(user: dict) -> UserOut:
    return UserOut(id=str(user["_id"]), name=user["name"], email=user["email"])


def _set_session(response: Response, user_id: str, version: int) -> None:
    response.set_cookie(
        key=SESSION_COOKIE,
        value=create_access_token(user_id, version=version),
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/",
    )


def _clear_session(response: Response) -> None:
    response.delete_cookie(key=SESSION_COOKIE, path="/", secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE, httponly=True)


@router.post("/register", response_model=UserOut, dependencies=[Depends(register_limiter)])
async def register(payload: RegisterRequest, response: Response):
    # Champ piège invisible pour les humains : s'il est rempli, c'est un robot.
    if payload.website:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inscription refusée")
    if not payload.accepted_terms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tu dois accepter les conditions d'utilisation et la politique de confidentialité",
        )

    existing = await users_collection.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Un compte existe déjà avec cet email")

    doc = {
        "name": payload.name,
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "terms_accepted_at": datetime.now(timezone.utc),
        "token_version": 0,
    }
    try:
        result = await users_collection.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Un compte existe déjà avec cet email")
    doc["_id"] = result.inserted_id

    _set_session(response, str(doc["_id"]), version=0)
    return _to_user_out(doc)


@router.post("/login", response_model=UserOut)
async def login(request: Request, response: Response, payload: LoginRequest):
    await login_limiter(request)
    await login_account_limiter.hit(f"{payload.email.lower()}|{client_ip(request)}")

    user = await users_collection.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")

    _set_session(response, str(user["_id"]), version=user.get("token_version", 0))
    return _to_user_out(user)


@router.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    return _to_user_out(current_user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response, current_user: dict = Depends(get_current_user)):
    """Révoque toutes les sessions du compte en incrémentant la version de session."""
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"token_version": 1}},
    )
    _clear_session(response)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(response: Response, current_user: dict = Depends(get_current_user)):
    """Droit à l'effacement (RGPD, art. 17) : supprime le compte et toutes ses données."""
    user_id = current_user["_id"]
    await watchlist_collection.delete_many({"user_id": user_id})
    await alerts_collection.delete_many({"user_id": user_id})
    await ratings_collection.delete_many({"user_id": user_id})
    await users_collection.delete_one({"_id": user_id})
    _clear_session(response)
