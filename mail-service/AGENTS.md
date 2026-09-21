# Mail Service AGENTS.md

`mail-service` — владелец почтовых операций после получения задания: RabbitMQ receiver, inbox lifecycle, retries и mail providers.

Перед работой прочитай корневой [`AGENTS.md`](../AGENTS.md), [архитектуру](../.agents/project-architecture.md) и [skill mail-service](../.agents/skills/mail-service-reliability/SKILL.md).

Первым шагом каждого запроса активируй `using-agent-skills`, затем выбери дополнительные skills по задаче.

Не добавляй сюда пользовательские бизнес-решения `api` и не отправляй письмо прямо из receiver. Сначала inbox, затем отдельный cron processor.

Основные каталоги: `src/rabbitmq`, `src/inbox`, `src/mail`, `src/prisma`.
