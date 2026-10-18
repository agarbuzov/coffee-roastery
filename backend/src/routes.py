import asyncio
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Response, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import JSONResponse

from .database import get_session
from .models import Lead
from .schemas import LeadCreate, LeadResponse, ErrorResponse
from .telegram import send_lead

api_router = APIRouter(prefix="/api")

DEDUP_WINDOW = timedelta(minutes=10)
_lead_lock = asyncio.Lock()


@api_router.post("/leads", response_model=LeadResponse, status_code=201)
async def create_lead(
        lead: LeadCreate,
        response: Response,
        background: BackgroundTasks,
        session: AsyncSession = Depends(get_session),
):
    async with _lead_lock:
        since = datetime.now(timezone.utc) - DEDUP_WINDOW
        existing_id = await session.scalar(
            select(Lead.id)
            .where(Lead.phone == lead.phone, Lead.created_at >= since)
            .order_by(Lead.id.desc())
            .limit(1)
        )
        if existing_id:
            response.status_code = 200  # дубль: вторую заявку не создаём
            return LeadResponse(id=existing_id)

        row = Lead(
            name=lead.name,
            phone=lead.phone,
            interest=lead.interest.value,
            comment=lead.comment,
            **lead.attribution.model_dump(),
        )
        session.add(row)
        try:
            await session.commit()
        except SQLAlchemyError:
            await session.rollback()
            return JSONResponse(status_code=503, content=ErrorResponse().model_dump())
        background.add_task(send_lead, row.id, lead)  # только для новой заявки
        return LeadResponse(id=row.id)


@api_router.get("/health")
async def health_check():
    return {"status": "ok"}
