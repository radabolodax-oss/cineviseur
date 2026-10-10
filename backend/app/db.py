from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGO_URL, DB_NAME

client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
db = client[DB_NAME]

users_collection = db["users"]
watchlist_collection = db["watchlist"]
ratings_collection = db["ratings"]
alerts_collection = db["alerts"]
rate_limits_collection = db["rate_limits"]
