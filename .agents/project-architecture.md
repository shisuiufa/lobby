# Архитектура проекта

## Поток почтового события

```text
business command in api
  -> database transaction: business write + outbox row
  -> api cron reads pending outbox rows
  -> publish typed event to RabbitMQ
  -> mail-service receiver stores message in inbox
  -> RabbitMQ delivery is acknowledged after inbox persistence
  -> mail-service cron claims pending inbox rows
  -> mail provider call
  -> inbox status is completed or retryable/failed
```

Outbox и inbox не означают exactly-once. Они обеспечивают устойчивость к сбоям, а код обязан безопасно переживать повторную доставку и повторную попытку.

## Outbox

- Создаётся в той же транзакции, что и бизнес-изменение, от которого зависит событие.
- Содержит стабильный идентификатор сообщения, тип события, payload, статус, число попыток и время следующей попытки.
- Cron публикует только доступные записи и не помечает запись окончательно отправленной до подтверждения RabbitMQ.
- Повторный запуск cron не должен создавать новый смысловой эффект.
- Нельзя отправлять RabbitMQ внутри незакоммиченной транзакции.

## Inbox

- Receiver сначала атомарно фиксирует входное сообщение по уникальному `messageId`/ключу идемпотентности.
- Повторное сообщение не создаёт вторую рабочую запись.
- RabbitMQ ack выполняется после успешной фиксации inbox, а не до неё.
- Cron обработки inbox отдельно управляет retries, backoff, terminal failure и наблюдаемостью.
- Внешний вызов почтового провайдера нельзя считать транзакционным с БД: результат может быть неизвестен после timeout, поэтому нужна идемпотентность или стратегия разрешения неизвестного состояния.

## Контракты

- Типы событий живут в `packages/events`.
- Payload события должен быть самодостаточным для потребителя и версионироваться аддитивно.
- Ошибки API имеют единый машинно-читаемый формат.
- Не протаскивай Prisma-модели, внутренние entity или transport-specific детали в публичный контракт.

## Источники

- React component hierarchy: https://react.dev/learn/thinking-in-react
- NestJS modules/controllers/providers: https://docs.nestjs.com/modules
- Prisma transactions: https://docs.prisma.io/docs/orm/v7/prisma-client/queries/transactions
- RabbitMQ acknowledgements and publisher confirms: https://www.rabbitmq.com/docs/confirms
- RabbitMQ reliability: https://www.rabbitmq.com/docs/reliability
