# API AGENTS.md

`api` — владелец HTTP API, пользовательских бизнес-операций, Prisma persistence и записи событий в outbox.

Перед работой прочитай корневой [`AGENTS.md`](../AGENTS.md), [архитектуру](../.agents/project-architecture.md) и [skill API](../.agents/skills/nestjs-api/SKILL.md).

Первым шагом каждого запроса активируй `using-agent-skills`, затем выбери дополнительные skills по задаче.

Не реализуй здесь SMTP, inbox processing или UI. Событие и бизнес-изменение сохраняй атомарно; публикацию выполняет outbox cron.

Основные каталоги: `src/auth`, `src/users`, `src/sessions`, `src/email-verification`, `src/outbox`, `src/rabbitmq`, `src/prisma`.
