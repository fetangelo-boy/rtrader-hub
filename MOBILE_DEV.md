# RTrader VIP Club — Mobile Developer Guide

Это руководство для разработчиков мобильного приложения RTrader VIP Club (iOS + Android).
Полная спецификация всех эндпоинтов — в файле [`openapi.yaml`](./openapi.yaml).

---

## Содержание

1. [Архитектура API](#архитектура-api)
2. [Базовые URL функций](#базовые-url-функций)
3. [Авторизация — flow](#авторизация--flow)
4. [Быстрый старт: первые 5 запросов](#быстрый-старт-первые-5-запросов)
5. [Работа с чатом](#работа-с-чатом)
6. [Подписки](#подписки)
7. [Котировки](#котировки)
8. [Telegram-привязка](#telegram-привязка)
9. [Тестовый аккаунт](#тестовый-аккаунт)
10. [Коды ошибок](#коды-ошибок)
11. [Ограничения и лимиты](#ограничения-и-лимиты)

---

## Архитектура API

- **Протокол:** HTTPS REST
- **Формат:** JSON (`Content-Type: application/json`)
- **Авторизация:** заголовок `X-Auth-Token` (токен сессии)
- **Файлы:** передаются как base64-строка внутри JSON-тела
- **CORS:** разрешён для всех источников (`*`)

Каждая функция бэкенда — это отдельный URL. Эндпоинты различаются query-параметром `?action=`.

---

## Базовые URL функций

| Функция | URL | Назначение |
|---|---|---|
| `auth` | `https://functions.poehali.dev/ae3bd284-8ae4-4f3e-9c34-1eb7f36477ed` | Регистрация, вход, профиль |
| `chat` | `https://functions.poehali.dev/d4285e14-f02c-4607-9a3f-4215f1bf054d` | Чаты VIP-клуба |
| `subscriptions` | `https://functions.poehali.dev/b4dcce4e-7c15-4eb7-b40e-1fb43f89083e` | Статус и история подписок |
| `quotes` | `https://functions.poehali.dev/8aa86429-4cf8-4a5f-bad6-95cdb8bcfc85` | Биржевые котировки |
| `tg-vip-bot` | `https://functions.poehali.dev/4807e4da-e564-4aba-8072-c30326d968ee` | Привязка Telegram |

---

## Авторизация — flow

```
┌─────────────────────────────────────────────────────┐
│                   AUTH FLOW                         │
│                                                     │
│  1. POST /auth?action=login                         │
│     { email, password }                             │
│            │                                        │
│            ▼                                        │
│     ← { token, user_id, nickname, role }            │
│            │                                        │
│  2. Сохранить token локально (Keychain / SecureStore)│
│            │                                        │
│  3. Все защищённые запросы:                         │
│     Header: X-Auth-Token: <token>                   │
│            │                                        │
│  4. Проверить доступ к клубу:                       │
│     GET /auth?action=me                             │
│     ← { role, ... }                                 │
│     role = "owner" | "admin" → доступ есть          │
│     role = "subscriber" → проверить подписку        │
│            │                                        │
│  5. GET /subscriptions?action=status                │
│     ← { subscription: { is_active: true/false } }  │
│     is_active = true → пускать в клуб               │
│     is_active = false → экран оформления подписки   │
└─────────────────────────────────────────────────────┘
```

**Важно:** токен действует **30 дней**. Храни в защищённом хранилище (Keychain на iOS, SecureStore на Android/Expo). При получении 401 — разлогинивай пользователя и отправляй на экран входа.

---

## Быстрый старт: первые 5 запросов

### 1. Войти в аккаунт

```http
POST https://functions.poehali.dev/ae3bd284-8ae4-4f3e-9c34-1eb7f36477ed?action=login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Ответ:
```json
{
  "token": "a1b2c3d4e5f6...",
  "user_id": 42,
  "nickname": "trader_pro",
  "email": "user@example.com",
  "role": "subscriber"
}
```

> Поле `email` принимает и email (`@`), и никнейм (без `@`).

---

### 2. Получить данные профиля

```http
GET https://functions.poehali.dev/ae3bd284-8ae4-4f3e-9c34-1eb7f36477ed?action=me
X-Auth-Token: a1b2c3d4e5f6...
```

Ответ:
```json
{
  "id": 42,
  "nickname": "trader_pro",
  "email": "user@example.com",
  "role": "subscriber",
  "is_blocked": false
}
```

---

### 3. Проверить статус подписки

```http
GET https://functions.poehali.dev/b4dcce4e-7c15-4eb7-b40e-1fb43f89083e?action=status
X-Auth-Token: a1b2c3d4e5f6...
```

Ответ (активная подписка):
```json
{
  "subscription": {
    "id": 7,
    "plan": "month",
    "status": "active",
    "expires_at": "2026-05-12T12:00:00+00:00",
    "is_active": true
  }
}
```

Ответ (нет подписки):
```json
{
  "subscription": null
}
```

**Логика доступа:**
```
if role in ["owner", "admin"] → доступ есть всегда
else if subscription.is_active == true → доступ есть
else → показать экран покупки подписки
```

---

### 4. Получить котировки

```http
GET https://functions.poehali.dev/8aa86429-4cf8-4a5f-bad6-95cdb8bcfc85
```

Ответ:
```json
{
  "quotes": [
    {
      "name": "IMOEX",
      "price": "2 847.30",
      "change": "+0.42%",
      "up": true,
      "raw_price": 2847.30,
      "raw_change_pct": 0.42,
      "source": "moex"
    },
    {
      "name": "BTC/USD",
      "price": "83500.00",
      "change": "-1.20%",
      "up": false,
      "raw_price": 83500.0,
      "raw_change_pct": -1.20,
      "source": "finnhub"
    }
  ],
  "updated_at": 1712920800
}
```

> Данные кешируются на 120 секунд. Рекомендуем обновлять каждые 2 минуты.

---

### 5. Получить сообщения чата

```http
GET https://functions.poehali.dev/d4285e14-f02c-4607-9a3f-4215f1bf054d?action=messages&source=club&channel=chat&limit=60
X-Auth-Token: a1b2c3d4e5f6...
```

Ответ:
```json
{
  "messages": [
    {
      "id": 101,
      "text": "Смотрю на SBER — хорошая точка входа",
      "created_at": "2026-04-12T10:30:00+00:00",
      "nickname": "trader_pro",
      "role": "subscriber",
      "user_id": 42,
      "reply_to_id": null,
      "reply_to_nickname": null,
      "reply_to_text": null,
      "image_url": null
    }
  ]
}
```

---

## Работа с чатом

### Доступные каналы

| Ключ | Название | Режим |
|---|---|---|
| `intraday` | Интрадей | только чтение |
| `chat` | Общий чат | чтение + запись |
| `metals` | Металлы | чтение + запись |
| `oil` | Нефть | чтение + запись |
| `products` | Продукты | чтение + запись |
| `video` | Видео | только чтение |
| `tech` | Техвопросы | чтение + запись |
| `access_info` | Доступ | только чтение |
| `knowledge` | База знаний | только чтение |

### Отправить сообщение

```http
POST https://functions.poehali.dev/d4285e14-f02c-4607-9a3f-4215f1bf054d?action=send&source=club&channel=chat
Content-Type: application/json
X-Auth-Token: a1b2c3d4e5f6...

{
  "text": "Всем привет! Слежу за нефтью.",
  "reply_to_id": null
}
```

### Отправить сообщение с изображением

```http
POST https://functions.poehali.dev/d4285e14-f02c-4607-9a3f-4215f1bf054d?action=send&source=club&channel=chat
Content-Type: application/json
X-Auth-Token: a1b2c3d4e5f6...

{
  "text": "График по SBER",
  "image_b64": "/9j/4AAQSkZJRgABAQAA...",
  "image_mime": "image/jpeg"
}
```

> Максимальный размер изображения — **5 МБ**. Форматы: JPEG, PNG, GIF, WebP.

### Ответить на сообщение (reply)

```json
{
  "text": "Согласен, хорошая идея",
  "reply_to_id": 101
}
```

---

## Подписки

### Тарифы

| Ключ | Название | Срок |
|---|---|---|
| `week` | Неделя | 7 дней |
| `month` | Месяц | 30 дней |
| `quarter` | Квартал | 90 дней |
| `halfyear` | Полгода | 180 дней |
| `loyal` | Лояльный | 30 дней |

### Оформить подписку

Пользователь оплачивает вручную (банковский перевод) и загружает скриншот чека:

```http
POST https://functions.poehali.dev/b4dcce4e-7c15-4eb7-b40e-1fb43f89083e?action=request
Content-Type: application/json
X-Auth-Token: a1b2c3d4e5f6...

{
  "plan": "month",
  "receipt_base64": "/9j/4AAQSkZJRgABAQAA...",
  "receipt_mime": "image/jpeg"
}
```

После отправки — статус `pending`. Администратор вручную проверяет чек и активирует подписку.

### История заявок

```http
GET https://functions.poehali.dev/b4dcce4e-7c15-4eb7-b40e-1fb43f89083e?action=my_requests
X-Auth-Token: a1b2c3d4e5f6...
```

---

## Котировки

Эндпоинт публичный, авторизация не нужна. Рекомендуемый интервал обновления — **120 секунд**.

Инструменты в ответе:
- **MOEX:** IMOEX, SBER, GAZP, NVTK, LKOH (задержка ~15 мин)
- **Finnhub:** XAU/USD, XAG/USD, BRENT, NG, BTC/USD (реальное время)

---

## Telegram-привязка

Пользователь может привязать Telegram для получения уведомлений об истечении подписки.

### Проверить статус привязки

```http
GET https://functions.poehali.dev/4807e4da-e564-4aba-8072-c30326d968ee?action=status
X-Auth-Token: a1b2c3d4e5f6...
```

Ответ:
```json
{
  "linked": false,
  "telegram_username": null
}
```

### Получить ссылку для привязки

```http
GET https://functions.poehali.dev/4807e4da-e564-4aba-8072-c30326d968ee?action=gen_link
X-Auth-Token: a1b2c3d4e5f6...
```

Ответ:
```json
{
  "url": "https://t.me/rtrader_vip_bot?start=abc123xyz",
  "expires_in": 900
}
```

Показать пользователю кнопку "Открыть в Telegram" с этим URL. Ссылка действует 15 минут. После перехода бот автоматически привязывает аккаунт.

---

## Тестовый аккаунт

Для разработки и тестирования доступен аккаунт с активной VIP-подпиской (план `month`).
Логин и пароль передаются отдельно владельцем проекта.

**Что доступно с тестовым аккаунтом:**
- Все каналы VIP-чата (чтение и запись)
- Статус активной подписки
- Привязка Telegram (можно тестировать с реальным аккаунтом)
- Все защищённые эндпоинты клуба

---

## Коды ошибок

| HTTP | Описание | Что делать |
|---|---|---|
| `400` | Ошибка валидации | Показать сообщение из поля `error` |
| `401` | Не авторизован / токен истёк | Разлогинить, отправить на экран входа |
| `403` | Нет доступа (нет подписки или роли) | Показать экран оформления подписки |
| `404` | Не найдено | Обработать gracefully |
| `405` | Метод не поддерживается | Проверить HTTP-метод запроса |
| `500` | Ошибка сервера | Показать общее сообщение об ошибке, retry |

Формат ошибки всегда одинаков:
```json
{
  "error": "Описание ошибки на русском"
}
```

---

## Ограничения и лимиты

| Параметр | Значение |
|---|---|
| Токен сессии | 30 дней |
| Сообщение чата | макс. 1000 символов |
| Изображение в чате | макс. 5 МБ (JPEG, PNG, GIF, WebP) |
| Никнейм | 2–30 символов |
| Пароль | минимум 6 символов |
| Котировки, кеш | 120 секунд |
| Ссылка для Telegram | 15 минут |
| Публичный чат, history | макс. 100 сообщений |
| VIP чат, history | макс. 200 сообщений |

---

## Полная документация

Все эндпоинты с подробными схемами запросов и ответов — в файле [`openapi.yaml`](./openapi.yaml).
Файл совместим со Swagger UI, Postman и Insomnia.

```bash
# Открыть в Swagger UI онлайн:
# https://editor.swagger.io/ → File → Import File → openapi.yaml
```
