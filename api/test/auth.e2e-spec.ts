import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RabbitMqPublisher } from '../src/rabbitmq/rabbitmq.publisher';
import { OutboxStatus } from '../src/prisma/generated/prisma/enums';
import { PostgresTestDatabase } from './support/postgres-test-database';
import { ROUTING_KEY } from '@lobby/events';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let database: PostgresTestDatabase;
  let databaseUrl: string;

  const validRegistration = {
    email: 'user@example.com',
    username: 'test-user',
    displayName: 'Test User',
    password: 'password123',
  };

  function expectMessage(body: unknown, message: string): void {
    expect(body).toEqual(expect.objectContaining({ message }));
  }

  beforeAll(async () => {
    database = new PostgresTestDatabase();
    databaseUrl = await database.start();

    process.env.DATABASE_URL = databaseUrl;
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.RABBITMQ_URL = 'amqp://localhost:5672';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RabbitMqPublisher)
      .useValue({ publish: jest.fn().mockResolvedValue(undefined) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.$executeRaw`
      TRUNCATE TABLE "users", "outbox_events" RESTART IDENTITY CASCADE
    `;
  });

  afterAll(async () => {
    await app.close();
    await database.stop();
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
    delete process.env.RABBITMQ_URL;
  });

  it('registers a user and creates email verification outbox event', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(validRegistration)
      .expect(201)
      .expect({});

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: validRegistration.email },
    });
    const event = await prisma.outboxEvent.findFirstOrThrow();

    expect(user.username).toBe(validRegistration.username);
    expect(user.passwordHash).not.toBe(validRegistration.password);
    expect(event).toMatchObject({
      routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
      status: OutboxStatus.PENDING,
      retries: 0,
    });
  });

  it('rejects invalid registration input', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ ...validRegistration, email: 'invalid-email' })
      .expect(400);
  });

  it('rejects duplicate email registration', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(validRegistration)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ ...validRegistration, username: 'another-user' })
      .expect(400)
      .expect(({ body }: { body: unknown }) => {
        expectMessage(body, 'Email already in use');
      });
  });

  it('logs in a verified user and returns tokens without password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(validRegistration)
      .expect(201);
    await prisma.user.update({
      where: { email: validRegistration.email },
      data: { emailVerifiedAt: new Date() },
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: validRegistration.email,
        password: validRegistration.password,
      })
      .expect(200);

    const responseBody = response.body as {
      accessToken: string;
      refreshToken: string;
      user: Record<string, unknown>;
    };
    expect(responseBody.accessToken).toEqual(expect.any(String));
    expect(responseBody.refreshToken).toEqual(expect.any(String));
    expect(responseBody.user).toMatchObject({
      email: validRegistration.email,
      username: validRegistration.username,
    });
    expect(responseBody.user).not.toHaveProperty('passwordHash');
  });

  it('rejects login with invalid password or unverified email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(validRegistration)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: validRegistration.email, password: 'wrong-password' })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: validRegistration.email,
        password: validRegistration.password,
      })
      .expect(401)
      .expect(({ body }: { body: unknown }) => {
        expectMessage(body, 'Email is not verified');
      });
  });

  it('verifies email using the token stored in the outbox payload', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(validRegistration)
      .expect(201);
    const event = await prisma.outboxEvent.findFirstOrThrow();
    const payload = event.payload as unknown as { token: string };
    const token = payload.token;

    await request(app.getHttpServer())
      .post('/api/auth/email/verify')
      .send({ token })
      .expect(200)
      .expect({});

    const verifiedUser = await prisma.user.findUniqueOrThrow({
      where: { email: validRegistration.email },
    });
    expect(verifiedUser.emailVerifiedAt).toBeInstanceOf(Date);
  });

  it('rejects invalid verification token', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/email/verify')
      .send({ token: 'invalid-token' })
      .expect(400)
      .expect(({ body }: { body: unknown }) => {
        expectMessage(body, 'Invalid verification token');
      });
  });

  it('resends verification email only after the existing token expires', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(validRegistration)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/email/resend')
      .send({ email: validRegistration.email })
      .expect(400)
      .expect(({ body }: { body: unknown }) => {
        expectMessage(
          body,
          'The current verification link has not expired yet',
        );
      });

    await prisma.emailVerification.updateMany({
      where: { user: { email: validRegistration.email } },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });

    await request(app.getHttpServer())
      .post('/api/auth/email/resend')
      .send({ email: validRegistration.email })
      .expect(200)
      .expect({});

    await expect(prisma.outboxEvent.count()).resolves.toBe(2);
  });
});
