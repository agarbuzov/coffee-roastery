import re
from enum import Enum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator


class Interest(str, Enum):
    subscription = "subscription"  # Подписка
    one_time = "one_time"          # Разовый заказ
    question = "question"          # Вопрос


# +375 / 375 / 80 + код оператора (25, 29, 33, 44) + 7 цифр
_BY_PHONE_RE = re.compile(r"^(?:\+?375|80)(25|29|33|44)(\d{7})$")


class Attribution(BaseModel):
    """Источник заявки: реклама, объявление, страница."""

    utm_source: str | None = Field(None, max_length=255)    # откуда: google, instagram, yandex
    utm_medium: str | None = Field(None, max_length=255)    # тип: cpc, social
    utm_campaign: str | None = Field(None, max_length=255)  # рекламная кампания
    utm_content: str | None = Field(None, max_length=255)   # конкретное объявление
    utm_term: str | None = Field(None, max_length=255)      # ключевое слово
    gclid: str | None = Field(None, max_length=255)
    fbclid: str | None = Field(None, max_length=255)
    yclid: str | None = Field(None, max_length=255)
    landing_url: str | None = Field(None, max_length=2048)  # страница, с которой отправлена форма
    referrer: str | None = Field(None, max_length=2048)     # document.referrer


class LeadCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: Annotated[str, StringConstraints(min_length=2, max_length=100)]
    phone: str
    interest: Interest
    comment: str | None = Field(None, max_length=1000)
    attribution: Attribution = Field(default_factory=Attribution)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"[\s\-()]", "", v)
        m = _BY_PHONE_RE.match(digits)
        if not m:
            raise ValueError(
                "Введите белорусский номер в формате +375 29 123-45-67 "
                "(коды операторов: 25, 29, 33, 44)"
            )
        return f"+375{m.group(1)}{m.group(2)}"  # нормализация: +375291234567

    @field_validator("comment")
    @classmethod
    def empty_comment_to_none(cls, v: str | None) -> str | None:
        return v or None


class LeadResponse(BaseModel):
    id: int
    message: str = "Заявка принята. Мы свяжемся с вами в ближайшее время."


class FieldError(BaseModel):
    field: str
    message: str


class ErrorResponse(BaseModel):
    """Ответ при ошибке — фронт показывает message и действие."""

    message: str = "Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам."
    fields: list[FieldError] = []