import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execSync } from 'node:child_process';

export class PostgresTestDatabase {
  private container?: StartedPostgreSqlContainer;

  async start(): Promise<string> {
    this.container = await new PostgreSqlContainer('postgres:17-alpine')
      .withDatabase('lobby_api_test')
      .withUsername('lobby')
      .withPassword('lobby')
      .start();

    const databaseUrl = this.container.getConnectionUri();
    execSync('..\\node_modules\\.bin\\prisma.cmd migrate deploy', {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'inherit',
    });

    return databaseUrl;
  }

  async stop(): Promise<void> {
    await this.container?.stop();
  }
}
