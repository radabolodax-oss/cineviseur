from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    # bcrypt ignore tout ce qui dépasse 72 octets : on refuse plutôt que de tronquer en silence.
    password: str = Field(min_length=8, max_length=72)
    accepted_terms: bool = False
    # Champ piège anti-robots, laissé vide par les humains.
    website: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(max_length=256)


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr


class WatchlistItemIn(BaseModel):
    media_id: int = Field(ge=1, le=100_000_000)
    media_type: str = Field(pattern="^(movie|tv)$")
    title: str = Field(min_length=1, max_length=300)
    poster_path: str | None = Field(default=None, max_length=200, pattern=r"^/[A-Za-z0-9._-]+$")
    status: str = Field(default="to_watch", pattern="^(to_watch|watched)$")


class WatchlistStatusUpdate(BaseModel):
    status: str = Field(pattern="^(to_watch|watched)$")


class RatingIn(BaseModel):
    media_id: int = Field(ge=1, le=100_000_000)
    media_type: str = Field(pattern="^(movie|tv)$")
    score: int = Field(ge=1, le=10)


class AlertIn(BaseModel):
    media_id: int = Field(ge=1, le=100_000_000)
    media_type: str = Field(pattern="^(movie|tv)$")
    title: str = Field(min_length=1, max_length=300)
    poster_path: str | None = Field(default=None, max_length=200, pattern=r"^/[A-Za-z0-9._-]+$")
    release_date: str | None = Field(default=None, max_length=10, pattern=r"^\d{4}-\d{2}-\d{2}$")
