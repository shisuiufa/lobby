FROM node:24-alpine

WORKDIR /app

RUN corepack enable

CMD ["yarn", "workspace", "web", "dev", "--host", "0.0.0.0"]