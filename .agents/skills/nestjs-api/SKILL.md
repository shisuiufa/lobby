---
name: nestjs-api
description: Правила разработки HTTP API на NestJS с типизированными контрактами, Prisma и outbox.
---

# API: NestJS + Prisma

## Стек и источники

`api` использует NestJS 11, Prisma 7, PostgreSQL, class-validator, scheduler и RabbitMQ client libraries.

- NestJS modules: https://docs.nestjs.com/modules
- NestJS controllers: https://docs.nestjs.com/controllers
- NestJS providers: https://docs.nestjs.com/providers
- Prisma transactions: https://docs.prisma.io/docs/orm/v7/prisma-client/queries/transactions
- API boundary design: https://docs.nestjs.com/techniques/validation

## Слои

- Controller — HTTP transport, DTO validation, status codes и mapping ошибок.
- Service — use-case orchestration и бизнес-правила.
- Repository — Prisma queries и persistence mapping.
- Outbox — запись и публикация интеграционных событий.
- Shared/common — только действительно общие технические утилиты.

Один класс не должен одновременно быть controller, repository, event publisher и владельцем бизнес-правил. Не передавай Prisma-модели прямо во внешний response без явного mapping.

## API contracts

- Определи DTO/input/output до реализации endpoint.
- Используй существующий единый формат ошибок.
- Валидируй внешний input на boundary; после validation внутренний код работает с типизированными данными.
- Используй plural resource URLs, HTTP semantics, pagination для list endpoints и additive changes для обратной совместимости.
- Не раскрывай stack traces, секреты и внутренние SQL/Prisma детали.

## Prisma и outbox

- Бизнес-запись и outbox row создаются одной Prisma transaction.
- Все запросы внутри interactive transaction идут через `tx`, а не через основной client.
- В transaction callback не вызывай RabbitMQ, HTTP или SMTP.
- Outbox processor делает claim конкурентно безопасно, учитывает retries/backoff и фиксирует publisher confirm.
- Для повторного запуска используй уникальные ключи и идемпотентные переходы статусов.

## Проверки

```text
yarn workspace api lint
yarn workspace api build
yarn workspace api test
yarn workspace api test:e2e
```
