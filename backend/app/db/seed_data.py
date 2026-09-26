import hashlib
import json
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import UUID
from zoneinfo import ZoneInfo

STUDIO_TIMEZONE = ZoneInfo("Europe/Moscow")

CLIENT_ID = UUID("00000000-0000-4000-8000-000000000001")

CHEF_IDS = [UUID(f"10000000-0000-4000-8000-{index:012d}") for index in range(1, 4)]
PROGRAM_IDS = [UUID(f"15000000-0000-4000-8000-{index:012d}") for index in range(1, 9)]
CLASS_IDS = [UUID(f"20000000-0000-4000-8000-{index:012d}") for index in range(1, 10)]
BOOKING_IDS = [UUID(f"30000000-0000-4000-8000-{index:012d}") for index in range(1, 6)]


def _at_day(offset: int, hour: int, minute: int = 0) -> datetime:
    current = datetime.now(STUDIO_TIMEZONE)
    target_date = (current + timedelta(days=offset)).date()
    return datetime(
        target_date.year,
        target_date.month,
        target_date.day,
        hour,
        minute,
        tzinfo=STUDIO_TIMEZONE,
    )


def _program(
    index: int,
    title: str,
    description: str,
    level: str,
    dishes: list[str],
    duration_minutes: int,
) -> dict[str, object]:
    return {
        "id": PROGRAM_IDS[index - 1],
        "title": title,
        "description": description,
        "level": level,
        "dishes": dishes,
        "duration_minutes": duration_minutes,
    }


def _cooking_class(
    index: int,
    program_index: int,
    chef_index: int,
    starts_at: datetime,
    *,
    status: str = "scheduled",
    capacity: int = 12,
    available_seats: int = 3,
    rental_capacity: int = 6,
    available_rental: int = 2,
    price: int = 450_000,
    rental_price: int = 40_000,
    eyebrow: str = "Готовим вместе",
    accent: str = "#C64F33",
    soft_accent: str = "#F7DDD3",
    cancellation_reason: str | None = None,
) -> dict[str, object]:
    return {
        "id": CLASS_IDS[index - 1],
        "program_id": PROGRAM_IDS[program_index - 1],
        "chef_id": CHEF_IDS[chef_index - 1],
        "starts_at": starts_at,
        "status": status,
        "capacity": capacity,
        "available_seats": available_seats,
        "rental_kits_capacity": rental_capacity,
        "available_rental_kits": available_rental,
        "price_kopecks": price,
        "rental_price_kopecks": rental_price,
        "address": "Лофт «Шеф-стол», ул. Заводская, 12",
        "eyebrow": eyebrow,
        "accent": accent,
        "soft_accent": soft_accent,
        "cancellation_reason": cancellation_reason,
    }


def build_seed_data() -> dict[str, list[dict[str, object]]]:
    chefs = [
        {
            "id": CHEF_IDS[0],
            "name": "Михаил Орлов",
            "role": "Шеф итальянской кухни",
            "rating": Decimal("4.9"),
            "initials": "МО",
        },
        {
            "id": CHEF_IDS[1],
            "name": "Алиса Миронова",
            "role": "Кондитер и food-стилист",
            "rating": Decimal("4.8"),
            "initials": "АМ",
        },
        {
            "id": CHEF_IDS[2],
            "name": "Тимур Сафин",
            "role": "Шеф паназиатской кухни",
            "rating": Decimal("4.7"),
            "initials": "ТС",
        },
    ]
    programs = [
        _program(
            1,
            "Паста с нуля",
            "Замесим тесто, раскатаем тальятелле и приготовим два соуса.",
            "beginner",
            ["Тальятелле", "Крем из пармезана", "Тирамису"],
            180,
        ),
        _program(
            2,
            "Французский завтрак",
            "Освоим воздушное тесто и спокойный темп французского завтрака.",
            "advanced",
            ["Круассан", "Яйцо пашот", "Голландский соус"],
            210,
        ),
        _program(
            3,
            "Рамен: глубокий вкус",
            "Разберём баланс бульона, тарэ и ароматного масла.",
            "advanced",
            ["Куриный бульон", "Домашняя лапша", "Яйцо адзитама"],
            180,
        ),
        _program(
            4,
            "Идеальный чизкейк",
            "Поймём температуру и текстуру сливочного чизкейка.",
            "beginner",
            ["Чизкейк Нью-Йорк", "Ягодный кули", "Песочная основа"],
            180,
        ),
        _program(
            5,
            "Сезонное меню",
            "Спецвыпуск с сезонными продуктами.",
            "advanced",
            ["Тыквенный крем", "Утиная грудка"],
            180,
        ),
        _program(
            6,
            "Домашняя паста",
            "Архивный класс для демонстрации оценки шефа.",
            "beginner",
            ["Равиоли", "Соус песто"],
            180,
        ),
        _program(
            7,
            "Хлеб на закваске",
            "Разберём зрелость закваски, замес и формовку.",
            "advanced",
            ["Пшеничный тартин", "Взбитое масло", "Сезонный джем"],
            210,
        ),
        _program(
            8,
            "Грузинское застолье",
            "Приготовим хинкали, хачапури и соусы.",
            "beginner",
            ["Хинкали", "Хачапури по-аджарски", "Сацебели"],
            180,
        ),
    ]
    classes = [
        _cooking_class(1, 1, 1, _at_day(1, 18, 30)),
        _cooking_class(
            2,
            2,
            2,
            _at_day(2, 10),
            capacity=8,
            available_seats=1,
            rental_capacity=4,
            available_rental=0,
            price=590_000,
            eyebrow="Утро в Париже",
            accent="#AA743F",
            soft_accent="#F4E4C9",
        ),
        _cooking_class(
            3,
            3,
            3,
            _at_day(3, 17),
            capacity=8,
            available_seats=0,
            rental_capacity=4,
            available_rental=0,
            price=540_000,
            eyebrow="Токио дома",
            accent="#355C50",
            soft_accent="#DCE9E3",
        ),
        _cooking_class(
            4,
            4,
            2,
            _at_day(4, 12),
            capacity=10,
            available_seats=6,
            rental_capacity=6,
            available_rental=5,
            price=470_000,
            eyebrow="Без трещин и суеты",
            accent="#765672",
            soft_accent="#EAE0E8",
        ),
        _cooking_class(5, 1, 1, _at_day(5, 19), available_seats=7, available_rental=1),
        _cooking_class(
            6,
            5,
            3,
            _at_day(6, 18),
            status="cancelled",
            capacity=8,
            available_seats=0,
            rental_capacity=4,
            available_rental=0,
            price=620_000,
            eyebrow="Спецвыпуск",
            accent="#355C50",
            soft_accent="#DCE9E3",
            cancellation_reason="Поставка сезонных продуктов задерживается",
        ),
        _cooking_class(
            7,
            6,
            1,
            _at_day(-3, 18),
            status="completed",
            available_seats=0,
            available_rental=0,
            price=430_000,
            eyebrow="Пройденный класс",
        ),
        _cooking_class(
            8,
            7,
            1,
            _at_day(-7, 11),
            status="completed",
            capacity=8,
            available_seats=0,
            rental_capacity=4,
            available_rental=0,
            price=520_000,
            eyebrow="Медленное ремесло",
            accent="#AA743F",
            soft_accent="#F4E4C9",
        ),
        _cooking_class(
            9,
            8,
            3,
            _at_day(16, 18),
            available_seats=9,
            available_rental=6,
            price=560_000,
            eyebrow="Большой общий стол",
            accent="#355C50",
            soft_accent="#DCE9E3",
        ),
    ]
    bookings = [
        {
            "id": BOOKING_IDS[0],
            "client_id": CLIENT_ID,
            "class_id": CLASS_IDS[4],
            "status": "confirmed",
            "equipment_option": "rental",
            "allergy_notes": "Нет аллергий",
            "total_price_kopecks": 490_000,
            "studio_cancellation_reason": None,
            "created_at": _at_day(-1, 14),
            "updated_at": _at_day(-1, 14),
        },
        {
            "id": BOOKING_IDS[1],
            "client_id": CLIENT_ID,
            "class_id": CLASS_IDS[6],
            "status": "attended",
            "equipment_option": "own",
            "allergy_notes": "Аллергия на фундук",
            "total_price_kopecks": 430_000,
            "studio_cancellation_reason": None,
            "created_at": _at_day(-8, 11),
            "updated_at": _at_day(-3, 21),
        },
        {
            "id": BOOKING_IDS[2],
            "client_id": CLIENT_ID,
            "class_id": CLASS_IDS[5],
            "status": "cancelled_by_studio",
            "equipment_option": "own",
            "allergy_notes": "Нет аллергий",
            "total_price_kopecks": 620_000,
            "studio_cancellation_reason": "Поставка сезонных продуктов задерживается",
            "created_at": _at_day(-2, 9),
            "updated_at": _at_day(-1, 12),
        },
        {
            "id": BOOKING_IDS[3],
            "client_id": CLIENT_ID,
            "class_id": CLASS_IDS[7],
            "status": "attended",
            "equipment_option": "own",
            "allergy_notes": "",
            "total_price_kopecks": 520_000,
            "studio_cancellation_reason": None,
            "created_at": _at_day(-12, 10),
            "updated_at": _at_day(-7, 15),
        },
        {
            "id": BOOKING_IDS[4],
            "client_id": CLIENT_ID,
            "class_id": CLASS_IDS[3],
            "status": "cancelled_by_client",
            "equipment_option": "own",
            "allergy_notes": "",
            "total_price_kopecks": 470_000,
            "studio_cancellation_reason": None,
            "created_at": _at_day(-3, 13),
            "updated_at": _at_day(-2, 13),
        },
    ]
    replay_payload = {
        "classId": str(CLASS_IDS[4]),
        "equipmentOption": "rental",
        "allergyNotes": "Нет аллергий",
    }
    canonical_payload = json.dumps(
        replay_payload,
        ensure_ascii=False,
        separators=(",", ":"),
    )
    return {
        "clients": [
            {
                "id": CLIENT_ID,
                "name": "Демо-клиент",
                "phone": "+79990000000",
                "created_at": _at_day(-30, 12),
            }
        ],
        "chefs": chefs,
        "programs": programs,
        "cooking_classes": classes,
        "bookings": bookings,
        "reviews": [
            {
                "id": UUID("35000000-0000-4000-8000-000000000001"),
                "booking_id": BOOKING_IDS[3],
                "rating": 5,
                "comment": "Понятно, спокойно и очень вкусно.",
                "created_at": _at_day(-6, 10),
            }
        ],
        "push_tokens": [
            {
                "id": UUID("36000000-0000-4000-8000-000000000001"),
                "client_id": CLIENT_ID,
                "token": "ExponentPushToken[demo-chef-table-ios]",
                "platform": "ios",
                "active": True,
                "updated_at": _at_day(-1, 15),
            }
        ],
        "idempotency_records": [
            {
                "id": UUID("37000000-0000-4000-8000-000000000001"),
                "client_id": CLIENT_ID,
                "key": UUID("40000000-0000-4000-8000-000000000001"),
                "request_hash": hashlib.sha256(canonical_payload.encode()).hexdigest(),
                "response_status": 201,
                "response_body": {
                    "id": str(BOOKING_IDS[0]),
                    **replay_payload,
                    "status": "confirmed",
                    "totalPriceKopecks": 490_000,
                },
                "created_at": _at_day(-1, 14),
            }
        ],
    }
