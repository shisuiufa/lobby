import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '@/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { SessionsModule } from '@/sessions/sessions.module';
import { OutboxModule } from '@/outbox/outbox.module';
import { ConfigService } from '@nestjs/config';
import { AUTH_ACCESS_TOKEN_TTL } from '@/auth/auth.constant';
import { EmailVerificationModule } from '@/email-verification/email-verification.module';

@Module({
  imports: [
    OutboxModule,
    UsersModule,
    SessionsModule,
    EmailVerificationModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: AUTH_ACCESS_TOKEN_TTL,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AuthModule {}
