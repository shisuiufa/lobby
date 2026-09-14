# Lobby

Lobby is a monorepo containing the API, mail service, shared event contracts, and web application.

## Project Structure

```text
lobby/
├── api/                 # NestJS API
├── mail-service/        # NestJS mail microservice
├── web/                 # Web application
├── packages/
│   └── events/          # Shared event contracts
└── docker/
    └── local/           # Local Docker environment
```

## Requirements

- Node.js 24+
- Yarn 4+
- Docker
- Docker Compose

## Installation

Install workspace dependencies:

```bash
yarn install
```

Build shared event contracts:

```bash
yarn workspace @lobby/events build
```

## Local Development

Start the application:

```bash
docker compose up -d
```

Rebuild containers:

```bash
docker compose up -d --build
```

## Database

The API and mail service use separate PostgreSQL databases.

### API

Create and apply development migrations:

```bash
docker compose exec api yarn workspace lobby-api prisma:migrate
```

Generate Prisma Client:

```bash
docker compose exec api yarn workspace lobby-api prisma:generate
```

### Mail Service

Create and apply development migrations:

```bash
docker compose exec mail yarn workspace lobby-mail prisma:migrate
```

Generate Prisma Client:

```bash
docker compose exec mail yarn workspace lobby-mail prisma:generate
```

## Production Migrations

Apply existing migrations without creating new ones.

### API

```bash
docker compose exec api yarn workspace lobby-api prisma:deploy
```

### Mail Service

```bash
docker compose exec mail yarn workspace lobby-mail prisma:deploy
```

## Code Quality

### API

```bash
yarn workspace lobby-api lint
yarn workspace lobby-api lint:fix
yarn workspace lobby-api format
```

### Mail Service

```bash
yarn workspace lobby-mail lint
yarn workspace lobby-mail lint:fix
yarn workspace lobby-mail format
```

## Services

The local environment includes:

- PostgreSQL — API database
- PostgreSQL — Mail service database
- RabbitMQ — message broker
- Redis
- API
- Mail service
- Web
- Nginx

## Architecture

Events are processed asynchronously using the Outbox and Inbox patterns.

```text
API
 ↓
Outbox
 ↓
RabbitMQ
 ↓
Inbox
 ↓
Mail Service
```

The Outbox provides reliable event publishing, while the Inbox provides idempotent event consumption and retry handling.