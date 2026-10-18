import asyncio
import html
import logging
import os

from aiogram import Bot
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.exceptions import (
    TelegramAPIError,
    TelegramNetworkError,
    TelegramRetryAfter,
    TelegramServerError,
)

from .schemas import LeadCreate

log = logging.getLogger("uvicorn.error")

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

INTEREST = {
    "subscription": "Подписка",
    "one_time": "Разовый заказ",
    "question": "Вопрос",
}

_bot: Bot | None = None


def enabled() -> bool:
    return bool(TOKEN and CHAT_ID)


def get_bot() -> Bot | None:
    """Один Bot (и одна HTTP-сессия) на всё приложение."""
    global _bot
    if _bot is None and enabled():
        _bot = Bot(
            TOKEN,
            default=DefaultBotProperties(
                parse_mode=ParseMode.HTML, link_preview_is_disabled=True
            ),
        )
    return _bot


async def close() -> None:
    if _bot is not None:
        await _bot.session.close()


def _e(value, limit: int = 300) -> str:
    return html.escape(str(value)[:limit])


def format_lead(lead_id: int, lead: LeadCreate) -> str:
    a = lead.attribution
    lines = [
        f"🆕 <b>Новая заявка №{lead_id}</b>",
        "",
        f"<b>Имя:</b> {_e(lead.name, 100)}",
        f"<b>Телефон:</b> {_e(lead.phone, 20)}",
        f"<b>Интересует:</b> {INTEREST[lead.interest.value]}",
    ]
    if lead.comment:
        lines.append(f"<b>Комментарий:</b> {_e(lead.comment, 1000)}")

    click_ids = ", ".join(
        f"{k}={getattr(a, k)}" for k in ("gclid", "fbclid", "yclid") if getattr(a, k)
    )
    rows = [
        ("Реклама", " / ".join(x for x in (a.utm_source, a.utm_medium) if x)),
        ("Кампания", a.utm_campaign),
        ("Объявление", a.utm_content),
        ("Ключевое слово", a.utm_term),
        ("Click ID", click_ids),
        ("Страница", a.landing_url),
        ("Пришёл с", a.referrer),
    ]
    source = [f"• {k}: {_e(v)}" for k, v in rows if v]
    lines += ["", "<b>Источник</b>", *(source or ["• метки не переданы"])]
    return "\n".join(lines)


async def send_lead(lead_id: int, lead: LeadCreate) -> None:
    """Дублирует заявку в Telegram. Никогда не бросает исключений."""
    bot = get_bot()
    if bot is None:
        log.warning("telegram: токен или chat_id не заданы, заявка #%s не отправлена", lead_id)
        return

    text = format_lead(lead_id, lead)
    for attempt in range(1, 4):
        delay = 2 ** attempt
        try:
            await bot.send_message(CHAT_ID, text)
            return
        except TelegramRetryAfter as e:
            delay = min(e.retry_after, 10)  # Telegram просит подождать
        except (TelegramNetworkError, TelegramServerError) as e:
            log.warning("telegram: lead #%s attempt %s failed: %s", lead_id, attempt, type(e).__name__)
        except TelegramAPIError as e:
            # неверный токен/chat_id, бот не в чате: повтор не поможет
            log.error("telegram: lead #%s rejected: %s", lead_id, e.message)
            return
        except Exception:
            log.exception("telegram: lead #%s unexpected error", lead_id)
            return
        if attempt < 3:
            await asyncio.sleep(delay)

    log.error("telegram: lead #%s не доставлена после 3 попыток", lead_id)
