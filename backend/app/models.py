from datetime import datetime, timezone

from pydantic import BaseModel, Field, field_validator


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class ContributorProfile(BaseModel):
    id: str
    username: str
    displayName: str


class IngredientCost(BaseModel):
    ingredient: str = Field(min_length=1, max_length=120)
    amount: float = Field(ge=0)


class Translation(BaseModel):
    language: str
    title: str | None = None
    status: str
    contributor: str | None = None


class Adaptation(BaseModel):
    id: str
    destinationCountry: str
    title: str
    adaptationType: str | None = None
    ingredients: list[str] = []
    ingredientCosts: list[IngredientCost] = Field(default_factory=list)
    budgetAdjustment: float = Field(default=0, ge=0)
    preparation: str | None = None
    availability: str | None = None
    estimatedLocalCost: float | None = None
    servingSize: int | None = None
    contributor: str | None = None
    owner: str | None = None
    collaborators: list[ContributorProfile] = Field(default_factory=list)
    image: str = ""
    notes: str | None = None
    status: str = "published"


class Recipe(BaseModel):
    id: str
    name: str
    cuisine: str
    country: str
    category: str | None = None
    originalLanguage: str
    originalTitle: str | None = None
    contributor: str | None = None
    owner: str | None = None
    collaborators: list[ContributorProfile] = Field(default_factory=list)
    image: str = ""
    ingredients: list[str] = []
    ingredientCosts: list[IngredientCost] = Field(default_factory=list)
    budgetAdjustment: float = Field(default=0, ge=0)
    preparation: str = ""
    servingSize: int | None = None
    estimatedCost: float | None = None
    status: str = "published"
    translations: list[Translation] = []
    adaptations: list[Adaptation] = []


class NewAdaptation(BaseModel):
    destinationCountry: str = Field(min_length=2, max_length=2)
    title: str = Field(min_length=1)
    adaptationType: str | None = None
    ingredients: list[str] = []
    ingredientCosts: list[IngredientCost] = Field(default_factory=list, max_length=100)
    budgetAdjustment: float = Field(default=0, ge=0)
    availability: str | None = None
    estimatedLocalCost: float | None = None
    servingSize: int | None = None
    contributor: str | None = None
    owner: str | None = None
    collaborators: list[str] = Field(default_factory=list, max_length=20)
    image: str = ""
    notes: str | None = None


class Comment(BaseModel):
    id: str
    recipeId: str
    userId: str
    author: str = "Anonymous"
    username: str | None = None
    avatarUrl: str = ""
    text: str
    createdAt: str = Field(default_factory=_utcnow)


class NewComment(BaseModel):
    text: str = Field(min_length=1)
    author: str | None = None


class LikeStatus(BaseModel):
    liked: bool = False
    count: int = 0


class NewLike(BaseModel):
    user: str = Field(min_length=1)


class LocalTwist(BaseModel):
    id: str
    recipeId: str
    destinationCountry: str
    text: str
    author: str
    votes: int = 0
    voted: bool = False
    upvotes: int = 0
    downvotes: int = 0
    myVote: int = 0
    createdAt: str = Field(default_factory=_utcnow)


class NewLocalTwist(BaseModel):
    text: str = Field(min_length=3, max_length=180)
    user: str | None = Field(default=None, max_length=100)
    author: str | None = Field(default=None, max_length=60)

    @field_validator("text")
    @classmethod
    def trim_and_validate_text(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise ValueError("Tip must contain at least 3 non-space characters")
        return value


class LocalTwistVote(BaseModel):
    value: int = Field(ge=-1, le=1)

    @field_validator("value")
    @classmethod
    def require_vote_direction(cls, value: int) -> int:
        if value not in (-1, 1):
            raise ValueError("Vote must be up or down")
        return value


class NewRecipe(BaseModel):
    name: str = Field(min_length=1)
    cuisine: str = Field(min_length=1)
    country: str = Field(min_length=2, max_length=2)
    category: str | None = None
    originalLanguage: str = "en"
    originalTitle: str | None = None
    contributor: str | None = None
    owner: str | None = None
    collaborators: list[str] = Field(default_factory=list, max_length=20)
    image: str = ""
    ingredients: list[str] = []
    ingredientCosts: list[IngredientCost] = Field(default_factory=list, max_length=100)
    budgetAdjustment: float = Field(default=0, ge=0)
    preparation: str = ""
    servingSize: int | None = None
    estimatedCost: float | None = None
