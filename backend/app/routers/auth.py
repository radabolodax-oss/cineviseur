from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.db import alerts_collection, ratings_collection, users_collection, watchlist_collection
from app.deps import get_current_user
from app.models import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.ratelimit import account_limiter, login_limiter, register_limiter
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _to_user_out(user: dict) -> UserOut:
    return UserOut(id=str(user["_id"]), name=user["name"], email=user["email"])


@router.post("/register", response_model=TokenResponse, dependencies=[Depends(register_limiter)])
async def register(payload: RegisterRequest):
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
    result = await users_collection.insert_one(doc)
    doc["_id"] = result.inserted_id

    token = create_access_token(str(doc["_id"]), version=0)
    return TokenResponse(access_token=token, user=_to_user_out(doc))


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, payload: LoginRequest):
    # Limite par IP d'abord.
    login_limiter(request)
    # Limite par compte cible : bloque même si l'attaquant change d'IP à chaque essai.
    account_limiter.hit(f"login:{payload.email.lower()}")

    user = await users_collection.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")

    version = user.get("token_version", 0)
    token = create_access_token(str(user["_id"]), version=version)
    return TokenResponse(access_token=token, user=_to_user_out(user))


@router.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    return _to_user_out(current_user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(current_user: dict = Depends(get_current_user)):
    """Révoque tous les jetons du compte en incrémentant la version de session."""
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"token_version": 1}},
    )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(current_user: dict = Depends(get_current_user)):
    """Droit à l'effacement (RGPD, art. 17) : supprime le compte et toutes ses données."""
    user_id = current_user["_id"]
    await watchlist_collection.delete_many({"user_id": user_id})
    await alerts_collection.delete_many({"user_id": user_id})
    await ratings_collection.delete_many({"user_id": user_id})
    await users_collection.delete_one({"_id": user_id})
