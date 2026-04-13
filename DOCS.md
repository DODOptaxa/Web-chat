# SuperDuperDODO Chat — документация

## Обзор проекта

Real-time чат на **ASP.NET Core 10** + **SignalR** + **React 18** (Vite + TypeScript).  
Авторизация через JWT. База данных — SQL Server через Entity Framework Core.

---

## Стек

| Слой | Технология |
|---|---|
| Backend | ASP.NET Core 10, SignalR, EF Core, SQL Server |
| Auth | JWT Bearer, ASP.NET Identity PasswordHasher |
| Frontend | React 18, TypeScript, Vite |
| Real-time | @microsoft/signalr (npm) |
| Стили | CSS (CSS Variables, без CSS-in-JS) |

---

## Структура проекта

```
SuperDuperDODO_Chat/
├── Controllers/
│   └── AuthController.cs        # POST /api/auth/login, /api/auth/register
├── EFcore/
│   └── ChatDbContext.cs         # DbContext: Messages, Rooms, Users, MessageReactions
├── Hubs/
│   ├── ChatHub.cs               # SignalR hub: сообщения, реакции, комнаты
│   └── LobbyHub.cs              # SignalR hub: счётчик онлайна
├── Migrations/                  # EF Core миграции
├── Models/
│   ├── Message.cs               # Сущность сообщения (+ ReplyTo, Reactions)
│   ├── MessageDto.cs            # DTO для передачи клиенту
│   ├── MessageReaction.cs       # Сущность реакции (emoji)
│   ├── Room.cs                  # Сущность комнаты
│   └── User.cs                  # Сущность пользователя
├── Services/
│   ├── IChatService.cs          # Интерфейс чат-сервиса
│   ├── DbChatService.cs         # Реализация на EF Core
│   ├── IRoomService.cs          # Интерфейс сервиса комнат
│   ├── DbRoomService.cs         # Реализация на EF Core
│   └── TokenService.cs          # Генерация JWT
├── wwwroot/
│   ├── assets/ddd.gif           # Декоративный GIF на экране логина
│   ├── css/chat.css             # Все стили (темы, компоненты)
│   └── index.html               # Entry point — монтирует React #root
└── ClientApp/                   # React SPA
    ├── index.html               # Dev entry (Vite dev server)
    ├── vite.config.ts           # Сборка → wwwroot/assets/app.js
    ├── tsconfig.json
    ├── package.json
    └── src/
        ├── main.tsx             # ReactDOM.createRoot
        ├── types.ts             # TypeScript типы (MessageDto, Room, etc.)
        ├── api/
        │   └── auth.ts          # login(), register(), getToken(), clearAuth()
        ├── context/
        │   └── ChatContext.tsx  # Глобальный state + SignalR логика
        ├── data/
        │   └── emojiData.ts     # Каталог emoji по категориям
        ├── hooks/
        │   └── useSignalR.ts    # Хук для создания HubConnection
        └── components/
            ├── App.tsx          # Root: auto-login, роутинг Login/Chat
            ├── ThemeToggle.tsx  # Кнопка смены темы (light/dark)
            ├── LoginScreen.tsx  # Экран входа/регистрации
            ├── ChatScreen.tsx   # Главный экран чата
            ├── Sidebar.tsx      # Боковая панель (комнаты, юзер, логаут)
            ├── MessageList.tsx  # Список сообщений + авто-скролл
            ├── Message.tsx      # Один пузырь сообщения
            ├── ReplyBar.tsx     # Полоса активного ответа над input
            ├── InputArea.tsx    # Поле ввода + кнопка отправить
            ├── EmojiModal.tsx   # Модальный пикер emoji (центр экрана)
            └── RoomModal.tsx    # Модал создания комнаты
```

---

## Запуск

### Development (два терминала)

**Терминал 1 — backend:**
```bash
cd "SuperDuperDODO_Chat"
dotnet run
# Сервер на http://localhost:5006
```

**Терминал 2 — frontend:**
```bash
cd "SuperDuperDODO_Chat/ClientApp"
npm install
npm run dev
# Vite на http://localhost:5173
# Проксирует /api и /hub → localhost:5006
```

Открывать **http://localhost:5173** во время разработки.

### Production (сборка в wwwroot)

```bash
cd "SuperDuperDODO_Chat/ClientApp"
npm run build
# Билд пишет в wwwroot/assets/app.js
# После этого dotnet run сам отдаёт index.html
```

Открывать **http://localhost:5006**.

---

## База данных

```bash
# Применить миграции
dotnet ef database update

# Создать новую миграцию (если изменили модели)
dotnet ef migrations add <НазваниеМиграции>
```

Строка подключения задаётся в `appsettings.json`:
```json
"ConnectionStrings": {
  "Chat": "Server=...;Database=ChatDb;..."
}
```

---

## API

### Auth endpoints

| Метод | URL | Тело | Ответ |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{ userName, email, password }` | `{ token, userName }` |
| `POST` | `/api/auth/login` | `{ email, password }` | `{ token, userName }` |

JWT токен сохраняется в `localStorage` под ключом `chat-token`.  
Каждый запрос к SignalR хабу передаёт токен через query string `?access_token=...`.

---

## SignalR — ChatHub (`/hub/chat`)

Хаб требует авторизации (`[Authorize]`).

### Методы, вызываемые клиентом

| Метод | Параметры | Описание |
|---|---|---|
| `Register` | — | Уведомить других о входе |
| `JoinRoom` | `roomId` | Войти в комнату, получить историю |
| `LeaveRoom` | `roomId` | Покинуть комнату |
| `SendMessage` | `roomId, text, replyToId?` | Отправить сообщение |
| `ToggleReaction` | `messageId, emoji` | Добавить/убрать реакцию |
| `StartTyping` | `roomId` | Начал печатать |
| `StopTyping` | `roomId` | Перестал печатать |
| `GetRooms` | — | Получить список комнат |
| `CreateRoom` | `name, icon` | Создать комнату |

### События, приходящие клиенту

| Событие | Данные | Описание |
|---|---|---|
| `LoadHistory` | `MessageDto[]` | История при входе в комнату |
| `ReceiveMessage` | `MessageDto, roomId` | Новое сообщение |
| `ReactionUpdated` | `messageId, ReactionDto[]` | Обновлены реакции на сообщение |
| `SystemMessage` | `string` | Системное уведомление (вошёл/вышел) |
| `UserTyping` | `userName` | Кто-то печатает |
| `UserStoppedTyping` | `userName` | Перестал печатать |
| `RoomCreated` | `{ id, name, icon }` | Создана новая комната |

---

## SignalR — LobbyHub (`/hub/lobby`)

Без авторизации. Отслеживает количество подключённых пользователей.

| Событие | Данные |
|---|---|
| `UsersOnline` | `number` |

---

## Модели данных

### MessageDto

```typescript
interface MessageDto {
  id: number
  userName: string
  text: string
  sentAt: string           // ISO 8601
  roomId: string | null
  replyToId: number | null
  replyToUserName: string | null
  replyToText: string | null
  reactions: ReactionDto[]
}
```

### ReactionDto

```typescript
interface ReactionDto {
  emoji: string
  count: number
  users: string[]          // список userName
}
```

### Room

```typescript
interface Room {
  id: string               // GUID
  name: string
  icon: string             // emoji
}
```

---

## Архитектура фронтенда

### Стейт-менеджмент

Весь глобальный стейт живёт в `ChatContext` (`useReducer`).  
Компоненты читают стейт через `useChatContext()` и вызывают действия напрямую.

```
App
└── ChatProvider (контекст + SignalR)
    ├── LoginScreen
    └── ChatScreen
        ├── Sidebar
        ├── MessageList → Message[]
        ├── ReplyBar
        ├── InputArea
        ├── EmojiModal (modal)
        └── RoomModal (modal)
```

### Поток данных SignalR

```
SignalR event → dispatch(action) → state → re-render
```

Все `on(...)` хэндлеры регистрируются один раз в `enterChat()` и работают через `dispatch`.

### Темы (light/dark)

Тема хранится в `localStorage['chat-theme']` и применяется как `data-theme` атрибут на `<html>`.  
`ThemeToggle.tsx` управляет переключением. CSS-переменные в `chat.css` реагируют на атрибут:

```css
[data-theme="light"] { --bg: #f4f4fc; --surface: #fff; ... }
[data-theme="dark"]  { --bg: #0a0a12; --surface: #0f0f1a; ... }
```

---

## Фичи

### Ответы на сообщения

- Наведение на сообщение → появляется кнопка «↩ Ответить» сбоку (Persona-стиль)
- Нажатие → `ReplyBar` показывает превью над полем ввода
- При отправке `replyToId` передаётся в `SendMessage`
- Получатели видят цитату внутри пузыря, клик по цитате скроллит к исходному сообщению

### Emoji реакции

- Кнопка «😊 Реакция» открывает модальный пикер по центру экрана
- Пикер содержит ~400 emoji по 9 категориям
- `ToggleReaction` добавляет реакцию если её нет, убирает если уже стоит
- Уникальность: один пользователь — одна реакция с конкретным emoji на сообщение (уникальный индекс в БД)
- Реакции отображаются пилюлями под текстом; своя реакция подсвечивается акцентом

### Мобильная адаптация

- Сайдбар скрыт, открывается по кнопке-гамбургеру с overlay-backdrop
- Кнопки действий (ответить/реакция) появляются по тапу на сообщение (повторный тап скрывает)
- При скролле ленты все открытые панели скрываются

### Комнаты

- «Общий» создаётся автоматически при первом запуске
- Создание: кнопка «Новая комната» → модал с названием и emoji иконкой
- `RoomCreated` транслируется всем подключённым клиентам

---

## CSS — ключевые классы

| Класс | Назначение |
|---|---|
| `.message` | Пузырь сообщения |
| `.message.own` | Своё сообщение (выровнено вправо) |
| `.msg-actions` | Блок кнопок Persona-стиля (появляется сбоку при hover/tap) |
| `.msg-reply-btn` | Зелёная кнопка ответа |
| `.msg-react-btn` | Оранжевая кнопка реакции |
| `.reply-bar` | Полоса над инпутом при активном ответе |
| `.reply-quote` | Цитата внутри пузыря |
| `.reactions` | Flex-ряд с реакциями |
| `.reaction-pill` | Одна реакция (emoji + счётчик) |
| `.reaction-pill.mine` | Своя реакция (акцентный цвет) |
| `.emoji-modal` | Модал выбора emoji |
| `.emoji-modal-grid` | Сетка emoji-кнопок |

---

## Конфигурация

### appsettings.json

```json
{
  "ConnectionStrings": {
    "Chat": "<строка подключения SQL Server>"
  },
  "Jwt": {
    "Key": "<секретный ключ минимум 32 символа>",
    "Issuer": "SuperDuperDODO",
    "Audience": "ChatUsers"
  }
}
```

### vite.config.ts (proxy)

В dev-режиме Vite проксирует запросы:
- `/api/*` → `http://localhost:5006`
- `/hub/*` → `http://localhost:5006` (WebSocket)

В prod билд пишет всё в `wwwroot/assets/app.js`, который ASP.NET Core отдаёт как статику.
