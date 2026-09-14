yarn install

yarn workspace @lobby/events build

docker compose exec api yarn workspace lobby-api prisma migrate dev --name init

docker compose exec api yarn workspace lobby-api prisma generate

docker compose exec api yarn workspace lobby-api prisma migrate deploy
