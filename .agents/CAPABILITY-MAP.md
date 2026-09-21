# Capability Map: Lobby MVP

## Scope

Первый MVP Lobby обязан включать регистрацию и авторизацию, подтверждение
email и восстановление пароля, поиск пользователей и заявки в друзья, а также
список публичных серверов и создание сервера.

## Modules

| Module id | Responsibility | Depends on | Primary owner |
|---|---|---|---|
| `identity` | Регистрация, вход, email confirmation, восстановление пароля, сессии и неизменяемый публичный идентификатор пользователя | - | `api`, `web` |
| `social-graph` | Поиск пользователей по `displayName#12345`, отправка, принятие и отклонение заявок, список друзей | `identity` | `api`, `web` |
| `servers` | Публичный список серверов и создание сервера с уникальным именем | `identity` | `api`, `web` |
| `event-contracts` | Типизированные события и payload для email-задач между `api` и `mail-service` | `identity` | `packages/events`, `api`, `mail-service` |

## Service Mapping

| Service | MVP responsibilities |
|---|---|
| `web` | UI и клиентские API-сценарии для всех трёх пользовательских модулей |
| `api` | HTTP-контракты, бизнес-правила, persistence, sessions и outbox |
| `mail-service` | RabbitMQ receiver, inbox, retries и отправка писем через mail provider |
| `packages/events` | Общие типы email-событий и версии их payload |

## Dependency Direction

```text
identity -> social-graph
identity -> servers
identity -> event-contracts
event-contracts -> mail-service
```

`web` использует HTTP API `api` и не зависит напрямую от `mail-service`,
RabbitMQ или баз данных.

## Build Order

1. `identity`
2. `event-contracts` и email delivery path
3. `social-graph`
4. `servers`
5. Сквозная web-интеграция и MVP verification

## Explicit MVP Exclusions

- OAuth, телефонная авторизация и смена пароля из профиля.
- Изменение `displayName` после регистрации.
- Блокировка пользователя, удаление друга и отмена заявки.
- Приватные серверы, приглашения, роли, каналы, описание и аватар сервера.
