import asyncio

import pytest
from aiogram.exceptions import TelegramNetworkError
from aiogram.methods import SendMessage

from backend.src import telegram


class FakeBot:
    def __init__(self, failures=0):
        self.failures = failures
        self.sent = []

    async def send_message(self, chat_id, text):
        if self.failures:
            self.failures -= 1
            raise TelegramNetworkError(method=SendMessage(chat_id=1, text="x"), message="boom")
        self.sent.append((chat_id, text))


def _lead():
    return telegram.LeadCreate(name="Анна", phone="+375331112233", interest="question")


def test_send_lead_retries_then_succeeds(monkeypatch):
    bot = FakeBot(failures=2)
    monkeypatch.setattr(telegram, "get_bot", lambda: bot)
    monkeypatch.setattr(telegram, "CHAT_ID", "-100500")

    async def no_sleep(_):
        pass

    monkeypatch.setattr(telegram.asyncio, "sleep", no_sleep)
    asyncio.run(telegram.send_lead(5, _lead()))
    assert len(bot.sent) == 1
    assert bot.sent[0][0] == "-100500"
    assert "Новая заявка №5" in bot.sent[0][1]


def test_send_lead_gives_up_without_raising(monkeypatch):
    bot = FakeBot(failures=99)
    monkeypatch.setattr(telegram, "get_bot", lambda: bot)

    async def no_sleep(_):
        pass

    monkeypatch.setattr(telegram.asyncio, "sleep", no_sleep)
    asyncio.run(telegram.send_lead(6, _lead()))  # не должно бросить исключение
    assert bot.sent == []
