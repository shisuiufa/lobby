---
name: mail-service-reliability
description: Правила mail-service на NestJS, Prisma, RabbitMQ, inbox и почтовых transport-ах.
---

# Mail Service: reliable inbox processing

## Стек и источники

`mail-service` использует NestJS 11, Prisma 7, PostgreSQL, RabbitMQ, scheduler, Nodemailer и transport abstraction.

- NestJS modules and providers: https://docs.nestjs.com/modules
- NestJS microservices: https://docs.nestjs.com/microservices/basics
- Prisma transactions: https://docs.prisma.io/docs/orm/v7/prisma-client/queries/transactions
- RabbitMQ acknowledgements and confirms: https://www.rabbitmq.com/docs/confirms
- RabbitMQ reliability: https://www.rabbitmq.com/docs/reliability

## Ответственность

- `rabbitmq` принимает transport message и передаёт его inbox boundary.
- `inbox` хранит факт приёма, дедупликацию, статус и retry metadata.
- `mail` превращает типизированное задание в вызов provider.
- `templates` формируют содержимое письма.
- `transports` изолируют SMTP/console и не знают о RabbitMQ или inbox lifecycle.
- `inbox processor` выполняет pending work cron-ом и управляет переходами состояния.

Не отправляй письмо прямо из RabbitMQ receiver. Сначала зафиксируй inbox, затем подтверди delivery, а отправку выполняй отдельным retryable процессором.

## Inbox algorithm

1. Прочитать и валидировать входной контракт.
2. Атомарно создать inbox record по уникальному message/event key.
3. Если запись уже существует, считать сообщение duplicate и не создавать вторую работу.
4. Ack RabbitMQ только после успешной записи inbox.
5. Cron атомарно claim-ит доступную запись с lease/attempt metadata.
6. Вызвать mail provider вне Prisma transaction.
7. Зафиксировать `completed`, `retryable failure` или `terminal failure` отдельным атомарным update.

Ожидай at-least-once delivery. Timeout провайдера означает неизвестный результат: не отправляй бездумно дубликат, если контракт провайдера не поддерживает идемпотентность или не определена политика reconciliation.

## Кодовая организация

- Разделяй receiver, repository, service, processor и provider.
- Не помещай SQL, retry policy и SMTP details в один service.
- Все внешние ответы и env values считай недоверенными и валидируй на границе.
- Логируй correlation/message id, attempt, статус и причину ошибки без паролей, токенов и полного содержимого письма.

## Проверки

```text
yarn workspace mail-service lint
yarn workspace mail-service build
yarn workspace mail-service test
yarn workspace mail-service test:integration
```
