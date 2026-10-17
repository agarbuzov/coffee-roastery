import pytest
from pydantic import ValidationError

from backend.src import Attribution, ErrorResponse, Interest, LeadCreate, LeadResponse


def make(**overrides):
    data = {
        "name": "Иван",
        "phone": "+375 29 123-45-67",
        "interest": "subscription",
        "comment": "Хочу попробовать",
    }
    data.update(overrides)
    return LeadCreate(**data)


# ---------- валидные данные ----------

def test_valid_lead():
    lead = make()
    assert lead.name == "Иван"
    assert lead.phone == "+375291234567"
    assert lead.interest is Interest.subscription
    assert lead.comment == "Хочу попробовать"


def test_comment_optional():
    assert make(comment=None).comment is None


def test_empty_comment_becomes_none():
    assert make(comment="").comment is None
    assert make(comment="   ").comment is None


def test_name_is_stripped():
    assert make(name="  Иван  ").name == "Иван"


# ---------- телефон: валидные форматы ----------

@pytest.mark.parametrize(
    "raw",
    [
        "+375291234567",
        "375291234567",
        "+375 29 123-45-67",
        "+375 (29) 123-45-67",
        "+375-29-123-45-67",
        "80291234567",
        "8 029 123-45-67".replace("8 029", "80 29"),
    ],
)
def test_phone_valid_formats_are_normalized(raw):
    assert make(phone=raw).phone == "+375291234567"


@pytest.mark.parametrize("code", ["25", "29", "33", "44"])
def test_phone_all_operator_codes(code):
    assert make(phone=f"+375{code}1234567").phone == f"+375{code}1234567"


# ---------- телефон: невалидные ----------

@pytest.mark.parametrize(
    "raw",
    [
        "",
        "abc",
        "+375 29 123-45-6",      # 6 цифр в абонентской части
        "+375 29 123-45-678",    # 8 цифр
        "+375 99 123-45-67",     # несуществующий код оператора
        "+375 17 123-45-67",     # городской код, не мобильный
        "+7 912 345-67-89",      # Россия
        "+375 29 123-45-6a",     # буква
        "29 123-45-67",          # без кода страны
    ],
)
def test_phone_invalid(raw):
    with pytest.raises(ValidationError) as exc:
        make(phone=raw)
    errors = exc.value.errors()
    assert errors[0]["loc"] == ("phone",)
    assert "+375 29 123-45-67" in errors[0]["msg"]  # понятная подсказка


# ---------- имя ----------

@pytest.mark.parametrize("name", ["", " ", "А", "x" * 101])
def test_name_invalid(name):
    with pytest.raises(ValidationError) as exc:
        make(name=name)
    assert exc.value.errors()[0]["loc"] == ("name",)


def test_name_max_length_ok():
    assert len(make(name="x" * 100).name) == 100


# ---------- интерес ----------

@pytest.mark.parametrize("value", ["subscription", "one_time", "question"])
def test_interest_valid(value):
    assert make(interest=value).interest.value == value


@pytest.mark.parametrize("value", ["", "подписка", "other", None])
def test_interest_invalid(value):
    with pytest.raises(ValidationError) as exc:
        make(interest=value)
    assert exc.value.errors()[0]["loc"] == ("interest",)


# ---------- комментарий ----------

def test_comment_too_long():
    with pytest.raises(ValidationError) as exc:
        make(comment="x" * 1001)
    assert exc.value.errors()[0]["loc"] == ("comment",)


def test_comment_max_length_ok():
    assert len(make(comment="x" * 1000).comment) == 1000


# ---------- обязательные поля ----------

@pytest.mark.parametrize("field", ["name", "phone", "interest"])
def test_required_fields(field):
    data = {"name": "Иван", "phone": "+375291234567", "interest": "question"}
    data.pop(field)
    with pytest.raises(ValidationError) as exc:
        LeadCreate(**data)
    assert exc.value.errors()[0]["loc"] == (field,)
    assert exc.value.errors()[0]["type"] == "missing"


# ---------- атрибуция ----------

def test_attribution_defaults_to_empty():
    lead = make()
    assert lead.attribution == Attribution()
    assert lead.attribution.utm_source is None


def test_attribution_full():
    lead = make(
        attribution={
            "utm_source": "instagram",
            "utm_medium": "cpc",
            "utm_campaign": "autumn_sale",
            "utm_content": "banner_2",
            "utm_term": "кофе минск",
            "fbclid": "abc123",
            "landing_url": "https://example.by/?utm_source=instagram",
            "referrer": "https://l.instagram.com/",
        }
    )
    a = lead.attribution
    assert a.utm_source == "instagram"
    assert a.utm_content == "banner_2"
    assert a.landing_url.startswith("https://example.by")
    assert a.fbclid == "abc123"


def test_attribution_partial():
    lead = make(attribution={"utm_source": "google"})
    assert lead.attribution.utm_source == "google"
    assert lead.attribution.utm_campaign is None


@pytest.mark.parametrize(
    "field,limit",
    [("utm_source", 255), ("utm_content", 255), ("landing_url", 2048), ("referrer", 2048)],
)
def test_attribution_too_long(field, limit):
    with pytest.raises(ValidationError):
        make(attribution={field: "x" * (limit + 1)})


# ---------- ответы ----------

def test_lead_response_default_message():
    r = LeadResponse(id=1)
    assert r.id == 1
    assert "Заявка принята" in r.message


def test_error_response_default_has_instruction():
    e = ErrorResponse()
    assert "Попробуйте ещё раз" in e.message
    assert e.fields == []


def test_error_response_with_fields():
    e = ErrorResponse(fields=[{"field": "phone", "message": "Неверный номер"}])
    assert e.fields[0].field == "phone"
