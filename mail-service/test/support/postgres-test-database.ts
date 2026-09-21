import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execSync } from 'node:child_process';

export class PostgresTestDatabase {
  private container?: StartedPostgreSqlContainer;

  async start(): Promise<string> {
    const container = new PostgreSqlContainer('postgres:17-alpine')
      .withDatabase('lobby_mail_test')
      .withUsername('lobby')
      .withPassword('lobby');

    this.container = await container.start();

    const databaseUrl = this.container.getConnectionUri();

    this.applyMigrations(databaseUrl);

    return databaseUrl;
  }

  async stop(): Promise<void> {
    await this.container?.stop();
  }

  private applyMigrations(databaseUrl: string): void {
    execSync('yarn prisma:deploy', {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
      stdio: 'inherit',
    });
  }
}
