from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(20))
    interest: Mapped[str] = mapped_column(String(20))
    comment: Mapped[str | None] = mapped_column(Text)

    # источник заявки (имена совпадают с schemas.Attribution)
    utm_source: Mapped[str | None] = mapped_column(String(255))
    utm_medium: Mapped[str | None] = mapped_column(String(255))
    utm_campaign: Mapped[str | None] = mapped_column(String(255))
    utm_content: Mapped[str | None] = mapped_column(String(255))
    utm_term: Mapped[str | None] = mapped_column(String(255))
    gclid: Mapped[str | None] = mapped_column(String(255))
    fbclid: Mapped[str | None] = mapped_column(String(255))
    yclid: Mapped[str | None] = mapped_column(String(255))
    landing_url: Mapped[str | None] = mapped_column(String(2048))
    referrer: Mapped[str | None] = mapped_column(String(2048))
