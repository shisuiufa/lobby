# Web AGENTS.md

`web` — пользовательский React-интерфейс проекта в архитектуре FSD. Он взаимодействует с backend через API client и не знает о RabbitMQ, outbox, inbox или SMTP.

Перед работой прочитай корневой [`AGENTS.md`](../AGENTS.md), [архитектуру](../.agents/project-architecture.md) и [skill React/FSD](../.agents/skills/web-react-fsd/SKILL.md).

Первым шагом каждого запроса активируй `using-agent-skills`, затем выбери дополнительные skills по задаче.

Сохраняй границы `app`, `pages`, `widgets`, `features`, `entities`, `shared`; не складывай несколько независимых сценариев в один компонент.

Основные каталоги: `src/app`, `src/pages`, `src/shared`.
