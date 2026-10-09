from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.db import alerts_collection, ratings_collection, watchlist_collection
from app.deps import get_current_user
from app.models import AlertIn, RatingIn, WatchlistItemIn, WatchlistStatusUpdate

router = APIRouter(prefix="/api", tags=["watchlist"])


def _serialize(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    doc["user_id"] = str(doc["user_id"])
    return doc


@router.get("/watchlist")
async def list_watchlist(current_user: dict = Depends(get_current_user)):
    cursor = watchlist_collection.find({"user_id": current_user["_id"]}).sort("added_at", -1)
    return [_serialize(doc) async for doc in cursor]


def _status_fields(status_value: str) -> dict:
    """Le statut et la date à laquelle le titre a été vu (pour l'étagère par mois et le récap annuel)."""
    return {"status": status_value, "watched_at": datetime.now(timezone.utc) if status_value == "watched" else None}


@router.post("/watchlist", status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(payload: WatchlistItemIn, current_user: dict = Depends(get_current_user)):
    existing = await watchlist_collection.find_one({
        "user_id": current_user["_id"],
        "media_id": payload.media_id,
        "media_type": payload.media_type,
    })
    if existing:
        await watchlist_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": _status_fields(payload.status)},
        )
        existing.update(_status_fields(payload.status))
        return _serialize(existing)

    doc = payload.model_dump()
    doc["user_id"] = current_user["_id"]
    doc["added_at"] = datetime.now(timezone.utc)
    doc.update(_status_fields(payload.status))
    result = await watchlist_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


@router.patch("/watchlist/{item_id}")
async def update_watchlist_status(item_id: str, payload: WatchlistStatusUpdate, current_user: dict = Depends(get_current_user)):
    result = await watchlist_collection.find_one_and_update(
        {"_id": ObjectId(item_id), "user_id": current_user["_id"]},
        {"$set": _status_fields(payload.status)},
        return_document=True,
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Élément introuvable")
    return _serialize(result)


@router.delete("/watchlist/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_watchlist(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await watchlist_collection.delete_one({"_id": ObjectId(item_id), "user_id": current_user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Élément introuvable")


@router.get("/library/status")
async def library_status(
    media_id: int = Query(...),
    media_type: str = Query(pattern="^(movie|tv)$"),
    current_user: dict = Depends(get_current_user),
):
    watchlist_item = await watchlist_collection.find_one({
        "user_id": current_user["_id"], "media_id": media_id, "media_type": media_type,
    })
    alert = await alerts_collection.find_one({
        "user_id": current_user["_id"], "media_id": media_id, "media_type": media_type,
    })
    return {
        "watchlist_item": _serialize(watchlist_item) if watchlist_item else None,
        "alert": _serialize(alert) if alert else None,
    }


@router.post("/alerts", status_code=status.HTTP_201_CREATED)
async def create_alert(payload: AlertIn, current_user: dict = Depends(get_current_user)):
    existing = await alerts_collection.find_one({
        "user_id": current_user["_id"], "media_id": payload.media_id, "media_type": payload.media_type,
    })
    if existing:
        return _serialize(existing)

    doc = payload.model_dump()
    doc["user_id"] = current_user["_id"]
    doc["created_at"] = datetime.now(timezone.utc)
    doc["notified"] = False
    result = await alerts_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


@router.get("/alerts/due")
async def list_due_alerts(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).date().isoformat()
    cursor = alerts_collection.find({
        "user_id": current_user["_id"],
        "notified": {"$ne": True},
        "release_date": {"$ne": None, "$lte": today},
    })
    return [_serialize(doc) async for doc in cursor]


@router.post("/alerts/{alert_id}/dismiss")
async def dismiss_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    result = await alerts_collection.find_one_and_update(
        {"_id": ObjectId(alert_id), "user_id": current_user["_id"]},
        {"$set": {"notified": True}},
        return_document=True,
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerte introuvable")
    return _serialize(result)


@router.get("/alerts")
async def list_alerts(current_user: dict = Depends(get_current_user)):
    cursor = alerts_collection.find({"user_id": current_user["_id"]})
    return [_serialize(doc) async for doc in cursor]


@router.delete("/alerts/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    result = await alerts_collection.delete_one({"_id": ObjectId(alert_id), "user_id": current_user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerte introuvable")


@router.put("/ratings")
async def upsert_rating(payload: RatingIn, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    await ratings_collection.update_one(
        {"user_id": current_user["_id"], "media_id": payload.media_id, "media_type": payload.media_type},
        {"$set": {"score": payload.score, "updated_at": now}, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )
    return {"ok": True}


@router.get("/ratings")
async def list_ratings(current_user: dict = Depends(get_current_user)):
    cursor = ratings_collection.find({"user_id": current_user["_id"]})
    return [_serialize(doc) async for doc in cursor]
