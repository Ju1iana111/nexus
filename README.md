<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Nexus — «Искра утраты»

> Одностраничное приложение (SPA) на **React + Vite + TypeScript**, сгенерированное из шаблона Google AI Studio. Проект использует Gemini API для локального запуска.

—

## Демо / Проект в AI Studio

* Ссылка из исходного шаблона: *(см. README в репозитории; при необходимости замените здесь на рабочую ссылку деплоя)*

## Возможности (на сегодня)

* Базовый каркас приложения на Vite
* Типизированные компоненты/утилиты (TypeScript)
* Структура каталогов: `components/`, `services/`, `utils/`, `data/`
* Локальный запуск и сборка

## Дорожная карта (высокоуровнево)

* [ ] Вынести доступ к Gemini в **backend-прокси** (serverless/edge), не хранить ключ в клиенте
* [ ] Ввести слой доменных сущностей (например: `Item`, `EquipmentSlot`, `Stats`) и состояние
* [ ] Линт/форматирование/типчек в CI; unit-тесты
* [ ] Автодеплой превью на каждый PR

---

## Технологический стек

* **React 18**, **Vite**, **TypeScript**
* Менеджер пакетов: **npm**
* Шаблон: *google-gemini/aistudio-repository-template*

## Требования

* **Node.js ≥ 18** (рекомендуется LTS)
* npm ≥ 9

## Быстрый старт (локально)

```bash
# 1) Установите зависимости
npm install

# 2) Настройте переменные окружения (локально)
# Если есть пример:
cp .env.local.example .env.local || true
# ИЛИ создайте .env.local вручную и добавьте:
# GEMINI_API_KEY=ваш_ключ

# 3) Запустите dev‑сервер (только фронтенд)
npm run dev
# Откройте http://localhost:5173
```

> ⚠️ **Безопасность:** хранить `GEMINI_API_KEY` в клиенте безопасно только для локальной разработки. Для продакшена — используйте серверный прокси.

### Локальный запуск с прокси (рекомендуется)

**Вариант A — serverless (Vercel/Netlify/Cloudflare Pages Functions) локально:**

1. Создайте файл обработчика, например `api/generate.ts` (см. ниже в разделе «Развёртывание» — готовые шаблоны под каждую платформу).
2. Запустите локальный рантайм платформы (например, `vercel dev`, `netlify dev`, `wrangler dev`) — и проксируйте фронтенд через их Dev‑сервер.

**Вариант B — Node/Express локально:**

1. Добавьте файл `server/index.ts`:

   ```ts
   import express from 'express';
   import fetch from 'node-fetch';
   import rateLimit from 'express-rate-limit';
   import cors from 'cors';
   const app = express();
   app.use(express.json());
   app.use(cors());
   app.use(rateLimit({ windowMs: 60_000, max: 60 }));
   app.post('/api/generate', async (req, res) => {
     const apiKey = process.env.GEMINI_API_KEY;
     if (!apiKey) return res.status(500).json({ error: 'Missing API key' });
     const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
       body: JSON.stringify({ contents: req.body?.messages ?? [] })
     });
     const data = await r.json();
     res.json(data);
   });
   app.listen(8787, () => console.log('API on http://localhost:8787'));
   ```
2. Добавьте скрипты:

   ```json
   {
     "scripts": {
       "dev": "vite",
       "dev:api": "tsx server/index.ts",
       "dev:all": "concurrently -k \"npm:dev\" \"npm:dev:api\""
     }
   }
   ```
3. В фронтенде зовите `POST /api/generate` (на `localhost:8787`).

## Сборка и предпросмотр

```bash
npm run build
npm run preview
```

## Развёртывание

Ниже 2 проверенных пути: **(1) фронтенд + serverless‑функции** (предпочтительно) и **(2) фронтенд + собственный Node‑сервер**.

### Вариант 1 — Vercel (Pages + Functions)

**Файлы/настройки:**

* `api/generate.ts` — серверless‑обработчик:

  ```ts
  export const config = { runtime: 'edge' };
  export default async function handler(req: Request) {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: 'Missing API key' }), { status: 500 });
    const body = await req.json().catch(() => ({}));
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents: body.messages ?? [] })
    });
    return new Response(await r.text(), { status: r.status, headers: { 'Content-Type': 'application/json' } });
  }
  ```
* `vercel.json` (опционально):

  ```json
  { "build": { "env": {} } }
  ```
* Переменные: добавьте `GEMINI_API_KEY` в Project → Settings → Environment Variables.
* Деплой: `vercel` (или через GitHub интеграцию). PR → превью автоматически.

### Вариант 1 — Netlify (Edge/Functions)

**Файлы/настройки:**

* `netlify/functions/generate.ts`:

  ```ts
  import type { Handler } from '@netlify/functions';
  export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'Missing API key' }) };
    const body = JSON.parse(event.body || '{}');
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents: body.messages ?? [] })
    });
    return { statusCode: r.status, body: await r.text(), headers: { 'Content-Type': 'application/json' } };
  }
  ```
* `netlify.toml`:

  ```toml
  [build]
    command = "npm run build"
    publish = "dist"
  [dev]
    functions = "netlify/functions"
  [[redirects]]
    from = "/api/generate"
    to = "/.netlify/functions/generate"
    status = 200
  ```
* Переменные: Netlify → Site settings → Environment variables → `GEMINI_API_KEY`.
* Деплой: Git‑подключение или `netlify deploy`.

### Вариант 1 — Cloudflare Pages + Functions

**Файлы/настройки:**

* `functions/api/generate.ts`:

  ```ts
  export const onRequestPost: PagesFunction = async (context) => {
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: 'Missing API key' }), { status: 500 });
    const body = await context.request.json().catch(() => ({}));
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents: body.messages ?? [] })
    });
    return new Response(await r.text(), { status: r.status, headers: { 'Content-Type': 'application/json' } });
  };
  ```
* `wrangler.toml`:

  ```toml
  name = "nexus"
  [vars]
  # при деплое через Dashboard добавьте GEMINI_API_KEY как Variable/Secret
  ```
* Деплой: Git → Cloudflare Pages. Preview на PR включается автоматически.

### Вариант 2 — Собственный Node сервер (Render/Railway/Fly/VM)

**Шаги:**

1. Перенесите `server/index.ts` из локального варианта и добавьте `build`/`start`:

   ```json
   {
     "scripts": {
       "build": "vite build",
       "build:server": "tsc -p server/tsconfig.json",
       "start": "node dist-server/index.js"
     }
   }
   ```
2. Настройте процесс:

   * Build: `npm ci && npm run build && npm run build:server`
   * Start: `npm run start`
3. Переменные окружения: `GEMINI_API_KEY` (в dashboard провайдера).
4. Настройте reverse‑proxy (Nginx/Caddy) на раздачу статического `dist` и проксирование `/api/*` на Node‑процесс.

### Docker (опционально)

**Dockerfile** (двухэтапная сборка):

```dockerfile
# build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# runtime (статическая раздача + node для /api при необходимости)
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY server ./server
COPY package*.json ./
RUN npm ci --omit=dev && npm run build:server || true
EXPOSE 8080
CMD ["node", "dist-server/index.js"]
```

**docker‑compose.yml** (локально):

```yaml
services:
  web:
    build: .
    ports: ["8080:8080"]
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
```

### Настройка фронтенда на работу с прокси

В API‑клиенте используйте относительный путь:

```ts
await fetch('/api/generate', { method: 'POST', body: JSON.stringify({ messages }) })
```

На платформах выше маршрутизация `/api/generate` уже сконфигурирована.

### Трекинг ошибок и защита API

* Добавьте логирование (например, `pino`) на сервере.
* Включите rate‑limit (пример есть выше).
* CORS: разрешайте только ваш продакшен‑домен.

### Чек‑лист перед продом

* [ ] Ключ хранится **только** на сервере/в функциях
* [ ] Включены rate‑limit, CORS
* [ ] Переменные окружения настроены для `Preview` и `Production`
* [ ] CI собирает и тестирует проект, превью‑деплой на PR
* [ ] Страницы/роуты работают после статической сборки (`npm run preview`)

## Скрипты (npm)

> Точный список смотрите в `package.json`. Типичный набор:

* `dev` — запуск Vite dev server
* `build` — продакшн-сборка
* `preview` — локальный предпросмотр сборки

---

## Структура проекта

```
.
├─ components/        # UI‑компоненты и виджеты
├─ services/          # Вызовы внешних API (в т.ч. Gemini)
├─ utils/             # Общие хелперы
├─ data/              # Временные данные/фикстуры
├─ App.tsx            # Корневой компонент
├─ index.tsx          # Точка входа React
├─ index.html         # Vite HTML-шаблон
├─ vite.config.ts     # Конфиг Vite
├─ tsconfig.json      # Конфиг TypeScript
└─ package.json
```

## Архитектурные заметки

* **Текущая модель:** тонкий клиент (SPA) ↔️ внешнее LLM API.
* **Рекомендуемая модель для продакшена:**

  * Frontend (этот репозиторий)
  * **/api** прокси (serverless-функции):

    * `POST /api/generate` — принимает промпт от клиента
    * сервер добавляет API‑ключ из переменных окружения и ходит в Gemini
    * rate limiting, CORS, логирование ошибок

### Пример serverless‑обработчика (псевдо‑код)

```ts
// /api/generate.ts (пример для Vercel/Netlify)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { messages } = JSON.parse(req.body ?? '{}');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing API key' });

  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ contents: messages })
  });
  const data = await r.json();
  return res.status(200).json(data);
}
```

## Переменные окружения

* `GEMINI_API_KEY` — обязательна для локальной разработки; **в продакшене — хранить только на сервере**

Примеры:

```
# .env.local (только локально)
GEMINI_API_KEY=xxxx

# .env (сервер)
GEMINI_API_KEY=xxxx
```

## Тестирование (предложение)

* Юнит‑тесты: **Vitest** + **@testing-library/react**
* Команда: `npm run test` (после добавления конфигурации)

## CI/CD (предложение)

* **GitHub Actions**: задачи `typecheck`, `lint`, `test`, `build`
* Превью‑деплой (Vercel/Netlify/Cloudflare Pages) на каждый PR

### Пример workflow (фрагмент)

```yaml
name: Node.js CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: ${{ matrix.node-version }}, cache: 'npm' }
      - run: npm ci
      - run: npm run typecheck --if-present
      - run: npm run lint --if-present
      - run: npm test --if-present
      - run: npm run build
```

## Вклад

PR‑ы и issue приветствуются. Перед отправкой — линт/типчек/тесты.

## Лицензия

Пока не указана (TBD). Если планируется Open Source — добавьте файл `LICENSE`.

---

### FAQ

**Почему ключ Gemini в `.env.local` — это плохо?**
В продакшене любой может извлечь ключ из бандла/сетевых запросов. Нужен серверный прокси и защита (rate limit/CORS).

**Можно ли запустить без Gemini?**
Да, замените `services/` на заглушки/фикстуры из `data/` для разработки UI.
