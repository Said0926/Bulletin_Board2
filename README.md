# BulletinBoard2

Доска объявлений для MMORPG-гильдии. Игроки публикуют объявления о поиске конкретных ролей (танки, хилеры и т.д.), другие игроки откликаются — автор принимает или отклоняет отклик.

## Стек

| Слой | Технологии |
|------|-----------|
| Backend | Python 3.11, Django 5.1, Django REST Framework, SimpleJWT |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| БД | SQLite (разработка) / PostgreSQL (продакшн) |
| Редактор | TipTap (rich text, изображения, YouTube) |

## Быстрый старт

### Backend

```bash
cd backend
python -m venv ../venv
source ../venv/bin/activate
pip install -r requirements.txt

cp .env.example .env        # заполните SECRET_KEY и настройки email
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver  # http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install

cp .env.local.example .env.local   # уже настроен для localhost
npm run dev                         # http://localhost:3000
```

## Структура проекта

```
backend/
  config/          — настройки Django, URLs, WSGI
  users/           — кастомная модель пользователя (email-only), верификация
  ads/             — модели Ad и Response, загрузка изображений
  newsletter/      — рассылки (Newsletter model)

frontend/
  app/             — страницы Next.js (App Router)
  components/      — переиспользуемые компоненты React
  lib/
    api.ts         — fetch-обёртка с авто-обновлением JWT
    auth-context.tsx — глобальный контекст авторизации
```

## Авторизация

1. Регистрация → код подтверждения на email
2. Верификация email → аккаунт активируется
3. Логин → JWT access (60 мин) + refresh (7 дней)
4. `api.ts` автоматически обновляет access-токен при 401

В режиме разработки (`EMAIL_BACKEND=console`) письма печатаются в терминал.

## Роли объявлений

`TANK` · `HEALER` · `DD` · `TRADER` · `GILDMASTER` · `QUESTGIVER` · `BLACKSMITH` · `SKINNER` · `TANNER` · `POTIONMAKER`

## Тесты

```bash
cd backend
pytest                          # все тесты
pytest ads/tests/               # тесты конкретного приложения
pytest -k "test_create_ad"     # один тест по имени
```

## Переменные окружения

Все переменные хранятся в файлах `.env` / `.env.local` (не коммитятся).  
Примеры: `backend/.env.example`, `frontend/.env.local.example`.
